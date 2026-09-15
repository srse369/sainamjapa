const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Brevo (Sendinblue) email configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@sainamjapa.local';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Sainam Japam';

async function sendOTPEmail(email, code) {
  if (!BREVO_API_KEY) {
    console.log('\n📧 ===== EMAIL (Development Mode - Not Sent) =====');
    console.log('To:', email);
    console.log('Code:', code);
    console.log('====================================================\n');
    return true;
  }

  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #FF6200; }
            .content { padding: 30px 20px; }
            .otp-code { text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #FF6200; background: #FEF3E2; padding: 20px; border-radius: 8px; margin: 30px 0; font-family: 'Courier New', monospace; }
            .warning { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 20px 0; color: #666; font-size: 12px; border-top: 1px solid #E5E7EB; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header"><h1 style="color: #FF6200; margin: 0;">🕉️ Sainam Japam</h1></div>
          <div class="content">
            <h2 style="color: #333;">Your Verification Code</h2>
            <p>Use this code to sign in to Sainam Japam. This code will expire in <strong>10 minutes</strong>.</p>
            <div class="otp-code">${code}</div>
            <div class="warning"><strong>⚠️ Security Notice:</strong> Never share this code with anyone. Sainam Japam staff will never ask for your login code.</div>
            <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
          <div class="footer"><p>© ${new Date().getFullYear()} Sainam Japam. All rights reserved.</p></div>
        </body>
      </html>
    `;

    const text = `
Sainam Japam - Your Verification Code

Your verification code is: ${code}

This code will expire in 10 minutes.

⚠️ Security Notice: Never share this code with anyone. Sainam Japam staff will never ask for your login code.

If you didn't request this code, you can safely ignore this email.
    `.trim();

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email }],
        subject: 'Your Sainam Japam Verification Code',
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Brevo API Error:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isEmail(contact) {
  return contact.includes('@');
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
    return jsonResponse(500, {error: 'Missing SUPABASE_URL or SUPABASE_KEY env variables'});
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return jsonResponse(400, {error: 'Invalid JSON'});
  }

  const { contact, type } = payload;

  if (!contact || !type) {
    return jsonResponse(400, {error: 'Contact and type required'});
  }

  if (!['signup', 'signin'].includes(type)) {
    return jsonResponse(400, {error: 'Invalid type'});
  }

  if (!isEmail(contact)) {
    return jsonResponse(400, {error: 'Invalid email address'});
  }

  try {
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

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

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

    const sent = await sendOTPEmail(contact, code);

    if (!sent) {
      return jsonResponse(500, {error: 'Failed to send OTP'});
    }

    return jsonResponse(200, {ok: true, message: 'OTP sent'});
  } catch (err) {
    return jsonResponse(500, {error: String(err)});
  }
};