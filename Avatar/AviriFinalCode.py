#!/usr/bin/env python3
"""
Text-portrait → edge-tts → SadTalker → final MP4
 • 5-point frontal alignment
 • Crop + grey background via rembg
 • Optional soft subtitles (--subs)
"""

import os, sys, uuid, argparse, asyncio, subprocess, io
import edge_tts, face_recognition, numpy as np
from PIL import Image
from rembg import remove
import face_alignment
from skimage import transform as trans

# ─── Voice map ───────────────────────────────────────────
VOICE_MAP = {"india": {"female": "en-IN-NeerjaNeural",
                       "male":   "en-IN-PrabhatNeural"}}
DEFAULT_VOICE = {"female": "en-US-JennyNeural",
                 "male":   "en-US-GuyNeural"}
def select_voice(nat: str, gen: str) -> str:
    return VOICE_MAP.get(nat.lower(), {}).get(gen.lower(),
           DEFAULT_VOICE.get(gen.lower(), DEFAULT_VOICE["female"]))

# ─── Alignment helper ───────────────────────────────────
# ─── Alignment helper ───────────────────────────────────
# ─── Alignment helper ───────────────────────────────────
import face_alignment
from skimage import transform as trans

# pick whichever enum name exists
if   hasattr(face_alignment.LandmarksType, "_3D"):
    _LM = face_alignment.LandmarksType._3D
elif hasattr(face_alignment.LandmarksType, "THREE_D"):
    _LM = face_alignment.LandmarksType.THREE_D
else:
    _LM = face_alignment.LandmarksType._2D          # fallback

# ▶▶ specify device="cpu"  ◀◀
fa = face_alignment.FaceAlignment(_LM, flip_input=False, device="cpu")

def align_face_rgb(img: np.ndarray, size: int = 512) -> np.ndarray:
    preds = fa.get_landmarks(img)
    if preds is None:                         # fallback centre-crop
        h,w = img.shape[:2]; m=min(h,w)
        crop = img[(h-m)//2:(h+m)//2, (w-m)//2:(w+m)//2]
        return np.array(Image.fromarray(crop).resize((size,size), Image.BICUBIC))
    pts = preds[0][:,:2]
    src = np.stack([pts[36], pts[45], pts[30], pts[48], pts[54]])
    dst = np.array([[38.2946,51.6963],[73.5318,51.5014],
                    [56.0252,71.7366],[41.5493,92.3655],
                    [70.7299,92.2041]],dtype=np.float32)*(size/112)
    t = trans.SimilarityTransform(); t.estimate(src,dst)
    warped = trans.warp(img, t.inverse, output_shape=(size,size),
                        preserve_range=True)
    return warped.astype(np.uint8)

# ─── Pre-process portrait ───────────────────────────────
def preprocess_face(path: str, work: str, margin: float=0.45) -> str:
    orig = face_recognition.load_image_file(path)
    aligned = align_face_rgb(orig, 512)
    loc = face_recognition.face_locations(aligned, model="hog")
    if not loc: raise RuntimeError("No face found after alignment.")
    t,r,b,l = loc[0]; h,w = aligned.shape[:2]
    dh,dw = int((b-t)*margin), int((r-l)*margin)
    t,b,l,r = max(0,t-dh),min(h,b+dh),max(0,l-dw),min(w,r+dw)
    crop = aligned[t:b,l:r]
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

# ─── edge-tts ───────────────────────────────────────────
async def _tts(txt, voice, out): await edge_tts.Communicate(txt,voice).save(out)
def run_tts(txt, voice, out): asyncio.run(_tts(txt,voice,out))

# ─── wav duration via ffprobe ───────────────────────────
def wav_duration(path: str) -> float:
    cmd=["ffprobe","-v","error","-show_entries","format=duration",
         "-of","default=noprint_wrappers=1:nokey=1",path]
    return float(subprocess.check_output(cmd).decode().strip())

# ─── build single-cue SRT ───────────────────────────────
def build_srt(text: str, wav: str, out: str):
    T = wav_duration(wav)
    to_ts = lambda x: f"{int(x//3600):02d}:{int(x%3600//60):02d}:" \
                      f"{int(x%60):02d},{int((x-int(x))*1000):03d}"
    with open(out,"w",encoding="utf-8") as f:
        f.write(f"1\n{to_ts(0)} --> {to_ts(T)}\n{text}\n")
    print("[SRT] built", out)

# ─── SadTalker call ────────────────────────────────────
def run_sadtalker(img, wav, out_dir) -> str:
    os.makedirs(out_dir,exist_ok=True)
    cmd=[sys.executable,"inference.py","--source_image",img,
         "--driven_audio",wav,"--enhancer","gfpgan",
         "--checkpoint_dir","checkpoints","--result_dir",out_dir]
    print("[SadTalker]", " ".join(cmd)); subprocess.check_call(cmd)
    mp4=[f for f in os.listdir(out_dir) if f.endswith(".mp4")]
    if not mp4: sys.exit("SadTalker produced no mp4"); return ""
    return os.path.join(out_dir, mp4[0])

# ─── mux audio (+optional SRT) ─────────────────────────
def mux(video, wav, out, srt=None):
    cmd=["ffmpeg","-y","-i",video,"-i",wav]
    if srt:
        cmd+=["-i",srt,"-c:v","copy","-c:a","aac","-b:a","192k",
              "-c:s","mov_text","-metadata:s:s:0","language=eng",
              "-shortest",out]
    else:
        cmd+=["-c:v","copy","-c:a","aac","-b:a","192k","-shortest",out]
    print("[ffmpeg] mux →", out)
    subprocess.run(cmd,check=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)

# ─── Main ──────────────────────────────────────────────
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("text"); ap.add_argument("image")
    ap.add_argument("--gender",choices=["male","female"],default="female")
    ap.add_argument("--nat",default=""); ap.add_argument("--subs",action="store_true")
    args=ap.parse_args()

    if not os.path.isfile(args.image): sys.exit("Image not found")

    work=f"tmp_{uuid.uuid4().hex}"; os.makedirs(work)
    wav=os.path.join(work,"speech.wav")
    vid_dir=os.path.join(work,"video"); os.makedirs(vid_dir)
    final=os.path.join(vid_dir,"final.mp4")
    srt_path=os.path.join(work,"speech.srt") if args.subs else None

    # 1) TTS → wav
    run_tts(args.text, select_voice(args.nat,args.gender), wav)
    if args.subs: build_srt(args.text,wav,srt_path)

    # 2) preprocess portrait
    proc=preprocess_face(args.image, work)

    # 3) SadTalker silent video
    silent=run_sadtalker(proc, wav, vid_dir)

    # 4) mux audio (+subs)
    mux(silent, wav, final, srt_path)

    print("\n[✅] Finished →", final)

if __name__ == "__main__":
    main()
