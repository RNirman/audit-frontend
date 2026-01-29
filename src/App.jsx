import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import SmePortal from './pages/SmePortal';
import AuditorPortal from './pages/AuditorPortal';

function App() {
  return (
    <Router>
      {/* Optional: Navigation Bar visible on all pages */}
      <nav style={{ padding: '10px', background: '#333', color: '#fff', display: 'flex', gap: '20px' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>🏠 Home</Link>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#aaa' }}>Prototype v1.0</div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sme" element={<SmePortal />} />
        <Route path="/auditor" element={<AuditorPortal />} />
      </Routes>
    </Router>
  );
}

export default App;