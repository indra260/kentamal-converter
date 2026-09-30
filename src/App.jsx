import { useEffect, useMemo, useRef, useState } from 'react'

/* ponytail: no Turnstile yet — add when bots show up. IP rate limit in the Pages Function covers MVP. */

const PLATFORMS = [
  { name: 'YouTube', host: /youtube\.com|youtu\.be/i },
  { name: 'TikTok', host: /tiktok\.com/i },
  { name: 'Douyin', host: /douyin\.com|iesdouyin\.com/i },
  { name: 'Instagram', host: /instagram\.com/i },
  { name: 'Facebook', host: /facebook\.com|fb\.watch/i },
  { name: 'X', host: /x\.com|twitter\.com/i },
  { name: 'SoundCloud', host: /soundcloud\.com/i },
  { name: 'Bluesky', host: /bsky\.app/i },
]

const cx = (...c) => c.filter(Boolean).join(' ')

const YEAR = new Date().getFullYear()

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('kc-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('kc-theme', theme)
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

const validUrl = (v) => {
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const hostOf = (v) => {
  try {
    return new URL(v).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const bytes = (n) => {
  if (n === undefined || n === null) return ''
  if (typeof n === 'string') return n
  if (n === 0) return ''
  return `${n} MB`
}

/* Response /api/extract sudah dinormalisasi server → { videos:[{label,url,mb}], audio, title, author, thumb } */
function normalize(r) {
  if (!r || r.status === 'error' || r.error) return null
  const videos = (r.videos || []).filter((v) => v?.url)
  const audio = r.audio?.url ? r.audio : null
  if (!videos.length && !audio) return null
  return { videos, audio, title: r.title || '', author: r.author || '', thumb: r.thumb || '' }
}

function Ico({ d, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {d}
    </svg>
  )
}

const Path = {
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>,
  video: <><rect x="2.5" y="5.5" width="13" height="13" rx="2.5" /><path d="m15.5 11 5-3v8l-5-3" /></>,
  audio: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  down: <><path d="M12 3v12" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4.5 20.5h15" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  x: <><path d="m6 6 12 12M18 6 6 18" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>,
  play: <><rect x="2.5" y="4.5" width="19" height="15" rx="3" /><path d="m10 9.5 5 2.5-5 2.5z" /></>,
}

function Star({ n, i }) {
  return (
    <span
      className={cx('text-lg leading-none', n >= i ? 'text-amber-400' : 'text-ink-tertiary/30')}
      aria-hidden="true"
    >
      ★
    </span>
  )
}

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [res, setRes] = useState(null)
  const [tab, setTab] = useState('video')
  const [toast, setToast] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  const platform = useMemo(() => {
    const h = url
    return PLATFORMS.find((p) => p.host.test(h))?.name ?? null
  }, [url])

  async function submit(e) {
    e.preventDefault()
    setErr('')
    const v = url.trim()
    if (!v) return setErr('Tempel link dulu ya.')
    if (!validUrl(v)) return setErr('Linknya belum valid.')

    setBusy(true)
    setRes(null)
    try {
      const r = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: v }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || `Gagal (${r.status})`)
      const n = normalize(j)
      if (!n) throw new Error(j?.error || 'Format download tidak ditemukan.')
      setRes(n)
      setTab(n.videos.length ? 'video' : 'audio')
    } catch (x) {
      setErr(x.message || 'Terjadi kesalahan.')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setUrl('')
    setRes(null)
    setErr('')
    setCopied(false)
    inputRef.current?.focus()
  }

  function go(item) {
    const a = document.createElement('a')
    a.href = item.url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
    setToast(`Membuka ${res?.title ? 'download' : 'link'}…`)
    setTimeout(() => setToast(''), 2400)
  }

  async function copyAll() {
    const links = [...res.videos.map((v) => v.url), res.audio?.url].filter(Boolean)
    try {
      await navigator.clipboard.writeText(links.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setToast('Gagal copy — buka link manual ya.')
      setTimeout(() => setToast(''), 2400)
    }
  }

  const host = hostOf(url)

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* ambience */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="animate-drift absolute -left-24 -top-32 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl dark:bg-brand-400/15" />
        <div className="animate-drift absolute -right-28 top-40 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl [animation-delay:-3s] dark:bg-emerald-300/10" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_255_255/.9),transparent)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_255_255/.05),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(0_0_0/.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(0_0_0/.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)] dark:bg-[linear-gradient(to_right,rgb(255_255_255/.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/.04)_1px,transparent_1px)]" />
      </div>

      {/* header */}
      <header className="animate-rise sticky top-0 z-30 border-b border-black/[.05] bg-surface-0/70 backdrop-blur-xl dark:border-white/10">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="group flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-soft ring-1 ring-white/20 transition-transform duration-200 ease-out group-hover:-rotate-6 group-hover:scale-105">
              <Ico d={Path.play} className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-extrabold tracking-tight">Kentamal</span>
              <span className="block text-[11px] font-medium text-ink-tertiary">Convert</span>
            </span>
          </a>
          <div className="flex items-center gap-1.5">
            <span className="pill hidden sm:inline-flex">Powered by Cobalt</span>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              className="btn-soft h-9 w-9 p-0"
            >
              <Ico d={theme === 'dark' ? Path.sun : Path.moon} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {/* hero */}
        <section className="animate-rise text-center" style={{ animationDelay: '60ms' }}>
          <span className="pill mb-4 inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Gratis · tanpa login · langsung unduh
          </span>
          <h1 className="font-display text-balance text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Tempel link,{' '}
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-500 bg-clip-text text-transparent">
              MP4 atau MP3
            </span>
            <br className="hidden sm:block" /> dalam hitungan detik.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-ink-secondary sm:mt-4 sm:text-base">
            YouTube, TikTok, Douyin, Instagram Reels, Facebook, X, SoundCloud. Link dialihkan
            langsung — file nggak disimpan di server kami.
          </p>
        </section>

        {/* form */}
        <section className="animate-rise mt-6 sm:mt-8" style={{ animationDelay: '120ms' }}>
          <form onSubmit={submit} className="card">
            <div className="flex flex-col gap-2.5">
              <div className="field">
                <Ico d={Path.link} className="h-5 w-5 shrink-0 text-ink-tertiary" />
                <label htmlFor="url" className="sr-only">Link video</label>
                <input
                  ref={inputRef}
                  id="url"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck="false"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-tertiary sm:text-base"
                  disabled={busy}
                />
                {url && (
                  <button type="button" onClick={reset} aria-label="Bersihkan" className="btn-soft h-8 w-8 shrink-0 p-0">
                    <Ico d={Path.x} className="h-4 w-4" />
                  </button>
                )}
                <button type="submit" className="btn-primary h-10 shrink-0 px-4 sm:px-5" disabled={busy}>
                  {busy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Proses
                    </>
                  ) : (
                    <>
                      <Ico d={Path.down} className="h-4 w-4" />
                      <span className="hidden sm:inline">Convert</span>
                      <span className="sm:hidden">Ambil</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {PLATFORMS.map((p) => (
                  <span key={p.name} className={cx('pill', platform === p.name && 'bg-brand-500/10 text-brand-700 ring-brand-500/25 dark:text-brand-300')}>
                    {p.name}
                  </span>
                ))}
                {platform && host && <span className="pill ml-auto text-ink-tertiary">{host}</span>}
              </div>
            </div>

            {err && (
              <p role="alert" className="animate-pop mt-3 flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-500/20 dark:text-red-300">
                <Ico d={Path.x} className="mt-0.5 h-4 w-4 shrink-0" />
                {err}
              </p>
            )}
          </form>
        </section>

        {/* loading */}
        {busy && (
          <section className="animate-rise mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2" aria-busy="true" aria-live="polite">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="skel h-10 w-10 !rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skel h-3 w-24" />
                    <div className="skel h-2.5 w-16" />
                  </div>
                </div>
                <div className="skel h-9 w-full !rounded-xl" />
              </div>
            ))}
            <span className="sr-only">Mengambil link download…</span>
          </section>
        )}

        {/* result */}
        {!busy && res && (
          <section className="animate-rise mt-4 sm:mt-5">
            <div className="card">
              <div className="flex flex-wrap items-start gap-3">
                {res.thumb && (
                  <img src={res.thumb} alt="" loading="lazy" className="h-16 w-24 shrink-0 rounded-xl object-cover ring-1 ring-black/10 dark:ring-white/10" />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 font-display text-base font-bold sm:text-lg">{res.title || 'Link siap diunduh'}</h2>
                  {res.author && <p className="mt-0.5 truncate text-sm text-ink-tertiary">{res.author}</p>}
                </div>
                <button onClick={reset} className="btn-soft shrink-0">Link lain</button>
              </div>

              <div className="mt-4 flex items-center gap-1.5 rounded-2xl bg-surface-2/60 p-1 ring-1 ring-inset ring-black/5 dark:bg-white/[.04] dark:ring-white/10">
                {res.videos.length > 0 && (
                  <button onClick={() => setTab('video')} className={cx('btn flex-1', tab === 'video' ? 'bg-brand-600 text-white shadow-soft' : 'text-ink-secondary hover:text-ink-primary')} aria-pressed={tab === 'video'}>
                    <Ico d={Path.video} className="h-4 w-4" /> Video {res.videos.length > 0 && <span className="text-xs opacity-70">({res.videos.length})</span>}
                  </button>
                )}
                {res.audio && (
                  <button onClick={() => setTab('audio')} className={cx('btn flex-1', tab === 'audio' ? 'bg-emerald-600 text-white shadow-soft' : 'text-ink-secondary hover:text-ink-primary')} aria-pressed={tab === 'audio'}>
                    <Ico d={Path.audio} className="h-4 w-4" /> Audio MP3
                  </button>
                )}
                <button onClick={copyAll} className="btn-soft" aria-label="Copy semua link" title={copied ? 'Tercopy!' : 'Copy semua link'}>
                  <Ico d={Path.copy} className="h-4 w-4" />
                </button>
              </div>

              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {(tab === 'video' ? res.videos : res.audio ? [res.audio] : []).map((it) => (
                  <li key={it.url} className="group flex items-center justify-between gap-3 rounded-2xl border border-black/[.06] bg-white/70 p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-soft dark:border-white/10 dark:bg-white/[.04]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{it.label}</p>
                      <p className="text-[11px] text-ink-tertiary">{bytes(it.mb) || (tab === 'video' ? 'MP4' : 'MP3')}</p>
                    </div>
                    <button onClick={() => go(it)} className={cx('btn shrink-0', tab === 'video' ? 'btn-primary' : 'btn-go')}>
                      <Ico d={Path.down} className="h-4 w-4" /> Ambil
                    </button>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-tertiary">
                Link bersifat sementara dari penyedia. Hanya unduh konten yang kamu berhak gunakan.
              </p>
            </div>
          </section>
        )}

        {/* trust */}
        <section className="animate-rise mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3" style={{ animationDelay: '180ms' }}>
          {[
            { t: 'Tanpa Install', d: 'Cukup paste link di browser HP atau PC.', s: [1, 2, 3, 4, 5] },
            { t: 'Link Sementara', d: 'File nggak disimpan, langsung dari penyedia.', s: [4, 5, 4, 3, 2] },
            { t: 'Multi Platform', d: 'YouTube sampai Douyin & Reels.', s: [5, 4, 5, 4, 5] },
          ].map((c) => (
            <div key={c.t} className="card p-4 transition-transform duration-200 ease-out hover:-translate-y-1">
              <div className="flex gap-0.5">
                {c.s.map((v, i) => <Star key={i} n={v} i={i} />)}
              </div>
              <p className="mt-2 text-sm font-bold">{c.t}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-secondary">{c.d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-black/[.05] py-6 text-center text-xs text-ink-tertiary dark:border-white/10">
        <p>© {YEAR} Kentamal Convert · untuk keperluan pribadi</p>
      </footer>

      {toast && (
        <div role="status" className="animate-pop fixed inset-x-4 bottom-5 z-50 mx-auto w-fit max-w-[92%] rounded-2xl bg-ink-primary px-4 py-2.5 text-sm font-medium text-surface-0 shadow-lift">
          {toast}
        </div>
      )}
    </div>
  )
}
