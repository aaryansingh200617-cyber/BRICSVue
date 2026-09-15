import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Navbar from './components/common/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Comparison from './pages/Comparison.jsx';
import ClimateAI from './pages/ClimateAI.jsx';

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/chat" element={<ClimateAI />} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
