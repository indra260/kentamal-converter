# Kentamal Convert

Ubah video dari YouTube, TikTok, Douyin, Instagram Reels, Facebook, X, SoundCloud, Bluesky
jadi MP4 atau MP3. Gratis, tanpa login, tanpa install, file nggak disimpan.

Frontend: Vite + React + Tailwind. Backend: 1 Cloudflare Pages Function (thin proxy).
Deploy: Cloudflare Pages. Nol biaya.

## Jalankan lokal

```bash
npm i
npm run dev          # http://localhost:5173
```

`/api/extract` hanya jalan di `wrangler pages dev` atau setelah deploy ke Cloudflare Pages,
karena Vite dev server tidak membaca folder `functions/`. Untuk uji penuh:

```bash
npx wrangler pages dev dist --port 8788
```

## Env (Cloudflare Pages → Settings → Environment variables)

| Key | Wajib | Keterangan |
|---|---|---|
| `COBALT_API` | tidak | Default `https://api.cobalt.tools`. Ganti kalau self-host Cobalt. |
| `COBALT_JWT` | **ya** | Token dari akun cobalt.tools. Cobalt v10 menolak semua request tanpa JWT. |

Tanpa `COBALT_JWT`, endpoint balas `API belum dikonfigurasi`. Itu normal — bukan bug.

## Kenapa perlu Cobalt

Cobalt v7 API (endpoint publik yang biasa dipakai situs downloader) **dimatikan 11 Nov 2024**.
Cobalt v10 sekarang wajib JWT. Jadi tidak ada API publik gratis tanpa token.

Pilihan lain (Piped, Invidious, YTDLAPI) saat ini: mati, 403, 401, atau Cloudflare 525.
Kalau nanti ada yang hidup, tinggal ganti isi `functions/api/extract.js` — frontend tidak berubah.

## Arsitektur

```
Browser ──POST /api/extract──> Pages Function ──Bearer JWT──> Cobalt
   │                              │  (validasi URL, rate limit 15/menit/IP)
   │<── { videos[], audio, title } ┘
   │
   └── klik Ambil ──> direct URL dari penyedia (file lewat penyedia, bukan lewat server kita)
```

Tidak ada file yang disimpan. Tidak ada ffmpeg. Tidak ada bandwidth keluar dari Workers
selain JSON metadata.

## Deploy

1. `git init && git add -A && git commit -m "init"`
2. Push ke GitHub
3. Cloudflare Pages → Create → Connect to Git → pilih repo
4. Build command `npm run build`, output directory `dist`
5. Environment variables: `COBALT_JWT`
6. Deploy

Functions di `functions/` otomatis terdeteksi, tidak perlu setting tambahan.

## Struktur

```
kentamal-converter/
├── index.html
├── src/
│   ├── App.jsx        semua UI + logic
│   ├── index.css      token tema (light/dark), komponen, motion
│   └── main.jsx
├── functions/api/extract.js   proxy Cobalt + rate limit + validasi URL
├── public/favicon.svg
└── dist/              hasil build
```

## Catatan

- Rate limit 15 permintaan/menit/IP, map in-memory per isolate Workers.
- Input URL divalidasi (hanya http/https, tolak host private) supaya endpoint nggak jadi SSRF proxy.
- `prefers-reduced-motion` dihormati: semua animasi dimatikan.
- Mode gelap ikut `prefers-color-scheme` dan bisa ditimpa manual, disimpan di localStorage.
- Unduh hanya konten yang kamu berhak gunakan.
