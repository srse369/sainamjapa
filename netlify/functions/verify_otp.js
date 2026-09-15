const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const jsonResponse = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
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

  const { contact, code, type } = payload; // type: 'signup' or 'signin'

  if (!contact || !code || !type) {
    return jsonResponse(400, {error: 'Contact, code, and type required'});
  }

  try {
    // Find valid OTP
    const now = new Date().toISOString();
    const otpRes = await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?contact=eq.${encodeURIComponent(contact)}&code=eq.${encodeURIComponent(code)}&type=eq.${type}&expires_at=gte.${now}&select=id,contact`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!otpRes.ok) {
      return jsonResponse(500, {error: 'Failed to verify OTP'});
    }

    const otps = await otpRes.json();
    if (otps.length === 0) {
      // Increment attempts on failed tries
      await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?contact=eq.${encodeURIComponent(contact)}&code=eq.${encodeURIComponent(code)}&type=eq.${type}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ attempts: { increment: 1 } })
      });
      return jsonResponse(400, {error: 'Invalid or expired OTP'});
    }

    // OTP valid - delete it (one-time use)
    await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?id=eq.${otps[0].id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (type === 'signup') {
      // For signup, we need name from the payload
      const { name } = payload;
      if (!name || !name.trim()) {
        return jsonResponse(400, {error: 'Name required for signup'});
      }

      // Check if user already exists with this contact
      const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/users?${isEmail(contact) ? 'email' : 'phone'}=eq.${encodeURIComponent(contact)}&select=id,name,verified`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (existingRes.ok) {
        const existing = await existingRes.json();
        if (existing.length > 0) {
          if (existing[0].verified) {
            return jsonResponse(409, {error: 'Account already exists. Please sign in.'});
          }
          // Update unverified user
          const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${existing[0].id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ name: name.trim(), verified: true })
          });
          if (!updateRes.ok) {
            return jsonResponse(500, {error: 'Failed to update user'});
          }
          return jsonResponse(200, {ok: true, user: { name: name.trim(), contact, verified: true }});
        }
      }

      // Create new user
      const insertData = { name: name.trim(), verified: true };
      if (isEmail(contact)) insertData.email = contact;
      else insertData.phone = contact;

      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(insertData)
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        if (err.code === '23505') {
          return jsonResponse(409, {error: 'Account already exists'});
        }
        return jsonResponse(500, {error: 'Failed to create user'});
      }

      const user = await createRes.json();
      return jsonResponse(200, {ok: true, user: user[0]});
    } else {
      // Sign in - find user
      const field = isEmail(contact) ? 'email' : 'phone';
      const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?${field}=eq.${encodeURIComponent(contact)}&verified=eq.true&select=id,name,${field}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!userRes.ok) {
        return jsonResponse(500, {error: 'Failed to find user'});
      }

      const users = await userRes.json();
      if (users.length === 0) {
        return jsonResponse(404, {error: 'No verified account found. Please sign up.'});
      }

      return jsonResponse(200, {ok: true, user: users[0]});
    }
  } catch (err) {
    return jsonResponse(500, {error: String(err)});
  }
};

function isEmail(contact) {
  return contact.includes('@');
}