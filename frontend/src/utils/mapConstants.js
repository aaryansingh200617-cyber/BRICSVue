export const BASEMAP_PRESETS = {
  topo: {
    id: 'topo',
    label: 'Topographic Relief',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, DeLorme, NAVTEQ, TomTom, Intermap, IPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey',
    maxZoom: 16,
    subdomains: [],
    oceanBg: '#97c2d9',
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean Bathymetry',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    refUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org',
    maxZoom: 16,
    subdomains: [],
    oceanBg: '#214d7a',
  }
};
