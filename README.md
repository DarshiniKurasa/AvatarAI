# AVIRI - Authentic Virtual Identity Recruitment Interface

AVIRI transforms hiring by converting resumes into engaging AI-driven video pitches. Recruiters interact with candidate avatars via real-time chat, making talent discovery fast, visual, and interactive.

**🔗 GitHub Repository**: [itsvamz/LinkedIn-Hack](https://github.com/itsvamz/LinkedIn-Hack)

---

## 🔍 Problem

Recruiters spend too much time on manual resume review, repetitive calls, and outdated systems. AVIRI streamlines this with a smart, visual, and interactive hiring experience that feels as easy as scrolling reels.

---

## 🚀 What It Does

- Generates video avatars from resumes and photos  
- Provides a chat interface powered by Hugging Face for recruiter-agent interaction  
- Displays candidates in a swipe-style carousel UI  
- Supports bookmarking, liking, messaging, and dark mode  
- Enables inclusive hiring with accessibility and multilingual pitch support  

---

## 💡 Key Features

- **Resume Parsing**: Converts resume into structured profile info  
- **Pitch Video Generation**: Uses `SadTalker`, `EdgeTTS`, `FFmpeg` for video synthesis  
- **Avatar Chat**: Hugging Face models power real-time AI conversations  
- **Carousel UI**: Swipe left/right to shortlist or reject candidates  
- **Background Removal**: `rembg` and `face_recognition` for clean avatar videos  
- **Inclusive UI**: Accessibility mode, dark mode, multilingual agents  

---

## 🛠️ Tech Stack

| Component           | Tech Used                                |
|---------------------|-------------------------------------------|
| Frontend            | React.js                                  |
| Backend             | Node.js, Express.js (Nodemon)             |
| Database            | MongoDB                                   |
| Resume Parsing      | Python                                    |
| Chatbot Integration | Hugging Face Transformers (LLM models)    |
| Video Generation    | SadTalker, EdgeTTS, FFmpeg                |
| Image Processing    | rembg, face_recognition                   |

---

## 📁 Folder Structure
LinkedIn-Hack/

├── Avatar/ # Talking avatar

generation (SadTalker, etc.)

├── backend/ # Node.js backend

│ ├── app.js

│ └── routes/

│ └── controllers/

├── frontend/ # React-based 

frontend

├── models/

│ └── Elevator pitch/ # Parsed

resume text , pitch scripts 


---

## 🧪 How to Run

### 1. Clone the repository

```bash
git clone https://github.com/itsvamz/LinkedIn-Hack.git
cd LinkedIn-Hack
```
### 2. Backend setup
```bash
cd backend
npm install
npx nodemon app.js
```
### 2. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
⚠️ Make sure to configure .env with MongoDB URI, Hugging Face access token, and other credentials.

📦 Key Dependencies

react, axios, tailwindcss

express, mongoose, nodemon

huggingface, transformers, python-shell

formidable, ffmpeg-static, sadtalker

edgetts, rembg, face_recognition

✅ Future Enhancements
Real-time live agent interviews

QR code to launch pitch on mobile

Dynamic pitch updates over time

Blockchain-based credential verification

---

# LinkedIn-Hack: Full Stack App Deployment & Usage Guide

## 1. Environment Setup

### A. Setting up `.env`
- Copy `.env.example` to `.env` in both backend and frontend folders.
- Fill in all required values (DB URIs, API keys, service URLs, etc.).

### B. Downloading Model Files
- Install gdown (if not already):
  ```
  pip install gdown
  ```
- Run the model download script from the project root:
  ```
  bash scripts/download_models.sh
  ```
- This will download all required models to `Avatar/checkpoints/`.

## 2. Running the App Locally

### A. Backend
- Install dependencies:
  ```
  cd backend
  npm install
  ```
- Start the backend:
  ```
  npm start
  ```

### B. Avatar (SadTalker) Service
- Install dependencies:
  ```
  cd Avatar
  # (Optional) Create and activate a virtual environment
  # python3 -m venv venv
  # source venv/bin/activate  (Linux/Mac)
  # venv\Scripts\activate    (Windows)
  pip install -r requirements.txt
  ```
- (If needed) Start the Gradio demo UI:
  ```
  python app_sadtalker.py
  ```
- For backend integration, no need to run a separate service; the backend calls the Python script directly.

### C. Frontend
- Install dependencies:
  ```
  cd frontend
  npm install
  ```
- Start the frontend:
  ```
  npm start
  ```

## 3. Platform-Specific Notes
- **Windows:** Use `venv\Scripts\activate` to activate Python virtual environments.
- **Linux/Mac:** Use `source venv/bin/activate`.
- Always run the model download script from the project root to ensure files go to the correct directory.

## 4. Deployment Plan

### A. Choose Hosting Platforms
- **Frontend:** [Vercel](https://vercel.com/), [Netlify](https://netlify.com/), or similar.
- **Backend:** [Render.com](https://render.com/), [Railway](https://railway.app/), [Heroku](https://heroku.com/), or a cloud VM (AWS, Azure, GCP).
- **Avatar (Python):**
  - If backend and avatar are on the same server, no extra step.
  - For scaling, deploy avatar as a separate service (Render, Railway, or a VM).

### B. Prepare for Deployment
- **Frontend:**
  - Build with:
    ```
    npm run build
    ```
  - Deploy the `build/` folder to your chosen platform.
  - Set environment variables (API URLs) in the platform dashboard.
- **Backend:**
  - Zip and upload your backend folder (excluding `node_modules` and large files).
  - Set all environment variables in the platform dashboard.
  - Run the model download script on the server after deployment.
- **Avatar:**
  - If needed, run the model download script and install dependencies on the server.

### C. Media Storage
- For production, use a cloud storage provider (AWS S3, Cloudinary, ImageKit, etc.) for uploads.
- Update your backend to use cloud storage for avatars, resumes, and videos.

## 5. Testing Checklist
After deployment, test the following:
- [ ] Registration and login
- [ ] Resume parsing
- [ ] Avatar/video/photo upload and generation
- [ ] All user flows (end-to-end)

---

**For any issues, check logs on your deployment platform and ensure all environment variables and model files are correctly set up.**








# AvatarAI
