const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Email/Phone sending - implement based on your provider (SendGrid, Twilio, etc.)
async function sendOTPEmail(email, code) {
  // TODO: Implement with your email provider (SendGrid, Resend, etc.)
  console.log(`Sending OTP ${code} to email ${email}`);
  return true;
}

async function sendOTPSMS(phone, code) {
  // TODO: Implement with your SMS provider (Twilio, etc.)
  console.log(`Sending OTP ${code} to phone ${phone}`);
  return true;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

function isEmail(contact) {
  return contact.includes('@');
}

function isPhone(contact) {
  return /^[\d\s\+\-\(\)]{10,}$/.test(contact.replace(/\s/g, ''));
}

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

  const { contact, type } = payload; // type: 'signup' or 'signin'

  if (!contact || !type) {
    return jsonResponse(400, {error: 'Contact and type required'});
  }

  if (!['signup', 'signin'].includes(type)) {
    return jsonResponse(400, {error: 'Invalid type'});
  }

  if (!isEmail(contact) && !isPhone(contact)) {
    return jsonResponse(400, {error: 'Invalid email or phone number'});
  }

  try {
    // Check rate limiting - max 3 OTPs per 15 minutes per contact
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const rateLimitRes = await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?contact=eq.${encodeURIComponent(contact)}&created_at=gte.${fifteenMinAgo}&select=id`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (rateLimitRes.ok) {
      const recentCodes = await rateLimitRes.json();
      if (recentCodes.length >= 3) {
        return jsonResponse(429, {error: 'Too many OTP requests. Try again later.'});
      }
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

    // Store OTP
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/otp_codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ contact, code, type, expires_at: expiresAt })
    });

    if (!insertRes.ok) {
      const err = await insertRes.json();
      return jsonResponse(500, {error: 'Failed to store OTP'});
    }

    // Send OTP
    const sent = isEmail(contact) 
      ? await sendOTPEmail(contact, code)
      : await sendOTPSMS(contact, code);

    if (!sent) {
      return jsonResponse(500, {error: 'Failed to send OTP'});
    }

    return jsonResponse(200, {ok: true, message: 'OTP sent'});
  } catch (err) {
    return jsonResponse(500, {error: String(err)});
  }
};