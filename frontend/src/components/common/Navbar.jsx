import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { ArrowRight, Menu, X } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

const Navbar = () => {
  const { wsConnected } = useContext(AppContext);
  const navigate = useNavigate();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home', end: true },
    { to: '/comparison', label: 'Comparison' },
    { to: '/chat', label: 'ClimateAI' },
  ];

  return (
    <>
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none transition-all">
        {/* ── Floating Pill Navbar ── */}
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] pl-4 sm:pl-5 pr-2 py-1.5 sm:py-2 flex items-center justify-between pointer-events-auto transition-all">

          {/* ── LEFT: Logo + Brand ── */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group flex-shrink-0"
          >
            <img
              src="/logo.png"
              alt="BRICS Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-md shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-sm sm:text-base lg:text-lg tracking-tight text-slate-900">
              BRICS<span className="text-teal-700">Vue</span>
            </span>
          </div>

          {/* ── MIDDLE: Nav Links (desktop only) ── */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs sm:text-sm font-medium text-slate-600">
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `transition-colors hover:text-slate-950 ${
                    isActive ? 'text-slate-950 font-bold' : 'text-slate-600'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="transition-colors hover:text-slate-950 text-slate-600 font-medium"
            >
              Feedback
            </button>
          </nav>

          {/* ── RIGHT: Actions ── */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Live Console CTA */}
            <button
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-1 sm:gap-1.5 pl-2.5 sm:pl-3.5 pr-1.5 py-1 sm:py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    wsConnected ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span>Live Console</span>
              </span>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-50 text-slate-950 flex items-center justify-center group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
              </div>
            </button>
          </div>

        </div>

        {/* ── Mobile slide-down menu ── */}
        {mobileMenuOpen && (
          <div className="md:hidden max-w-4xl mx-auto mt-2 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.08)] py-3 px-4 pointer-events-auto">
            <nav className="flex flex-col gap-0.5">
              {/* Live Console first in mobile menu */}
              <button
                onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors text-left"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                Live Console (Dashboard)
              </button>
              <div className="h-px bg-slate-100 my-1" />
              {navLinks.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-950 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
              <div className="h-px bg-slate-100 my-1" />
              <button
                onClick={() => { setIsFeedbackOpen(true); setMobileMenuOpen(false); }}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
              >
                Feedback
              </button>
            </nav>
          </div>
        )}
      </header>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
};

export default Navbar;