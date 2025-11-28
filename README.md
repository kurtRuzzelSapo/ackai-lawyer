# ACKAI - Attorney AI Legal Assistant

A React + Express application for Filipino human rights legal assistance powered by AI.

## 🏗️ Project Structure

```
ackai/
├── client/          # React frontend (Vite)
├── server/          # Express backend API
└── README.md        # This file
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Environment variables configured in root `.env` file

### Environment Variables

Create a `.env` file in the project root with:

```env
AGORA_APPID=your_agora_app_id
AGORA_REST_KEY=your_agora_rest_key
AGORA_REST_SECRET=your_agora_rest_secret
GROQ_KEY=your_groq_api_key
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_minimax_group_id
```

### Installation

#### 1. Install Server Dependencies

```bash
cd ackai/server
npm install
```

#### 2. Install Client Dependencies

```bash
cd ackai/client
npm install
```

### Running the Application

You need to run **both** the server and client simultaneously:

#### Terminal 1: Start Express Backend

```bash
cd ackai/server
npm run dev
```

The server will start on **http://localhost:3001**

#### Terminal 2: Start React Frontend

```bash
cd ackai/client
npm run dev
```

The client will start on **http://localhost:5173**

### 📱 Usage

1. Open your browser to **http://localhost:5173**
2. You'll see the landing page with quick question suggestions
3. Click a suggestion or "Get Started" to begin a video call
4. The AI will respond to your questions about Filipino human rights law

## 🎯 Features

- **Landing Page**: Modern UI with quick question suggestions
- **Video Call Interface**: Real-time AI conversation with Agora RTC
- **Conversation History**: Auto-saved conversation transcript
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Error Handling**: Graceful error messages and loading states

## 🛠️ Tech Stack

### Frontend (React + Vite)

- React 18
- React Router DOM for navigation
- Agora RTC SDK for video/audio
- Font Awesome icons
- CSS3 animations

### Backend (Express)

- Express.js API server
- CORS enabled for development
- Agora Conversational AI proxy
- Environment variable management

## 📂 Key Files

### Client

- `src/main.jsx` - React entry point
- `src/App.jsx` - Main app router
- `src/pages/LandingPage.jsx` - Landing page component
- `src/pages/VideoCall.jsx` - Video call interface
- `src/hooks/useConvoAI.js` - Agora integration hook
- `src/services/apiService.js` - Backend API calls
- `vite.config.js` - Vite configuration with proxy

### Server

- `server.js` - Express server with API routes
- `package.json` - Server dependencies

## 🔧 Development

### Adding New Features

1. **New React Component**: Add to `client/src/components/`
2. **New Page**: Add to `client/src/pages/` and update router
3. **New API Endpoint**: Add to `server/server.js`
4. **New Hook**: Add to `client/src/hooks/`

### API Endpoints

- `GET /api/config` - Get client configuration
- `POST /api/convo-ai/start` - Start AI conversation
- `POST /api/convo-ai/agents/:agentId/leave` - Stop AI conversation
- `POST /api/convo-ai/cleanup` - Cleanup stale sessions
- `GET /api/health` - Health check

## 🐛 Troubleshooting

### Port Already in Use

If port 3001 or 5173 is in use:

```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### CORS Issues

Make sure the Express server has CORS enabled for `http://localhost:5173`

### Agora Connection Failed

1. Check your `.env` file has correct Agora credentials
2. Verify the Agora App ID is valid
3. Check browser console for detailed error messages

### Rate Limit Exceeded

If you see "Rate limit reached" errors:

- Groq free tier has 100k tokens/day limit
- Wait for the limit to reset (24 hours)
- Or upgrade your Groq account

## 📝 Notes

- The conversation history is stored in localStorage
- Maximum 20 messages kept to avoid token limits
- TTS reads responses naturally without markdown formatting
- Suggestion buttons auto-start conversation with that question

## 🚢 Production Deployment

### Build Client

```bash
cd ackai/client
npm run build
```

This creates an optimized build in `dist/` folder.

### Deploy

- Deploy `server/` to your Node.js hosting (Heroku, Railway, etc.)
- Deploy `client/dist/` to static hosting (Vercel, Netlify, etc.)
- Update CORS origins in server to match production domain
- Set environment variables in production

## 📄 License

MIT License - See original project for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
