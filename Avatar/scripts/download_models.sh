mkdir ./checkpoints  

# lagency download link
# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/auido2exp_00300-model.pth -O ./checkpoints/auido2exp_00300-model.pth
# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/auido2pose_00140-model.pth -O ./checkpoints/auido2pose_00140-model.pth
# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/epoch_20.pth -O ./checkpoints/epoch_20.pth
# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/facevid2vid_00189-model.pth.tar -O ./checkpoints/facevid2vid_00189-model.pth.tar
# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/shape_predictor_68_face_landmarks.dat -O ./checkpoints/shape_predictor_68_face_landmarks.dat
# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/wav2lip.pth -O ./checkpoints/wav2lip.pth
# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/mapping_00229-model.pth.tar -O ./checkpoints/mapping_00229-model.pth.tar
# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/mapping_00109-model.pth.tar -O ./checkpoints/mapping_00109-model.pth.tar
# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/hub.zip -O ./checkpoints/hub.zip
# unzip -n ./checkpoints/hub.zip -d ./checkpoints/


#### download the new links.
curl -nc https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00109-model.pth.tar -O  ./checkpoints/mapping_00109-model.pth.tar
curl -nc https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00229-model.pth.tar -O  ./checkpoints/mapping_00229-model.pth.tar
curl -nc https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_256.safetensors -O  ./checkpoints/SadTalker_V0.0.2_256.safetensors
curl -nc https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_512.safetensors -O  ./checkpoints/SadTalker_V0.0.2_512.safetensors


# curl -nc https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/BFM_Fitting.zip -O ./checkpoints/BFM_Fitting.zip
# unzip -n ./checkpoints/BFM_Fitting.zip -d ./checkpoints/

### enhancer 
mkdir -p ./gfpgan/weights
curl -nc https://github.com/xinntao/facexlib/releases/download/v0.1.0/alignment_WFLW_4HG.pth -O ./gfpgan/weights/alignment_WFLW_4HG.pth 
curl -nc https://github.com/xinntao/facexlib/releases/download/v0.1.0/detection_Resnet50_Final.pth -O ./gfpgan/weights/detection_Resnet50_Final.pth 
curl -nc https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth -O ./gfpgan/weights/GFPGANv1.4.pth 
curl -nc https://github.com/xinntao/facexlib/releases/download/v0.2.2/parsing_parsenet.pth -O ./gfpgan/weights/parsing_parsenet.pth 

