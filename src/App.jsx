import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import SmePortal from './pages/SmePortal';
import AuditorPortal from './pages/AuditorPortal';
import AdminPortal from './pages/AdminPortal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sme" element={<SmePortal />} />
        <Route path="/auditor" element={<AuditorPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </Router>
  );
}

export default App;