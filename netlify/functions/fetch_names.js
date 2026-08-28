const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const jsonResponse = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse(200, {ok: true});

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, {error: 'Method not allowed. Use GET.'});
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return jsonResponse(500, {error: 'Missing Supabase env variables'});
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/names?order=name.asc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) {
      return jsonResponse(res.status, {error: 'Failed to fetch names'});
    }

    const names = await res.json();
    return jsonResponse(200, {ok: true, names: names.map(n => n.name)});
  } catch (err) {
    return jsonResponse(500, {error: String(err)});
  }
};
