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
Browser ──POST /api/extract──> Cloudflare Pages Function ──> Backend Python (yt-dlp)
   │                              │  (validasi URL, rate limit 20/menit/IP)
   │<── { videos[], audio, title } ┘
   │
   └── klik Ambil ──> direct URL dari penyedia (file lewat penyedia, bukan lewat server kita)
```

Backend Python (`backend/main.py`) mengekstrak video/audio menggunakan `yt-dlp` langsung dari URL sumber (YouTube, TikTok, Douyin, Instagram Reels, Facebook, X, SoundCloud, Bluesky). Direct stream URL dikembalikan ke frontend, jadi tidak ada file yang disimpan dan bandwidth tetap hemat.

**Kenapa pakai yt-dlp?** Cobalt API v7 sudah dimatikan (Nov 2024). V10 memerlukan JWT. Dengan backend sendiri, kita punya kendali penuh tanpa bergantung pada layanan pihak ketiga.

## Deploy Backend (Gratis)

Backend harus di-host secara publik agar bisa diakses oleh Cloudflare Pages. Pilih salah satu:

| Platform | Gratis? | Catatan |
|---|---|---|
| **Koyeb** | Ya (Free Tier) | Tanpa kartu kredit, mudah deploy Docker |
| **Render** | Ya (Free, sleep setelah 15m idle) | Perlu kartu untuk verifikasi |
| **Railway** | Kredit gratis $5 bulan pertama | Cukup generous untuk MVP |

### Langkah Deploy Backend (contoh: Koyeb)
1. Buat akun di koyeb.com
2. New Service → select Dockerfile di folder `backend/`
3. Set env variable: `PORT=8000`
4. Deploy → dapatkan URL seperti `https://kentamal-api.koyeb.app`

### Langkah Deploy Frontend (Cloudflare Pages)
1. Push repo ke GitHub
2. Cloudflare Pages → Create project → Connect repository
3. Build command: `npm run build`, output directory: `dist`
4. Add environment variable: `EXTRACTOR_URL = https://your-backend-url/api/extract`
5. Deploy

### Langkah Deploy Frontend (alternatif, tanpa Cloudflare)
Bisa juga deploy ke Netlify/Vercel:
- Build command: `npm run build`
- Publish directory: `dist`
- Add env var: `VITE_EXTRACTOR_URL=https://your-backend-url/api/extract`

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
├── backend/               # NEW — Python FastAPI extractor
│   ├── main.py           # yt-dlp extractor langsung
│   ├── requirements.txt
│   ├── Dockerfile         # Untuk deployment ke Render/Railway/Koyeb
│   └── Procfile          # Untuk Railway/Heroku
├── dist/              # hasil build
```

## Catatan

- Rate limit 20 permintaan/menit/IP, map in-memory per isolate Workers.
- Input URL divalidasi (hanya http/https, tolak host private) supaya endpoint nggak jadi SSRF proxy.
- `prefers-reduced-motion` dihormati: semua animasi dimatikan.
- Mode gelap ikut `prefers-color-scheme` dan bisa ditimpa manual, disimpan di localStorage.
- Unduh hanya konten yang kamu berhak gunakan.
