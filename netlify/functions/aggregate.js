const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

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

const fetchRows = async () => {
  const mainQuery = `${SUPABASE_URL}/rest/v1/chants?select=id,name,date,country,city,latitude,longitude,ip,count,created_at`;
  const fallbackQuery = `${SUPABASE_URL}/rest/v1/chants?select=id,name,date,ip,count,created_at`;

  let res = await fetch(mainQuery, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!res.ok) {
    const text = await res.text();
    const fallback = await fetch(fallbackQuery, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!fallback.ok) {
      throw new Error(text || 'Aggregate query failed');
    }

    return fallback.json();
  }

  return res.json();
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse(200, {ok: true});

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, {error: 'Method not allowed'});
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return jsonResponse(500, {error: 'Missing SUPABASE_URL or SUPABASE_KEY env variables'});
  }

  try {
    const rows = await fetchRows();

    const total = rows.reduce((s, r) => s + (Number(r.count) || 0), 0);

    const dailyMap = {};
    for (const r of rows) {
      const d = r.date;
      dailyMap[d] = (dailyMap[d] || 0) + (Number(r.count) || 0);
    }

    const daily = Object.keys(dailyMap)
      .map(date => ({date, count: dailyMap[date]}))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const locations = Object.values(
      rows.reduce((acc, row) => {
        const lat = Number(row.latitude);
        const lon = Number(row.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return acc;
        const key = `${row.country || 'Unknown'}::${row.city || 'Unknown'}::${lat}::${lon}`;
        if (!acc[key]) {
          acc[key] = {
            country: row.country || 'Unknown',
            city: row.city || 'Unknown',
            latitude: lat,
            longitude: lon,
            count: 0
          };
        }
        acc[key].count += Number(row.count) || 0;
        return acc;
      }, {})
    ).sort((a, b) => b.count - a.count);

    return jsonResponse(200, {ok: true, total, daily, locations});
  } catch (err) {
    return jsonResponse(500, {error: String(err)});
  }
};
