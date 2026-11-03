import { HttpError } from './http'
import { apiPublicUrl, siteOrigin } from './plans'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

export function assertEmail(value: unknown) {
  const email = normalizeEmail(value)
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    throw new HttpError(400, 'invalid_email', 'A valid email is required.')
  }
  return email
}

function sender(env: Env) {
  return {
    email: env.BREVO_SENDER_EMAIL || 'nic@blacnova.net',
    name: env.BREVO_SENDER_NAME || 'Blacnova Development',
  }
}

async function sendBrevo(env: Env, payload: Record<string, unknown>) {
  const apiKey = env.BREVO_API_KEY?.trim()
  if (!apiKey) {
    throw new HttpError(503, 'mail_unconfigured', 'Email sending is not configured.')
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('brevo_send_failed', response.status, detail.slice(0, 300))
    throw new HttpError(502, 'mail_failed', 'Could not send the email. Try again in a minute.')
  }
}

export async function sendApiKeyEmail(env: Env, input: { email: string; key: string; rotated: boolean }) {
  const origin = siteOrigin(env)
  const docs = `${origin}/docs`
  const pricing = `${origin}/pricing`
  const account = `${origin}/account`
  const subject = input.rotated ? 'Your new Instatools API key' : 'Your Instatools API key'
  const intro = input.rotated
    ? 'You asked for a key again, so we issued a new one and revoked the previous key.'
    : 'Here is your Instatools API key. Instatools in the browser stays free. This key is for the HTTP API.'
  const htmlContent = `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#f7f7f8;font-family:Inter,Segoe UI,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">
      <p style="margin:0 0 8px;font-weight:800;letter-spacing:-0.04em;">Instatools</p>
      <h1 style="margin:0 0 12px;font-size:28px;letter-spacing:-0.04em;">Your API key</h1>
      <p style="margin:0 0 16px;line-height:1.5;color:#475569;">${intro}</p>
      <p style="margin:0 0 20px;padding:14px 16px;background:#f1f5f9;border-radius:10px;font-family:ui-monospace,Consolas,monospace;font-size:14px;word-break:break-all;">${input.key}</p>
      <p style="margin:0 0 8px;line-height:1.5;color:#475569;">Keep it private. Treat it like a password. Account: <a href="${account}">${account}</a></p>
      <p style="margin:0;line-height:1.5;color:#475569;">Docs: <a href="${docs}">${docs}</a>. Upgrade: <a href="${pricing}">${pricing}</a></p>
    </div>
  </body>
</html>`
  const textContent = `${subject}

${intro}

${input.key}

Account: ${account}
Docs: ${docs}
Upgrade: ${pricing}
Base URL: ${apiPublicUrl()}
`
  await sendBrevo(env, {
    sender: sender(env),
    to: [{ email: input.email }],
    subject,
    htmlContent,
    textContent,
  })
}

export async function sendLoginEmail(env: Env, input: { email: string; token: string }) {
  const origin = siteOrigin(env)
  const link = `${origin}/account?login=${encodeURIComponent(input.token)}`
  const htmlContent = `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#f7f7f8;font-family:Inter,Segoe UI,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">
      <p style="margin:0 0 8px;font-weight:800;letter-spacing:-0.04em;">Instatools</p>
      <h1 style="margin:0 0 12px;font-size:28px;letter-spacing:-0.04em;">Sign in to Instatools</h1>
      <p style="margin:0 0 16px;line-height:1.5;color:#475569;">This link opens your Instatools account. Unlock Pro layouts, manage API keys, redeem a code, or handle billing. It expires in 15 minutes.</p>
      <p style="margin:0 0 20px;"><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;">Open account</a></p>
      <p style="margin:0;line-height:1.5;color:#475569;font-size:13px;">If the button does not work: ${link}</p>
    </div>
  </body>
</html>`
  const textContent = `Sign in to Instatools

This link opens your Instatools account for Pro layouts, API keys, redeem codes, and billing.
It expires in 15 minutes:

${link}
`
  await sendBrevo(env, {
    sender: sender(env),
    to: [{ email: input.email }],
    subject: 'Sign in to Instatools',
    htmlContent,
    textContent,
  })
}
