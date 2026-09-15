import React from 'react';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';

const AuthorityDashboard = () => {
  const incidents = [
    { id: 'INC-2034', loc: 'Punjab Border', sev: 'Critical', status: 'Action Required', time: '10m ago' },
    { id: 'INC-2033', loc: 'Beijing Suburb', sev: 'High', status: 'Investigating', time: '1h ago' },
    { id: 'INC-2032', loc: 'Amazon Basin', sev: 'Medium', status: 'Resolved', time: '5h ago' },
  ];

  const getStatusColor = (status) => {
    if (status === 'Action Required') return 'bg-red-100 text-red-700';
    if (status === 'Investigating') return 'bg-blue-100 text-blue-700';
    if (status === 'Resolved') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Command Center</h1>
          <p className="text-slate-500">Incident management and inter-governmental coordination</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 font-bold text-slate-800">Active Incidents</div>
            <div className="divide-y">
              {incidents.map(inc => (
                <div key={inc.id} className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors">
                  <div>
                    <div className="font-semibold text-slate-800">{inc.loc}</div>
                    <div className="text-xs text-slate-500">{inc.id} • {inc.time}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(inc.status)}`}>{inc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center text-center">
            <AlertOctagon className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">INC-2034 Details</h3>
            <p className="text-slate-600 text-sm mb-4">
              AI model predicts severe transboundary smoke flow affecting northern regions in next 6 hours. Confidence: 94%.
            </p>
            <div className="grid grid-cols-2 gap-4 w-full mb-6">
              <div className="bg-gray-50 p-3 rounded border">
                <div className="text-xs text-slate-500">Current AQI</div>
                <div className="text-xl font-bold text-slate-800">185</div>
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-100">
                <div className="text-xs text-red-500">Predicted AQI (+6h)</div>
                <div className="text-xl font-bold text-red-700">320</div>
              </div>
            </div>
            <div className="flex space-x-3 w-full">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">Dispatch Team</button>
              <button className="flex-1 bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 transition-colors flex justify-center items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
           <h3 className="font-bold text-slate-800 mb-4">Cross-Border Policy Protocol Engine</h3>
           <p className="text-sm text-slate-600 mb-4">When a transboundary event is detected, automatically notify affected member states per BRICS environmental treaty.</p>
           <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 text-sm">
             Generate Briefing Report
           </button>
        </div>
      </div>
  );
};

export default AuthorityDashboard;
