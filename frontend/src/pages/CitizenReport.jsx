import React, { useState } from 'react';
import { Camera, MapPin, UploadCloud, CheckCircle } from 'lucide-react';

const CitizenReport = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center fade-in">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted Successfully</h2>
        <p className="text-slate-600 mb-6">Our AI has analyzed your image and categorized it as <strong>Agricultural Fire (92% confidence)</strong>.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Report Environmental Event</h1>
        <p className="text-slate-500">Crowdsource data to improve AI accuracy</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <UploadCloud className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="font-medium text-slate-700">Drag & drop photo here</p>
            <p className="text-xs text-slate-500 mt-1">or click to browse from your device</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Location</label>
              <div className="flex">
                <input type="text" placeholder="e.g. Lat, Lon or City" className="flex-1 border-gray-300 rounded-l-md border p-2 text-sm focus:ring-blue-500" required />
                <button type="button" className="bg-gray-100 border-y border-r border-gray-300 px-3 rounded-r-md text-slate-600 hover:bg-gray-200">
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Category</label>
              <select className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-blue-500" required>
                <option value="">Select category...</option>
                <option>Smoke / Fire</option>
                <option>Dust / Haze</option>
                <option>Industrial Emission</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea 
              rows="3" 
              placeholder="Describe what you observed..." 
              className="w-full border-gray-300 rounded-md border p-2 text-sm focus:ring-blue-500"
              required
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition-colors flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Submit Report for AI Analysis'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CitizenReport;
