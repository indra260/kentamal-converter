/**
 * Self-check untuk functions/api/extract.js — dijalankan tanpa framework.
 *   node scripts/check-function.mjs
 *
 * Menguji: validasi URL (SSRF), rate limit, dan bentuk response saat upstream gagal.
 * Tidak memanggil Cobalt sungguhan (butuh JWT).
 */
import assert from 'node:assert/strict'

const src = (await import('node:fs')).readFileSync(new URL('../functions/api/extract.js', import.meta.url), 'utf8')
const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))
const { onRequestPost, onRequestOptions } = mod

const req = (url, ip = '1.2.3.4') =>
  new Request('https://kc.pages.dev/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': ip },
    body: JSON.stringify({ url }),
  })

const env = { COBALT_API: 'https://api.cobalt.tools' }
const call = (url, ip) => onRequestPost({ request: req(url, ip), env })

// 1. OPTIONS preflight
assert.equal((await onRequestOptions()).status, 204)

// 2. Tolak URL bukan http(s)
for (const bad of ['ftp://x.com/a.mp4', 'javascript:alert(1)', 'not-a-url', '']) {
  const r = await call(bad)
  assert.equal(r.status, 400, `harus 400 untuk ${bad}`)
}

// 3. Tolak host private / loopback (SSRF)
for (const bad of [
  'http://127.0.0.1:8788/',
  'http://localhost/admin',
  'http://10.0.0.5/x',
  'http://192.168.1.1/x',
  'http://169.254.169.254/latest/meta-data/',
  'http://box.internal/x',
]) {
  const r = await call(bad)
  assert.equal(r.status, 400, `harus 400 untuk ${bad}`)
  assert.match((await r.json()).error, /valid|internal/i)
}

// 4. Body bukan JSON
const bad = await onRequestPost({ request: new Request('https://x.dev', { method: 'POST', body: '{oops' }), env })
assert.equal(bad.status, 400)

// 5. Rate limit: 16 request valid dari IP sama harus kena 429
let limited = false
for (let i = 0; i < 16; i++) {
  const r = await call('https://youtu.be/aqz-KE-bpKQ', '9.9.9.9')
  if (r.status === 429) { limited = true; break }
}
assert.ok(limited, 'rate limit tidak aktif')

// 6. Upstream menolak tanpa JWT → pesan jelas, bukan error generik
const noJwt = await call('https://youtu.be/aqz-KE-bpKQ', '8.8.8.8')
assert.equal(noJwt.status, 500)
assert.match((await noJwt.json()).error, /COBALT_JWT/)

console.log('OK — 6 kelompokassert lolos')
