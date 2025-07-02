import os
import sys
import uuid
import argparse
import asyncio
import subprocess
import edge_tts

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


# ② edge-tts: text → speech.wav
async def generate_speech(text: str, voice: str, out_path: str):
    print(f"[TTS] Using voice={voice}")
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)
    print(f"[TTS] Audio saved → {out_path}")

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
    print("[SadTalker]", " ".join(cmd))
    try:
        subprocess.check_call(cmd)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR][SadTalker] {e}")
        sys.exit(1)

    # Find the generated .mp4 in out_dir
    mp4s = [f for f in os.listdir(out_dir) if f.lower().endswith(".mp4")]
    if not mp4s:
        print(f"[ERROR][SadTalker] No MP4 found in {out_dir}")
        sys.exit(1)

    # Return the first .mp4 found
    return os.path.join(out_dir, mp4s[0])


# ④ Merge audio + silent‐video → final talking‐head video
def merge_audio(video_path: str, audio_path: str, out_path: str):
    """
    Call ffmpeg via subprocess to merge audio_path (WAV) onto video_path (MP4),
    writing the result to out_path. This guarantees the final file will
    have the audio track embedded.
    """
    cmd = [
        "ffmpeg",
        "-y",                    # overwrite output if it already exists
        "-i", video_path,        # input video (silent MP4)
        "-i", audio_path,        # input audio (WAV from edge-tts)
        "-c:v", "copy",          # copy the video stream without re-encoding
        "-c:a", "aac",           # encode the audio to AAC
        "-b:a", "192k",          # audio bitrate
        "-shortest",             # stop writing when the shortest stream ends
        out_path
    ]
    print(f"[ffmpeg] Merging audio → {out_path}")
    try:
        completed = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        print("[ERROR][ffmpeg] Failed to merge audio:")
        print(e.stdout.decode("utf-8", errors="ignore"))
        sys.exit(1)
    print("[ffmpeg] Merge completed.")


def main():
    p = argparse.ArgumentParser(
        description="Text+Image → edge-tts → SadTalker → final talking-head video"
    )
    p.add_argument("text", help="The script you want spoken (wrap in quotes)")
    p.add_argument("image", help="Path to portrait image (PNG/JPG)")
    p.add_argument("--gender", choices=["male","female"], default="female",
                   help="Speaker gender (default: female)")
    p.add_argument("--nat", default="", help="Nationality (e.g. indian)")

    args = p.parse_args()
    text, img, gender, nat = args.text, args.image, args.gender, args.nat

    # Check that the image exists
    if not os.path.isfile(img):
        print(f"[ERROR] Image not found: {img}")
        sys.exit(1)

    # Working dirs
    work = f"tmp_{uuid.uuid4().hex}"
    os.makedirs(work, exist_ok=True)
    wav = os.path.join(work, "speech.wav")
    vid_dir = os.path.join(work, "video")
    os.makedirs(vid_dir, exist_ok=True)
    final = os.path.join(vid_dir, "final_with_audio.mp4")

    # 1) TTS → WAV
    voice = select_voice(nat, gender)
    run_tts(text, voice, wav)

    # 2) SadTalker → silent MP4
    silent_mp4 = run_sadtalker(img, wav, vid_dir)

    # 3) Merge audio → final video
    merge_audio(silent_mp4, wav, final)

    print(f"[✅] Pipeline complete! Final video at:\n  {final}")


if __name__ == "__main__":
    main()
