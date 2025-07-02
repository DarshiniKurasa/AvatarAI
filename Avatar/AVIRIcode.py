#!/usr/bin/env python3
"""
Text + single-face portrait → edge-tts → SadTalker → final talking-head mp4
– now with automatic face-crop & grey background.
"""

import os
import sys
import uuid
import argparse
import asyncio
import subprocess
import io
from typing import Tuple

import edge_tts

# ────────────────────────────────────────────────────────────────────────────────
# NEW imports for pre-processing
import face_recognition        # face detection
import numpy as np
from PIL import Image
from rembg import remove       # background removal
# ────────────────────────────────────────────────────────────────────────────────

# ① Voice selection map
VOICE_MAP = {
    "india": {
        "female": "en-IN-NeerjaNeural",
        "male":   "en-IN-PrabhatNeural",
    },
}
DEFAULT_VOICE = {
    "female": "en-US-JennyNeural",
    "male":   "en-US-GuyNeural",
}

def select_voice(nationality: str, gender: str) -> str:
    nat = (nationality or "").strip().lower()
    gen = (gender or "").strip().lower()
    if nat in VOICE_MAP and gen in VOICE_MAP[nat]:
        return VOICE_MAP[nat][gen]
    return DEFAULT_VOICE.get(gen, DEFAULT_VOICE["female"])


# ────────────────────────────────────────────────────────────────────────────────
# NEW helper → detect-crop-grey-bg
def preprocess_face(img_path: str, work_dir: str, margin: float = 0.45) -> str:
    """
    Detect single face in `img_path`, crop with margin, replace background by
    solid grey, save to <work_dir>/processed_face.png and return that path.
    """
    print("[Pre] Loading image & finding face…")
    img_np = face_recognition.load_image_file(img_path)
    face_locations = face_recognition.face_locations(img_np, model="hog")

    if not face_locations:
        raise RuntimeError("No face detected in the input image.")

    top, right, bottom, left = face_locations[0]

    # expand bounding box by `margin`
    h, w = img_np.shape[:2]
    box_h, box_w = bottom - top, right - left
    dy, dx = int(box_h * margin), int(box_w * margin)
    top    = max(0, top - dy)
    bottom = min(h, bottom + dy)
    left   = max(0, left - dx)
    right  = min(w, right + dx)

    face_crop = img_np[top:bottom, left:right]
    face_pil  = Image.fromarray(face_crop)

    # background removal → RGBA
    buf_in  = io.BytesIO()
    face_pil.save(buf_in, format="PNG")
    # ---- inside preprocess_face() ----
    rgba_bytes = remove(
        buf_in.getvalue(),
        alpha_matting=True,                        # enable trimap refinement
        alpha_matting_foreground_threshold=230,    # pixels ≥ 230 = definite foreground
        alpha_matting_background_threshold=5,      # pixels ≤ 5   = definite background
        alpha_matting_erode_size=0                 # ✨ DO NOT shrink the mask
    )
    face_rgba  = Image.open(io.BytesIO(rgba_bytes)).convert("RGBA")

    # solid grey background
    grey_bg = Image.new("RGBA", face_rgba.size, (128, 128, 128, 255))
    grey_bg.paste(face_rgba, mask=face_rgba.split()[3])  # α-composite

    out_path = os.path.join(work_dir, "processed_face.png")
    grey_bg.convert("RGB").save(out_path)
    print(f"[Pre] Processed face saved → {out_path}")
    return out_path
# ────────────────────────────────────────────────────────────────────────────────


# ② edge-tts: text → speech.wav
async def generate_speech(text: str, voice: str, out_path: str):
    print(f"[TTS] Using voice={voice}")
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)
    print(f"[TTS] Audio saved -> {out_path}")

def run_tts(text: str, voice: str, out_path: str):
    try:
        asyncio.run(generate_speech(text, voice, out_path))
    except Exception as e:
        print(f"[ERROR][TTS] {e}")
        sys.exit(1)


# ③ SadTalker: image + wav → silent mp4
def run_sadtalker(image_path: str, wav_path: str, out_dir: str) -> str:
    os.makedirs(out_dir, exist_ok=True)
    cmd = [
        sys.executable, "inference.py",
        "--driven_audio", wav_path,
        "--source_image", image_path,
        "--enhancer", "gfpgan",
        "--checkpoint_dir", "checkpoints",
        "--result_dir", out_dir
    ]
    print("[SadTalker] " + " ".join(cmd))
    try:
        subprocess.check_call(cmd)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR][SadTalker] {e}")
        sys.exit(1)

    mp4s = [f for f in os.listdir(out_dir) if f.lower().endswith(".mp4")]
    if not mp4s:
        print(f"[ERROR][SadTalker] No MP4 found in {out_dir}")
        sys.exit(1)

    return os.path.join(out_dir, mp4s[0])


# ④ Merge audio + silent-video → final talking-head video
def merge_audio(video_path: str, audio_path: str, out_path: str):
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        out_path
    ]
    print(f"[ffmpeg] Merging audio → {out_path}")
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        print("[ERROR][ffmpeg] Failed to merge audio:")
        print(e.stdout.decode("utf-8", errors="ignore"))
        sys.exit(1)
    print("[ffmpeg] Merge completed.")


def main():
    p = argparse.ArgumentParser(
        description="Text+Image → edge-tts → SadTalker → final talking-head video"
    )
    p.add_argument("text",  help="The script you want spoken (wrap in quotes)")
    p.add_argument("image", help="Path to portrait image (PNG/JPG)")
    p.add_argument("--gender", choices=["male", "female"], default="female",
                   help="Speaker gender (default: female)")
    p.add_argument("--nat", default="", help="Nationality (e.g. india)")

    args     = p.parse_args()
    text, img, gender, nat = args.text, args.image, args.gender, args.nat

    if not os.path.isfile(img):
        print(f"[ERROR] Image not found: {img}")
        sys.exit(1)

    # Working directory
    work = f"tmp_{uuid.uuid4().hex}"
    os.makedirs(work, exist_ok=True)
    wav      = os.path.join(work, "speech.wav")
    vid_dir  = os.path.join(work, "video")
    os.makedirs(vid_dir, exist_ok=True)
    final_mp4 = os.path.join(vid_dir, "final_with_audio.mp4")

    # ── 1) TEXT → WAV ───────────────────────────────────────────────────────────
    voice = select_voice(nat, gender)
    run_tts(text, voice, wav)

    # ── 2) IMAGE PRE-PROCESS → face-only on grey ───────────────────────────────
    processed_img = preprocess_face(img, work)

    # ── 3) SadTalker (silent) ──────────────────────────────────────────────────
    silent_mp4 = run_sadtalker(processed_img, wav, vid_dir)

    # ── 4) Merge audio track ───────────────────────────────────────────────────
    merge_audio(silent_mp4, wav, final_mp4)

    print(f"\n[✅] Pipeline complete! Final video at:\n    {final_mp4}")


if __name__ == "__main__":
    main()
