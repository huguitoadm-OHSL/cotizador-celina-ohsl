import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Calculator, Send, Map as MapIcon, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, Tag, 
  MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, ChevronDown, 
  Database, Edit2, LayoutTemplate, Loader2, AlertCircle, Scale, X, Printer, Activity, Wallet, CreditCard, Lock, Unlock,
  Maximize, Minimize, Eye, Crosshair, Server,
  TreePine, GraduationCap, Hospital, ShoppingBag, Landmark, Timer, Equal
} from "lucide-react";
import Map, { Source, Layer, GeolocateControl, NavigationControl, Marker } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ============================================================================
// BASE DE DATOS DE REGIONALES Y PROYECTOS
// ============================================================================
const proyectosPorRegional = {
  "SANTA CRUZ": [
    "URUBÓ NORTE", "ROSA RODALI", "CELINA PAILÓN", "EL ENCANTO", "EL ENCANTO FASE 2",
    "SANTA ROSA - FASE 1", "SANTA ROSA - FASE 2", "SANTA ROSA - FASE 3", "TAMARINDO",
    "JARDINES DEL BOSQUE", "EL PORVENIR", "EL PORVENIR FASE 2"
  ],
  "MONTERO": [
    "MUYURINA", "LOS JARDINES", "EL RENACER", "CELINA 3", "CELINA 4", "CELINA 5",
    "RANCHO NUEVO", "CELINA X", "CAÑAVERAL", "SANTA FE", "VILLA BELLA VIVIENDAS"
  ],
  "SATÉLITE NORTE": [
    "CELINA 7 FASE 3", "CELINA 8", "CLARA CHUCHIO", "SAN JORGE",
    "CELINA VII FASE 1", "CELINA VII FASE 2", "PRADERAS DEL NORTE", "NARANJAL III", "CELINA II"
  ]
};

const coordenadasProyectos = {
  "MUYURINA": { lat: -17.3710, lng: -63.2550, zoom: 15.5 },
  "LOS JARDINES": { lat: -17.3524, lng: -63.2718, zoom: 15.5 },
  "EL RENACER": { lat: -17.3615, lng: -63.2652, zoom: 15.5 },
  "CAÑAVERAL": { lat: -17.3255, lng: -63.2625, zoom: 15.5 },
  "SANTA FE": { lat: -17.3150, lng: -63.2755, zoom: 15.5 },
  "CELINA 3": { lat: -17.3452, lng: -63.2425, zoom: 15.5 },
  "CELINA 4": { lat: -17.3485, lng: -63.2385, zoom: 15.5 },
  "CELINA 5": { lat: -17.3518, lng: -63.2345, zoom: 15.5 },
  "CELINA X": { lat: -17.3325, lng: -63.2515, zoom: 15.5 },
  "RANCHO NUEVO": { lat: -17.3582, lng: -63.2482, zoom: 15.5 },
  "VILLA BELLA VIVIENDAS": { lat: -17.3382, lng: -63.2412, zoom: 15.5 },
  "CELINA 7 FASE 3": { lat: -17.5752, lng: -63.1425, zoom: 15.5 },
  "CELINA VII FASE 1": { lat: -17.5785, lng: -63.1455, zoom: 15.5 },
  "CELINA VII FASE 2": { lat: -17.5765, lng: -63.1435, zoom: 15.5 },
  "CELINA 8": { lat: -17.5685, lng: -63.1352, zoom: 15.5 },
  "CLARA CHUCHIO": { lat: -17.5925, lng: -63.1552, zoom: 15.5 },
  "SAN JORGE": { lat: -17.5852, lng: -63.1482, zoom: 15.5 },
  "PRADERAS DEL NORTE": { lat: -17.5625, lng: -63.1512, zoom: 15.5 },
  "NARANJAL III": { lat: -17.5452, lng: -63.1625, zoom: 15.5 },
  "CELINA II": { lat: -17.5815, lng: -63.1395, zoom: 15.5 },
  "URUBÓ NORTE": { lat: -17.7215, lng: -63.2385, zoom: 15.2 },
  "ROSA RODALI": { lat: -17.6852, lng: -63.1252, zoom: 15.2 },
  "CELINA PAILÓN": { lat: -17.6552, lng: -62.7225, zoom: 15.2 },
  "EL ENCANTO": { lat: -17.6952, lng: -63.0852, zoom: 15.2 },
  "EL ENCANTO FASE 2": { lat: -17.6982, lng: -63.0825, zoom: 15.2 },
  "SANTA ROSA - FASE 1": { lat: -17.7125, lng: -63.0752, zoom: 15.2 },
  "SANTA ROSA - FASE 2": { lat: -17.7155, lng: -63.0722, zoom: 15.2 },
  "SANTA ROSA - FASE 3": { lat: -17.7185, lng: -63.0692, zoom: 15.2 },
  "TAMARINDO": { lat: -17.7352, lng: -63.0952, zoom: 15.2 },
  "JARDINES DEL BOSQUE": { lat: -17.7652, lng: -63.0452, zoom: 15.2 },
  "EL PORVENIR": { lat: -17.7052, lng: -63.0652, zoom: 15.2 },
  "EL PORVENIR FASE 2": { lat: -17.7082, lng: -63.0622, zoom: 15.2 }
};

const ciudadesRegionales = [
  { id: 'scz', nombre: 'Santa Cruz de la Sierra', lat: -17.7833, lng: -63.1821 },
  { id: 'montero', nombre: 'Montero', lat: -17.3386, lng: -63.2553 },
  { id: 'warnes', nombre: 'Warnes', lat: -17.5147, lng: -63.1672 },
  { id: 'cotoca', nombre: 'Cotoca', lat: -17.7544, lng: -62.9975 },
  { id: 'satelite', nombre: 'Satélite Norte', lat: -17.5833, lng: -63.1500 },
  { id: 'pailon', nombre: 'Pailón', lat: -17.6597, lng: -62.7194 }
];

// ============================================================================
// MATRIZ DINÁMICA DE PLUSVALÍA (URBAN ANCHORS LOCALES)
// ============================================================================
const baseAnclasUrbanas = {
  "MUYURINA": [
    { id: 'edu-salesiana', nombre: 'Cdad. Educativa Salesiana', tipo: 'educacion', lat: -17.361885914835153, lng: -63.24893856868162 },
    { id: 'parque-lineal-1', nombre: 'Parque Lineal', tipo: 'recreacion', lat: -17.365927510716485, lng: -63.2459298471779 },
    { id: 'parque-lineal-2', nombre: 'Parque Lineal', tipo: 'recreacion', lat: -17.369436731162317, lng: -63.256639276667 },
    { id: 'centro-comercial', nombre: 'Centro Comercial', tipo: 'comercio', lat: -17.370851047268427, lng: -63.25323287462514 },
    { id: 'carretera-norte', nombre: 'Carretera al Norte', tipo: 'landmark', lat: -17.36191155922974, lng: -63.24341131066158 },
    { id: 'segundo-anillo', nombre: 'Segundo Anillo', tipo: 'landmark', lat: -17.366171150625245, lng: -63.263898823492916 },
    { id: 'primera-radial', nombre: '1ra Radial', tipo: 'landmark', lat: -17.36532915405663, lng: -63.25521355672914 },
    { id: 'segunda-radial', nombre: '2da Radial', tipo: 'landmark', lat: -17.371226189082137, lng: -63.26083508618699 }
  ],
  "URUBÓ NORTE": [
    { id: 'puente-foianini', nombre: 'Puente Mario Foianini', tipo: 'landmark', lat: -17.7551, lng: -63.2045 },
    { id: 'urubo-business', nombre: 'Centro Empresarial Urubó', tipo: 'comercio', lat: -17.7450, lng: -63.2100 },
    { id: 'country-club', nombre: 'Urubó Golf Country Club', tipo: 'recreacion', lat: -17.7380, lng: -63.2150 },
    { id: 'parque-ecologico', nombre: 'Reserva Ecológica Urubó', tipo: 'recreacion', lat: -17.7300, lng: -63.2200 }
  ],
  "CELINA 7 FASE 3": [
    { id: 'aeropuerto-viru', nombre: 'Aeropuerto Int. Viru Viru', tipo: 'landmark', lat: -17.6444, lng: -63.1350 },
    { id: 'mercado-satelite', nombre: 'Mercado Mayorista Satélite', tipo: 'comercio', lat: -17.5850, lng: -63.1510 },
    { id: 'avenida-g77', nombre: 'Avenida G77', tipo: 'landmark', lat: -17.6200, lng: -63.1400 },
    { id: 'parque-industrial', nombre: 'Parque Industrial Norte', tipo: 'comercio', lat: -17.5900, lng: -63.1450 }
  ],
  "EL ENCANTO": [
    { id: 'nueva-autopista', nombre: 'Autopista Santa Cruz - Warnes', tipo: 'landmark', lat: -17.6900, lng: -63.0900 },
    { id: 'zona-franca', nombre: 'Zona Franca Comercial', tipo: 'comercio', lat: -17.6850, lng: -63.0950 },
    { id: 'parque-urbano', nombre: 'Parque Urbano El Encanto', tipo: 'recreacion', lat: -17.6980, lng: -63.0800 }
  ]
};

// ============================================================================
// COMPONENTE: NAVEGADOR ESPACIAL WEBGIS 
// ============================================================================
const MapaEspacial = ({ loteActivo, proyectoActivo, baseDeDatosLotes, onLoteClick }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false); 
  const mapRef = useRef(null);
  
  const geojsonPath = `/${proyectoActivo.toLowerCase().replace(/\s+/g, '_')}.geojson`;
  const anclasActivas = baseAnclasUrbanas[proyectoActivo] || [];
  
  useEffect(() => {
    setIsMapReady(false);
    const safetyTimer = setTimeout(() => setIsMapReady(true), 2500);
    return () => clearTimeout(safetyTimer);
  }, [proyectoActivo]);

  useEffect(() => {
    const volarAlProyecto = async () => {
      try {
        const response = await fetch(geojsonPath);
        if (response.ok) {
          const data = await response.json();
          if (data && data.features && data.features.length > 0) {
            let coordenadas = data.features[0].geometry.coordinates;
            while (Array.isArray(coordenadas[0])) coordenadas = coordenadas[0];
            const [lng, lat] = coordenadas;
            if (mapRef.current && lng && lat) {
              mapRef.current.getMap().flyTo({ center: [lng, lat], zoom: 15.2, pitch: 50, speed: 1.5, essential: true });
              return;
            }
          }
        }
        const target = coordenadasProyectos[proyectoActivo] || { lat: -17.3710, lng: -63.2550, zoom: 15.0 };
        if (mapRef.current) mapRef.current.getMap().flyTo({ center: [target.lng, target.lat], zoom: target.zoom || 15.0, pitch: 50, speed: 1.5, essential: true });
      } catch (error) {
        const target = coordenadasProyectos[proyectoActivo] || { lat: -17.3710, lng: -63.2550, zoom: 15.0 };
        if (mapRef.current) mapRef.current.getMap().flyTo({ center: [target.lng, target.lat], zoom: target.zoom || 15.0, pitch: 50, speed: 1.5, essential: true });
      }
    };
    volarAlProyecto();
  }, [geojsonPath, proyectoActivo]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) { setTimeout(() => map.resize(), 50); setTimeout(() => map.resize(), 300); }
  }, [isFullscreen]);

  const handleMapClick = useCallback((event) => {
    if (!onLoteClick) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    const features = map.queryRenderedFeatures(event.point, { layers: ['lotes-fill', 'lotes-labels', 'lotes-points'] });
    if (features && features.length > 0) {
      const prop = features[0].properties;
      const loteTocado = prop.Lote || prop.lote || prop.name || prop.Text || prop.text;
      const mznTocada = prop.MZN || prop.mzn || prop.Manzano || prop.manzano;
      const uvTocada = prop.UV || prop.uv;
      if (loteTocado) onLoteClick(uvTocada || "", mznTocada || "", loteTocado);
    }
  }, [onLoteClick]);

  const { verdes, rojos, azules } = useMemo(() => {
    let v = []; let r = []; let a = [];
    const lotesFiltrados = baseDeDatosLotes.filter(l => l.proyecto.includes(proyectoActivo));
    lotesFiltrados.forEach(l => {
      const raw = String(l.lote).trim();
      const num = String(parseInt(raw, 10) || raw);
      const variaciones = [raw, num, `${num} `, ` ${num}`, `0${num}`, `LOTE ${num}`];
      const est = String(l.estado).toUpperCase();
      if (est === 'LIBRE' || est === 'DISPONIBLE' || est === '') v.push(...variaciones);
      else if (est === 'BLOQUEADO' || est === 'RESERVADO') r.push(...variaciones);
      else if (est === 'VENDIDO') a.push(...variaciones);
    });
    return { verdes: v.length > 0 ? v : ['__NONE__'], rojos: r.length > 0 ? r : ['__NONE__'], azules: a.length > 0 ? a : ['__NONE__'] };
  }, [baseDeDatosLotes, proyectoActivo]);

  const textProperty = ['coalesce', ['get', 'name'], ['get', 'Name'], ['get', 'Text'], ['get', 'text'], ['get', 'Lote'], ['get', 'lote'], ''];
  const fillLayer = useMemo(() => ({
    id: 'lotes-fill', type: 'fill',
    paint: { 'fill-color': ['match', ['to-string', textProperty], verdes, 'rgba(34, 197, 94, 0.35)', rojos, 'rgba(239, 68, 68, 0.35)', azules, 'rgba(59, 130, 246, 0.35)', 'transparent'], 'fill-opacity': 1 }
  }), [verdes, rojos, azules]);

  const lineGlowLayer = useMemo(() => ({ id: 'lotes-line-glow', type: 'line', paint: { 'line-color': '#00e5ff', 'line-width': 8, 'line-opacity': 0.35, 'line-blur': 4 } }), []);
  const lineLayer = useMemo(() => ({ id: 'lotes-line', type: 'line', paint: { 'line-color': '#00e5ff', 'line-width': 1.5, 'line-opacity': 0.9 } }), []);
  const highlightLayer = useMemo(() => ({ id: 'lotes-highlight', type: 'line', paint: { 'line-color': '#fbbf24', 'line-width': 5, 'line-opacity': 1 }, filter: ['==', ['to-string', textProperty], String(parseInt(loteActivo, 10) || '')] }), [loteActivo]);

  const pointLayer = useMemo(() => ({
    id: 'lotes-points', type: 'circle', minzoom: 16.2, 
    paint: { 'circle-radius': 9, 'circle-color': ['match', ['to-string', textProperty], verdes, '#22c55e', rojos, '#ef4444', azules, '#3b82f6', 'rgba(255, 255, 255, 0.25)'], 'circle-stroke-width': 1.5, 'circle-stroke-color': '#020617' },
    filter: ['all', ['==', ['geometry-type'], 'Point'], ['!=', ['to-string', textProperty], '']]
  }), [verdes, rojos, azules]);

  const labelLayer = useMemo(() => ({
    id: 'lotes-labels', type: 'symbol', minzoom: 16.2, 
    layout: { 'text-field': textProperty, 'text-size': 11, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 'text-anchor': 'center', 'text-allow-overlap': true, 'text-ignore-placement': true },
    paint: { 'text-color': '#ffffff' },
    filter: ['all', ['==', ['geometry-type'], 'Point'], ['!=', ['to-string', textProperty], '']]
  }), []);

  const containerClasses = isFullscreen 
    ? "fixed top-0 left-0 right-0 bottom-0 z-[99999] bg-[#020617] w-full h-[100dvh] flex flex-col m-0 p-0 rounded-none animate-in fade-in duration-300 cursor-crosshair" 
    : "relative w-full h-[450px] sm:h-[500px] rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.2)] border border-cyan-500/40 bg-[#060b13] transition-all duration-500 cursor-crosshair";

  return (
    <div className={containerClasses}>
      {!isFullscreen && (
        <div className="bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 z-20 border-b border-cyan-500/30 flex justify-between items-center shadow-lg relative shrink-0">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-900/20 to-transparent pointer-events-none"></div>
           <div className="flex items-center gap-3 relative z-10">
             <div className="bg-cyan-500/20 p-2 rounded-xl border border-cyan-500/40 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]">
               <MapPin className="w-5 h-5 text-cyan-400" />
             </div>
             <div>
               <h3 className="text-white font-black tracking-widest uppercase text-xs sm:text-sm">Navegador Espacial <span className="text-cyan-400">{proyectoActivo}</span></h3>
               <p className="text-slate-400 text-[9px] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                 <span className="w-2 h-2 rounded-full bg-green-500 inline-block shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span> Disponible 
                 <span className="w-2 h-2 rounded-full bg-red-500 inline-block ml-1 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span> Bloqueado 
                 <span className="w-2 h-2 rounded-full bg-blue-500 inline-block ml-1 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span> Vendido
               </p>
             </div>
           </div>
           <div className="flex gap-3 relative z-10">
             <span className="hidden sm:flex text-[10px] font-black bg-slate-900 text-cyan-400 px-4 py-2 rounded-xl border border-cyan-500/40 items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
               <div className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
               </div>
               TRACKER ACTIVO
             </span>
             <button 
               type="button" onClick={() => setIsFullscreen(true)} 
               className="bg-[#020617] hover:bg-cyan-950 text-cyan-400 p-2.5 rounded-xl border border-cyan-500/40 hover:border-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
             >
               <Maximize className="w-5 h-5"/>
             </button>
           </div>
        </div>
      )}
      {isFullscreen && (
        <button 
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[10000] bg-slate-900/90 backdrop-blur-md text-cyan-400 p-3.5 rounded-2xl border border-cyan-500/50 hover:bg-slate-800 hover:text-white transition-all shadow-[0_0_30px_rgba(34,211,238,0.5)] group"
        >
          <Minimize className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}
      <div className="flex-1 relative w-full h-full bg-[#020617] min-h-[300px]">
        {!isMapReady && (
          <div className="absolute inset-0 z-50 bg-[#060b13] flex flex-col items-center justify-center pointer-events-none">
            <div className="relative flex items-center justify-center">
               <div className="absolute w-24 h-24 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
               <div className="absolute w-16 h-16 border-4 border-emerald-500/20 border-b-emerald-400 rounded-full animate-spin direction-reverse"></div>
               <Crosshair className="w-8 h-8 text-cyan-500 animate-pulse" />
            </div>
            <div className="text-cyan-500 text-[10px] font-black tracking-[0.3em] uppercase mt-6 animate-pulse">Enlazando Satélite...</div>
          </div>
        )}
        <div className="absolute inset-0 z-10 w-full h-full">
          <Map
            ref={mapRef} mapLib={maplibregl}
            initialViewState={{ longitude: -63.2435, latitude: -17.3635, zoom: 14.3, pitch: 0 }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            maxZoom={20} onLoad={() => setIsMapReady(true)} onClick={handleMapClick}
            interactiveLayerIds={['lotes-fill', 'lotes-labels', 'lotes-points']}
            style={{ width: '100%', height: '100%' }}
          >
            <GeolocateControl position="bottom-right" trackUserLocation={true} showUserHeading={true} />
            <NavigationControl position="bottom-right" visualizePitch={true} />
            <Source id="satellite-source" type="raster" tiles={['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}']} tileSize={256} maxzoom={20}>
              <Layer id="satellite-layer" type="raster" paint={{ 'raster-opacity': 1.0, 'raster-brightness-max': 1.0, 'raster-saturation': 0.1 }} />
            </Source>
            <Source id="dynamic-data" type="geojson" data={geojsonPath}>
              <Layer {...fillLayer as any} />
              <Layer {...lineGlowLayer as any} />
              <Layer {...lineLayer as any} />
              <Layer {...highlightLayer as any} />
              <Layer {...pointLayer as any} />
              <Layer {...labelLayer as any} />
            </Source>
            
            {/* BALIZAS REGIONALES CIUDADES */}
            {ciudadesRegionales.map((ciudad) => (
              <Marker key={ciudad.id} longitude={ciudad.lng} latitude={ciudad.lat} anchor="center">
                <div className="flex items-center gap-1.5 bg-[#020617]/85 backdrop-blur-md border border-cyan-500/40 px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                  <span className="text-[9px] font-extrabold text-cyan-200 uppercase tracking-widest">{ciudad.nombre}</span>
                </div>
              </Marker>
            ))}
            
            {/* SISTEMA DE BALIZAS TELEMÉTRICAS (ALTIMÉTRICAS) */}
            {anclasActivas.map((nodo) => (
              <Marker key={nodo.id} longitude={nodo.lng} latitude={nodo.lat} anchor="bottom">
                <div className="flex flex-col items-center group cursor-pointer animate-in fade-in zoom-in duration-700">
                  
                  {/* Cabezal de Lectura Constante (Opacidad 100%) */}
                  <div className="flex items-center gap-2 bg-[#020617]/95 backdrop-blur-xl border border-cyan-500/50 p-1.5 pr-3 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)] transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 relative z-20">
                    <div className="bg-cyan-950/80 p-1.5 rounded-full border border-cyan-400/50 flex items-center justify-center shrink-0">
                      {nodo.tipo === 'educacion' && <GraduationCap className="w-3.5 h-3.5 text-cyan-300" />}
                      {nodo.tipo === 'recreacion' && <TreePine className="w-3.5 h-3.5 text-emerald-400" />}
                      {nodo.tipo === 'salud' && <Hospital className="w-3.5 h-3.5 text-rose-400" />}
                      {nodo.tipo === 'comercio' && <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />}
                      {nodo.tipo === 'landmark' && <Landmark className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-white whitespace-nowrap uppercase tracking-widest drop-shadow-md">
                      {nodo.nombre}
                    </span>
                  </div>
                  
                  {/* Mástil Vertical */}
                  <div className="w-[1.5px] h-10 sm:h-14 bg-gradient-to-b from-cyan-400/80 to-cyan-500/10 shadow-[0_0_5px_rgba(34,211,238,0.5)] relative z-10 -my-1">
                     <div className="absolute top-0 left-0 w-full h-1/3 bg-cyan-300 animate-pulse"></div>
                  </div>
                  
                  {/* Elipse Topográfica Suelo */}
                  <div className="relative flex items-center justify-center z-0">
                     <div className="absolute w-8 h-2.5 bg-cyan-500/30 rounded-[100%] blur-sm animate-ping"></div>
                     <div className="w-3 h-[3px] bg-cyan-400 rounded-[100%] shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
                  </div>

                </div>
              </Marker>
            ))}
          </Map>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(false); 
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "SALMO23") { setIsAuthenticated(true); setIsAdmin(false); setLoginError(false); } 
    else if (passwordInput === "OHSARAVIA") { setIsAuthenticated(true); setIsAdmin(true); setLoginError(false); } 
    else { setLoginError(true); setTimeout(() => setLoginError(false), 2000); }
  };

  const [regional, setRegional] = useState("MONTERO");
  const [proyecto, setProyecto] = useState("MUYURINA");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  const [usarAPI, setUsarAPI] = useState(true); 
  const [baseDeDatosLotes, setBaseDeDatosLotes] = useState([]);
  const [cargandoBD, setCargandoBD] = useState(true);
  const [usarBD, setUsarBD] = useState(true);
  const [tipoCotizacion, setTipoCotizacion] = useState("credito"); 
  const [tcFlexible, setTcFlexible] = useState(12.32); 
  
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState(""); 
  const [categoria, setCategoria] = useState("");
  
  const [descuentoM2, setDescuentoM2] = useState(1); 
  const [aplicarDescM2, setAplicarDescM2] = useState(true); 
  
  const [plazoLiquidacion, setPlazoLiquidacion] = useState("30"); 

  const [modoInicial, setModoInicial] = useState("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  const [años, setAños] = useState("");
  
  const [resultado, setResultado] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [toast, setToast] = useState(null);
  const formRef = useRef(null);
  const resultadosRef = useRef(null);

  // ============================================================================
  // CARGADOR UNIFICADO: EXCEL LOCAL vs API SERVER
  // ============================================================================
  useEffect(() => {
    if (!isAuthenticated || !proyecto) return;
    const cargarDatos = async () => {
      setCargandoBD(true);
      const getSafeVal = (obj, propName) => {
          const key = Object.keys(obj).find(k => k.trim().toLowerCase().includes(propName.toLowerCase()));
          return key ? obj[key] : undefined;
      };
      const extractNumber = (val) => {
          if (val === undefined || val === null || val === '') return 0;
          if (typeof val === 'number') return val;
          let s = String(val).trim();
          if (s.includes('.') && s.includes(',')) {
              if (s.indexOf('.') < s.indexOf(',')) s = s.replace(/\./g, '').replace(',', '.');
              else s = s.replace(/,/g, '');
          } else if (s.includes(',')) s = s.replace(',', '.');
          s = s.replace(/[^0-9.-]/g, '');
          const n = Number(s);
          return isNaN(n) ? 0 : n;
      };
      
      if (usarAPI) {
        try {
          const resProj = await fetch('https://simulador.data-gc.net/api/proyectos');
          if (!resProj.ok) throw new Error("API Falló");
          const dataProj = await resProj.json();
          const projAPI = dataProj.proyectos.find(p => {
             const apiName = String(p.proyecto).trim().toUpperCase();
             const local = proyecto.trim().toUpperCase();
             const map = {
                "URUBÓ NORTE": ["CELINA URUBO DEL NORTE", "URUBO NORTE"],
                "ROSA RODALI": ["ROSA RODALI", "CELINA ROSA RODALI"],
                "CELINA PAILÓN": ["CELINA PAILON", "PAILON"],
                "EL ENCANTO": ["EL ENCANTO", "CELINA EL ENCANTO"],
                "EL ENCANTO FASE 2": ["EL ENCANTO FASE 2", "EL ENCANTO 2", "CELINA EL ENCANTO FASE 2"],
                "SANTA ROSA - FASE 1": ["SANTA ROSA FASE 1", "SANTA ROSA - FASE 1"],
                "SANTA ROSA - FASE 2": ["SANTA ROSA FASE 2", "SANTA ROSA - FASE 2"],
                "SANTA ROSA - FASE 3": ["SANTA ROSA FASE 3", "SANTA ROSA - FASE 3"],
                "TAMARINDO": ["TAMARINDO", "CELINA TAMARINDO"],
                "JARDINES DEL BOSQUE": ["JARDINES DEL BOSQUE"],
                "EL PORVENIR": ["EL PORVENIR", "CELINA EL PORVENIR"],
                "EL PORVENIR FASE 2": ["EL PORVENIR FASE 2", "EL PORVENIR 2", "CELINA EL PORVENIR FASE 2"],
                "MUYURINA": ["CELINA MUYURINA", "MUYURINA"],
                "LOS JARDINES": ["LOS JARDINES", "CELINA LOS JARDINES"],
                "EL RENACER": ["EL RENACER", "CELINA EL RENACER"],
                "CELINA 3": ["CELINA III", "CELINA 3"],
                "CELINA 4": ["CELINA IV", "CELINA 4"],
                "CELINA 5": ["CELINA V", "CELINA 5"],
                "RANCHO NUEVO": ["CELINA - RANCHO NUEVO", "RANCHO NUEVO"],
                "CELINA X": ["CELINA X", "CELINA 10"],
                "CAÑAVERAL": ["CAÑAVERAL", "CELINA CAÑAVERAL"],
                "SANTA FE": ["CELINA SANTA FE", "SANTA FE"],
                "VILLA BELLA VIVIENDAS": ["VILLA BELLA", "VILLA BELLA VIVIENDAS"],
                "CELINA 7 FASE 3": ["CELINA VII FASE 3", "CELINA 7 FASE 3"],
                "CELINA 8": ["CELINA 8", "CELINA VIII"],
                "CLARA CHUCHIO": ["CELINA CLARA CHUCHIO", "CLARA CHUCHIO"],
                "SAN JORGE": ["SAN JORGE", "CELINA SAN JORGE"],
                "CELINA VII FASE 1": ["CELINA VII FASE 1", "CELINA 7 FASE 1"],
                "CELINA VII FASE 2": ["CELINA VII FASE 2", "CELINA 7 FASE 2"],
                "PRADERAS DEL NORTE": ["PRADERAS DEL NORTE", "CELINA PRADERAS DEL NORTE"],
                "NARANJAL III": ["NARANJAL III", "NARANJAL 3"],
                "CELINA II": ["CELINA II", "CELINA 2"]
             };
             if (map[local] && map[local].includes(apiName)) return true;
             return apiName === local || apiName === `CELINA ${local}`;
          });
          
          if (projAPI && projAPI.project_id) {
            const resLotes = await fetch(`https://simulador.data-gc.net/api/lotes?project_id=${projAPI.project_id}`);
            if (!resLotes.ok) throw new Error("API Lotes Falló");
            const dataLotes = await resLotes.json();
            if (dataLotes.lotes) {
              const apiMapped = dataLotes.lotes.map(loteFresco => {
                const keyPrecio = Object.keys(loteFresco).find(k => k.toLowerCase().includes('prec') || k.toLowerCase().includes('pric'));
                const rawPrecio = keyPrecio ? loteFresco[keyPrecio] : 0;
                
                return {
                  proyecto: proyecto, 
                  uv: loteFresco.uv ? String(loteFresco.uv).trim().toUpperCase() : "SN",
                  mzn: loteFresco.manzano ? String(loteFresco.manzano).trim().toUpperCase() : "SN",
                  lote: String(loteFresco.lote).trim().toUpperCase(),
                  superficie: extractNumber(loteFresco.mt2 || loteFresco.superficie),
                  precio: extractNumber(rawPrecio),
                  estado: String(loteFresco.estado || "LIBRE").toUpperCase(),
                  categoria: loteFresco.categoria ? String(loteFresco.categoria).toUpperCase() : "ESTÁNDAR",
                  vendedor: "API VIVA",
                  api_cuota_inicial: extractNumber(loteFresco.cuota_inicial),
                  api_initial_tipo: String(loteFresco.initial_tipo || ""),
                  api_initial_pct: extractNumber(loteFresco.initial_pct),
                  api_initial_valor: extractNumber(loteFresco.initial_valor)
                };
              });
              setBaseDeDatosLotes(apiMapped);
              setCargandoBD(false);
              return; 
            }
          }
          throw new Error("Proyecto no encontrado en API");
        } catch (error) { setUsarAPI(false); }
      } else {
        try {
          let rawData;
          try {
            const response = await fetch('/lotes.json');
            if (!response.ok) throw new Error('Fallo local');
            rawData = await response.json();
          } catch (e) {
            const timestamp = new Date().getTime();
            const githubRawUrl = `https://raw.githubusercontent.com/huguitoadm-OHSL/cotizador-celina-ohsl/main/public/lotes.json?t=${timestamp}`;
            const fallbackResponse = await fetch(githubRawUrl);
            if (!fallbackResponse.ok) throw new Error('Fallo github');
            rawData = await fallbackResponse.json();
          }
          if (!Array.isArray(rawData)) rawData = [];
          const normalizedData = rawData.map(item => ({
              proyecto: String(getSafeVal(item, 'proyecto') || "").trim().toUpperCase(),
              uv: String(getSafeVal(item, 'uv') || "").trim().toUpperCase() || "SN", 
              mzn: String(getSafeVal(item, 'mzn') || "").trim().toUpperCase(),
              lote: String(getSafeVal(item, 'lote') || "").trim().toUpperCase(),
              superficie: extractNumber(getSafeVal(item, 'superficie')),
              precio: extractNumber(getSafeVal(item, 'precio')),
              estado: String(getSafeVal(item, 'estado') || "LIBRE").trim().toUpperCase(),
              categoria: String(getSafeVal(item, 'categoria') || "ESTÁNDAR").trim().toUpperCase(),
              vendedor: String(getSafeVal(item, 'vendedor') || "NO ASIGNADO").trim().toUpperCase(),
              api_cuota_inicial: extractNumber(getSafeVal(item, 'cuota_inicial')),
              api_initial_tipo: String(getSafeVal(item, 'initial_tipo') || ""),
              api_initial_pct: extractNumber(getSafeVal(item, 'initial_pct')),
              api_initial_valor: extractNumber(getSafeVal(item, 'initial_valor'))
          }));
          const lotesPermitidos = normalizedData.filter(l => !['CELINA 1', 'CELINA 2', 'PARAÍSO DEL NORTE'].includes(l.proyecto));
          
          setBaseDeDatosLotes(lotesPermitidos);
          setCargandoBD(false);
        } catch (error) { setCargandoBD(false); setUsarBD(false); }
      }
    };
    cargarDatos();
  }, [proyecto, isAuthenticated, usarAPI]); 

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    if (proyectosPorRegional[regional] && !proyectosPorRegional[regional].includes(proyecto)) {
      setProyecto(proyectosPorRegional[regional][0] || "OTRO");
    }
  }, [regional]);

  const handleUvChange = (e) => { setUv(e.target.value); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoria(""); };
  const handleMznChange = (e) => { setMzn(e.target.value); setLote(""); setSuperficie(""); setPrecio(""); setCategoria(""); };
  const handleLoteChange = (e) => { setLote(e.target.value); };
  
  const handleMapClickSelection = (uvTocado, mznTocada, loteTocado) => {
    if (uvTocado) setUv(uvTocado);
    if (mznTocada) setMzn(mznTocada);
    if (loteTocado) setLote(loteTocado);
  };

  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños(""); setCategoria("");
    setResultado(null); setProyectoPersonalizado(""); 
    setExpandedPlan(false);
  }, [proyecto, tipoCotizacion]);

  const getAlias = (p) => {
    if (!p) return [];
    const aliases = [p, `CELINA ${p}`];
    if (p === "URUBÓ NORTE") aliases.push("CELINA URUBO DEL NORTE", "URUBO NORTE");
    if (p === "ROSA RODALI") aliases.push("ROSA DE RODALI", "CELINA ROSA RODALI");
    if (p === "CELINA PAILÓN") aliases.push("CELINA PAILON", "PAILON");
    if (p === "EL ENCANTO FASE 2") aliases.push("EL ENCANTO 2", "EL ENCANTO FASE II", "EL ENCANTO FASE 2");
    if (p === "SANTA ROSA - FASE 1") aliases.push("SANTA ROSA FASE 1", "SANTA ROSA 1");
    if (p === "SANTA ROSA - FASE 2") aliases.push("SANTA ROSA FASE 2", "SANTA ROSA 2");
    if (p === "SANTA ROSA - FASE 3") aliases.push("SANTA ROSA FASE 3", "SANTA ROSA 3");
    if (p === "EL PORVENIR FASE 2") aliases.push("EL PORVENIR 2", "EL PORVENIR FASE II");
    if (p === "CELINA 3") aliases.push("CELINA III");
    if (p === "CELINA 4") aliases.push("CELINA IV");
    if (p === "CELINA 5") aliases.push("CELINA V");
    if (p === "CELINA X") aliases.push("CELINA 10", "CELINA X");
    if (p === "RANCHO NUEVO") aliases.push("CELINA - RANCHO NUEVO", "CELINA RANCHO NUEVO");
    if (p === "MUYURINA") aliases.push("CELINA MUYURINA");
    if (p === "SANTA FE") aliases.push("CELINA SANTA FE");
    if (p === "VILLA BELLA VIVIENDAS") aliases.push("VILLA BELLA");
    if (p === "CELINA 7 FASE 3") aliases.push("CELINA VII FASE 3");
    if (p === "CELINA VII FASE 1") aliases.push("CELINA 7 FASE 1");
    if (p === "CELINA VII FASE 2") aliases.push("CELINA 7 FASE 2");
    if (p === "CLARA CHUCHIO") aliases.push("CELINA CLARA CHUCHIO");
    return aliases;
  };

  const lotesDelProyecto = useMemo(() => {
    const currentAliases = getAlias(proyecto);
    return baseDeDatosLotes?.filter(l => 
      currentAliases.some(alias => l.proyecto === alias || l?.proyecto?.includes(alias)) || currentAliases.includes(l.proyecto)
    ) || [];
  }, [baseDeDatosLotes, proyecto]);
  
  const tieneBD = lotesDelProyecto.length > 0;
  const modoBD = usarBD && tieneBD;
  
  const lotesParaDropdown = lotesDelProyecto.filter(l => isAdmin || ["LIBRE", "DISPONIBLE", "BLOQUEADO", "RESERVADO", ""].includes(l.estado));
  const sortAlphaNum = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  const uvsDisponibles = [...new Set(lotesParaDropdown.map(l => l.uv))].sort(sortAlphaNum);
  const mznsDisponibles = [...new Set(lotesParaDropdown.filter(l => l.uv === uv).map(l => l.mzn))].sort(sortAlphaNum);
  const lotesDisponibles = lotesParaDropdown.filter(l => l.uv === uv && l.mzn === mzn).map(l => l.lote).sort(sortAlphaNum);

  useEffect(() => { if (modoBD && uv && !uvsDisponibles.includes(uv)) setUv(""); }, [modoBD, uvsDisponibles, uv]);
  useEffect(() => { if (modoBD && mzn && !mznsDisponibles.includes(mzn)) setMzn(""); }, [modoBD, mznsDisponibles, mzn]);
  useEffect(() => { if (modoBD && lote && !lotesDisponibles.includes(lote)) setLote(""); }, [modoBD, lotesDisponibles, lote]);

  useEffect(() => {
    if (modoBD && uv && mzn && lote) {
      const loteEncontrado = lotesDelProyecto.find(l => String(l.uv) === String(uv) && String(l.mzn) === String(mzn) && String(l.lote) === String(lote));
      if (loteEncontrado) {
        setSuperficie(loteEncontrado.superficie.toString());
        setPrecio(loteEncontrado.precio.toString()); 
        setCategoria(loteEncontrado.categoria || "ESTÁNDAR");
        const precioCalculado = loteEncontrado.superficie * loteEncontrado.precio;
        let iniCalculada = loteEncontrado.api_cuota_inicial || 0;
        
        if (loteEncontrado.api_initial_tipo === '2' && loteEncontrado.api_initial_pct > 0) {
            iniCalculada = Math.ceil((precioCalculado * loteEncontrado.api_initial_pct) / 100);
        } else if (loteEncontrado.api_initial_tipo === '1' && loteEncontrado.api_initial_valor > 0) {
            iniCalculada = Math.round(loteEncontrado.api_initial_valor);
        }
        if (iniCalculada === 0 && loteEncontrado.api_cuota_inicial > 0) iniCalculada = loteEncontrado.api_cuota_inicial;
        
        if (iniCalculada > 0) {
            setModoInicial("monto");
            setInicialMonto(iniCalculada.toString());
            setInicialPorcentaje("");
        } else {
            setModoInicial("porcentaje");
            setInicialPorcentaje("");
            setInicialMonto("");
        }
      }
    }
  }, [uv, mzn, lote, lotesDelProyecto]); 
  
  const formatMoney = (amount) => {
    if (isNaN(amount) || amount === undefined || amount === null) return "0.00";
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };
  
  const showNotification = (message) => { setToast(message); setTimeout(() => setToast(null), 4000); };

  // ============================================================================
  // MOTOR DE CÁLCULO REFACTORIZADO 
  // ============================================================================
  const calcular = () => {
    const sup = Number(superficie) || 0; 
    const prec = Number(precio) || 0; 
    const ans = tipoCotizacion === 'credito' ? (Number(años) || 0) : 0; 
    if (!sup || !prec) { setResultado(null); return; }
    if (tipoCotizacion === 'credito' && ans <= 0) { setResultado(null); return; }
    
    const valor_original = sup * prec;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;
    
    let valor_final = 0, ahorro_total = 0, cuota_inicial = 0, pct_efectivo = 0, pago_puro = 0, seguro = 0, cbdi = 0, cuota_final = 0;
    let planPagosDetallado = [];
    let planPlazosAlternativos = [];
    
    const TC_FLEX_NUMBER = Number(tcFlexible) || 12.32;
    
    let tcEfectivoAplicado = TC_FLEX_NUMBER;
    let descPctMapeo = 0;
    
    let totalBs_OpcionA = 0;
    let totalBs_OpcionB = 0;

    if (tipoCotizacion === 'contado') {
        if (plazoLiquidacion === '30') descPctMapeo = 0.30;
        else if (plazoLiquidacion === '60') descPctMapeo = 0.20;
        else if (plazoLiquidacion === '90') descPctMapeo = 0.10;

        ahorro_total = valor_original * descPctMapeo;
        valor_final = valor_original - ahorro_total;
        tcEfectivoAplicado = TC_FLEX_NUMBER * (1 - descPctMapeo);

        totalBs_OpcionA = valor_final * TC_FLEX_NUMBER;
        totalBs_OpcionB = valor_original * tcEfectivoAplicado;
        
    } else {
        const descM2Val = aplicarDescM2 ? (Number(descuentoM2) || 1) : 0;
        let monto_descuento_m2 = sup * descM2Val;
        
        ahorro_total = monto_descuento_m2; 
        valor_final = valor_original - ahorro_total; 
        const base_para_inicial = valor_final;

        if (modoInicial === 'porcentaje') {
           pct_efectivo = Number(inicialPorcentaje) || 0;
           cuota_inicial = base_para_inicial * (pct_efectivo / 100);
        } else {
           cuota_inicial = Number(inicialMonto) || 0;
           pct_efectivo = base_para_inicial > 0 ? (cuota_inicial / base_para_inicial) * 100 : 0;
        }

        const saldo = valor_final - cuota_inicial;
        const meses = ans * 12;
        const tasa_anual = 0.121733; const tasa = tasa_anual / 12;
        const refSaldo = 34278.00;
        const baseSeguro = { 1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38, 11: 27.67, 12: 29.00, 13: 30.36, 14: 31.75 };
        
        pago_puro = tasa === 0 ? saldo / meses : saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
        if(isNaN(pago_puro) || !isFinite(pago_puro)) pago_puro = 0;
        const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1.3) / refSaldo;
        seguro = saldo * factorSeguro;
        cuota_final = pago_puro + seguro + cbdi;

        const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        let mesInicioIndex = 9; 
        let añoInicio = 2026; 

        for(let m=1; m<=meses; m++) {
            let currentMIndex = (mesInicioIndex + (m - 1)) % 12;
            let currentY = añoInicio + Math.floor((mesInicioIndex + (m - 1)) / 12);
            planPagosDetallado.push({
                nro: m, 
                mesLabel: `${mesesNombres[currentMIndex]} ${currentY}`,
                cuotaUsd: cuota_final
            });
        }

        // MOTOR: PLAN DE PLAZOS ALTERNATIVOS (1 A 14 AÑOS)
        for (let i = 14; i >= 1; i--) {
          const m_i = i * 12;
          let pp_i = tasa === 0 ? saldo / m_i : saldo * (tasa * Math.pow(1 + tasa, m_i)) / (Math.pow(1 + tasa, m_i) - 1);
          if(isNaN(pp_i) || !isFinite(pp_i)) pp_i = 0;
          const fS_i = baseSeguro[i] ? (baseSeguro[i] / refSaldo) : (26.38 + (i - 10) * 1.3) / refSaldo;
          const c_final_i = pp_i + (saldo * fS_i) + cbdi;

          planPlazosAlternativos.push({
            año: i,
            cuotaUsd: formatMoney(c_final_i),
            cuotaBs: formatMoney(c_final_i * TC_FLEX_NUMBER),
            isCurrent: i === ans
          });
        }
    }
    
    const formatPct = (pct_efectivo % 1 === 0) ? pct_efectivo.toFixed(0) : pct_efectivo.toFixed(2);
    setResultado({
      tipoCotizacion, regional, proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, categoria,
      valorOriginalRaw: valor_original, 
      valorOriginal: formatMoney(valor_original), 
      valorFinal: formatMoney(valor_final), 
      valorFinalBs: formatMoney(valor_final * TC_FLEX_NUMBER), // NUEVO
      ahorroTotalRaw: ahorro_total, 
      ahorroTotal: formatMoney(ahorro_total),
      inicialRaw: cuota_inicial, 
      inicial: formatMoney(cuota_inicial), 
      inicialBs: formatMoney(cuota_inicial * TC_FLEX_NUMBER), // NUEVO
      inicialPct: formatPct,
      saldoRaw: tipoCotizacion === 'credito' ? valor_final - cuota_inicial : 0, 
      mensualRaw: cuota_final, 
      mensual: formatMoney(cuota_final), 
      mensualBs: formatMoney(cuota_final * TC_FLEX_NUMBER), // NUEVO
      plazo: ans, 
      planPagosDetallado: planPagosDetallado,
      planPlazosAlternativos: planPlazosAlternativos, // NUEVO
      descPctAplicado: descPctMapeo,
      tcOriginal: TC_FLEX_NUMBER,
      tcEfectivo: tcEfectivoAplicado,
      totalBsA: formatMoney(totalBs_OpcionA),
      totalBsB: formatMoney(totalBs_OpcionB),
      plazoLiquidacionVisual: plazoLiquidacion === '30' ? '30 Días' : plazoLiquidacion === '60' ? '60 Días' : '90 Días',
      descuentoM2Aplicado: tipoCotizacion === 'credito' && aplicarDescM2 ? descuentoM2 : 0,
      timestampId: new Date().getTime()
    });
    setCopiado(false); 
  };

  const handleProcesar = (e) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      try { calcular(); } catch(err) { showNotification("Error de ingesta de datos. Revisa la integridad del lote."); } 
      finally { 
        setIsCalculating(false); 
        if (resultadosRef.current) resultadosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
      }
    }, 500);
  };

  // ============================================================================
  // EXPORTACIÓN B2C PARA WHATSAPP
  // ============================================================================
  const getTextToCopy = () => {
    if (!resultado) return "";
    const saludo = "Estimado cliente, es un gusto saludarle. Le presento su propuesta oficial de inversión estructurada:\n\n";
    const ubicacion = `📍 *[Proyecto_${resultado.proyecto}]*\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)\n\n`;
    const precioLista = `💎 *Precio de Lista:* $us ${resultado.valorOriginal}\n\n`;
    
    let contentStr = "";
    if (resultado.tipoCotizacion === 'contado') {
        contentStr += `💰 *[LIQUIDACIÓN / AL CONTADO]*\n`;
        contentStr += `⏱️ *Plazo de Pago:* Hasta ${resultado.plazoLiquidacionVisual}\n`;
        contentStr += `🔥 *Descuento Aplicado:* ${(resultado.descPctAplicado * 100).toFixed(0)}%\n`;
        contentStr += `💵 *T.C. Efectivo Equivalente:* Bs. ${resultado.tcEfectivo.toFixed(3)}\n`;
        contentStr += `*Inversión Final:* $us ${resultado.valorFinal} (Equivalente a Bs. ${resultado.totalBsA})\n\n`;
    } else {
        contentStr += `✅ *[FINANCIAMIENTO_ESTRATÉGICO]*\n`;
        if (resultado.descuentoM2Aplicado > 0) contentStr += `🎁 *Bono Promocional:* Descuento de $us ${resultado.descuentoM2Aplicado} x m²\n`;
        contentStr += `*Valor del Terreno:* $us ${resultado.valorFinal} (Bs. ${resultado.valorFinalBs})\n\n`;
        contentStr += `📊 *Proyección a ${resultado.plazo} años*\n*Inversión Inicial:* ${resultado.inicialPct}% ($us ${resultado.inicial} | Bs. ${resultado.inicialBs})\n\n`;
        contentStr += `⏳ *Periodo de Gracia Activo:*\nAdquiriendo hoy, su primera cuota se programa para *Octubre*.\n*Cuota Fija Mensual:* $us ${resultado.mensual} (Bs. ${resultado.mensualBs})\n\n`;
    }
    return saludo + ubicacion + precioLista + contentStr + `¿Desea que agendemos una visita ejecutiva al proyecto? 🤝`;
  };

  const enviarWhatsApp = () => { 
    if (!resultado) return; 
    window.open(`https://wa.me/?text=${encodeURIComponent(getTextToCopy())}`, '_blank'); 
  };

  const copiarTexto = () => {
    if (!resultado) return;
    const mensaje = getTextToCopy();
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(mensaje).then(() => showNotification("¡Extracción de datos copiada al portapapeles!"));
    } else {
        let textArea = document.createElement("textarea"); 
        textArea.value = mensaje;
        textArea.style.position = "fixed"; 
        textArea.style.left = "-999999px"; 
        document.body.appendChild(textArea);
        textArea.focus(); 
        textArea.select();
        try { document.execCommand('copy'); showNotification("¡Extracción de datos copiada al portapapeles!"); } catch (error) {}
        textArea.remove();
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] relative font-['Plus_Jakarta_Sans'] text-slate-300 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200 pb-20 w-full max-w-[100vw]">
      
      {!isAuthenticated && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-[#0f172a]/90 backdrop-blur-3xl border border-cyan-500/20 p-8 sm:p-12 rounded-[2.5rem] w-full max-w-md relative shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col items-center text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(6,182,212,0.5)] relative">
               <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl animate-pulse"></div>
               <Lock className="w-10 h-10 text-[#020617] relative z-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Celina <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">Quantum</span></h1>
            <p className="text-cyan-500/80 text-xs uppercase tracking-[0.2em] font-black mb-8 border border-cyan-500/20 px-4 py-1 rounded-full">Motor Financiero V3.0</p>
            <form onSubmit={handleLogin} className="w-full space-y-6 relative z-10">
              <div className="relative">
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  placeholder="Credencial de Acceso" 
                  className={`w-full bg-[#060b13] border ${loginError ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-slate-700 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)]'} text-white text-center text-lg tracking-widest p-4 rounded-2xl outline-none transition-all shadow-inner`} 
                />
                {loginError && (<div className="absolute -bottom-6 left-0 right-0 text-rose-400 text-xs font-bold animate-in slide-in-from-top-1">Acceso denegado. Intenta de nuevo.</div>)}
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-[#020617] font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2 uppercase tracking-widest text-sm hover:-translate-y-1">
                <Unlock className="w-5 h-5"/> Desbloquear Sistema
              </button>
            </form>
            <div className="mt-12 pt-6 border-t border-slate-800/50 w-full relative z-10">
              <div className="text-slate-500 text-[9px] uppercase tracking-widest font-black">Desarrollado y Creado por</div>
              <div className="text-slate-300 font-bold tracking-widest mt-1">OSCAR SARAVIA ®</div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-cyan-950/90 text-cyan-50 px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(6,182,212,0.3)] flex items-center gap-3 font-bold text-sm tracking-wide animate-toast border border-cyan-500/50 backdrop-blur-md w-max">
           {toast.includes('🛡️') || toast.includes('⚠️') ? <AlertCircle className="w-5 h-5 text-amber-400" /> : <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
           {toast}
        </div>
      )}

      {/* EFECTO DE FONDO CYBERTECH */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.08] flex items-center justify-center mix-blend-screen animate-float no-print">
        <svg viewBox="0 0 1000 1000" className="w-full h-full max-w-[1600px] absolute right-[-20%] bottom-[-10%]">
          <g transform="translate(500, 400) scale(1.6)">
            {[...Array(15)]?.map((_, i) => <path key={`grid-v-${i}`} d={`M${-450 + i*60} ${225 + i*30} L${450 + i*60} ${-225 + i*30}`} stroke="rgba(34, 211, 238, 0.5)" strokeWidth="1" strokeDasharray="4 4" />)}
            {[...Array(15)]?.map((_, i) => <path key={`grid-h-${i}`} d={`M${-450 + i*60} ${-225 + i*30} L${450 + i*60} ${225 + i*30}`} stroke="rgba(34, 211, 238, 0.5)" strokeWidth="1" strokeDasharray="4 4" />)}
          </g>
        </svg>
      </div>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none no-print">
        <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-cyan-900/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45rem] h-[45rem] bg-emerald-900/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[55rem] h-[55rem] bg-indigo-900/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="hidden xl:flex fixed left-0 top-0 h-full w-20 items-center justify-center z-0 no-print">
        <div className="transform -rotate-90 whitespace-nowrap text-slate-800 font-black tracking-[0.5em] text-3xl select-none">CELINA QUANTUM</div>
      </div>

      <div className={`max-w-[1280px] mx-auto py-8 px-4 sm:px-6 lg:px-12 xl:pl-24 relative z-10 w-full min-w-0 transition-opacity duration-700 ${!isAuthenticated ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'}`}>
        
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 no-print w-full min-w-0">
          <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-center sm:justify-start">
             <button onClick={() => setIsAuthenticated(false)} className="bg-slate-900/50 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-colors p-2.5 rounded-xl shadow-inner flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shrink-0">
               <Lock className="w-4 h-4"/> Salir
             </button>
             {isAdmin && (
                <div className="bg-amber-500/10 border border-amber-500/50 text-amber-400 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
                  <Eye className="w-4 h-4" /> MODO DIRECTOR
                </div>
             )}
          </div>
          <div className="bg-[#090e17]/80 backdrop-blur-md border border-cyan-500/30 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shadow-[0_0_20px_rgba(6,182,212,0.15)] w-full sm:w-auto hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-shadow">
             <div className="flex items-center gap-2">
               <div className="bg-cyan-500/20 p-2 rounded-xl border border-cyan-500/30 shrink-0"><Activity className="w-5 h-5 text-cyan-400" /></div>
               <div>
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">TC Mercado</div>
                 <div className="text-xs font-bold text-white flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div> En Vivo</div>
               </div>
             </div>
             <div className="relative shrink-0 flex-1 sm:flex-none">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-bold text-sm">Bs.</span>
                <input 
                  type="number" step="0.01" value={tcFlexible} onChange={(e) => setTcFlexible(Number(e.target.value))} 
                  className="bg-[#04070b] border border-slate-700/80 text-cyan-400 font-black text-lg rounded-xl pl-10 pr-3 py-2 w-full sm:w-28 text-center outline-none focus:border-cyan-500 transition-all shadow-inner focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                />
             </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mb-8 sm:mb-12 gap-6 relative no-print min-w-0">
          <div className="hidden md:block w-32"></div>
          <div className="text-center flex-1 flex flex-col items-center max-w-full relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-cyan-500/20 blur-[80px] pointer-events-none z-0"></div>
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-slate-900/50 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-4 sm:mb-5 backdrop-blur-md relative z-10">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cyan-300 text-center">Plataforma Fintech de Alta Precisión</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg flex items-center justify-center flex-wrap gap-2 sm:gap-4 w-full relative z-10">
              Celina <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]">Quantum</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-3 sm:mt-4 font-semibold tracking-widest uppercase relative z-10">Motor Financiero V 3.0</p>
          </div>
          <div className="hidden md:block w-32"></div>
        </div>

        <div className="w-full mb-8 sm:mb-12 no-print relative z-20">
           <MapaEspacial 
             loteActivo={lote}
             proyectoActivo={proyecto}
             baseDeDatosLotes={baseDeDatosLotes}
             onLoteClick={handleMapClickSelection}
           />
        </div>

        <div ref={formRef} className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start w-full min-w-0">
          
          <div className="lg:col-span-5 glass-panel rounded-[2.5rem] overflow-hidden transition-all duration-500 flex flex-col no-print min-w-0 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700/50">
            <div className="bg-[#0d1420]/90 backdrop-blur-xl p-5 sm:p-6 flex items-center justify-between gap-3 relative overflow-hidden border-b border-slate-800 flex-wrap">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/30 shadow-[inset_0_0_15px_rgba(34,211,238,0.15)]">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-wide text-white drop-shadow-md">Datos de Inversión</h2>
              </div>
              
              <div className="relative z-10 flex items-center gap-2 bg-slate-950 p-1.5 rounded-full border border-slate-700 shadow-inner">
                <button 
                    onClick={() => setUsarAPI(false)} 
                    className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all duration-300 flex items-center gap-1 ${!usarAPI ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Database className="w-3 h-3" /> Excel Local
                </button>
                <button 
                    onClick={() => setUsarAPI(true)} 
                    className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all duration-300 flex items-center gap-1 ${usarAPI ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(5,150,105,0.5)]' : 'text-slate-500 hover:text-emerald-400'}`}
                >
                    <Server className="w-3 h-3" /> API Server
                </button>
              </div>
            </div>
            
            <div className="p-5 sm:p-8 flex-1 bg-[#090e17]/60 backdrop-blur-md">
              <form onSubmit={handleProcesar} className="space-y-5 sm:space-y-6">
                <div className="flex bg-[#04070b] p-1.5 rounded-2xl border border-slate-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] mb-6 relative overflow-hidden">
                  <button 
                    type="button" 
                    onClick={() => { setTipoCotizacion('credito'); }} 
                    className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${tipoCotizacion === 'credito' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'text-slate-500 hover:text-emerald-400'}`}
                  >
                    <CreditCard className="w-4 h-4"/> A Crédito
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setTipoCotizacion('contado'); }} 
                    className={`flex-1 py-3 text-xs sm:text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${tipoCotizacion === 'contado' ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'text-slate-500 hover:text-cyan-400'}`}
                  >
                    <Wallet className="w-4 h-4 shrink-0"/> Contado / Liquidación
                  </button>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapIcon className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`} /> Regional
                  </label>
                  <div className="relative">
                    <select 
                      value={regional} 
                      onChange={e => setRegional(e.target.value)} 
                      className={`w-full bg-[#060b13]/50 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]'}`}
                    >
                      {Object.keys(proyectosPorRegional)?.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2.5 relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`} /> Proyecto
                    </label>
                    {cargandoBD ? (
                      <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 flex items-center gap-1.5 border border-amber-500/30 px-3 py-1.5 rounded-full bg-amber-500/10 shrink-0">
                        <Loader2 className="w-3 h-3 animate-spin"/> Cargando BD...
                      </span>
                    ) : tieneBD ? (
                      <button 
                        type="button" 
                        onClick={() => setUsarBD(!usarBD)} 
                        className={`text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shrink-0 shadow-sm ${usarBD ? (tipoCotizacion === 'contado' ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-800/50 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-800/50 hover:shadow-[0_0_10px_rgba(52,211,153,0.2)]') : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50'}`}
                      >
                        {usarBD ? <Database className={`w-3 h-3 ${tipoCotizacion === 'contado' ? 'text-cyan-400' : 'text-emerald-400'}`}/> : <Edit2 className="w-3 h-3"/>} BÚSQUEDA INTELIGENTE
                      </button>
                    ) : null}
                  </div>
                  <div className="relative">
                    <select 
                      value={proyecto} 
                      onChange={e => setProyecto(e.target.value)} 
                      className={`w-full bg-[#060b13]/50 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]'}`}
                    >
                      {proyectosPorRegional[regional]?.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="OTRO">OTRO...</option>
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                  {proyecto === "OTRO" && (
                    <input 
                      type="text" 
                      value={proyectoPersonalizado} 
                      onChange={e => setProyectoPersonalizado(e.target.value)} 
                      className="w-full bg-[#060b13]/50 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 transition-all font-semibold mt-3 animate-pop focus:shadow-[0_0_15px_rgba(34,211,238,0.15)] focus:border-cyan-500" 
                      placeholder="Escribe el nombre del proyecto..." 
                    />
                  )}
                </div>

                <div className="pt-2 sm:pt-3">
                  <div className="bg-[#0b111a] border border-slate-700 rounded-[1.5rem] p-4 sm:p-5 flex flex-col gap-3 relative shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]'}`} />
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ubicación del Lote</span>
                      </div>
                      {!usarBD && tieneBD && (
                        <span className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase flex items-center gap-1 shrink-0">
                          <Edit2 className="w-3 h-3"/> Ingreso Manual
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`}>UV</label>
                        {modoBD ? (
                           <div className="relative group">
                             <select 
                               value={uv} 
                               onChange={handleUvChange} 
                               className={`w-full bg-[#060b13] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer transition-colors outline-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(52,211,153,0.15)]'}`}
                             >
                               <option value="" disabled hidden>Selec.</option>
                               {uvsDisponibles?.map(u => <option key={u} value={u}>{u}</option>)}
                             </select>
                             <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                               <ChevronDown className="w-3 h-3" />
                             </div>
                           </div>
                        ) : (
                          <input 
                            type="text" 
                            value={uv} 
                            onChange={handleUvChange} 
                            placeholder="Ej. 49" 
                            className={`w-full bg-[#060b13] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600 min-w-0 transition-colors outline-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(52,211,153,0.15)]'}`} 
                          />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`}>MZN</label>
                        {modoBD ? (
                           <div className="relative group">
                             <select 
                               value={mzn} 
                               onChange={handleMznChange} 
                               className={`w-full bg-[#060b13] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer transition-colors outline-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(52,211,153,0.15)]'}`}
                             >
                               <option value="" disabled hidden>Selec.</option>
                               {mznsDisponibles?.map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                             <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                               <ChevronDown className="w-3 h-3" />
                             </div>
                           </div>
                        ) : (
                          <input 
                            type="text" 
                            value={mzn} 
                            onChange={handleMznChange} 
                            placeholder="Ej. 6" 
                            className={`w-full bg-[#060b13] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600 min-w-0 transition-colors outline-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(52,211,153,0.15)]'}`} 
                          />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`}>LOTE</label>
                        {modoBD ? (
                           <div className="relative group">
                             <select 
                               value={lote} 
                               onChange={handleLoteChange} 
                               className={`w-full bg-[#060b13] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer transition-colors shadow-inner outline-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(52,211,153,0.15)]'}`}
                             >
                               <option value="" disabled hidden>Selec.</option>
                               {lotesDisponibles?.map(l => <option key={l} value={l}>{l}</option>)}
                             </select>
                             <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                               <ChevronDown className="w-3 h-3" />
                             </div>
                           </div>
                        ) : (
                          <input 
                            type="text" 
                            value={lote} 
                            onChange={handleLoteChange} 
                            placeholder="Ej. 9" 
                            className={`w-full bg-[#060b13] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600 min-w-0 transition-colors shadow-inner outline-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(52,211,153,0.15)]'}`} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 relative mt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutTemplate className={`w-3 h-3 shrink-0 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`} /> 
                      Categoría del Lote
                    </label>
                    <input 
                      type="text" 
                      value={categoria} 
                      onChange={e => setCategoria(e.target.value)} 
                      placeholder="Ej. LOTE S/CALLE ESQ. A" 
                      className={`w-full rounded-xl p-3.5 text-xs sm:text-sm font-semibold placeholder-slate-600 outline-none transition-colors ${modoBD ? (tipoCotizacion==='contado' ? 'bg-cyan-950/30 border border-cyan-500/40 text-cyan-100 shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-100 shadow-[inset_0_0_15px_rgba(52,211,153,0.1)] focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(52,211,153,0.2)]') : 'bg-[#060b13] border border-slate-700 text-white'}`} 
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-4">
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5">
                        <MapIcon className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`} /> 
                        Superficie <span className="text-slate-600 normal-case">(m²)</span>
                      </span>
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={superficie} 
                      onChange={e => setSuperficie(e.target.value)} 
                      placeholder="Ej. 240" 
                      className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 transition-all outline-none bg-[#060b13] border border-slate-700 shadow-inner ${tipoCotizacion === 'contado' ? 'text-cyan-400 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'text-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(52,211,153,0.15)]'}`} 
                    />
                  </div>
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-cyan-500' : 'text-emerald-500'}`} /> 
                        Precio <span className="text-slate-600 normal-case">/ m²</span>
                      </span>
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={precio} 
                      onChange={e => setPrecio(e.target.value)} 
                      placeholder="Ej. 145" 
                      className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 transition-all outline-none bg-[#060b13] border border-slate-700 shadow-inner ${tipoCotizacion === 'contado' ? 'text-cyan-400 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'text-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(52,211,153,0.15)]'}`} 
                    />
                  </div>
                </div>

                <div className={`bg-[#060b13]/50 border p-4 sm:p-5 rounded-[2rem] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] relative overflow-hidden group backdrop-blur-md mt-4 ${tipoCotizacion === 'contado' ? 'border-cyan-500/40 hover:border-cyan-500/60' : 'border-emerald-500/40 hover:border-emerald-500/60'} transition-colors`}>
                  <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl transition-colors ${tipoCotizacion === 'contado' ? 'bg-cyan-500/10 group-hover:bg-cyan-400/20' : 'bg-emerald-500/10 group-hover:bg-emerald-400/20'}`}></div>
                  <div className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 mb-4 ${tipoCotizacion === 'contado' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}>
                    <div className={`p-1.5 rounded-lg border shadow-sm shrink-0 ${tipoCotizacion === 'contado' ? 'bg-cyan-900/50 border-cyan-500/50' : 'bg-emerald-900/50 border-emerald-500/50'}`}>
                      <Gift className={`w-4 h-4 ${tipoCotizacion === 'contado' ? 'text-cyan-300' : 'text-emerald-300'}`} />
                    </div>
                    {tipoCotizacion === 'contado' ? 'Esquema de Descuento Promocional' : 'Descuentos Exclusivos (Crédito)'}
                  </div>
                  
                  <div className="relative z-10">
                    {tipoCotizacion === 'contado' && (
                      <div className="space-y-3">
                        <label className="text-[10px] sm:text-[11px] font-bold text-slate-300 w-max uppercase tracking-widest flex items-center gap-2">
                          <Timer className="w-4 h-4 text-cyan-400"/> Plazo de Pago o Liquidación
                        </label>
                        <div className="relative">
                          <select 
                            value={plazoLiquidacion} 
                            onChange={(e) => setPlazoLiquidacion(e.target.value)} 
                            className="w-full bg-[#060b13] border border-cyan-500/50 text-cyan-100 rounded-xl p-3.5 outline-none transition-all font-bold text-sm shadow-[0_0_15px_rgba(34,211,238,0.1)] appearance-none cursor-pointer focus:ring-1 focus:ring-cyan-500 focus:border-cyan-400" 
                          >
                            <option value="30">En los primeros 30 días (-30% | TC Ref: 8.62)</option>
                            <option value="60">Entre 31 y 60 días (-20% | TC Ref: 9.85)</option>
                            <option value="90">Entre 61 y 90 días (-10% | TC Ref: 11.08)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-500">
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    )}
                    {tipoCotizacion === 'credito' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors w-max">
                            <input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500 shrink-0" /> Crédito x m² ($us)
                          </label>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            disabled={!aplicarDescM2} 
                            value={descuentoM2} 
                            onChange={(e) => setDescuentoM2(Number(e.target.value))} 
                            className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescM2 ? 'bg-[#060b13] border border-emerald-500 text-white focus:ring-1 focus:ring-emerald-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {tipoCotizacion === 'credito' && (
                <div className="grid grid-cols-12 gap-4 sm:gap-5 mt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="col-span-12 md:col-span-8 bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 relative shadow-[inset_0_0_15px_rgba(52,211,153,0.1)]">
                    <div className="space-y-2">
                      <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${modoInicial === 'porcentaje' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Percent className="w-3.5 h-3.5 shrink-0" /> Inicial (%)
                      </label>
                      <input 
                        type="number" step="0.01" min="0" value={inicialPorcentaje} 
                        onFocus={() => setModoInicial('porcentaje')}
                        onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                        placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 5'} 
                        className={`w-full bg-[#060b13] border rounded-xl p-3 sm:p-3.5 outline-none transition-all font-bold text-sm sm:text-base placeholder-slate-600 shadow-inner ${modoInicial === 'porcentaje' ? 'border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.2)] text-white' : 'border-slate-700 text-slate-500'}`} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${modoInicial === 'monto' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <DollarSign className="w-3.5 h-3.5 shrink-0" /> Monto ($us)
                      </label>
                      <input 
                        type="number" step="0.01" min="0" value={inicialMonto} 
                        onFocus={() => setModoInicial('monto')}
                        onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} 
                        placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 500'} 
                        className={`w-full bg-[#060b13] border rounded-xl p-3 sm:p-3.5 outline-none transition-all font-black text-sm sm:text-base placeholder-slate-600 shadow-inner ${modoInicial === 'monto' ? 'border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.2)] text-amber-400' : 'border-slate-700 text-slate-500'}`} 
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-12 md:col-span-4 space-y-2 mt-2 md:mt-0">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-400 shrink-0" /> Plazo
                    </label>
                    <div className="relative h-[calc(100%-1.5rem)]">
                      <select 
                        required value={años} onChange={e => setAños(e.target.value)} 
                        className="w-full bg-[#060b13]/50 border border-slate-700 text-white rounded-2xl p-3.5 outline-none transition-all font-bold text-sm sm:text-base appearance-none pr-10 cursor-pointer h-full min-h-[50px] focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      >
                        <option value="" disabled hidden>Selec.</option>
                        {[...Array(14)]?.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500">
                        <ChevronRight className="w-5 h-5 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
                )}

                <button 
                  type="submit" disabled={isCalculating} 
                  className={`w-full mt-6 sm:mt-8 bg-gradient-to-r ${tipoCotizacion === 'contado' ? 'from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:via-blue-400 hover:to-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_45px_rgba(34,211,238,0.6)]' : 'from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.4)] hover:shadow-[0_0_45px_rgba(52,211,153,0.6)]'} text-[#020617] font-black py-4 sm:py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-widest text-sm sm:text-lg relative overflow-hidden group ${isCalculating ? 'opacity-80 scale-95' : 'hover:-translate-y-1'}`}
                >
                  <div className="absolute inset-0 bg-white/40 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                  <span className="relative z-10 flex items-center gap-2 sm:gap-3 drop-shadow-sm">
                    {isCalculating ? (
                      <><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin shrink-0 text-[#020617]" /> Renderizando...</>
                    ) : (
                      <>Procesar Inversión <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /></>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
          
          <div ref={resultadosRef} className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 scroll-mt-6 min-w-0 w-full">
            {!resultado || isCalculating ? (
              <div className="glass-panel rounded-[2.5rem] h-full min-h-[400px] sm:min-h-[600px] flex flex-col items-center justify-center text-slate-500 p-6 sm:p-10 text-center transition-all duration-500 border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#0d1420]/60 backdrop-blur-xl">
                <div className="relative">
                  <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${tipoCotizacion === 'contado' ? 'bg-cyan-500/30' : 'bg-emerald-500/30'}`}></div>
                  <div className={`bg-[#060b13] p-6 sm:p-8 rounded-full mb-6 sm:mb-8 shadow-[0_0_40px_rgba(6,182,212,0.3)] border relative z-10 ${tipoCotizacion === 'contado' ? 'border-cyan-500/50' : 'border-emerald-500/50'}`}>
                    {isCalculating ? <Loader2 className={`w-12 h-12 sm:w-16 sm:h-16 animate-spin ${tipoCotizacion === 'contado' ? 'text-cyan-400' : 'text-emerald-400'}`} /> : <Calculator className={`w-12 h-12 sm:w-16 sm:h-16 ${tipoCotizacion === 'contado' ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]'}`} />}
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 sm:mb-3 drop-shadow-md">
                  {isCalculating ? "Analizando Variables..." : "Motor Financiero"}
                </h3>
                <p className="text-sm sm:text-base max-w-md text-slate-400 font-medium leading-relaxed px-2">
                  {isCalculating ? "Calculando algoritmos y proyecciones en tiempo real." : "Completa los parámetros a la izquierda para generar una propuesta financiera de máxima precisión."}
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 animate-in fade-in slide-in-from-bottom-12 duration-700 ease-out relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-600/50 bg-[#0d1420]/95 backdrop-blur-2xl">
                <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none ${resultado.tipoCotizacion === 'contado' ? 'bg-cyan-500/15' : 'bg-emerald-500/15'}`}></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-slate-700 gap-4 relative z-10">
                  <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 tracking-tight drop-shadow-sm">
                    <div className={`p-2 rounded-xl text-[#060b13] shadow-[0_0_15px_rgba(255,255,255,0.2)] shrink-0 bg-gradient-to-br ${resultado.tipoCotizacion === 'contado' ? 'from-cyan-400 to-blue-500' : 'from-emerald-400 to-teal-500'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div> 
                    Resumen de Inversión
                  </h2>
                  <span className={`border text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 w-full sm:w-auto ${resultado.tipoCotizacion === 'contado' ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/50' : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${resultado.tipoCotizacion === 'contado' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]'}`}></span> 
                    {resultado.tipoCotizacion === 'contado' ? 'Liquidación / Contado' : 'A Crédito'}
                  </span>
                </div>
                
                <div className="relative z-10 space-y-6">
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#04070b]/80 p-4 rounded-2xl border border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-600 shrink-0 shadow-sm">
                          <MapPin className={`w-5 h-5 ${resultado.tipoCotizacion === 'contado' ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Proyecto</div>
                          <div className="text-white font-black text-lg uppercase leading-none truncate drop-shadow-sm">{resultado.proyecto}</div>
                          {resultado.categoria && resultado.categoria !== "ESTÁNDAR" && (
                            <div className="text-[8px] text-amber-400 font-bold mt-1 tracking-wider truncate bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20 w-max">{resultado.categoria}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 w-full sm:w-auto">
                        <div className="text-center px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700 flex-1 sm:flex-none shadow-inner">
                          <div className="text-[8px] font-extrabold text-slate-500 uppercase mb-1">UV</div>
                          <div className={`${resultado.tipoCotizacion === 'contado' ? 'text-cyan-400' : 'text-emerald-400'} font-black text-base leading-none truncate`}>{resultado.uv || '-'}</div>
                        </div>
                        <div className="text-center px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700 flex-1 sm:flex-none shadow-inner">
                          <div className="text-[8px] font-extrabold text-slate-500 uppercase mb-1">MZN</div>
                          <div className={`${resultado.tipoCotizacion === 'contado' ? 'text-cyan-400' : 'text-emerald-400'} font-black text-base leading-none truncate`}>{resultado.mzn || '-'}</div>
                        </div>
                        <div className={`text-center px-4 py-2 rounded-xl border flex-1 sm:flex-none shadow-[0_0_15px_rgba(0,0,0,0.5)] ${resultado.tipoCotizacion === 'contado' ? 'bg-cyan-950/60 border-cyan-500/50' : 'bg-emerald-950/60 border-emerald-500/50'}`}>
                          <div className={`text-[8px] font-extrabold uppercase mb-1 ${resultado.tipoCotizacion === 'contado' ? 'text-cyan-400' : 'text-emerald-400'}`}>LOTE</div>
                          <div className="text-white font-black text-base leading-none truncate">{resultado.lote || '-'}</div>
                        </div>
                      </div>
                  </div>

                  {/* BLOQUE AL CONTADO REDISEÑADO CON COMPARACIÓN CONMUTATIVA */}
                  {resultado.tipoCotizacion === 'contado' && (
                    <div className="animate-in zoom-in-95 duration-500 space-y-6">
                       <div className="relative overflow-hidden bg-gradient-to-br from-cyan-950 via-[#04070b] to-[#04070b] p-8 sm:p-12 rounded-[2rem] shadow-[0_0_50px_rgba(6,182,212,0.15)] border border-cyan-500/50 group text-center">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                          <div className="absolute -bottom-20 -right-20 opacity-10"><Wallet className="w-64 h-64 text-cyan-400" /></div>
                          <div className="relative z-10 flex flex-col items-center justify-center">
                             
                             <div className="inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)] mb-6">
                               <span className="text-cyan-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 <Timer className="w-4 h-4 text-cyan-400"/> Liquidación en {resultado.plazoLiquidacionVisual}
                               </span>
                             </div>

                             <div className="text-[3.5rem] sm:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] leading-none mb-3">
                               $us {resultado.valorFinal}
                             </div>
                             
                             {/* DEMOSTRADOR DE PROPIEDAD CONMUTATIVA */}
                             <div className="mt-8 w-full max-w-3xl">
                               <div className="flex items-center justify-center gap-3 text-cyan-400 text-xs font-black uppercase tracking-widest mb-4">
                                 <Scale className="w-4 h-4" /> Demostración de Equivalencia
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 
                                 {/* DEMO A: DESC. AL PRECIO */}
                                 <div className="bg-[#0b111a] border border-cyan-500/30 p-5 rounded-2xl relative shadow-[0_0_20px_rgba(6,182,212,0.1)] text-left hover:border-cyan-500/50 transition-colors">
                                   <div className="text-cyan-400 font-bold text-[10px] tracking-widest uppercase mb-4 text-center border-b border-cyan-500/20 pb-2">
                                     Opción A: Descuento al Precio
                                   </div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Precio Lista</span> <span className="font-bold text-slate-200">$us {resultado.valorOriginal}</span></div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Descuento ({(resultado.descPctAplicado * 100).toFixed(0)}%)</span> <span className="text-emerald-400 font-bold">-$us {resultado.ahorroTotal}</span></div>
                                   <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2 mb-1.5"><span className="text-slate-300 font-bold">Precio Final</span> <span className="font-black text-white">$us {resultado.valorFinal}</span></div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">T.C. Referencial</span> <span className="font-bold text-slate-200">x {resultado.tcOriginal}</span></div>
                                   <div className="flex justify-between text-lg border-t border-cyan-500/50 pt-2 mt-2 bg-cyan-950/20 -mx-5 -mb-5 px-5 pb-5 rounded-b-2xl">
                                     <span className="text-cyan-400 font-black mt-2">Total Bs.</span> 
                                     <span className="font-black text-cyan-300 mt-2">Bs. {resultado.totalBsA}</span>
                                   </div>
                                 </div>

                                 {/* DEMO B: DESC. AL TC */}
                                 <div className="bg-[#0b111a] border border-emerald-500/30 p-5 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.1)] text-left hover:border-emerald-500/50 transition-colors">
                                   <div className="text-emerald-400 font-bold text-[10px] tracking-widest uppercase mb-4 text-center border-b border-emerald-500/20 pb-2">
                                     Opción B: Descuento al T.C.
                                   </div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">T.C. Referencial</span> <span className="font-bold text-slate-200">{resultado.tcOriginal}</span></div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Descuento ({(resultado.descPctAplicado * 100).toFixed(0)}%)</span> <span className="text-emerald-400 font-bold">-{resultado.descPctAplicado * 100}%</span></div>
                                   <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2 mb-1.5"><span className="text-slate-300 font-bold">Nuevo T.C. (Hoy)</span> <span className="font-black text-white">{resultado.tcEfectivo.toFixed(3)}</span></div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Precio Lista</span> <span className="font-bold text-slate-200">x $us {resultado.valorOriginal}</span></div>
                                   <div className="flex justify-between text-lg border-t border-emerald-500/50 pt-2 mt-2 bg-emerald-950/20 -mx-5 -mb-5 px-5 pb-5 rounded-b-2xl">
                                     <span className="text-emerald-400 font-black mt-2">Total Bs.</span> 
                                     <span className="font-black text-emerald-300 mt-2">Bs. {resultado.totalBsB}</span>
                                   </div>
                                 </div>

                               </div>
                             </div>

                             <div className="mt-8 flex justify-between w-full max-w-xl mx-auto border-t border-cyan-500/30 pt-6">
                               <div className="text-center">
                                 <div className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Precio de Lista</div>
                                 <div className="text-slate-300 font-bold text-lg line-through decoration-rose-500/50 decoration-2">$us {resultado.valorOriginal}</div>
                               </div>
                               <div className="text-center">
                                 <div className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Superficie</div>
                                 <div className="text-white font-bold text-lg">{resultado.superficie} m²</div>
                               </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* BLOQUE A CRÉDITO REDISEÑADO CON Bs. */}
                  {resultado.tipoCotizacion === 'credito' && (
                    <div className="animate-in fade-in duration-500 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="bg-[#0b111a] p-5 rounded-2xl border border-slate-700 text-center sm:text-left relative shadow-lg">
                          <div className="text-emerald-500 text-[10px] font-extrabold uppercase tracking-widest">Inversión Total</div>
                          <div className="text-3xl font-black text-white mt-1">$us {resultado.valorFinal}</div>
                          <div className="text-[11px] font-bold text-emerald-500 mt-1 truncate">Bs. {resultado.valorFinalBs}</div>
                          {resultado.ahorroTotalRaw > 0 && (
                            <div className="mt-2 text-[9px] text-amber-400 font-bold bg-amber-950/60 px-2 py-1 rounded border border-amber-500/40 inline-block uppercase shadow-sm">
                              Bono Promocional Incluido: $us {resultado.ahorroTotal}
                            </div>
                          )}
                        </div>
                        <div className="bg-[#0b111a] p-5 rounded-2xl border border-slate-700 text-center sm:text-left relative shadow-lg">
                          <div className="text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest">Cuota Inicial ({resultado.inicialPct}%)</div>
                          <div className="text-3xl font-black text-white mt-1">$us {resultado.inicial}</div>
                          <div className="text-[11px] font-bold text-emerald-500 mt-1 truncate">Bs. {resultado.inicialBs}</div>
                        </div>
                      </div>

                      {/* ACORDEÓN DE PAGOS */}
                      <div className="mt-8 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(16,185,129,0.15)] bg-[#04070b] w-full">
                          <div className="p-5 border-b border-slate-800 flex flex-col justify-between items-start bg-gradient-to-r from-emerald-950/40 to-transparent">
                                <h3 className="text-white font-black text-lg flex items-center gap-2">
                                  <Calendar className="w-5 h-5 text-emerald-400"/> Proyección Financiera Estructural
                                </h3>
                                <p className="text-slate-400 text-xs mt-2">
                                  Periodo de gracia activado. Sus obligaciones inician en <strong className="text-emerald-400">Octubre 2026</strong>.
                                </p>
                          </div>
                          
                          <button onClick={() => setExpandedPlan(!expandedPlan)} className="w-full bg-[#0b111a] p-4 flex justify-between items-center hover:bg-slate-900 transition-colors border-b border-slate-800">
                             <span className="text-emerald-400 font-bold text-sm tracking-widest uppercase">Desplegar Cuadros de Cuota Fija ($us / Bs.)</span>
                             <ChevronDown className={`w-5 h-5 text-emerald-400 transition-transform duration-300 ${expandedPlan ? 'rotate-180' : ''}`} />
                          </button>

                          {expandedPlan && (
                            <div className="overflow-y-auto max-h-[350px] custom-scrollbar p-0 bg-[#060b13]">
                              <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="sticky top-0 bg-[#090e17] z-30 border-b border-slate-700">
                                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                                    <th className="p-4">Nro.</th>
                                    <th className="p-4">Mes de Pago</th>
                                    <th className="p-4 text-emerald-400">Cuota Fija ($us)</th>
                                  </tr>
                                </thead>
                                <tbody className="font-semibold relative z-10">
                                  {resultado.planPagosDetallado?.map((row, i) => (
                                    <tr key={i} className="border-b border-slate-800/50 text-center hover:bg-slate-800/60 transition-colors">
                                      <td className="p-4 text-slate-600 font-bold">{row.nro}</td>
                                      <td className="p-4 text-slate-300">{row.mesLabel}</td>
                                      <td className="p-4 font-black text-emerald-400 text-sm">$ {Number(row.cuotaUsd).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                      </div>

                      {/* MOTOR DE PLAZOS ALTERNATIVOS 1 A 14 AÑOS */}
                      <div className="mt-8 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-[#0b111a] w-full">
                        <div className="bg-[#060b13] p-4 border-b border-emerald-500/30 flex justify-between items-center">
                          <h3 className="text-slate-200 font-bold text-sm tracking-wide flex items-center gap-2 drop-shadow-sm">
                            <Activity className="w-4 h-4 text-emerald-500 shrink-0 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"/> Resumen de Plazos Alternativos
                          </h3>
                        </div>
                        <div className="p-3 sm:p-5 max-h-[350px] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 pb-3 border-b border-slate-800 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center sticky top-0 bg-[#0b111a] z-10">
                              <div>Plazo</div>
                              <div className="text-emerald-400">Cuota ($us)</div>
                              <div className="text-emerald-400">Cuota (Bs.)</div>
                            </div>
                            <div className="pt-2">
                              {resultado.planPlazosAlternativos?.map((plan, i) => (
                                <div key={i} className={`grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl text-center text-xs sm:text-sm font-bold transition-all duration-300 ${plan.isCurrent ? 'bg-emerald-950/80 border border-emerald-500/60 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02] transform my-2' : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'}`}>
                                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                    {plan.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block shrink-0 shadow-[0_0_8px_rgba(52,211,153,1)]"></span>} 
                                    <span className="truncate">{plan.año} {plan.año === 1 ? 'Año' : 'Años'}</span>
                                  </div>
                                  <div className={`font-black truncate ${plan.isCurrent ? 'text-white' : 'text-emerald-50'}`}>$ {plan.cuotaUsd}</div>
                                  <div className={`truncate ${plan.isCurrent ? 'text-emerald-400' : 'text-slate-400'}`}>Bs. {plan.cuotaBs}</div>
                                </div>
                              ))}
                            </div>
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={copiarTexto} 
                          className={`flex-1 bg-[#060b13] border font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-inner ${resultado.tipoCotizacion === 'contado' ? 'border-cyan-500/60 text-cyan-400 hover:bg-cyan-900/30' : 'border-emerald-500/60 text-emerald-400 hover:bg-emerald-900/30'}`}
                        >
                          {copiado ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />} {copiado ? 'COPIADO' : 'COPIAR TEXTO'}
                        </button>
                        <button 
                          onClick={enviarWhatsApp} 
                          className="flex-1 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#15873e] text-[#020617] font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:-translate-y-1 text-sm uppercase tracking-wider"
                        >
                          <Send className="w-5 h-5" /> WhatsApp
                        </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-20 sm:mt-32 pt-12 sm:pt-16 border-t border-slate-800/60 flex flex-col items-center justify-center text-center pb-12 sm:pb-16 no-print relative w-full">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          <div className="text-slate-500 text-[8px] sm:text-[10px] md:text-xs font-black tracking-[0.3em] sm:tracking-[0.5em] uppercase mb-6 sm:mb-8 px-4 drop-shadow-sm">
            Concepto, Arquitectura y Desarrollo Web
          </div>
          <div className="text-4xl sm:text-7xl md:text-[6rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-cyan-400 tracking-tighter mb-6 sm:mb-8 drop-shadow-[0_0_50px_rgba(34,211,238,0.4)] select-none w-full break-words px-4">
            OSCAR SARAVIA
          </div>
          <p className="text-slate-400 text-[8px] sm:text-[10px] md:text-xs max-w-3xl font-bold tracking-[0.1em] sm:tracking-[0.2em] leading-relaxed uppercase px-4">
            Esta plataforma de clase mundial fue inventada y programada de forma exclusiva para elevar el estándar de ventas y la experiencia del cliente.
          </p>
        </div>
      </div>
    </div>
  );
}
