import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Analysis from './pages/Analysis'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/analysis" element={<Analysis />} />
      </Routes>
    </Router>
  )
}
