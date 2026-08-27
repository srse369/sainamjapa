const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// In-memory cache for IP geolocation (survives across function invocations in Netlify)
// Pattern inspired by saisongs AnalyticsService
const geoCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const jsonResponse = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
  body: JSON.stringify(body)
});

/**
 * Get geolocation for an IP from cache or external API
 * Caches results for 24 hours to avoid rate limiting
 * Falls back gracefully if external service is unavailable
 */
const lookupLocation = async (ip) => {
  if (!ip) return {};

  // Check cache first
  const cacheKey = `ip:${ip}`;
  const cached = geoCache.get(cacheKey);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_TTL_MS) {
      return cached.data;
    }
    // Cache expired, remove it
    geoCache.delete(cacheKey);
  }

  // Skip geolocation for localhost/private IPs (common in testing)
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      country: 'Local',
      city: 'Localhost',
      latitude: null,
      longitude: null
    };
  }

  try {
    // Use ip-api.com service (free tier, 45 req/min limit = 64,800/day)
    // Much better rate limits than ipapi.co, falls back gracefully if unavailable
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon`);
    if (!response.ok) {
      console.warn(`[Geolocation] API error for ${ip}: ${response.status}`);
      return {};
    }

    const data = await response.json();
    if (!data || typeof data !== 'object' || data.status !== 'success') return {};

    const geoData = {
      country: data.country || null,
      city: data.city || null,
      latitude: typeof data.lat === 'number' ? data.lat : null,
      longitude: typeof data.lon === 'number' ? data.lon : null
    };

    // Cache the result
    geoCache.set(cacheKey, {
      data: geoData,
      timestamp: Date.now()
    });

    return geoData;
  } catch (err) {
    console.error(`[Geolocation] Failed to lookup IP ${ip}:`, err.message);
    return {};
  }
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse(200, {ok: true});

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {error: 'Method not allowed'});
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return jsonResponse(500, {error: 'Missing SUPABASE_URL or SUPABASE_KEY env variables'});
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return jsonResponse(400, {error: 'Invalid JSON'});
  }

  const {name, date, count} = payload;
  if (!date || count === undefined || count === null) {
    return jsonResponse(400, {error: 'Missing required fields: date and count'});
  }

  const today = new Date().toISOString().slice(0,10);
  if (String(date) > today) {
    return jsonResponse(400, {error: 'Date cannot be in the future'});
  }

  const parsedCount = parseInt(count, 10);
  if (Number.isNaN(parsedCount) || parsedCount < 0) {
    return jsonResponse(400, {error: 'Invalid count value'});
  }

  const headers = event.headers || {};
  const xf = headers['x-forwarded-for'] || headers['X-Forwarded-For'] || headers['x-forwarded'] || headers['X-Forwarded'] || headers['forwarded-for'] || headers['Forwarded-For'];
  let ip = xf ? String(xf).split(',').map(s => s.trim()).filter(Boolean)[0] || null : null;
  ip = ip || headers['x-nf-client-remote-ip'] || headers['x-nf-client-ip'] || headers['client-ip'] || headers['Client-IP'] || null;

  const geolocation = ip ? await lookupLocation(ip) : {};

  const row = {
    name: name || null,
    date,
    count: parsedCount,
    ip: ip || null,
    ...geolocation
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/chants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(row)
    });

    const data = await res.json();
    if (!res.ok) return jsonResponse(res.status, {error: data});

    return jsonResponse(200, {ok: true, inserted: data});
  } catch (err) {
    return jsonResponse(500, {error: String(err)});
  }
};
