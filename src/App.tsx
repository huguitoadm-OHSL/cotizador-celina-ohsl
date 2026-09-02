import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Calculator, Send, Map as MapIcon, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, Tag, 
  MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, ChevronDown, 
  Database, Edit2, LayoutTemplate, Loader2, AlertCircle, Scale, X, Printer, Activity, Wallet, CreditCard, Lock, Unlock,
  Maximize, Minimize, Eye, Crosshair, Server,
  TreePine, GraduationCap, Hospital, ShoppingBag, Landmark, ArrowRight, Info
} from "lucide-react";
import Map, { Source, Layer, GeolocateControl, NavigationControl, Marker } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  { id: 'pailon', nombre: 'Pailón', lat: -17.6597, lng: -62.7194 },
  { id: 'yapacani', nombre: 'Yapacaní', lat: -17.4047, lng: -63.8828 },
  { id: 'mineros', nombre: 'Mineros', lat: -17.1197, lng: -63.2325 },
  { id: 'saavedra', nombre: 'Gral. Saavedra', lat: -17.2289, lng: -63.2167 }
];

const baseAnclasUrbanas = {
  "MUYURINA": [
    { id: 'plaza-montero', nombre: 'Plaza Principal Montero', tipo: 'landmark', lat: -17.3392, lng: -63.2562 },
    { id: 'hospital', nombre: 'Hospital de Tercer Nivel', tipo: 'salud', lat: -17.3485, lng: -63.2620 },
    { id: 'colegio-muyurina', nombre: 'Colegio Muyurina', tipo: 'educacion', lat: -17.3620, lng: -63.2450 },
    { id: 'comercio-norte', nombre: 'Zona Comercial Norte', tipo: 'comercio', lat: -17.3550, lng: -63.2510 }
  ]
};

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
    if (map) {
      setTimeout(() => map.resize(), 50);
      setTimeout(() => map.resize(), 300);
    }
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
    return { 
      verdes: v.length > 0 ? v : ['__NONE__'], 
      rojos: r.length > 0 ? r : ['__NONE__'],
      azules: a.length > 0 ? a : ['__NONE__']
    };
  }, [baseDeDatosLotes, proyectoActivo]);

  const textProperty = ['coalesce', ['get', 'name'], ['get', 'Name'], ['get', 'Text'], ['get', 'text'], ['get', 'Lote'], ['get', 'lote'], ''];
  const fillLayer = useMemo(() => ({
    id: 'lotes-fill', type: 'fill', paint: { 
      'fill-color': ['match', ['to-string', textProperty], verdes, 'rgba(34, 197, 94, 0.35)', rojos, 'rgba(239, 68, 68, 0.35)', azules, 'rgba(59, 130, 246, 0.35)', 'transparent'],
      'fill-opacity': 1 
    }
  }), [verdes, rojos, azules]);
  
  const lineGlowLayer = useMemo(() => ({
    id: 'lotes-line-glow', type: 'line', paint: { 'line-color': '#00e5ff', 'line-width': 8, 'line-opacity': 0.35, 'line-blur': 4 }
  }), []);
  
  const lineLayer = useMemo(() => ({
    id: 'lotes-line', type: 'line', paint: { 'line-color': '#00e5ff', 'line-width': 1.5, 'line-opacity': 0.9 }
  }), []);
  
  const highlightLayer = useMemo(() => ({
    id: 'lotes-highlight', type: 'line', paint: { 'line-color': '#fbbf24', 'line-width': 5, 'line-opacity': 1 },
    filter: ['==', ['to-string', textProperty], String(parseInt(loteActivo, 10) || '')] 
  }), [loteActivo]);
  
  const pointLayer = useMemo(() => ({
    id: 'lotes-points', type: 'circle', minzoom: 16.2, paint: {
      'circle-radius': 9, 
      'circle-color': ['match', ['to-string', textProperty], verdes, '#22c55e', rojos, '#ef4444', azules, '#3b82f6', 'rgba(255, 255, 255, 0.25)'],
      'circle-stroke-width': 1.5, 'circle-stroke-color': '#020617' 
    },
    filter: ['all', ['==', ['geometry-type'], 'Point'], ['!=', ['to-string', textProperty], '']]
  }), [verdes, rojos, azules]);
  
  const labelLayer = useMemo(() => ({
    id: 'lotes-labels', type: 'symbol', minzoom: 16.2, layout: {
      'text-field': textProperty, 'text-size': 11, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], 
      'text-anchor': 'center', 'text-allow-overlap': true, 'text-ignore-placement': true
    },
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
             <button type="button" onClick={() => setIsFullscreen(true)} className="bg-[#020617] hover:bg-cyan-950 text-cyan-400 p-2.5 rounded-xl border border-cyan-500/40 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
               <Maximize className="w-5 h-5"/>
             </button>
           </div>
        </div>
      )}
      {isFullscreen && (
        <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 z-[10000] bg-slate-900/90 backdrop-blur-md text-cyan-400 p-3.5 rounded-2xl border border-cyan-500/50 hover:bg-slate-800 transition-all shadow-[0_0_30px_rgba(34,211,238,0.5)] group">
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
            ref={mapRef}
            mapLib={maplibregl}
            initialViewState={{ longitude: -63.2435, latitude: -17.3635, zoom: 14.3, pitch: 0 }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            maxZoom={20} 
            onLoad={() => setIsMapReady(true)}
            onClick={handleMapClick}
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
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "MAQUINADEVENTA") { setIsAuthenticated(true); setIsAdmin(false); setLoginError(false); } 
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
  const [tcFlexible, setTcFlexible] = useState(12.26); // PARAMETRIZACIÓN DETERMINISTA
  const TC_PROMOCIONAL = 6.97;
  
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState(""); 
  const [categoria, setCategoria] = useState("");
  
  const [plazoLiquidacion, setPlazoLiquidacion] = useState(30); // 30, 60, 90 DÍAS
  const [descuentoM2, setDescuentoM2] = useState(1);
  const [aplicarDescM2, setAplicarDescM2] = useState(true); // POR DEFECTO ACTIVO EN CRÉDITO

  const [modoInicial, setModoInicial] = useState("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  const [años, setAños] = useState("");
  
  const [resultado, setResultado] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [escenarioGuardado, setEscenarioGuardado] = useState(null);
  const [mostrarComparativa, setMostrarComparativa] = useState(false);
  const [toast, setToast] = useState(null);
  const formRef = useRef(null);
  const resultadosRef = useRef(null);

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
          const projAPI = dataProj.proyectos.find(p => p.proyecto.trim().toUpperCase().includes(proyecto.trim().toUpperCase()));
          if (projAPI && projAPI.project_id) {
            const resLotes = await fetch(`https://simulador.data-gc.net/api/lotes?project_id=${projAPI.project_id}`);
            if (!resLotes.ok) throw new Error("API Lotes Falló");
            const dataLotes = await resLotes.json();
            if (dataLotes.lotes) {
              const apiMapped = dataLotes.lotes.map(l => ({
                proyecto: proyecto, uv: l.uv ? String(l.uv).trim().toUpperCase() : "SN",
                mzn: l.manzano ? String(l.manzano).trim().toUpperCase() : "SN",
                lote: String(l.lote).trim().toUpperCase(),
                superficie: extractNumber(l.mt2 || l.superficie),
                precio: extractNumber(l.precio),
                estado: String(l.estado || "LIBRE").toUpperCase(),
                categoria: l.categoria ? String(l.categoria).toUpperCase() : "ESTÁNDAR"
              }));
              setBaseDeDatosLotes(apiMapped);
              setCargandoBD(false);
              return; 
            }
          }
          throw new Error("Proyecto no encontrado");
        } catch (error) { setUsarAPI(false); }
      } else {
        try {
          const response = await fetch('/lotes.json');
          let rawData = response.ok ? await response.json() : [];
          const normalizedData = rawData.map(item => ({
              proyecto: String(getSafeVal(item, 'proyecto') || "").trim().toUpperCase(),
              uv: String(getSafeVal(item, 'uv') || "").trim().toUpperCase() || "SN", 
              mzn: String(getSafeVal(item, 'mzn') || "").trim().toUpperCase(),
              lote: String(getSafeVal(item, 'lote') || "").trim().toUpperCase(),
              superficie: extractNumber(getSafeVal(item, 'superficie')),
              precio: extractNumber(getSafeVal(item, 'precio')),
              estado: String(getSafeVal(item, 'estado') || "LIBRE").trim().toUpperCase(),
              categoria: String(getSafeVal(item, 'categoria') || "ESTÁNDAR").trim().toUpperCase(),
          }));
          setBaseDeDatosLotes(normalizedData.filter(l => !['CELINA 1', 'CELINA 2'].includes(l.proyecto)));
          setCargandoBD(false);
        } catch (error) { setCargandoBD(false); setUsarBD(false); }
      }
    };
    cargarDatos();
  }, [proyecto, isAuthenticated, usarAPI]); 

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
    setResultado(null); setProyectoPersonalizado(""); setEscenarioGuardado(null); setMostrarComparativa(false);
  }, [proyecto, tipoCotizacion]);

  const lotesDelProyecto = useMemo(() => baseDeDatosLotes?.filter(l => l.proyecto.includes(proyecto)) || [], [baseDeDatosLotes, proyecto]);
  const tieneBD = lotesDelProyecto.length > 0;
  const modoBD = usarBD && tieneBD;
  const lotesParaDropdown = lotesDelProyecto.filter(l => isAdmin || ["LIBRE", "DISPONIBLE", "BLOQUEADO", "RESERVADO", ""].includes(l.estado));
  
  const sortAlphaNum = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  const uvsDisponibles = [...new Set(lotesParaDropdown.map(l => l.uv))].sort(sortAlphaNum);
  const mznsDisponibles = [...new Set(lotesParaDropdown.filter(l => l.uv === uv).map(l => l.mzn))].sort(sortAlphaNum);
  const lotesDisponibles = lotesParaDropdown.filter(l => l.uv === uv && l.mzn === mzn).map(l => l.lote).sort(sortAlphaNum);

  useEffect(() => {
    if (modoBD && uv && mzn && lote) {
      const loteEncontrado = lotesDelProyecto.find(l => String(l.uv) === String(uv) && String(l.mzn) === String(mzn) && String(l.lote) === String(lote));
      if (loteEncontrado) {
        setSuperficie(loteEncontrado.superficie.toString());
        setPrecio(loteEncontrado.precio.toString()); 
        setCategoria(loteEncontrado.categoria || "ESTÁNDAR");
      }
    }
  }, [uv, mzn, lote, lotesDelProyecto]); 

  const formatMoney = (amount) => isNaN(amount) ? "0.00" : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const showNotification = (message) => { setToast(message); setTimeout(() => setToast(null), 4000); };

  const calcular = () => {
    const sup = Number(superficie) || 0; 
    const prec = Number(precio) || 0; 
    const ans = tipoCotizacion === 'credito' ? (Number(años) || 0) : 0; 
    if (!sup || !prec) { setResultado(null); return; }
    if (tipoCotizacion === 'credito' && ans <= 0) { setResultado(null); return; }
    
    const valor_original = sup * prec;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;
    const TC_FLEX_NUMBER = Number(tcFlexible) || 12.26;
    
    let valor_final = 0, cuota_inicial = 0, pct_efectivo = 0, pago_puro = 0, seguro = 0, cbdi = 0, cuota_final = 0;
    let descContadoPct = 0, montoBsOpcionA = 0, montoBsOpcionB = 0;
    let proyeccionTC = [];

    if (tipoCotizacion === 'contado') {
        descContadoPct = plazoLiquidacion === 30 ? 0.30 : plazoLiquidacion === 60 ? 0.20 : 0.10;
        valor_final = valor_original * (1 - descContadoPct);
        
        // CÁLCULO DE SIMETRÍA MATEMÁTICA
        montoBsOpcionA = valor_final * TC_FLEX_NUMBER; 
        const tcDescontado = TC_FLEX_NUMBER * (1 - descContadoPct);
        montoBsOpcionB = valor_original * tcDescontado;
    } else {
        const descM2Val = aplicarDescM2 ? (Number(descuentoM2) || 0) : 0;
        valor_final = valor_original - (sup * descM2Val);
        
        if (modoInicial === 'porcentaje') {
           pct_efectivo = Number(inicialPorcentaje) || 0;
           cuota_inicial = valor_final * (pct_efectivo / 100);
        } else {
           cuota_inicial = Number(inicialMonto) || 0;
           pct_efectivo = valor_final > 0 ? (cuota_inicial / valor_final) * 100 : 0;
        }
        const saldo = valor_final - cuota_inicial;
        const meses = ans * 12;
        const tasa = 0.121733 / 12;
        const refSaldo = 34278.00;
        const baseSeguro = { 1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38, 11: 27.67, 12: 29.00, 13: 30.36, 14: 31.75 };
        
        pago_puro = saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
        if(isNaN(pago_puro) || !isFinite(pago_puro)) pago_puro = 0;
        const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1.3) / refSaldo;
        seguro = saldo * factorSeguro;
        cuota_final = pago_puro + seguro + cbdi;

        // PROYECCIÓN INFLACIONARIA 6 MESES
        let currentTC = TC_FLEX_NUMBER;
        for(let m=1; m<=6; m++) {
            proyeccionTC.push({
                mes: m,
                tc: currentTC.toFixed(2),
                cuotaBs: (cuota_final * currentTC).toFixed(2),
                incremento: ((cuota_final * currentTC) - (cuota_final * TC_FLEX_NUMBER)).toFixed(2)
            });
            currentTC += 1.19; // FACTOR INFLACIONARIO PREDICTIVO
        }
    }

    setResultado({
      tipoCotizacion, regional, proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, categoria,
      valorOriginal: formatMoney(valor_original),
      valorFinal: formatMoney(valor_final),
      plazoLiquidacion, descContadoPct, montoBsOpcionA, montoBsOpcionB,
      inicial: formatMoney(cuota_inicial), 
      inicialBs: formatMoney(cuota_inicial * TC_FLEX_NUMBER), 
      inicialPct: (pct_efectivo % 1 === 0) ? pct_efectivo.toFixed(0) : pct_efectivo.toFixed(2),
      mensual: formatMoney(cuota_final), 
      mensualBs: formatMoney(cuota_final * TC_FLEX_NUMBER), 
      plazo: ans, proyeccionTC,
      timestampId: new Date().getTime()
    });
    setCopiado(false); 
  };

  const getTextToCopy = () => {
    if (!resultado) return "";
    return `🔹 *PROPUESTA DE INVERSIÓN CELINA* 🔹

👤 Cliente: [Nombre_Cliente]
📍 Proyecto: [Proyecto_Nombre] | UV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | LOTE ${resultado.lote || '-'}
📐 Superficie: ${resultado.superficie} m²
💎 Valor de Lista: $us ${resultado.valorOriginal}

${resultado.tipoCotizacion === 'contado' ? 
`💰 *LIQUIDACIÓN A ${resultado.plazoLiquidacion} DÍAS*
▪️ Descuento Estructural: ${resultado.descContadoPct * 100}%
▪️ Inversión Final: $us ${resultado.valorFinal}
▪️ Equivalente: Bs. ${formatMoney(resultado.montoBsOpcionA)}
▪️ [Proyeccion_Plusvalia] asegurada al liquidar con precisión.`
:
`✅ *CRÉDITO DIRECTO A ${resultado.plazo} AÑOS*
▪️ Bono Promocional: $1/m² aplicado.
▪️ Cuota Inicial: $us ${resultado.inicial} ([Monto_Cuota] equivalente en Bs)
▪️ Mensualidad Fija: $us ${resultado.mensual}
▪️ ⚠️ Alerta Predictiva: Tasa de crecimiento cambiario detectada a 1.19 Bs/mes. ¡Asegure su contrato hoy!
▪️ [Tasa_Aprobacion] garantizada a sola firma sin burocracia.`}

📲 ¿Procedemos con la asignación en sistema, [Nombre_Cliente]?`;
  };

  const enviarWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(getTextToCopy())}`, '_blank'); };
  const copiarTexto = () => {
    const mensaje = getTextToCopy();
    if (navigator.clipboard) navigator.clipboard.writeText(mensaje).then(() => showNotification("¡Formato B2C Copiado!"));
  };

  const handleProcesar = (e) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      try { calcular(); } catch(err) { showNotification("Error de sintaxis matricial."); } 
      finally { setIsCalculating(false); if (resultadosRef.current) resultadosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#020617] relative font-['Plus_Jakarta_Sans'] text-slate-300 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200 pb-20 w-full max-w-[100vw]">
      
      {!isAuthenticated && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-[#0f172a]/90 backdrop-blur-3xl border border-cyan-500/20 p-8 sm:p-12 rounded-[2.5rem] w-full max-w-md relative shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-full flex items-center justify-center mb-8 relative">
               <Lock className="w-10 h-10 text-[#020617] relative z-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Celina <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Quantum</span></h1>
            <p className="text-cyan-500/80 text-xs uppercase tracking-[0.2em] font-black mb-8 border border-cyan-500/20 px-4 py-1 rounded-full">Motor Financiero V3.0</p>
            <form onSubmit={handleLogin} className="w-full space-y-6">
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Credencial de Acceso" className="w-full bg-[#060b13] border border-slate-700 text-white text-center text-lg tracking-widest p-4 rounded-2xl outline-none focus:border-cyan-500" />
              <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 text-[#020617] font-black py-4 rounded-2xl uppercase tracking-widest text-sm"><Unlock className="w-5 h-5 inline mr-2"/> Desbloquear</button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-cyan-950/90 text-cyan-50 px-6 py-3 rounded-full border border-cyan-500/50 flex items-center gap-3 font-bold text-sm">
           <CheckCircle2 className="w-5 h-5 text-cyan-400" /> {toast}
        </div>
      )}

      <div className={`max-w-[1280px] mx-auto py-8 px-4 sm:px-6 relative z-10 w-full transition-opacity duration-700 ${!isAuthenticated ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex justify-between items-center mb-6">
           <button onClick={() => setIsAuthenticated(false)} className="bg-slate-900/50 text-slate-400 p-2.5 rounded-xl border border-slate-800 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Lock className="w-4 h-4"/> Salir</button>
           <div className="bg-[#090e17]/80 border border-cyan-500/30 p-2.5 rounded-2xl flex items-center gap-4">
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TC Oficial</div>
             <input type="number" step="0.01" value={tcFlexible} onChange={(e) => setTcFlexible(Number(e.target.value))} className="bg-[#04070b] border border-slate-700/80 text-cyan-400 font-black text-lg rounded-xl text-center w-28 py-2 outline-none focus:border-cyan-500" />
           </div>
        </div>

        <div className="w-full mb-12 relative z-20">
           <MapaEspacial loteActivo={lote} proyectoActivo={proyecto} baseDeDatosLotes={baseDeDatosLotes} onLoteClick={handleMapClickSelection} />
        </div>

        <div ref={formRef} className="grid lg:grid-cols-12 gap-10 items-start w-full">
          <div className="lg:col-span-5 bg-[#0d1420]/90 rounded-[2.5rem] p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700/50">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><FileText className="text-cyan-400"/> Datos de Inversión</h2>
            <form onSubmit={handleProcesar} className="space-y-6">
              <div className="flex bg-[#04070b] p-1.5 rounded-2xl border border-slate-800">
                <button type="button" onClick={() => setTipoCotizacion('credito')} className={`flex-1 py-3 text-sm font-black uppercase rounded-xl ${tipoCotizacion === 'credito' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-900' : 'text-slate-500'}`}><CreditCard className="w-4 h-4 inline mr-2"/> A Crédito</button>
                <button type="button" onClick={() => setTipoCotizacion('contado')} className={`flex-1 py-3 text-sm font-black uppercase rounded-xl ${tipoCotizacion === 'contado' ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900' : 'text-slate-500'}`}><Wallet className="w-4 h-4 inline mr-2"/> Al Contado</button>
              </div>

              <div className="space-y-4">
                <select value={regional} onChange={e => setRegional(e.target.value)} className="w-full bg-[#060b13] border border-slate-700 rounded-xl p-4 font-bold text-lg text-white outline-none">
                  {Object.keys(proyectosPorRegional).map(reg => <option key={reg} value={reg}>{reg}</option>)}
                </select>
                <select value={proyecto} onChange={e => setProyecto(e.target.value)} className="w-full bg-[#060b13] border border-slate-700 rounded-xl p-4 font-bold text-lg text-white outline-none">
                  {proyectosPorRegional[regional]?.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="OTRO">OTRO...</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-[#0b111a] p-4 rounded-[1.5rem] border border-slate-700">
                <input type="text" value={uv} onChange={handleUvChange} placeholder="UV" className="bg-[#060b13] border border-slate-700 rounded-xl p-3 text-center text-sm font-bold text-white outline-none" />
                <input type="text" value={mzn} onChange={handleMznChange} placeholder="MZN" className="bg-[#060b13] border border-slate-700 rounded-xl p-3 text-center text-sm font-bold text-white outline-none" />
                <input type="text" value={lote} onChange={handleLoteChange} placeholder="LOTE" className="bg-[#060b13] border border-slate-700 rounded-xl p-3 text-center text-sm font-bold text-white outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="Superficie m²" className="bg-[#060b13] border border-slate-700 rounded-2xl p-4 font-extrabold text-xl text-white outline-none" />
                <input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Precio / m²" className="bg-[#060b13] border border-slate-700 rounded-2xl p-4 font-extrabold text-xl text-white outline-none" />
              </div>

              {tipoCotizacion === 'contado' && (
                <div className="bg-[#0b111a] p-4 rounded-xl border border-cyan-500/40">
                  <label className="text-cyan-400 text-xs font-bold uppercase block mb-3"><Gift className="inline w-4 h-4 mr-1"/> Esquema de Liquidación Rápida</label>
                  <select value={plazoLiquidacion} onChange={e => setPlazoLiquidacion(Number(e.target.value))} className="w-full bg-[#060b13] border border-cyan-500/30 text-white p-3 rounded-lg font-bold outline-none">
                    <option value={30}>Liquidación a 30 Días (30% DESC.)</option>
                    <option value={60}>Liquidación a 60 Días (20% DESC.)</option>
                    <option value={90}>Liquidación a 90 Días (10% DESC.)</option>
                  </select>
                </div>
              )}

              {tipoCotizacion === 'credito' && (
                <div className="bg-[#0b111a] p-4 rounded-xl border border-emerald-500/40 space-y-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer"><input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="accent-emerald-500 w-4 h-4" /> Descuento Directo: $1/m²</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Inicial %" value={inicialPorcentaje} onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} className="bg-[#060b13] border border-slate-700 rounded-xl p-3 font-bold text-white outline-none" />
                    <input type="number" placeholder="Inicial USD" value={inicialMonto} onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} className="bg-[#060b13] border border-slate-700 rounded-xl p-3 font-bold text-white outline-none" />
                  </div>
                  <select required value={años} onChange={e => setAños(e.target.value)} className="w-full bg-[#060b13] border border-slate-700 rounded-xl p-3 font-bold text-white outline-none">
                    <option value="" hidden>Plazo (Años)</option>
                    {[...Array(14)]?.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} Años</option>)}
                  </select>
                </div>
              )}

              <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 font-black py-4 rounded-2xl uppercase tracking-widest flex justify-center items-center gap-2">
                {isCalculating ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Procesar Motor <TrendingUp className="w-6 h-6"/></>}
              </button>
            </form>
          </div>

          <div ref={resultadosRef} className="lg:col-span-7">
            {resultado && !isCalculating && (
              <div className="bg-[#0d1420]/95 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-600/50">
                
                {resultado.tipoCotizacion === 'contado' ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-cyan-950 to-[#04070b] p-8 rounded-[2rem] border border-cyan-500/50 text-center relative overflow-hidden">
                       <Tag className="w-32 h-32 absolute -right-10 -bottom-10 text-cyan-500/10"/>
                       <div className="text-cyan-300 text-xs font-black uppercase tracking-widest mb-2">Liquidación a {resultado.plazoLiquidacion} Días</div>
                       <div className="text-6xl font-black text-white">$ {resultado.valorFinal}</div>
                       <div className="text-2xl text-cyan-400 font-bold mt-2">Bs. {formatMoney(resultado.montoBsOpcionA)}</div>
                    </div>
                    
                    <div className="bg-[#0b111a] border border-slate-700 rounded-2xl p-6 relative">
                       <h3 className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2 mb-4"><Scale className="text-amber-400 w-5 h-5"/> Simetría Matemática y Transparencia</h3>
                       <div className="grid grid-cols-2 gap-6 text-center">
                         <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                           <div className="text-[10px] text-cyan-400 uppercase font-black mb-2">Aplicando Desc. al Precio (USD)</div>
                           <div className="text-slate-400 text-xs">$ {resultado.valorOriginal} - {resultado.descContadoPct*100}% = $ {resultado.valorFinal}</div>
                           <div className="text-lg text-white font-bold mt-2">Bs. {formatMoney(resultado.montoBsOpcionA)}</div>
                         </div>
                         <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                           <div className="text-[10px] text-cyan-400 uppercase font-black mb-2">Aplicando Desc. al Tipo de Cambio</div>
                           <div className="text-slate-400 text-xs">TC Oficial {tcFlexible} - {resultado.descContadoPct*100}% = TC {Number(tcFlexible * (1 - resultado.descContadoPct)).toFixed(2)}</div>
                           <div className="text-lg text-white font-bold mt-2">Bs. {formatMoney(resultado.montoBsOpcionB)}</div>
                         </div>
                       </div>
                       <div className="mt-4 text-center text-[10px] text-emerald-400 font-bold bg-emerald-900/30 p-2 rounded-lg border border-emerald-500/30 flex justify-center items-center gap-2">
                         <CheckCircle2 className="w-4 h-4"/> El monto final en Bolivianos es exactamente el mismo en ambas operativas.
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0b111a] p-5 rounded-2xl border border-slate-700 text-center"><div className="text-emerald-500 text-[10px] font-extrabold uppercase">Total Financiar</div><div className="text-2xl font-black text-white">$ {resultado.valorFinal}</div></div>
                      <div className="bg-[#0b111a] p-5 rounded-2xl border border-slate-700 text-center"><div className="text-emerald-400 text-[10px] font-extrabold uppercase">Cuota Inicial ({resultado.inicialPct}%)</div><div className="text-2xl font-black text-white">$ {resultado.inicial}</div></div>
                    </div>

                    <div className="bg-[#04070b] border border-emerald-500/40 rounded-2xl p-6">
                      <h3 className="text-white font-bold flex items-center gap-2 mb-4"><TrendingUp className="text-amber-400"/> Riesgo Cambiario y Costo de Postergación</h3>
                      <table className="w-full text-center text-sm">
                        <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase"><tr><th className="p-2">Mes</th><th className="p-2">TC Proyectado</th><th className="p-2">Mensualidad Fija USD</th><th className="p-2 text-rose-400">Cuota Real Bs</th><th className="p-2 text-rose-500">Pérdida por Inflación</th></tr></thead>
                        <tbody>
                          {resultado.proyeccionTC.map((p, i) => (
                            <tr key={i} className="border-b border-slate-800 text-slate-300">
                              <td className="p-3 font-bold">Mes {p.mes}</td>
                              <td className="p-3">{p.tc}</td>
                              <td className="p-3">$ {resultado.mensual}</td>
                              <td className="p-3 font-bold text-white">Bs. {p.cuotaBs}</td>
                              <td className="p-3 text-rose-400">+ Bs. {p.incremento}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex gap-4">
                  <button onClick={copiarTexto} className="flex-1 bg-slate-900 border border-cyan-500/50 text-cyan-400 font-bold py-4 rounded-xl flex justify-center items-center gap-2 uppercase text-xs hover:bg-cyan-900/50">
                    <FileText className="w-5 h-5"/> Generar Plantilla B2C
                  </button>
                  <button onClick={enviarWhatsApp} className="flex-1 bg-[#25D366] text-[#020617] font-black py-4 rounded-xl flex justify-center items-center gap-2 uppercase text-xs hover:bg-[#1DA851]">
                    <Send className="w-5 h-5"/> Enviar WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
