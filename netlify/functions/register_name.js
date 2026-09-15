const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const jsonResponse = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse(200, {ok: true});

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {error: 'Method not allowed'});
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return jsonResponse(500, {error: 'Missing Supabase env variables'});
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return jsonResponse(400, {error: 'Invalid JSON'});
  }

  const { name, device_id } = payload;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return jsonResponse(400, {error: 'Name is required'});
  }

  const trimmedName = name.trim();

  try {
    // Check if name exists in users table
    // For web app, we allow the same name to be used by different users (email/phone will differentiate)
    // We only care if the name exists to prevent conflicts with authenticated users
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?name=eq.${encodeURIComponent(trimmedName)}&select=id,name`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing.length > 0) {
        // Name exists in users table - this could be an authenticated user
        // For web app registration, we'll allow it but note it exists
        // The device_id helps track anonymous registrations
        return jsonResponse(200, {ok: true, name: trimmedName});
      }
    }

    // New registration - insert into users table with device_id
    // No email/phone for anonymous web registration
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ name: trimmedName, device_id: device_id || null, verified: false })
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409 || (data.code === '23505')) {
        return jsonResponse(409, {error: 'Name already registered'});
      }
      return jsonResponse(res.status, {error: data});
    }

    return jsonResponse(200, {ok: true, name: trimmedName});
  } catch (err) {
    return jsonResponse(500, {error: String(err)});
  }
};