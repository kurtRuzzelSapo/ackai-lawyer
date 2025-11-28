const express = require("express");
const cors = require("cors");
const path = require("path");

// Load environment from .env (local development)
try {
  // Load the project's .env which lives one level above the server directory
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {
  console.log('Note: dotenv not loaded, using process.env');
}

const PORT = process.env.PORT || 3001;
const app = express();

// Enable CORS for React dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite default port is 5173
  credentials: true
}));

// Parse JSON bodies from the browser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Expose a small, safe config endpoint for client-side usage
// WARNING: Do NOT expose your RESTful API Key and Secret in production environment.
app.get("/api/config", (req, res) => {
  res.json({
    AGORA_APPID: process.env.AGORA_APPID,
    AGORA_TOKEN: process.env.AGORA_TOKEN || null,
    GROQ_KEY: process.env.GROQ_KEY || null,
    TTS_MINIMAX_KEY: process.env.TTS_MINIMAX_KEY || null,
    TTS_MINIMAX_GROUPID: process.env.TTS_MINIMAX_GROUPID || null,
  });
});

// Proxy: start Convo AI (server calls Agora so browser doesn't need credentials)
app.post("/api/convo-ai/start", async (req, res) => {
  try {
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;
    
    if (!appid || !apiKey || !apiSecret) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing Agora credentials" });
    }

    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/join`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body || {}),
    });

    console.log("Convo API URL ->", url);
    console.log("Convo API body ->", JSON.stringify(req.body, null, 2));

    const data = await response.text();
    const status = response.status;

    console.log("Convo API response ->", status, data);

    try {
      // return parsed JSON if possible
      return res.status(status).json(JSON.parse(data));
    } catch (e) {
      return res.status(status).send(data);
    }
  } catch (err) {
    console.error("Proxy /api/convo-ai/start error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Proxy: stop (leave) Convo AI agent
app.post("/api/convo-ai/agents/:agentId/leave", async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;
    
    if (!appid || !apiKey || !apiSecret) {
      return res
        .status(500)
        .json({ error: "Server misconfigured: missing Agora credentials" });
    }

    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/agents/${agentId}/leave`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.text();
    const status = response.status;
    
    console.log("Agent leave response ->", status);
    
    try {
      return res.status(status).json(JSON.parse(data));
    } catch (e) {
      return res.status(status).send(data);
    }
  } catch (err) {
    console.error("Proxy /api/convo-ai/leave error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Proxy: force cleanup - stop the conflicting agent if TaskConflict occurs
app.post("/api/convo-ai/cleanup", async (req, res) => {
  try {
    const { channel } = req.body;
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;
    
    if (!appid || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "Server misconfigured: missing Agora credentials" });
    }

    console.log(`Attempting to cleanup any existing sessions in channel: ${channel}`);
    
    const testUrl = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/join`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    
    const testResponse = await fetch(testUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: channel,
        properties: {
          channel: channel,
          agent_rtc_uid: "99999",
          remote_rtc_uids: ["10000"],
          idle_timeout: 1
        }
      }),
    });

    const testData = await testResponse.json();
    
    if (testData.reason === "TaskConflict" && testData.agent_id) {
      console.log(`Found conflicting agent: ${testData.agent_id}, stopping it...`);
      
      const stopUrl = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/agents/${testData.agent_id}/leave`;
      const stopResponse = await fetch(stopUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log(`Cleanup response status: ${stopResponse.status}`);
      
      return res.json({ 
        success: true, 
        message: "Cleaned up existing session",
        agent_id: testData.agent_id 
      });
    }
    
    return res.json({ 
      success: true, 
      message: "No existing session found" 
    });
    
  } catch (err) {
    console.error("Proxy /api/convo-ai/cleanup error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.info(`\n---------------------------------------`);
  console.info(`🚀 Express Backend Server Running`);
  console.info(`📍 API: http://localhost:${PORT}/api`);
  console.info(`---------------------------------------\n`);
  console.info('AGORA_APPID present:', process.env.AGORA_APPID ? 'YES ✓' : 'NO ✗');
  console.info('AGORA_REST_KEY present:', process.env.AGORA_REST_KEY ? 'YES ✓' : 'NO ✗');
  console.info('GROQ_KEY present:', process.env.GROQ_KEY ? 'YES ✓' : 'NO ✗');
  console.info('');
});

module.exports = app;
