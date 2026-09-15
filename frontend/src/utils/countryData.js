export const KNOWN_FIRE_COUNTS = {
  ID: 1137,
  RU: 208,
  CN: 122,
  ZA: 103,
  BR: 75,
  IR: 63,
  SA: 51,
  ET: 48,
  IN: 38,
  EG: 9,
  AE: 7,
};

export const COUNTRY_FLAGS = {
  BR: '🇧🇷',
  RU: '🇷🇺',
  IN: '🇮🇳',
  CN: '🇨🇳',
  ZA: '🇿🇦',
  EG: '🇪🇬',
  ET: '🇪🇹',
  IR: '🇮🇷',
  SA: '🇸🇦',
  AE: '🇦🇪',
  ID: '🇮🇩',
};

export const resolveCountryFlag = (c) => {
  if (!c) return '🌍';
  if (typeof c === 'object' && c.flag) return c.flag;
  const code = resolveCountryCode(c);
  return COUNTRY_FLAGS[code] || '🌍';
};

export const resolveCountryCode = (c) => {
  if (!c) return 'BRICS';
  if (typeof c === 'string') {
    const s = c.trim().toUpperCase();
    if (KNOWN_FIRE_COUNTS[s]) return s;
    const lower = c.toLowerCase();
    if (lower.includes('brazil') || lower.includes('brasilia')) return 'BR';
    if (lower.includes('russia') || lower.includes('moscow')) return 'RU';
    if (lower.includes('india') || lower.includes('delhi')) return 'IN';
    if (lower.includes('china') || lower.includes('beijing')) return 'CN';
    if (lower.includes('south africa') || lower.includes('johannesburg')) return 'ZA';
    if (lower.includes('egypt') || lower.includes('cairo')) return 'EG';
    if (lower.includes('ethiopia') || lower.includes('addis')) return 'ET';
    if (lower.includes('iran') || lower.includes('tehran')) return 'IR';
    if (lower.includes('arabia') || lower.includes('riyadh')) return 'SA';
    if (lower.includes('emirates') || lower.includes('uae') || lower.includes('dubai')) return 'AE';
    if (lower.includes('indonesia') || lower.includes('jakarta')) return 'ID';
    return s.slice(0, 2);
  }
  const rawCode = c?.code || c?.country_code || c?.country;
  if (KNOWN_FIRE_COUNTS[rawCode]) return rawCode;
  const name = (c?.name || c?.country_name || '').toLowerCase();
  if (name.includes('brazil') || name.includes('brasilia')) return 'BR';
  if (name.includes('russia') || name.includes('moscow')) return 'RU';
  if (name.includes('india') || name.includes('delhi')) return 'IN';
  if (name.includes('china') || name.includes('beijing')) return 'CN';
  if (name.includes('south africa') || name.includes('johannesburg')) return 'ZA';
  if (name.includes('egypt') || name.includes('cairo')) return 'EG';
  if (name.includes('ethiopia') || name.includes('addis')) return 'ET';
  if (name.includes('iran') || name.includes('tehran')) return 'IR';
  if (name.includes('arabia') || name.includes('riyadh')) return 'SA';
  if (name.includes('emirates') || name.includes('uae') || name.includes('dubai')) return 'AE';
  if (name.includes('indonesia') || name.includes('jakarta')) return 'ID';
  return 'BRICS';
};
