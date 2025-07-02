import argparse
import os
import sys
from src.gradio_demo import SadTalker
import tempfile
import subprocess
import asyncio
from AVIRIcode import select_voice, generate_speech
import re

# This script assumes SadTalker can be called programmatically
# and that it can take a text file or string as input for audio generation.
# You may need to adapt the SadTalker API if it is different.

# Explicitly set ffmpeg path for pydub
os.environ["PATH"] += os.pathsep + r"C:\Users\abhip\anaconda3\envs\avatar-pitch\Library\bin"

def run(cmd, *, live: bool = False, **kw):
    """
    Run a subprocess.
    • live=False (default) → capture output, print only if the command fails.
    • live=True            → stream stdout/stderr to this terminal (recommended
                             for long-running tools like SadTalker).
    Returns captured stdout (empty string when live=True).
    """
    if live:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, **kw)
        while True:
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
            if line:
                print(line, end='')  # Already includes newline
                match = re.search(r'(\d{1,3})\s*%', line)
                if match:
                    print(f"[Progress] {match.group(1)}%")
        if process.returncode:
            sys.exit(process.returncode)
        return ""
    else:
        out = subprocess.run(cmd, stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, **kw)
        if out.returncode:
            print(out.stdout.decode(errors="ignore"))
            sys.exit(out.returncode)
        return out.stdout.decode(errors="ignore")

def main():
    TOTAL_STEPS = 4
    print(f"[Progress] Starting video pitch generation pipeline ({TOTAL_STEPS} steps)")
    parser = argparse.ArgumentParser(description='Generate talking avatar video using SadTalker')
    parser.add_argument('--image', required=True, help='Path to the avatar image')
    parser.add_argument('--text', required=True, help='Pitch text to be spoken')
    parser.add_argument('--gender', required=False, default='male', help='Voice gender (male/female)')
    parser.add_argument('--nationality', required=False, default='', help='Voice accent/nationality')
    parser.add_argument('--output', required=True, help='Output video path')
    args = parser.parse_args()

    # 1) Generate temporary audio file from text using Edge TTS and correct voice
    print(f"[1/{TOTAL_STEPS}] Generating speech audio with edge-tts...")
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tf:
        audio_path = tf.name
    voice = select_voice(args.nationality, args.gender)
    async def run_tts():
        await generate_speech(args.text, voice, audio_path)
    asyncio.run(run_tts())

    # 2) Call SadTalker
    print(f"[2/{TOTAL_STEPS}] Generating video with SadTalker...")
    sad_talker = SadTalker('checkpoints', 'src/config', lazy_load=True)
    # If SadTalker can be called via subprocess for more granular logs, use run([...], live=True)
    # Otherwise, this will just print the step
    # Example if you want to use subprocess:
    # run([sys.executable, 'path/to/sadtalker_script.py', ...], live=True)
    sad_talker.test(
        source_image=args.image,
        driven_audio=audio_path,
        preprocess='crop',
        still_mode=False,
        use_enhancer=False,
        batch_size=1,
        size=256,
        pose_style=0,
        result_dir=os.path.dirname(args.output)
    )

    # 3) Finalize
    print(f"[3/{TOTAL_STEPS}] Cleaning up temporary files...")
    try:
        os.remove(audio_path)
    except FileNotFoundError:
        pass  # Ignore if file is already deleted

    print(f"[4/{TOTAL_STEPS}] Video generated at {args.output}\n[✅] Complete!")

if __name__ == '__main__':
    main() 