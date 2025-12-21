# 🚀 ForgetMeNot - AR Glasses Memory Assistant

> **Never forget a face again** - AI-powered person recognition for Meta Ray-Ban smart glasses

[![Demo Ready](https://img.shields.io/badge/demo-ready-brightgreen)]()
[![Hackathon](https://img.shields.io/badge/hackathon-GDG%202025-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

---

## ⚡ Quick Start (2 Commands)

### Windows
```cmd
cd gdg-hackathon
START_DEMO.bat
```

### Linux/Mac
```bash
cd gdg-hackathon
chmod +x START_DEMO.sh
./START_DEMO.sh
```

Then open: **http://localhost:3000**

---

## 🎯 What Is This?

**ForgetMeNot** is an AR application for Meta Ray-Ban smart glasses that:

✅ **Detects faces** in real-time using your camera  
✅ **Identifies people** and shows their context  
✅ **Remembers conversations** and past interactions  
✅ **Displays information** directly in your field of view  

### Perfect For:
- 👴 **Dementia Care**: Help patients recognize loved ones
- 🤝 **Networking**: Remember everyone you meet
- 🧠 **Memory Support**: Augmented memory for daily life

---

## 🎥 Demo Features

### 1️⃣ Real-Time Face Detection
- Tracks faces with MediaPipe AI
- Works with multiple people
- 20 FPS performance

### 2️⃣ Person Recognition
- Shows name and relationship
- Displays recent conversations
- AI-generated context

### 3️⃣ AR Glasses Simulation
- Ray-Ban style overlay
- Information in lens area
- Natural AR positioning

### 4️⃣ Live Controls & Telemetry (NEW)
- Keyboard shortcuts: **M** mute, **V** video, **G** glasses, **R** reconnect SSE, **Shift+?** help
- Rotation speed control for demo personas (3-60s)
- SSE health indicator with one-click reconnect
- Voice visualizer + stats dashboard + recent detections

### 4️⃣ Smart Context
Demo includes 5 sample persons:
- **Sarah Johnson** - Family member
- **Dr. Michael Chen** - Healthcare provider
- **Emily Rodriguez** - Neighbor
- **James Thompson** - Old friend
- **Linda Martinez** - Professional contact

---

## 📁 Project Structure

```
gdg-hackathon/
├── simplified-backend/    # Python FastAPI server
├── frontend/             # Next.js React app
├── START_DEMO.bat       # Windows launcher
├── START_DEMO.sh        # Linux/Mac launcher
└── HACKATHON_DEMO_GUIDE.md  # Full documentation
```

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 15, TypeScript, React 19 |
| **Face Detection** | MediaPipe Tasks Vision |
| **Backend** | Python 3.13, FastAPI |
| **Communication** | Server-Sent Events (SSE) |
| **UI** | Tailwind CSS, Radix UI |
| **Database** | MongoDB (production) |

---

## 🎮 How to Use

1. **Start the demo** with the script above
2. **Allow camera/mic** access in browser
3. **See your face detected** with bounding box
4. **Watch notifications appear** with person info
5. **Click glasses icon** to enter AR mode

---

## 📸 Screenshots

### Normal Mode
```
┌─────────────────────────────────────┐
│  [Webcam Feed]                      │
│                                     │
│    ┌──────┐  ← Face Detection      │
│    │ You  │                         │
│    └──────┘                         │
│       ↓                             │
│    [Sarah Johnson]                  │
│    Daughter                         │
│    "Last spoke 3 days ago..."       │
└─────────────────────────────────────┘
```

### Ray-Ban AR Mode
```
┌─────────────────────────────────────┐
│  ╔════════════════════════════╗    │
│  ║   👓  AR Glasses View  👓  ║    │
│  ║                             ║    │
│  ║  [Clear Video Feed]         ║    │
│  ║                             ║    │
│  ║  Sarah Johnson              ║    │
│  ║  Your daughter              ║    │
│  ╚════════════════════════════╝    │
└─────────────────────────────────────┘
```

---

## 🏆 Hackathon Highlights

### What We Built (In 10 Hours!)

✅ **Complete working prototype**  
✅ **Real-time face detection**  
✅ **AR glasses simulation**  
✅ **Person identification system**  
✅ **Backend API with SSE**  
✅ **Responsive UI**  
✅ **Demo-ready application**  

### Production Roadmap

The full system includes:
- 🗣️ Voice recognition & speaker diarization
- 💾 MongoDB Atlas integration
- 🤖 LLM-powered context aggregation
- 📱 Mobile app companion
- 🔐 Privacy & security controls
- 🌐 Cloud deployment

See `backend/`, `inference/`, and `training/` directories for advanced features.

---

## 📚 Documentation

- **[HACKATHON_DEMO_GUIDE.md](HACKATHON_DEMO_GUIDE.md)** - Complete demo guide
- **[INTEGRATION.md](INTEGRATION.md)** - Backend integration
- **[plan.md](plan.md)** - Technical architecture
- **[AGENTS.md](AGENTS.md)** - Development guidelines

---

## 🐛 Troubleshooting

### Camera Not Working?
- Check browser permissions
- Try Chrome or Edge
- Verify webcam not in use

### Backend Not Starting?
```bash
cd simplified-backend
pip install -r requirements.txt
python main.py
```

### Frontend Not Starting?
```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Demo Script for Judges

**1. Introduction (30 sec)**
"ForgetMeNot helps people remember faces using AR glasses - perfect for dementia care or networking."

**2. Face Detection (30 sec)**
Show real-time face tracking with bounding boxes.

**3. Person Recognition (1 min)**
Wait for notifications to appear showing person context.

**4. AR Mode (30 sec)**
Switch to Ray-Ban mode to show glasses overlay.

**5. Use Cases (30 sec)**
Explain dementia care, networking, and daily assistance applications.

---

## 🔗 Links

- **Demo**: http://localhost:3000 (after running script)
- **Backend API**: http://localhost:8002
- **Health Check**: http://localhost:8002/health
- **SSE Stream**: http://localhost:8002/stream/inference

---

## 👥 Team

Built with ❤️ for the GDG Hackathon 2025

---

## 📄 License

MIT License - Free to use and modify

---

## 🚀 Get Started Now!

```bash
# Clone and run
cd gdg-hackathon
START_DEMO.bat  # Windows
# or
./START_DEMO.sh  # Linux/Mac

# Open browser
http://localhost:3000
```

**🎉 That's it! Your AR glasses demo is ready!**

---

*Made for Meta Ray-Ban Smart Glasses - The future of augmented memory*
