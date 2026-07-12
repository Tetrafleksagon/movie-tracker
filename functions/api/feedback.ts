// Cloudflare Pages Function — user feedback → Resend → dev@ inbox.
// POST /api/feedback  { message, email?, context?, website? }
// Same-origin guard mirrors /api/tmdb; volume limiting is on the WAF layer.
// (Typed loosely: this dir is built by Cloudflare, not by our tsc.)

function hostOf(value: string | null): string | null {
  if (!value) return null
  try { return new URL(value).host } catch { return null }
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context

  const incoming = new URL(request.url)
  const requesterHost = hostOf(request.headers.get('Origin')) || hostOf(request.headers.get('Referer'))
  if (requesterHost !== incoming.host) {
    return new Response('Forbidden', { status: 403 })
  }

  if (!env.RESEND_API_KEY || !env.FEEDBACK_TO) {
    return new Response(JSON.stringify({ error: 'not configured' }), { status: 500 })
  }

  let body: any
  try { body = await request.json() } catch { return new Response('Bad JSON', { status: 400 }) }

  // Honeypot: a hidden `website` field. Real users leave it blank; bots fill
  // every field they see. Silently accept and drop, so scanners don't retry.
  if (typeof body?.website === 'string' && body.website.trim() !== '') {
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (message.length < 10 || message.length > 5000) {
    return new Response(JSON.stringify({ error: 'message length must be 10..5000' }), { status: 400 })
  }

  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 320) : ''
  const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ''

  const ctx = body?.context && typeof body.context === 'object' ? body.context : {}
  const meta = {
    userId: typeof ctx.userId === 'string' ? ctx.userId.slice(0, 64) : '',
    lang: typeof ctx.lang === 'string' ? ctx.lang.slice(0, 8) : '',
    version: typeof ctx.version === 'string' ? ctx.version.slice(0, 32) : '',
    path: typeof ctx.path === 'string' ? ctx.path.slice(0, 256) : '',
    ua: (request.headers.get('User-Agent') || '').slice(0, 300),
    ip: request.headers.get('CF-Connecting-IP') || '',
    ts: new Date().toISOString(),
  }

  const subject = `[Movie Tracker feedback] ${message.slice(0, 60).replace(/\s+/g, ' ')}${message.length > 60 ? '…' : ''}`
  const html = `
    <h2 style="margin:0 0 12px">Feedback from Movie Tracker</h2>
    <div style="white-space:pre-wrap;padding:12px;border-left:3px solid #3b82f6;background:#f8fafc;color:#111;font-family:system-ui,sans-serif">${esc(message)}</div>
    <table style="margin-top:16px;font-family:system-ui,sans-serif;font-size:13px;color:#374151;border-collapse:collapse">
      <tr><td style="padding:2px 8px;color:#9ca3af">From:</td><td style="padding:2px 8px">${validEmail ? esc(validEmail) : '<em>анонимно</em>'}</td></tr>
      <tr><td style="padding:2px 8px;color:#9ca3af">User ID:</td><td style="padding:2px 8px">${esc(meta.userId) || '<em>гость</em>'}</td></tr>
      <tr><td style="padding:2px 8px;color:#9ca3af">Language:</td><td style="padding:2px 8px">${esc(meta.lang)}</td></tr>
      <tr><td style="padding:2px 8px;color:#9ca3af">Version:</td><td style="padding:2px 8px">${esc(meta.version)}</td></tr>
      <tr><td style="padding:2px 8px;color:#9ca3af">Page:</td><td style="padding:2px 8px">${esc(meta.path)}</td></tr>
      <tr><td style="padding:2px 8px;color:#9ca3af">User-Agent:</td><td style="padding:2px 8px">${esc(meta.ua)}</td></tr>
      <tr><td style="padding:2px 8px;color:#9ca3af">IP:</td><td style="padding:2px 8px">${esc(meta.ip)}</td></tr>
      <tr><td style="padding:2px 8px;color:#9ca3af">Timestamp:</td><td style="padding:2px 8px">${esc(meta.ts)}</td></tr>
    </table>
  `.trim()

  const payload: any = {
    from: 'Movie Tracker <feedback@filmtrack.pp.ua>',
    to: [env.FEEDBACK_TO],
    subject,
    html,
  }
  if (validEmail) payload.reply_to = validEmail

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return new Response(JSON.stringify({ error: 'send failed', status: res.status, detail: detail.slice(0, 300) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
