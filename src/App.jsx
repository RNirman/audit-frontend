import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SmePortal from './pages/SmePortal';
import AuditorPortal from './pages/AuditorPortal';
import AdminPortal from './pages/AdminPortal';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#1f2937', // bg-gray-800
            color: '#f3f4f6', // text-gray-100
            border: '1px solid #374151', // border-gray-700
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sme" element={
            <ProtectedRoute allowedRoles={['SME']}>
              <SmePortal />
            </ProtectedRoute>
          } />
          <Route path="/auditor" element={
            <ProtectedRoute allowedRoles={['AUDITOR', 'GOV_AUDITOR']}>
              <AuditorPortal />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPortal />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;