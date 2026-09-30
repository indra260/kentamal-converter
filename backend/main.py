import os
import re
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import yt_dlp

app = FastAPI(title="Kentamal Extractor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractRequest(BaseModel):
    url: str

class VideoOption(BaseModel):
    label: str
    url: str
    mb: float

class AudioOption(BaseModel):
    label: str
    url: str
    mb: float

class ExtractResponse(BaseModel):
    title: str
    author: str
    thumb: str
    videos: List[VideoOption]
    audio: Optional[AudioOption] = None

def format_mb(size_bytes: Optional[int]) -> float:
    if not size_bytes or size_bytes <= 0:
        return 0.0
    return round(size_bytes / (1024 * 1024), 1)

@app.get("/health")
def health():
    return {"status": "ok", "service": "kentamal-extractor"}

@app.post("/api/extract", response_model=ExtractResponse)
def extract_media(req: ExtractRequest):
    target_url = req.url.strip()
    if not target_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL tidak valid")

    ydl_opts: Dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extract_flat": False,
        "noplaylist": True,
        "socket_timeout": 15,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target_url, download=False)
            if not info:
                raise HTTPException(status_code=422, detail="Gagal mengambil informasi media")
    except Exception as e:
        err_msg = str(e)
        if "Unsupported URL" in err_msg:
            raise HTTPException(status_code=422, detail="Platform atau URL belum didukung")
        if "Private video" in err_msg or "Sign in" in err_msg:
            raise HTTPException(status_code=403, detail="Video bersifat privat atau membutuhkan login")
        raise HTTPException(status_code=502, detail=f"Gagal ekstraksi: {err_msg[:120]}")

    title = info.get("title") or "Media Download"
    author = info.get("uploader") or info.get("creator") or info.get("channel") or ""
    thumb = info.get("thumbnail") or ""

    formats = info.get("formats", [])
    
    # 1. Video formats
    seen_heights = set()
    videos: List[VideoOption] = []
    
    # Sort formats by height descending
    sorted_formats = sorted(
        [f for f in formats if f.get("url")],
        key=lambda x: (x.get("height") or 0, x.get("tbr") or 0),
        reverse=True
    )

    for f in sorted_formats:
        vcodec = f.get("vcodec")
        height = f.get("height")
        url = f.get("url")
        
        if vcodec and vcodec != "none" and url:
            h_key = height or f.get("format_note") or "video"
            if h_key not in seen_heights:
                seen_heights.add(h_key)
                label = f"{height}p" if height else (f.get("format_note") or "MP4")
                size = f.get("filesize") or f.get("filesize_approx") or 0
                videos.append(VideoOption(label=label, url=url, mb=format_mb(size)))
                if len(videos) >= 5:
                    break

    # If single direct video url (like tiktok/ig sometimes has direct url in info)
    if not videos and info.get("url"):
        videos.append(VideoOption(label="MP4 Video", url=info["url"], mb=0.0))

    # 2. Audio format (best audio stream)
    audio: Optional[AudioOption] = None
    audio_formats = [
        f for f in sorted_formats
        if f.get("acodec") and f.get("acodec") != "none" and (not f.get("vcodec") or f.get("vcodec") == "none")
    ]

    if audio_formats:
        best_audio = audio_formats[0]
        size = best_audio.get("filesize") or best_audio.get("filesize_approx") or 0
        bitrate = best_audio.get("abr") or 128
        audio = AudioOption(
            label=f"{int(bitrate)} kbps",
            url=best_audio["url"],
            mb=format_mb(size)
        )
    elif sorted_formats:
        # Fallback to standard stream
        sample = sorted_formats[-1]
        audio = AudioOption(label="Audio MP3", url=sample["url"], mb=0.0)

    if not videos and not audio:
        raise HTTPException(status_code=422, detail="Format video/audio tidak ditemukan")

    return ExtractResponse(
        title=title,
        author=author,
        thumb=thumb,
        videos=videos,
        audio=audio,
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
