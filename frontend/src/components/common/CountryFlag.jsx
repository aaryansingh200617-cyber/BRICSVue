import React, { useState } from 'react';
import { resolveCountryCode, COUNTRY_FLAGS } from '../../utils/countryData';

export default function CountryFlag({
  code,
  country,
  flag,
  className = "w-5 h-3.5",
  style = {},
  alt = ""
}) {
  const [useEmoji, setUseEmoji] = useState(false);
  const resolvedCode = resolveCountryCode(code || country || flag);

  if (!resolvedCode || resolvedCode === 'BRICS') {
    return <span className="inline-block text-base leading-none select-none">🌍</span>;
  }

  const localUrl = `/flags/${resolvedCode.toLowerCase()}.png`;
  const cdnUrl = `https://flagcdn.com/w80/${resolvedCode.toLowerCase()}.png`;

  if (useEmoji) {
    return (
      <span className="inline-block text-base leading-none select-none" title={alt || resolvedCode}>
        {COUNTRY_FLAGS[resolvedCode] || '🌍'}
      </span>
    );
  }

  return (
    <img
      src={localUrl}
      alt={alt || resolvedCode}
      title={alt || resolvedCode}
      className={`inline-block object-cover rounded-xs shadow-xs align-middle flex-shrink-0 border border-slate-300/40 ${className}`}
      style={{ aspectRatio: '4/3', ...style }}
      loading="lazy"
      onError={(e) => {
        if (e.target.src !== cdnUrl && !e.target.src.includes('flagcdn.com')) {
          e.target.src = cdnUrl;
        } else {
          setUseEmoji(true);
        }
      }}
    />
  );
}
