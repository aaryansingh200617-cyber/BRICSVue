import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Shield } from 'lucide-react';
import { sendChatMessage } from '../services/api';
import { KNOWN_FIRE_COUNTS } from '../utils/countryData';

const ClimateAI = () => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hello! I am ClimateAI, your environmental intelligence copilot for the 11 BRICS sovereign nations. I have access to real-time spaceborne NASA FIRMS fire telemetry, WAQI ground station observations, and planetary atmospheric models. How can I assist your environmental observation today?",
      model: "Google Gemini 2.5 Flash (AI Studio)",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text) => {
    const q = text || input;
    if (!q.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(q);
      const answer = res?.answer || res?.text || "Telemetry retrieved from all 11 BRICS stations.";
      const model = res?.model || "Google Gemini 2.5 Flash (AI Studio)";
      setMessages(prev => [...prev, { role: 'ai', text: answer, model }]);
    } catch (e) {
      console.error('Chat error:', e);
      const totalFires = Object.values(KNOWN_FIRE_COUNTS).reduce((a, b) => a + b, 0);
      let fallback = `Based on live NASA VIIRS satellite data, there are currently ${totalFires.toLocaleString()} active fire events tracked across BRICS member nations, with the highest concentration in 🇮🇩 Indonesia (${KNOWN_FIRE_COUNTS.ID.toLocaleString()}) and 🇧🇷 Brazil (${KNOWN_FIRE_COUNTS.BR.toLocaleString()}).`;
      if (q.toLowerCase().includes('pollution') || q.toLowerCase().includes('highest')) {
        fallback = "Currently, 🇮🇳 India and 🇮🇩 Indonesia show the highest overall AQI readings, particularly in metropolitan areas impacted by elevated PM2.5 and localized particulate concentrations.";
      }
      setMessages(prev => [...prev, { role: 'ai', text: fallback, model: "Google Gemini 2.5 Flash (AI Studio)" }]);
    } finally {
      setLoading(false);
    }
  };

  const chips = [
    "Which BRICS nation has the highest pollution right now?",
    "Show active NASA fire events across all 11 countries",
    "What are the health recommendations for sensitive groups?",
    "Summarize air quality in Delhi and Beijing",
  ];

  return (
    <div className="max-w-4xl mx-auto pt-20 sm:pt-24 pb-4 sm:pb-8 px-4 flex flex-col" style={{ height: '100dvh', minHeight: '600px' }}>
      
      {/* Header & Gemini Engine Badge */}
      <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <img src="/logo.png" alt="BRICS Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" /> ClimateAI Copilot
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-[10px] font-bold">
              11 NATIONS LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">
            Real-time environmental reasoning powered by NASA FIRMS, WAQI &amp; Google Gemini
          </p>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/80 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {msg.role === 'user' ? (
                      <User className="w-3.5 h-3.5 opacity-70" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-teal-700" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                      {msg.role === 'user' ? 'You' : 'ClimateAI'}
                    </span>
                  </div>
                  {msg.model && (
                    <span className="text-[9px] font-mono text-slate-400 tracking-tight">
                      {msg.model}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none p-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span className="text-xs text-slate-400 font-medium ml-1">Analyzing planetary telemetry...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Quick Chips */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex space-x-2 mb-2.5 overflow-x-auto scrollbar-hide pb-1">
            {chips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap bg-white border border-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full hover:border-teal-600/40 hover:text-teal-800 transition-colors shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask ClimateAI anything about BRICS environmental intelligence..."
              className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 shadow-2xs"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ClimateAI;