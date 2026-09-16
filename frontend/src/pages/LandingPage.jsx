import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Flame, Wind, Cpu, TrendingUp,
  ArrowRight, Eye, Sparkles, Layers, Users, ChevronRight, ShieldCheck,
  Activity, Satellite, MapPin, CheckCircle2, Shield, Database, Compass, ArrowUpRight
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { fetchFireStats } from '../services/api';
import CountryFlag from '../components/common/CountryFlag';

const BRICS_MEMBERS = [
  { name: 'Brazil',       flag: '🇧🇷', code: 'BR', hub: 'Brasília & São Paulo',   region: 'South America',   status: 'Operational' },
  { name: 'Russia',       flag: '🇷🇺', code: 'RU', hub: 'Moscow & St. Petersburg', region: 'Eurasia',         status: 'Operational' },
  { name: 'India',        flag: '🇮🇳', code: 'IN', hub: 'Delhi NCR & Mumbai',      region: 'South Asia',      status: 'Operational' },
  { name: 'China',        flag: '🇨🇳', code: 'CN', hub: 'Beijing & Shanghai',      region: 'East Asia',       status: 'Operational' },
  { name: 'South Africa', flag: '🇿🇦', code: 'ZA', hub: 'Johannesburg & Pretoria', region: 'Southern Africa', status: 'Operational' },
  { name: 'Egypt',        flag: '🇪🇬', code: 'EG', hub: 'Cairo & Alexandria',      region: 'North Africa',    status: 'Operational' },
  { name: 'Ethiopia',     flag: '🇪🇹', code: 'ET', hub: 'Addis Ababa',             region: 'East Africa',     status: 'Operational' },
  { name: 'Iran',         flag: '🇮🇷', code: 'IR', hub: 'Tehran & Isfahan',        region: 'Middle East',     status: 'Operational' },
  { name: 'Saudi Arabia', flag: '🇸🇦', code: 'SA', hub: 'Riyadh & Jeddah',        region: 'Middle East',     status: 'Operational' },
  { name: 'UAE',          flag: '🇦🇪', code: 'AE', hub: 'Abu Dhabi & Dubai',       region: 'Middle East',     status: 'Operational' },
  { name: 'Indonesia',    flag: '🇮🇩', code: 'ID', hub: 'Jakarta & Surabaya',      region: 'Southeast Asia',  status: 'Operational' },
];

const OPERATIONAL_PILLARS = [
  {
    step: '01',
    title: 'Detection & Ingestion',
    subtitle: 'Spaceborne & Terrestrial Telemetry',
    desc: 'Continuous real-time ingestion from NASA FIRMS 375m VIIRS sensors, Open-Meteo atmospheric monitoring stations, and verified citizen observations.',
    icon: Satellite,
    chipBg: 'bg-slate-100 text-slate-700',
  },
  {
    step: '02',
    title: 'Atmospheric Dispersion',
    subtitle: 'Physics-Based Transport Vectors',
    desc: 'Gaussian plume dispersion physics coupled with real-time wind advection modeling, computing downwind pollutant transport vectors and transboundary arrival velocity.',
    icon: TrendingUp,
    chipBg: 'bg-teal-50 text-teal-700',
  },
  {
    step: '03',
    title: 'Transboundary Coordination',
    subtitle: 'Sovereign Notification Network',
    desc: 'Automated transboundary tracking protocol calculating smoke plume transport vectors between neighboring sovereign territories to mitigate exposure.',
    icon: Globe,
    chipBg: 'bg-slate-100 text-slate-700',
  },
  {
    step: '04',
    title: 'Verified Mitigation',
    subtitle: 'Targeted Interventions',
    desc: 'Automated emission source attribution (biomass combustion, industrial discharge, or vehicular concentration) and rapid mitigation deployment coordination.',
    icon: ShieldCheck,
    chipBg: 'bg-teal-50 text-teal-700',
  },
];

const STRATEGIC_CAPABILITIES = [
  {
    icon: Layers,
    title: '5-Layer Geospatial Telemetry Stack',
    desc: 'Unified multi-spectral map integrating ground-level AQI, satellite thermal anomalies, real-time atmospheric wind vectors, AI anomaly clusters, and forward predictive zones.',
  },
  {
    icon: Cpu,
    title: 'Statistical Z-Score Anomaly Engine',
    desc: 'Continuous baseline monitoring identifies abrupt air quality variances in unmonitored regions, filtering atmospheric noise from genuine emission spikes.',
  },
  {
    icon: Wind,
    title: 'Physics-Based Atmospheric Dispersion',
    desc: 'Advection-diffusion computations project plume arrival velocity, estimated ground-level AQI delta, and transboundary transmission confidence metrics.',
  },
  {
    icon: Eye,
    title: 'Computer Vision Optical Verification',
    desc: 'Edge image analysis algorithms evaluate uploaded photographic observations to categorize smoke density, thermal signatures, and atmospheric haze.',
  },
  {
    icon: Sparkles,
    title: 'Explainable AI Feature Attribution',
    desc: 'SHAP-calibrated feature weights decompose every forecast into underlying drivers including ambient humidity, wind vectors, PM ratios, and proximal fire count.',
  },
  {
    icon: Users,
    title: 'Sovereign Intergovernmental Protocol',
    desc: 'Engineered specifically for intergovernmental climate observation, providing transparent and verifiable environmental data across 11 sovereign nations.',
  },
];

const useCountUp = (target, duration = 900) => {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  useEffect(() => {
    if (!target) return;
    startRef.current = null;
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { liveData, wsConnected } = useContext(AppContext);
  const [fireCount, setFireCount] = useState(1861);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const refreshTelemetry = useCallback(() => {
    fetchFireStats()
      .then((stats) => {
        if (stats) {
          const total = Object.values(stats).reduce((a, b) => a + b, 0);
          if (total > 0) {
            setFireCount(total);
            setLastSyncTime(Date.now());
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 30000);
    return () => clearInterval(interval);
  }, [refreshTelemetry]);

  // Sync when WebSocket broadcast arrives
  useEffect(() => {
    if (liveData?.timestamp || liveData?.stats) {
      setLastSyncTime(Date.now());
    }
  }, [liveData]);

  // Live second-by-second ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastSyncTime) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastSyncTime]);

  const totalFires = (liveData?.stats?.total_fires && liveData.stats.total_fires > 0)
    ? liveData.stats.total_fires
    : fireCount;

  const animatedFires = useCountUp(totalFires, 1100);

  const syncLabel = secondsAgo < 5 ? 'Updated just now' : `Synced ${secondsAgo}s ago`;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 selection:bg-teal-700 selection:text-white">

      {/* ══════════════════════════════════════════════════════════════
          1. HERO SECTION WITH TIGHTENED VERTICAL RHYTHM & RESTRAINT
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-24 sm:pt-28 pb-16 border-b border-slate-200/70 bg-white">
        
        {/* Background Video with Maximum Clarity & Minimized White Overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center opacity-95"
            src="/hero-bg.mp4"
          />
          {/* Minimized white layer: completely transparent in the center to show pure video, with gentle bottom transition */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/90" />
          {/* Subtle architectural grid */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px)
              `,
              backgroundSize: '36px 36px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 text-center">

          {/* Eyebrow label with light green fill and green border */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50/95 backdrop-blur-md border border-emerald-500 text-xs font-semibold mb-4 shadow-[0_2px_10px_rgba(16,185,129,0.12)]">
            <img src="/logo.png" alt="BRICS Logo" className="w-4 h-4 object-contain rounded-xs" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-900 font-bold">
              AI-Powered Observatory
            </span>
            <span className="text-emerald-400">·</span>
            <span className="text-emerald-700 font-semibold">11 Sovereign Partners</span>
          </div>

          {/* Headline: Sovereign Atmospheric & Climate Intelligence for in white with black shadow */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight sm:leading-none mb-4">
            <span
              className="text-white"
              style={{
                textShadow: '0 2px 14px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.9), 0 4px 24px rgba(0, 0, 0, 0.75)'
              }}
            >
              Sovereign Atmospheric &amp; Climate Intelligence for{' '}
            </span>
            <span
              className="text-teal-400"
              style={{
                textShadow: '0 2px 14px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.9)'
              }}
            >
              BRICS Nations
            </span>
          </h1>

          {/* Subtitle in crisp white with black drop shadow */}
          <p
            className="text-sm sm:text-base text-white max-w-2xl mx-auto mb-7 leading-relaxed font-medium"
            style={{
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.9), 0 4px 18px rgba(0, 0, 0, 0.75)'
            }}
          >
            A unified environmental observatory connecting 11 sovereign states. Ingesting satellite thermal
            telemetry and ground-level sensor data to model transboundary smoke plumes and coordinate response.
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm shadow-md transition-all w-full sm:w-auto"
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={() => navigate('/comparison')}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 font-medium text-xs sm:text-sm border border-slate-300 shadow-sm transition-all w-full sm:w-auto backdrop-blur-sm"
            >
              <span>Comparative Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-white/90 hover:text-white font-medium text-xs sm:text-sm transition-colors w-full sm:w-auto"
              style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)' }}
            >
              <span>ClimateAI Copilot</span>
            </button>
          </div>

          {/* Lifted Stat Cards with Subtle Shadow & Soft Status Chips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-left">
            {[
              {
                label: 'Member States',
                value: '11',
                sub: 'Sovereign Partners',
                chip: (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active</span>
                  </span>
                ),
                chipStyle: 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/60',
                icon: Globe,
                iconStyle: 'bg-slate-100 text-slate-700',
              },
              {
                label: 'Monitored Metros',
                value: '40+',
                sub: 'Ground Sensor Hubs',
                chip: (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    <span>Real-time</span>
                  </span>
                ),
                chipStyle: 'bg-teal-50 text-teal-700 border border-teal-200/50',
                icon: MapPin,
                iconStyle: 'bg-teal-50 text-teal-700',
              },
              {
                label: 'Active Satellite Fires',
                value: animatedFires.toLocaleString(),
                sub: 'Clustered Incidents',
                chip: (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span>NASA VIIRS</span>
                  </span>
                ),
                chipStyle: 'bg-orange-50 text-orange-700 border border-orange-200/60',
                icon: Flame,
                iconStyle: 'bg-orange-50 text-orange-600',
              },
              {
                label: 'Telemetry Cadence',
                value: 'Real-time',
                sub: `${syncLabel} · 30s stream`,
                chip: (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Stream</span>
                  </span>
                ),
                chipStyle: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
                icon: Activity,
                iconStyle: 'bg-emerald-50 text-emerald-700',
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="bg-white/95 backdrop-blur-md hover:bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.iconStyle}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${m.chipStyle}`}>
                      {m.chip}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                      {m.value}
                    </p>
                    <p className="text-xs font-semibold text-slate-800">{m.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{m.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. FOUR-PHASE OPERATIONAL PIPELINE
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#FAFAFC] border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-[11px] font-mono font-semibold tracking-widest text-slate-400 uppercase">
              Operational Framework
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Four-Phase Response Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Transforming raw satellite observations and terrestrial telemetry into actionable sovereign coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {OPERATIONAL_PILLARS.map(({ step, title, subtitle, desc, icon: Icon, chipBg }) => (
              <div
                key={step}
                className="bg-white rounded-xl border border-slate-200/70 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${chipBg}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-100">
                      PHASE {step}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
                  <p className="text-[11px] font-medium text-teal-700 mt-0.5 mb-2 uppercase tracking-wide">
                    {subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. 11 SOVEREIGN BRICS MEMBER STATES DIRECTORY
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <span className="text-[11px] font-mono font-semibold tracking-widest text-slate-400 uppercase">
                Member Roster
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                11 Sovereign Alliance Partners
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Continuous real-time synchronization across national telemetry hubs.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-3 md:mt-0 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
            >
              <span>Inspect Live Telemetry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {BRICS_MEMBERS.map((m) => (
              <div
                key={m.code}
                onClick={() => navigate('/dashboard')}
                className="group p-3.5 rounded-xl border border-slate-200/70 bg-[#FAFAFA] hover:bg-white hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_3px_8px_rgba(0,0,0,0.04)] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <CountryFlag code={m.code} country={m.name} className="w-8 h-5.5 rounded-xs shadow-xs" />
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Active
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {m.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{m.hub}</p>
                </div>
                <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                  <span>{m.region}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. STRATEGIC CAPABILITIES MATRIX
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#FAFAFC] border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-[11px] font-mono font-semibold tracking-widest text-slate-400 uppercase">
              Scientific Platform
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Core Technical Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Combining physics-based transport models, multi-spectral satellite sensors, and transparent machine learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STRATEGIC_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl border border-slate-200/70 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-700 mb-3.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1.5">{title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. LIGHT, MINIMAL EXECUTIVE FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="bg-white text-slate-600 py-10 px-5 sm:px-6 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="BRICS Logo" className="w-6 h-6 object-contain rounded" />
            <span className="font-bold text-slate-900">BRICSVue</span>
            <span className="text-slate-400">· Sovereign Climate Observatory</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-slate-500 text-[11px]">
            <span>Data: NASA EOSDIS FIRMS (VIIRS 375m)</span>
            <span className="hidden sm:inline">·</span>
            <span>Open-Meteo European AQI</span>
            <span className="hidden sm:inline">·</span>
            <span>WMO Standards Compliant</span>
          </div>

          <div className="text-[11px] text-slate-400">
            Updated live · {new Date().getFullYear()} Protocol
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;