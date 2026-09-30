/**
 * Cloudflare Pages Function — POST /api/extract
 *
 * Thin proxy ke Cobalt API (v10). Tidak menyimpan file: Balikin direct URL,
 * browser yang download langsung dari penyedia. Ini yang bikin hemat bandwidth.
 *
 * Env (Cloudflare Pages → Settings → Environment variables):
 *   COBALT_API   = https://api.cobalt.tools   (default, atau instance self-hosted)
 *   COBALT_JWT   = token dari https://cobalt.tools/account (WAJIB di v10)
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

/* --- SSRF guard: hanya http(s) ke host publik --- */
const PRIVATE = /^(localhost$|127\.|0\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|.*\.local$|.*\.internal$)/i

function checkUrl(raw) {
  let u
  try {
    u = new URL(raw)
  } catch {
    return 'Link-nya belum valid.'
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'Hanya link http:// atau https:// yang didukung.'
  if (PRIVATE.test(u.hostname)) return 'Link internal tidak diizinkan.'
  return null
}

/* --- rate limit per IP, in-memory (free tier Workers isolate) --- */
const WINDOW_MS = 60_000
const MAX = 15
/** @type {Map<string,{t:number,n:number}>} */
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

const mb = (n) => (n > 0 ? Number((n / 1048576).toFixed(1)) : 0)

/** Bentuk response Cobalt v10 → bentuk yang dipakai frontend */
function shape(raw) {
  if (!raw || raw.status === 'error' || raw.error) return null
  const quality = raw.picker || (raw.url ? [raw] : [])

  const videos = quality
    .filter((f) => f.type !== 'audio' && f.url)
    .map((f) => ({ label: f.quality || f.codec || 'Video', url: f.url, mb: mb(f.size) }))

  // Audio: kalau Cobalt sudah convert mp3, pakai; kalau tidak, ambil stream audio terendah.
  const a = raw.audio
  const audio = a?.url
    ? { label: a.bitrate ? `${Math.round(a.bitrate / 1000)} kbps` : 'MP3', url: a.url, mb: mb(a.size) }
    : (() => {
        const stream = (raw.streaming?.audio || []).slice().sort((x, y) => (x.bitrate || 0) - (y.bitrate || 0))[0]
        return stream?.url ? { label: stream.bitrate ? `${Math.round(stream.bitrate / 1000)} kbps` : 'Audio', url: stream.url, mb: 0 } : null
      })()

  if (!videos.length && !audio) return null
  return { title: raw.title || '', author: raw.uploader || raw.author || '', thumb: raw.thumbnail || '', videos, audio }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: JSON_HEADERS })
}

export async function onRequestPost({ request, env }) {
  if (rateLimited(clientIp(request))) {
    return json({ error: 'Terlalu banyak permintaan. Tunggu 1 menit.' }, 429)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Body JSON tidak valid.' }, 400)
  }

  const bad = checkUrl(String(body?.url ?? '').trim())
  if (bad) return json({ error: bad }, 400)

  const api = (env.COBALT_API || 'https://api.cobalt.tools').replace(/\/+$/, '')
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
  if (env.COBALT_JWT) headers.Authorization = `Bearer ${env.COBALT_JWT}`

  let up
  try {
    up = await fetch(`${api}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: body.url.trim(),
        videoQuality: '1080',
        downloadMode: 'auto',
        aFormat: 'mp3',
        filenameStyle: 'pretty',
      }),
    })
  } catch {
    return json({ error: 'Server penyedia sedang tidak bisa dihubungi. Coba lagi sebentar.' }, 502)
  }

  const raw = await up.json().catch(() => null)

  if (!up.ok || !raw) {
    const code = raw?.error?.code || ''
    if (/auth|jwt|token/i.test(code)) {
      return json({ error: 'API belum dikonfigurasi. Set COBALT_JWT di env Cloudflare Pages.' }, 500)
    }
    if (/rate|cooldown/i.test(code)) {
      return json({ error: 'Penyedia sedang membatasi. Coba lagi dalam 1 menit.' }, 429)
    }
    return json({ error: raw?.error?.code || `Penyedia menolak (${up.status}).` }, 502)
  }

  const data = shape(raw)
  if (!data) return json({ error: 'Format download tidak ditemukan untuk link ini.' }, 422)
  return json(data)
}
