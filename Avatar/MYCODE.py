#!/usr/bin/env python3
"""
Text portrait ➜ edge-tts ➜ SadTalker ➜ MP4 with **burned** subtitles
Fully robust version – 2025-06-20
(Streams SadTalker progress logs to the terminal)
"""

import os, sys, uuid, argparse, asyncio, subprocess, io, re
import edge_tts, face_recognition
import numpy as np
from PIL import Image
from rembg import remove

# ─── Voice selection ───────────────────────────────────────────
VOICE_MAP = {
    "india": {"female": "en-IN-NeerjaNeural", "male": "en-IN-PrabhatNeural"}
}
DEFAULT_VOICE = {"female": "en-US-JennyNeural", "male": "en-GB-ThomasNeural"}

def select_voice(nat: str, gen: str) -> str:
    return VOICE_MAP.get(nat.lower(), {}).get(
        gen.lower(), DEFAULT_VOICE.get(gen.lower(), DEFAULT_VOICE["female"])
    )

# ─── Helpers ───────────────────────────────────────────────────
def run(cmd, *, live: bool = False, **kw):
    """
    Run a subprocess.
    • live=False (default) → capture output, print only if the command fails.
    • live=True            → stream stdout/stderr to this terminal (recommended
                             for long-running tools like SadTalker).
    Returns captured stdout (empty string when live=True).
    """
    if live:
        completed = subprocess.run(cmd, **kw)
        if completed.returncode:
            sys.exit(completed.returncode)
        return ""
    else:
        out = subprocess.run(cmd, stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, **kw)
        if out.returncode:
            print(out.stdout.decode(errors="ignore"))
            sys.exit(out.returncode)
        return out.stdout.decode(errors="ignore")

def check_ffmpeg_support():
    """Abort if FFmpeg was built without libass / subtitles filter."""
    filters = run(["ffmpeg", "-filters"])
    if not re.search(r"\bsubtitles\b", filters):
        sys.exit("[ERR] FFmpeg build lacks libass / subtitles filter.")

def _escape_for_sub_filter(path: str) -> str:
    """Make absolute path safe for FFmpeg `subtitles=` filter."""
    p = os.path.abspath(path)
    if os.name == "nt":
        p = p.replace("\\", "\\\\")           # double back-slashes
        if len(p) > 1 and p[1] == ":":
            p = p[0] + r"\:" + p[2:]          # escape drive-letter colon
    return p

# ─── 1) Pre-process portrait (detect, crop, grey BG) ───────────
def preprocess(img_path: str, work: str, margin: float = 0.45) -> str:
    # Load image with PIL instead of face_recognition directly
    from PIL import Image
    import numpy as np
    
    print(f"Opening image: {img_path}")
    # Open and convert to RGB
    pil_img = Image.open(img_path).convert('RGB')
    print(f"Image mode after conversion: {pil_img.mode}")
    rgb = np.array(pil_img)
    print(f"NumPy array shape: {rgb.shape}, dtype: {rgb.dtype}")
    
    # Continue with face detection
    locs = face_recognition.face_locations(rgb, model="hog")
    if not locs:
        sys.exit("[ERR] No face detected in input image.")
    top, right, bottom, left = locs[0]
    h, w = rgb.shape[:2]
    dh, dw = int((bottom - top) * margin), int((right - left) * margin)
    top, bottom = max(0, top - dh), min(h, bottom + dh)
    left, right = max(0, left - dw), min(w, right + dw)
    crop = rgb[top:bottom, left:right]

    buf = io.BytesIO()
    Image.fromarray(crop).save(buf, format="PNG")
    rgba_bytes = remove(
        buf.getvalue(),
        alpha_matting=True,
        alpha_matting_foreground_threshold=230,
        alpha_matting_background_threshold=5,
        alpha_matting_erode_size=0,
    )
    face = Image.open(io.BytesIO(rgba_bytes)).convert("RGBA")
    grey = Image.new("RGBA", face.size, (128, 128, 128, 255))
    grey.paste(face, mask=face.split()[3])
    final = grey.convert("RGB").resize((512, 512), Image.BICUBIC)

    out = os.path.join(work, "processed_face.png")
    final.save(out)
    print("[Pre] saved:", out)
    return out

# ─── 2) edge-tts: text ➜ speech.wav ───────────────────────────
async def _tts(text: str, voice: str, out: str):
    await edge_tts.Communicate(text, voice).save(out)

def generate_wav(text: str, voice: str, out: str):
    print("[TTS] voice:", voice)
    asyncio.run(_tts(text, voice, out))
    print("[TTS] saved:", out)

# ─── 3) ffprobe duration helper ───────────────────────────────
def get_duration(path: str) -> float:
    out = run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            path,
        ]
    )
    return float(out.strip())

# ─── 4) build single-cue SRT ──────────────────────────────────
def make_srt(text: str, wav: str, srt: str):
    T = get_duration(wav)

    def fmt(ts: float):
        h = int(ts // 3600)
        m = int((ts % 3600) // 60)
        s = int(ts % 60)
        ms = int((ts - int(ts)) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    with open(srt, "w", encoding="utf-8") as f:
        # **blank line at end is required**
        f.write(f"1\n{fmt(0)} --> {fmt(T)}\n{text}\n\n")
    print("[SRT] saved:", srt)

# ─── 5) SadTalker silent-video ────────────────────────────────
def run_sadtalker(img: str, wav: str, out_dir: str) -> str:
    os.makedirs(out_dir, exist_ok=True)
    cmd = [
        sys.executable, "inference.py",
        "--source_image", img,
        "--driven_audio", wav,
        # no --enhancer → defaults to None (fastest)
        "--checkpoint_dir", "checkpoints",
        "--result_dir", out_dir,
    ]
    print("[SadTalker]", " ".join(cmd))
    run(cmd, live=True)                        # stream logs!
    mp4s = [f for f in os.listdir(out_dir) if f.lower().endswith(".mp4")]
    if not mp4s:
        sys.exit("[ERR][SadTalker] no .mp4 generated")
    return os.path.join(out_dir, mp4s[0])

# ─── 6) mux & burn subtitles ──────────────────────────────────
def burn_subs(video: str, wav: str, srt: str, out: str):
    srt_escaped = _escape_for_sub_filter(srt)
    vf = f"subtitles='{srt_escaped}'"
    cmd = [
        "ffmpeg", "-y",
        "-i", video, "-i", wav,
        "-vf", vf,
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", out,
    ]
    print("[ffmpeg] burn:", vf)
    run(cmd)

def simple_mux(video: str, wav: str, out: str):
    run(
        [
            "ffmpeg", "-y",
            "-i", video, "-i", wav,
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest", out,
        ]
    )

# ─── Main pipeline ────────────────────────────────────────────
def main():
    check_ffmpeg_support()

    p = argparse.ArgumentParser()
    p.add_argument("text", help="Quote your script here (in quotes)")
    p.add_argument("image", help="Path to a portrait image")
    p.add_argument("--gender", choices=["male", "female"], default="female")
    p.add_argument("--nat", default="", help="Nationality for voice")
    p.add_argument("--subs", action="store_true", help="Burn subtitles")
    args = p.parse_args()

    if not os.path.isfile(args.image):
        sys.exit(f"[ERR] image not found: {args.image}")

    work = f"tmp_{uuid.uuid4().hex}"
    os.makedirs(work)

    wav = os.path.join(work, "speech.wav")
    srt = os.path.join(work, "speech.srt") if args.subs else None
    vid_dir = os.path.join(work, "video")
    os.makedirs(vid_dir)
    final = os.path.join(vid_dir, "final.mp4")

    # 1) TTS
    voice = select_voice(args.nat, args.gender)
    generate_wav(args.text, voice, wav)
    if args.subs:
        make_srt(args.text, wav, srt)

    # 2) Pre-process portrait
    proc_img = preprocess(args.image, work)

    # 3) SadTalker
    silent = run_sadtalker(proc_img, wav, vid_dir)

    # 4) mux + optional burn
    if args.subs:
        burn_subs(silent, wav, srt, final)
    else:
        simple_mux(silent, wav, final)

    print("\n[✅] Complete! Final video:\n   ", final)

if __name__ == "__main__":
    main()