import fetch from 'node-fetch';

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'no-reply@yourapp.com';
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Resend API error: ${res.status} ${txt}`);
  }

  return res.json();
}

export default { sendEmail };
