# 🚀 Quick Start Guide

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Environment variables configured in root `.env` file

## Run the Application

### Option 1: Run Both Servers Separately (Recommended)

Open **2 terminals** and run these commands:

**Terminal 1 - Express Backend:**

```bash
cd ackai/server
npm run dev
```

Server runs on: **http://localhost:3001**

**Terminal 2 - React Frontend:**

```bash
cd ackai/client
npm run dev
```

Client runs on: **http://localhost:5173**

Then open your browser to **http://localhost:5173**

---

## ✅ What You Should See

1. **Landing Page** at http://localhost:5173
   - Modern dark theme with grid background
   - "Get Started" buttons
   - 4 suggestion buttons with preset questions
   - Stats counter animation

2. **Click a Suggestion Button** (e.g., "Explain my constitutional rights")
   - Navigates to video call page
   - Auto-starts call with that question
   - AI responds immediately

3. **Video Call Interface**
   - AI voice playback
   - Conversation sidebar with transcript
   - Real-time messaging
   - End call button

---

## 🐛 Troubleshooting

### "Cannot GET /api/config"

❌ Express server not running  
✅ Start server: `cd ackai/server && npm run dev`

### "Network Error" in browser console

❌ Backend not accessible  
✅ Make sure server is on port 3001

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Agora Connection Failed

❌ Missing or invalid credentials  
✅ Check `.env` file in project root:

```env
AGORA_APPID=your_agora_app_id
AGORA_REST_KEY=your_agora_rest_key
AGORA_REST_SECRET=your_agora_rest_secret
GROQ_KEY=your_groq_api_key
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_minimax_group_id
```

### Rate Limit Error

❌ Groq API rate limit exceeded (100k tokens/day)  
✅ Wait 24 hours or upgrade account

---

## 📂 Project Structure

```
ackai/
├── client/               # React Vite Frontend
│   ├── src/
│   │   ├── pages/       # LandingPage, VideoCall
│   │   ├── hooks/       # useConvoAI
│   │   ├── services/    # apiService
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js   # Proxy to backend
│   └── package.json
│
├── server/              # Express Backend
│   ├── server.js        # API routes
│   └── package.json
│
└── README.md            # Full documentation
```

---

## 🎯 Key Features

✅ **Landing Page** - Modern UI with preset questions  
✅ **Video Call** - Real-time AI conversation  
✅ **Conversation History** - Auto-saved in localStorage  
✅ **Responsive Design** - Mobile-friendly  
✅ **Error Handling** - Graceful failures  
✅ **Suggestion Buttons** - Auto-answer questions

---

## 📝 Next Steps

1. Test the landing page navigation
2. Click a suggestion button
3. Test the video call interface
4. Check conversation history in sidebar
5. Try ending and restarting calls

For more details, see the full **README.md**
