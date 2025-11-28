import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import VideoCall from './pages/VideoCall'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/video-call" element={<VideoCall />} />
      </Routes>
    </Router>
  )
}

export default App
