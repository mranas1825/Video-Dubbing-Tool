# 🎬 DubCraft AI Studio

> **AI-Powered Video Dubbing, Subtitle Translation & Voice Synthesis Desktop Suite**

DubCraft AI Studio is a full-featured desktop application built with Electron, React, and Python AI backends. It allows content creators, dubbing studios, and video editors to automatically translate video audio into **45+ world languages**, generate accurate captions, rewrite scripts with AI, and synthesize natural sounding voices.

---

## ✨ Features

- 🌐 **45+ Language Support**: Multilingual support including English, Hindi, Urdu, Spanish, French, German, Japanese, Chinese, Arabic, and more.
- 🎙️ **AI Audio Transcription**: Powered by OpenAI Whisper for high-precision speech-to-text.
- ✍️ **AI Script Rewriter**: Smart script adjustment and context-aware translations.
- 🗣️ **High-Quality Text-To-Speech (TTS)**: Natural voice synthesis with customizable speech speed, pitch, and voice models.
- 🎬 **Subtitle / Caption Burn-In**: Automatically overlay custom subtitles onto videos.
- 🎨 **Modern Dark Glassmorphism UI**: Beautiful, reactive user interface with realtime task queue processing and live console logs.

---

## 🚀 Quick Setup & Usage Guide

### Prerequisites
Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (v3.10 or higher)
- [FFmpeg](https://ffmpeg.org/) (installed & added to system PATH)

---

### 📥 1. Clone the Repository

```bash
git clone https://github.com/mranas1825/Video-Dubbing-Tool.git
cd Video-Dubbing-Tool
```

---

### 📦 2. Install Dependencies

#### Frontend & Main Process
```bash
npm install
```

#### Python AI Engine
```bash
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r python/requirements.txt
```

---

### ⚡ 3. Running the App

#### Option A: Quick 1-Click Launcher (Windows)
Double-click `Launch DubCraft AI.bat` in the project root directory.

#### Option B: Terminal Command
```bash
npm run dev
```

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Lucide Icons, Tailwind-inspired Vanilla CSS Design System
- **Desktop Shell**: Electron JS
- **Backend AI Engine**: Python (Whisper, Edge-TTS, Demucs, FFmpeg, PyTorch)

---

## 📄 License
This project is open-source under the MIT License.
