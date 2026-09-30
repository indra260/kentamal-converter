import { useEffect, useMemo, useRef, useState } from 'react'

const PLATFORMS = [
  { name: 'YouTube', host: /youtube\.com|youtu\.be/i, icon: 'youtube', color: 'from-red-500 to-red-600' },
  { name: 'TikTok', host: /tiktok\.com/i, icon: 'tiktok', color: 'from-cyan-400 to-pink-500' },
  { name: 'Douyin', host: /douyin\.com|iesdouyin\.com/i, icon: 'douyin', color: 'from-rose-500 to-purple-600' },
  { name: 'Instagram', host: /instagram\.com/i, icon: 'instagram', color: 'from-amber-500 via-rose-500 to-purple-600' },
  { name: 'Facebook', host: /facebook\.com|fb\.watch/i, icon: 'facebook', color: 'from-blue-600 to-blue-700' },
  { name: 'X', host: /x\.com|twitter\.com/i, icon: 'x', color: 'from-zinc-700 to-zinc-900' },
  { name: 'SoundCloud', host: /soundcloud\.com/i, icon: 'soundcloud', color: 'from-orange-500 to-amber-600' },
  { name: 'Bluesky', host: /bsky\.app/i, icon: 'bluesky', color: 'from-sky-400 to-blue-600' },
]

const cx = (...c) => c.filter(Boolean).join(' ')
const YEAR = new Date().getFullYear()
const MAX_HISTORY = 5

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

function useSpotlight() {
  const containerRef = useRef(null)
  useEffect(() => {
    const handleMove = (e) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      containerRef.current.style.setProperty('--mouse-x', `${x}px`)
      containerRef.current.style.setProperty('--mouse-y', `${y}px`)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])
  return containerRef
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

function BrandIcon({ type, className = 'h-5 w-5' }) {
  switch (type) {
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cx('text-red-500', className)}>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    case 'tiktok':
    case 'douyin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cx('text-cyan-400', className)}>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.31 1.54-1.33 2.54-.02.82.32 1.64.92 2.19.82.76 2.02.93 3.02.48.88-.38 1.48-1.22 1.58-2.17.02-3.58.01-7.16.02-10.74z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cx('text-rose-500', className)}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cx('text-blue-600', className)}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cx('text-zinc-800 dark:text-zinc-200', className)}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'soundcloud':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cx('text-orange-500', className)}>
          <path d="M1.175 12.225a.81.81 0 0 0-.25.59c0 .24.08.45.25.61.16.16.36.24.59.24s.43-.08.59-.24c.16-.16.24-.37.24-.61 0-.23-.08-.43-.24-.59a.81.81 0 0 0-.59-.25c-.23 0-.43.09-.59.25zm2.14-1.84a.81.81 0 0 0-.25.59c0 .24.08.45.25.61.16.16.36.24.59.24s.43-.08.59-.24c.16-.16.24-.37.24-.61 0-.23-.08-.43-.24-.59a.81.81 0 0 0-.59-.25c-.23 0-.43.09-.59.25zm2.14-1.28c-.23 0-.43.08-.59.24a.81.81 0 0 0-.25.59c0 .24.08.45.25.61.16.16.36.24.59.24s.43-.08.59-.24c.16-.16.24-.37.24-.61 0-.23-.08-.43-.24-.59a.81.81 0 0 0-.59-.24z" />
        </svg>
      )
    case 'bluesky':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cx('text-sky-400', className)}>
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.377 5.665 2.506 9.523 2.129 3.858 5.485 5.093 7.822 4.41-3.568.835-7.794.225-8.815-1.921C.802 14.362.5 13.067.5 13.067s1.8 3.504 6.7 3.504c3.8 0 4.8-1.7 4.8-1.7s1 1.7 4.8 1.7c4.9 0 6.7-3.504 6.7-3.504s-.302 1.295-1.013 2.713c-1.021 2.146-5.247 2.756-8.815 1.921 2.337.683 5.693-.552 7.822-4.41C23.623 9.433 24 4.458 24 3.768c0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8z" />
        </svg>
      )
    default:
      return <Ico d={Path.link} className={className} />
  }
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
  history: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  ad: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M7 8h10" /><path d="M7 12h10" /><path d="M7 16h6" /></>,
}

function Star({ n, i }) {
  return (
    <span className={cx('text-lg leading-none', n >= i ? 'text-amber-400' : 'text-ink-tertiary/30')} aria-hidden="true">
      ★
    </span>
  )
}

function AdBanner({ slot = 'leaderboard', label = 'Sponsor' }) {
  return (
    <div className="relative my-4 overflow-hidden rounded-2xl border border-dashed border-black/10 bg-surface-2/40 p-3 text-center transition-all dark:border-white/10 dark:bg-white/[.02]">
      <div className="flex items-center justify-between border-b border-black/5 pb-1.5 text-[10px] font-semibold tracking-wider text-ink-tertiary uppercase dark:border-white/5">
        <span className="flex items-center gap-1"><Ico d={Path.ad} className="h-3 w-3" /> {label}</span>
        <span>Ad Placement</span>
      </div>
      <div className="mt-2.5 flex min-h-[60px] items-center justify-center rounded-xl border border-black/[.04] bg-white/60 p-2 text-xs font-medium text-ink-tertiary shadow-inner dark:border-white/5 dark:bg-white/5">
        {slot === 'leaderboard' ? (
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
            <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[11px] font-bold text-brand-600 dark:text-brand-300">Space Iklan (728x90)</span>
            <span>Siap dipasang tag Adsterra / Monetag / Google AdSense</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">Iklan Native</span>
            <span>Rekomendasi sponsor atau tautan relevan</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [theme, toggleTheme] = useTheme()
  const spotlightRef = useSpotlight()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [res, setRes] = useState(null)
  const [tab, setTab] = useState('video')
  const [toast, setToast] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('kc-history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('kc-history', JSON.stringify(history))
    } catch {}
  }, [history])

  const platformObj = useMemo(() => {
    const h = url.trim()
    if (!h) return null
    return PLATFORMS.find((p) => p.host.test(h)) ?? null
  }, [url])

  const platform = platformObj?.name ?? null

  const addHistoryItem = (itemUrl, resultData) => {
    const newItem = {
      id: Date.now().toString(),
      url: itemUrl,
      title: resultData?.title || hostOf(itemUrl) || 'Media Download',
      author: resultData?.author || '',
      platform: PLATFORMS.find((p) => p.host.test(itemUrl))?.name || 'Media',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.url !== itemUrl)
      return [newItem, ...filtered].slice(0, MAX_HISTORY)
    })
  }

  const clearHistory = () => {
    setHistory([])
    setToast('Riwayat dibersihkan')
    setTimeout(() => setToast(''), 2000)
  }

  async function submit(e) {
    if (e) e.preventDefault()
    setErr('')
    const v = url.trim()
    if (!v) return setErr('Tempel link dulu ya.')
    if (!validUrl(v)) return setErr('Linknya belum valid.')

    setBusy(true)
    setRes(null)
    try {
      const apiUrl = import.meta.env.VITE_EXTRACTOR_URL || '/api/extract'
      const r = await fetch(apiUrl, {
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
      addHistoryItem(v, n)
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
    const links = [...(res?.videos?.map((v) => v.url) || []), res?.audio?.url].filter(Boolean)
    try {
      await navigator.clipboard.writeText(links.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setToast('Gagal copy - buka link manual ya.')
      setTimeout(() => setToast(''), 2400)
    }
  }

  const host = hostOf(url)

  return (
    <div ref={spotlightRef} className="spotlight-container relative flex min-h-dvh flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="animate-drift absolute -left-24 -top-32 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl dark:bg-brand-400/15" />
        <div className="animate-drift absolute -right-28 top-40 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl [animation-delay:-3s] dark:bg-emerald-300/10" />
        <div className="spotlight-glow absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_255_255/.9),transparent)] dark:bg-[radial-gradient(60%_100%_at_50%_0%,rgb(255_255_255/.05),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(0_0_0/.035)_1px,transparent_1px),linear-gradient(to_bottom,rgb(0_0_0/.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)] dark:bg-[linear-gradient(to_right,rgb(255_255_255/.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/.04)_1px,transparent_1px)]" />
      </div>

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
            <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'} className="btn-soft h-9 w-9 p-0">
              <Ico d={theme === 'dark' ? Path.sun : Path.moon} className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
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
            YouTube, TikTok, Douyin, Instagram Reels, Facebook, X, SoundCloud. Link dialihkan langsung - file nggak disimpan di server kami.
          </p>
        </section>

        <section className="animate-rise mt-6 sm:mt-8" style={{ animationDelay: '120ms' }}>
          <form onSubmit={submit} className="card relative overflow-hidden">
            <div className="flex flex-col gap-2.5">
              <div className="field relative">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-2/80 dark:bg-white/5">
                  {platformObj ? (
                    <BrandIcon type={platformObj.icon} className="h-5 w-5 animate-pop" />
                  ) : (
                    <Ico d={Path.link} className="h-5 w-5 shrink-0 text-ink-tertiary transition-colors" />
                  )}
                </div>
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
                {PLATFORMS.map((p) => {
                  const isActive = platform === p.name
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        if (!url) {
                          inputRef.current?.focus()
                        }
                      }}
                      className={cx(
                        'pill cursor-pointer transition-all duration-300 ease-out',
                        isActive
                          ? 'bg-gradient-to-r text-white font-semibold shadow-soft scale-105 ' + p.color
                          : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-[1.03] bg-surface-2/60 dark:bg-white/[.04]'
                      )}
                    >
                      <BrandIcon type={p.icon} className="h-3.5 w-3.5" />
                      {p.name}
                    </button>
                  )
                })}
                {platform && host && <span className="pill ml-auto font-mono text-[10px] text-ink-tertiary">{host}</span>}
              </div>
            </div>

            {err && (
              <p role="alert" className="animate-pop mt-3 flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-500/20 dark:text-red-300">
                <Ico d={Path.x} className="mt-0.5 h-4 w-4 shrink-0" />
                {err}
              </p>
            )}
          </form>

          <AdBanner slot="leaderboard" label="Sponsor Utama" />
        </section>

        {history.length > 0 && !res && !busy && (
          <section className="animate-rise mt-4" style={{ animationDelay: '150ms' }}>
            <div className="card p-4">
              <div className="flex items-center justify-between border-b border-black/5 pb-2 dark:border-white/5">
                <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-ink-secondary uppercase">
                  <Ico d={Path.history} className="h-3.5 w-3.5" /> Riwayat Terakhir
                </span>
                <button onClick={clearHistory} className="btn-soft h-7 px-2 text-[11px] text-red-600 dark:text-red-400">
                  <Ico d={Path.trash} className="h-3 w-3" /> Hapus
                </button>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setUrl(h.url)
                      inputRef.current?.focus()
                    }}
                    className="group flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-black/[.04] bg-surface-2/40 p-2.5 transition-all hover:bg-surface-2 hover:border-brand-500/30 dark:border-white/5 dark:bg-white/[.02] dark:hover:bg-white/[.06]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="rounded-lg bg-surface-0 p-1.5 text-ink-secondary shadow-xs dark:bg-white/10">
                        <Ico d={Path.link} className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink-primary group-hover:text-brand-600 dark:group-hover:text-brand-300">
                          {h.title}
                        </p>
                        <p className="truncate text-[10px] text-ink-tertiary">
                          {h.platform} • {h.time}
                        </p>
                      </div>
                    </div>
                    <span className="pill text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                      Gunakan
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

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
                    <button onClick={() => go(it)} className={cx('btn shrink-0 min-h-[44px] px-4', tab === 'video' ? 'btn-primary' : 'btn-go')}>
                      <Ico d={Path.down} className="h-4 w-4" /> Ambil
                    </button>
                  </li>
                ))}
              </ul>

              <AdBanner slot="native" label="Rekomendasi" />

              <p className="mt-2 text-center text-[11px] leading-relaxed text-ink-tertiary">
                Link bersifat sementara dari penyedia. Hanya unduh konten yang kamu berhak gunakan.
              </p>
            </div>
          </section>
        )}

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
