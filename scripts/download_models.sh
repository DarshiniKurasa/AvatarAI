#!/bin/bash
# Download Avatar model checkpoints
cd Avatar/checkpoints

gdown --id 114r9gnZzpUIR2suDZEgPM43y4Tf9pMjc -O SadTalker_V0.0.2_512.safetensors
gdown --id 1rEwH9PAw55lKxYnA0HaR2JGfqLJfFHKe -O SadTalker_V0.0.2_256.safetensors
gdown --id 1bMim-bhhIVu1bYPFzZfjYsOoqfE2u8qg -O mapping_00229-model.pth.tar
gdown --id 1Li78GkB4Itx-LYMnbNzK9HNZIPlYIxwx -O mapping_00109-model.pth.tar
# Add more as needed

echo "Model downloads complete." 