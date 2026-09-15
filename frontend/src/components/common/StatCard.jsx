import React from 'react';

const SEMANTIC_THEMES = {
  neutral: {
    bar: 'bg-slate-400',
    iconChip: 'bg-slate-100 text-slate-600',
    num: 'text-slate-900',
    sub: 'text-slate-500',
  },
  nominal: {
    bar: 'bg-emerald-500',
    iconChip: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    num: 'text-slate-900',
    sub: 'text-emerald-700',
  },
  caution: {
    bar: 'bg-amber-500',
    iconChip: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    num: 'text-slate-900',
    sub: 'text-amber-700',
  },
  critical: {
    bar: 'bg-rose-600',
    iconChip: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    num: 'text-slate-900',
    sub: 'text-rose-700',
  },
};

const StatCard = ({
  title,
  value,
  subtitle,
  subtitleIcon: SubIcon,
  icon: Icon,
  semantic = 'neutral',
  color,
}) => {
  let effectiveSemantic = semantic;
  if (color) {
    if (color === 'green' || color === 'teal') effectiveSemantic = 'nominal';
    else if (color === 'amber' || color === 'orange') effectiveSemantic = 'caution';
    else if (color === 'red' || color === 'rose') effectiveSemantic = 'critical';
    else effectiveSemantic = 'neutral';
  }

  const t = SEMANTIC_THEMES[effectiveSemantic] || SEMANTIC_THEMES.neutral;

  return (
    <div className="relative bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all overflow-hidden flex flex-col justify-between p-4 sm:p-5 pl-5 sm:pl-6 min-h-[136px]">
      {/* 4px semantic left-accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.bar} rounded-l-xl`} />

      {/* Top row: Title and Icon Chip */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-snug">
          {title}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t.iconChip}`}>
          {Icon && <Icon className="w-4 h-4" />}
        </div>
      </div>

      {/* Middle row: Large metric value */}
      <div className="my-1.5">
        <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-none ${t.num}`}>
          {value}
        </p>
      </div>

      {/* Bottom row: Subtitle line with icon */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs font-medium truncate">
        {SubIcon && <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className={`truncate ${t.sub}`}>{subtitle}</span>
      </div>
    </div>
  );
};

export default StatCard;