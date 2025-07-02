#!/usr/bin/env python3
"""
Text portrait  ➜  edge-tts  ➜  SadTalker  ➜  MP4 with BURNED subtitles

No face-alignment step, just one-face detection + margin crop + rembg grey BG.
"""

import os, sys, uuid, argparse, asyncio, subprocess, io
import edge_tts, face_recognition, numpy as np
from PIL import Image
from rembg import remove

# ─── Voice map ──────────────────────────────────────────
VOICE_MAP = {"india":{"female":"en-IN-NeerjaNeural",
                      "male":"en-IN-PrabhatNeural"}}
DEFAULT_VOICE = {"female":"en-US-JennyNeural",
                 "male":"en-US-GuyNeural"}
def voice(nat, gen):
    return VOICE_MAP.get(nat.lower(),{}).get(gen.lower(),
           DEFAULT_VOICE.get(gen.lower(), DEFAULT_VOICE["female"]))

# ─── Pre-process portrait (crop + grey BG) ─────────────
def preprocess(img_path:str, work:str, margin:float=0.45)->str:
    rgb = face_recognition.load_image_file(img_path)
    locs = face_recognition.face_locations(rgb, model="hog")
    if not locs: sys.exit("[ERR] no face detected")
    t,r,b,l = locs[0]; h,w = rgb.shape[:2]
    dh,dw = int((b-t)*margin), int((r-l)*margin)
    t,b,l,r = max(0,t-dh),min(h,b+dh),max(0,l-dw),min(w,r+dw)
    crop = rgb[t:b,l:r]

    buf = io.BytesIO(); Image.fromarray(crop).save(buf,"PNG")
    rgba = remove(buf.getvalue(), alpha_matting=True,
                  alpha_matting_foreground_threshold=230,
                  alpha_matting_background_threshold=5,
                  alpha_matting_erode_size=0)
    face = Image.open(io.BytesIO(rgba)).convert("RGBA")

    grey = Image.new("RGBA", face.size, (128,128,128,255))
    grey.paste(face, mask=face.split()[3])

    final = grey.convert("RGB").resize((512,512), Image.BICUBIC)
    out = os.path.join(work,"processed_face.png"); final.save(out)
    print("[Pre] saved", out); return out

# ─── edge-tts ──────────────────────────────────────────
async def _tts(txt,v,out): await edge_tts.Communicate(txt,v).save(out)
def gen_wav(txt,v,out): asyncio.run(_tts(txt,v,out))

# ─── ffprobe duration ─────────────────────────────────
def dur(p:str)->float:
    cmd=["ffprobe","-v","error","-show_entries","format=duration",
         "-of","default=noprint_wrappers=1:nokey=1",p]
    return float(subprocess.check_output(cmd).decode().strip())

# ─── make single-cue SRT ──────────────────────────────
def make_srt(txt,wav,srt):
    T=dur(wav)
    ts=lambda x:f"{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{int((x-int(x))*1000):03d}"
    with open(srt,"w",encoding="utf-8") as f:
        f.write(f"1\n{ts(0)} --> {ts(T)}\n{txt}\n")

# ─── SadTalker call ───────────────────────────────────
def sadtalk(img,wav,out_dir)->str:
    os.makedirs(out_dir,exist_ok=True)
    cmd=[sys.executable,"inference.py",
         "--source_image",img,"--driven_audio",wav,
         "--enhancer","gfpgan",
         "--checkpoint_dir","checkpoints",
         "--result_dir",out_dir]
    subprocess.check_call(cmd)
    mp4s=[f for f in os.listdir(out_dir) if f.endswith(".mp4")]
    if not mp4s: sys.exit("SadTalker produced no MP4")
    return os.path.join(out_dir,mp4s[0])

# ─── mux audio & **burn subtitles** ───────────────────
def burn(video,wav,srt,out):
    # ffmpeg’s subtitles filter likes forward slashes on Windows
    srt_path = os.path.abspath(srt).replace("\\","/")
    vf = f"subtitles='{srt_path}'"
    cmd=["ffmpeg","-y",
         "-i",video,
         "-i",wav,
         "-vf",vf,
         "-c:v","libx264","-pix_fmt","yuv420p",
         "-c:a","aac","-b:a","192k",
         "-shortest",out]
    subprocess.run(cmd,check=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("text"); ap.add_argument("image")
    ap.add_argument("--gender",choices=["male","female"],default="female")
    ap.add_argument("--nat",default="")
    ap.add_argument("--subs",action="store_true",
                    help="burn subtitles into video")
    args=ap.parse_args()

    if not os.path.isfile(args.image): sys.exit("image not found")

    work=f"tmp_{uuid.uuid4().hex}"; os.makedirs(work)
    wav=os.path.join(work,"speech.wav")
    srt=os.path.join(work,"speech.srt") if args.subs else None
    vid_dir=os.path.join(work,"video"); os.makedirs(vid_dir)
    final=os.path.join(vid_dir,"final.mp4")

    # 1) TTS
    v=voice(args.nat,args.gender); print("[TTS] voice:",v)
    gen_wav(args.text,v,wav)
    if args.subs: make_srt(args.text,wav,srt)

    # 2) preprocess portrait
    proc=preprocess(args.image,work)

    # 3) SadTalker silent video
    silent=sadtalk(proc,wav,vid_dir)

    # 4) mux & burn captions if requested
    if args.subs:
        burn(silent,wav,srt,final)
    else:
        # simple mux without subs
        subprocess.run(["ffmpeg","-y","-i",silent,"-i",wav,
                        "-c:v","copy","-c:a","aac","-b:a","192k",
                        "-shortest",final],
                       check=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)

    print("\n[✅] done →", final)

if __name__=="__main__":
    main()
