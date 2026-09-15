import React from 'react';

const ExplainabilityChart = ({ factors = [] }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-slate-800 mb-4">AI Prediction Factors (SHAP Values)</h3>
      <div className="space-y-4">
        {factors.map((factor, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-slate-600">{factor.name}</span>
              <span className="font-bold text-slate-800">{factor.importance_pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${factor.importance_pct}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4 italic">
        * Higher percentage indicates stronger influence on the predicted AQI spike.
      </p>
    </div>
  );
};

export default ExplainabilityChart;
