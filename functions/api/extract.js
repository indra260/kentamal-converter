/**
 * Cloudflare Pages Function — POST /api/extract
 * 
 * Proxy ke backend Python (yt-dlp) milik sendiri.
 * Menggunakan env EXTRACTOR_URL untuk menentukan alamat backend public.
 */

const ALLOW_METHODS = 'POST, OPTIONS'
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': ALLOW_METHODS,
  'Access-Control-Allow-Headers': 'Content-Type',
}

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS })

const clientIp = (req) =>
  req.headers.get('cf-connecting-ip') ||
  (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
  'unknown'

const PRIVATE = /^(localhost$|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i

function checkUrl(raw) {
  let u
  try { u = new URL(raw) } catch { return 'Link-nya belum valid.' }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'Hanya link http:// atau https:// yang didukung.'
  if (PRIVATE.test(u.hostname)) return 'Link internal tidak diizinkan.'
  return null
}

const WINDOW_MS = 60_000
const MAX = 20
const hits = new Map()

function rateLimited(ip) {
  if (ip === 'unknown') return false
  const now = Date.now()
  const e = hits.get(ip)
  if (!e || now - e.t > WINDOW_MS) {
    hits.set(ip, { t: now, n: 1 })
    if (hits.size > 5000) hits.clear()
    return false
  }
  e.n += 1
  return e.n > MAX
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: JSON_HEADERS })
}

export async function onRequestPost({ request, env }) {
  if (rateLimited(clientIp(request))) {
    return json({ error: 'Terlalu banyak permintaan. Tunggu 1 menit.' }, 429)
  }

  let body
  try { body = await request.json() } catch { return json({ error: 'Body JSON tidak valid.' }, 400) }

  const target = String(body?.url ?? '').trim()
  const bad = checkUrl(target)
  if (bad) return json({ error: bad }, 400)

  // Gunakan backend Python lokal untuk dev, atau public URL untuk prod
  // Set EXTRACTOR_URL di Cloudflare Dashboard
  const apiBase = (env.EXTRACTOR_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
  
  try {
    const up = await fetch(`${apiBase}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: target }),
    })

    const data = await up.json()

    if (!up.ok) {
      return json({ error: data?.detail || 'Gagal ekstraksi dari backend.' }, up.status)
    }

    return json(data)
  } catch (err) {
    return json({ 
      error: 'Backend extractor tidak terjangkau. Pastikan EXTRACTOR_URL sudah diset dan backend aktif.',
      debug: err.message 
    }, 502)
  }
}
