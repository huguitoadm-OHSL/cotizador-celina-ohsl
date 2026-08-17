import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Calculator, Send, Map as MapIcon, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, Tag, 
  MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, ChevronDown, 
  Database, Edit2, LayoutTemplate, Loader2, AlertCircle, Scale, X, Printer, Activity, Wallet, CreditCard, Lock, Unlock,
  Maximize, Minimize, Eye, Crosshair, Server
} from "lucide-react";
import Map, { Source, Layer, GeolocateControl, NavigationControl } from 'react-map-gl';
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
    "CELINA VII FASE 1", "CELINA VII FASE 2", "PRADERAS DEL NORTE"
  ]
};

// ============================================================================
// COMPONENTE: NAVEGADOR ESPACIAL WEBGIS (VERSIÓN ESTABLE Y ELEGANTE)
// ============================================================================
const MapaEspacial = ({ loteActivo, proyectoActivo }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false); 
  const [geoData, setGeoData] = useState(null);
  const mapRef = useRef(null);
  
  const geojsonPath = `/${proyectoActivo.toLowerCase().replace(/\s+/g, '_')}.geojson`;

  useEffect(() => {
    setIsMapReady(false);
    fetch(geojsonPath)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return setIsMapReady(true);
        
        const cleanFeatures = data.features.map(f => {
            const p = f.properties || {};
            const nombreRaw = p.LOTE || p.lote || p.Lote || p.TextString || p.Text || p.text || p.name || p.Name || "";
            const numLote = parseInt(String(nombreRaw).replace(/[^0-9]/g, ''), 10);
            let q_lote = isNaN(numLote) ? "" : String(numLote);
            
            if (q_lote.length > 4) {
                q_lote = "";
            }

            return {
                ...f,
                properties: {
                    ...p,
                    q_lote: q_lote
                }
            };
        });
        
        const dataLimpia = { type: "FeatureCollection", features: cleanFeatures };
        setGeoData(dataLimpia);

        if (dataLimpia.features[0] && mapRef.current) {
            let coords = dataLimpia.features[0].geometry.coordinates;
            while (Array.isArray(coords[0])) coords = coords[0];
            mapRef.current.getMap().flyTo({ center: [coords[0], coords[1]], zoom: 14.5, speed: 1.5, essential: true });
        }
        setTimeout(() => setIsMapReady(true), 600);
      })
      .catch(() => setIsMapReady(true));
  }, [geojsonPath]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      setTimeout(() => map.resize(), 50);
      setTimeout(() => map.resize(), 300);
    }
  }, [isFullscreen]);

  const fillLayer = useMemo(() => ({
    id: 'lotes-fill',
    type: 'fill',
    paint: {
      'fill-color': 'rgba(6, 182, 212, 0.15)', 
      'fill-opacity': 1
    },
    filter: ['!=', ['geometry-type'], 'Point'] 
  }), []);

  const lineLayer = useMemo(() => ({
    id: 'lotes-line',
    type: 'line',
    paint: { 'line-color': '#22d3ee', 'line-width': 1.5, 'line-opacity': 0.8 },
    filter: ['!=', ['geometry-type'], 'Point'] 
  }), []);

  const highlightLayer = useMemo(() => ({
    id: 'lotes-highlight-fill',
    type: 'fill',
    paint: { 'fill-color': '#fbbf24', 'fill-opacity': 0.6 },
    filter: ['==', ['get', 'q_lote'], String(parseInt(loteActivo, 10) || '')] 
  }), [loteActivo]);

  const highlightLineLayer = useMemo(() => ({
    id: 'lotes-highlight-line',
    type: 'line',
    paint: { 'line-color': '#fbbf24', 'line-width': 3, 'line-opacity': 1 },
    filter: ['==', ['get', 'q_lote'], String(parseInt(loteActivo, 10) || '')] 
  }), [loteActivo]);

  const labelLayer = useMemo(() => ({
    id: 'lotes-labels',
    type: 'symbol',
    minzoom: 16.5, 
    layout: {
      'text-field': ['get', 'q_lote'],
      'text-size': 12.5,
      'text-anchor': 'center',
      'text-allow-overlap': false 
    },
    paint: {
      'text-color': '#ffffff', 
      'text-halo-color': '#000000',
      'text-halo-width': 1.5 
    },
    filter: ['all', ['!=', ['geometry-type'], 'Point'], ['!=', ['get', 'q_lote'], '']]
  }), []);

  const containerClasses = isFullscreen 
    ? "fixed top-0 left-0 right-0 bottom-0 z-[99999] bg-[#020617] w-full h-[100dvh] flex flex-col m-0 p-0 rounded-none animate-in fade-in duration-300" 
    : "relative w-full h-[450px] sm:h-[500px] rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.2)] border border-cyan-500/40 bg-[#060b13] transition-all duration-500";

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
                 Plataforma renderizada establemente.
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
               type="button"
               onClick={() => setIsFullscreen(true)} 
               className="bg-[#020617] hover:bg-cyan-950 text-cyan-400 p-2.5 rounded-xl border border-cyan-500/40 hover:border-cyan-400 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.2)]"
               title="Pantalla Completa"
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
            ref={mapRef}
            mapLib={maplibregl}
            initialViewState={{ longitude: -63.2435, latitude: -17.3635, zoom: 14.3, pitch: 0 }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            maxZoom={20} 
            style={{ width: '100%', height: '100%' }}
          >
            <GeolocateControl position="bottom-right" trackUserLocation={true} showUserHeading={true} />
            <NavigationControl position="bottom-right" visualizePitch={true} />
            
            <Source id="satellite-source" type="raster" tiles={['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']} tileSize={256} maxzoom={17}>
              <Layer id="satellite-layer" type="raster" paint={{ 'raster-opacity': 0.85 }} />
            </Source>

            {geoData && (
              <Source id="dynamic-data" type="geojson" data={geoData}>
                <Layer {...fillLayer as any} />
                <Layer {...lineLayer as any} />
                <Layer {...highlightLayer as any} />
                <Layer {...highlightLineLayer as any} />
                <Layer {...labelLayer as any} />
              </Source>
            )}
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
    if (passwordInput === "DIOSESMIGUIA") { 
      setIsAuthenticated(true); setIsAdmin(false); setLoginError(false);
    } else if (passwordInput === "DIRECTOR2026") { 
      setIsAuthenticated(true); setIsAdmin(true); setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const [regional, setRegional] = useState("MONTERO");
  const [proyecto, setProyecto] = useState("MUYURINA");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  
  const [usarAPI, setUsarAPI] = useState(false); 
  
  const [baseDeDatosLotes, setBaseDeDatosLotes] = useState([]);
  const [cargandoBD, setCargandoBD] = useState(true);
  const [usarBD, setUsarBD] = useState(true);

  const [tipoCotizacion, setTipoCotizacion] = useState("credito"); 
  const [tcFlexible, setTcFlexible] = useState(11.58); 
  const TC_PROMOCIONAL = 6.97;

  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState(""); 
  const [categoria, setCategoria] = useState("");
  
  const [descuentoCredito, setDescuentoCredito] = useState(0);
  const [descuentoContado, setDescuentoContado] = useState(0);
  const [descuentoM2, setDescuentoM2] = useState(1);
  const [descuentoContadoM2, setDescuentoContadoM2] = useState(2); 
  const [descuentoInicial, setDescuentoInicial] = useState(0);

  const [aplicarDescContadoPct, setAplicarDescContadoPct] = useState(false);
  const [aplicarDescCreditoPct, setAplicarDescCreditoPct] = useState(false);
  const [aplicarDescM2, setAplicarDescM2] = useState(false);
  const [aplicarDescContadoM2, setAplicarDescContadoM2] = useState(false);
  const [aplicarBonoInicialOtro, setAplicarBonoInicialOtro] = useState(false);
  const [aplicarBonificacion, setAplicarBonificacion] = useState(true);

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

  // ============================================================================
  // CARGADOR UNIFICADO: EXCEL LOCAL vs API SERVER (AISLAMIENTO TOTAL)
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
              if (s.indexOf('.') < s.indexOf(',')) {
                  s = s.replace(/\./g, '').replace(',', '.');
              } else {
                  s = s.replace(/,/g, '');
              }
          } else if (s.includes(',')) {
              s = s.replace(',', '.');
          }
          s = s.replace(/[^0-9.-]/g, '');
          const n = Number(s);
          return isNaN(n) ? 0 : n;
      };

      if (usarAPI) {
        // MODO API
        try {
          const resProj = await fetch('https://simulador.data-gc.net/api/proyectos');
          if (!resProj.ok) throw new Error("API Falló");
          const dataProj = await resProj.json();

          const projAPI = dataProj.proyectos.find(p => {
             const apiName = String(p.proyecto).trim().toUpperCase();
             const local = proyecto.trim().toUpperCase();

             if (local === "EL PORVENIR") return apiName === "EL PORVENIR" || apiName === "CELINA EL PORVENIR";
             if (local === "EL PORVENIR FASE 2") return apiName === "EL PORVENIR FASE 2" || apiName === "EL PORVENIR 2" || apiName === "CELINA EL PORVENIR FASE 2";
             if (local === "CELINA 3") return apiName === "CELINA III";
             if (local === "CELINA 4") return apiName === "CELINA IV";
             if (local === "CELINA 5") return apiName === "CELINA V";
             if (local === "CELINA 8") return apiName === "CELINA 8" || apiName === "CELINA VIII";
             if (local === "CELINA X") return apiName === "CELINA X" || apiName === "CELINA 10";
             if (local === "CELINA 7 FASE 1") return apiName === "CELINA VII FASE 1";
             if (local === "CELINA 7 FASE 2") return apiName === "CELINA VII FASE 2";
             if (local === "CELINA 7 FASE 3") return apiName === "CELINA VII FASE 3";
             if (local === "RANCHO NUEVO") return apiName === "CELINA - RANCHO NUEVO" || apiName === "RANCHO NUEVO";
             if (local === "CLARA CHUCHIO") return apiName === "CELINA CLARA CHUCHIO" || apiName === "CLARA CHUCHIO";
             if (local === "ROSA RODALI") return apiName === "ROSA RODALI" || apiName === "CELINA ROSA RODALI";
             if (local === "SANTA ROSA - FASE 1") return apiName === "SANTA ROSA FASE 1" || apiName === "SANTA ROSA - FASE 1";
             if (local === "SANTA ROSA - FASE 2") return apiName === "SANTA ROSA FASE 2" || apiName === "SANTA ROSA - FASE 2";
             if (local === "SANTA ROSA - FASE 3") return apiName === "SANTA ROSA FASE 3" || apiName === "SANTA ROSA - FASE 3";
             if (local === "SAN JORGE") return apiName === "SAN JORGE";
             if (local === "CAÑAVERAL") return apiName === "CAÑAVERAL";
             if (local === "EL ENCANTO") return apiName === "EL ENCANTO";
             if (local === "TAMARINDO") return apiName === "TAMARINDO";

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
        } catch (error) {
          console.warn("⚠️ API inaccesible. Operando con Excel Local en modo sigiloso.");
          setUsarAPI(false); 
        }
      } else {
        // MODO EXCEL LOCAL
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

        } catch (error) {
          setCargandoBD(false);
          setUsarBD(false); 
        }
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

  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños(""); setCategoria("");
    setResultado(null); setProyectoPersonalizado(""); 
    setEscenarioGuardado(null); setMostrarComparativa(false);
    setAplicarDescContadoPct(false); setAplicarDescCreditoPct(false); setAplicarDescM2(false);
    setAplicarDescContadoM2(false); setAplicarBonoInicialOtro(false);
    setDescuentoContado(0); setDescuentoCredito(0); setDescuentoM2(1); setDescuentoContadoM2(2); setDescuentoInicial(0);
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

  const currentAliases = getAlias(proyecto);
  const lotesDelProyecto = baseDeDatosLotes?.filter(l => 
    currentAliases.some(alias => l.proyecto === alias || l?.proyecto?.includes(alias)) || currentAliases.includes(l.proyecto)
  ) || [];
  
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

        if (iniCalculada === 0 && loteEncontrado.api_cuota_inicial > 0) {
            iniCalculada = loteEncontrado.api_cuota_inicial;
        }

        if (iniCalculada > 0) {
            setModoInicial("monto");
            setInicialMonto(iniCalculada.toString());
        } else {
            setModoInicial("porcentaje");
            setInicialPorcentaje("");
            setInicialMonto("");
        }
      }
    }
  }, [modoBD, uv, mzn, lote, lotesDelProyecto]);

  const calcularLimitesMaximos = () => { return { maxCreditoPct: 0, maxContadoPct: 0, maxDescM2: 100, maxContadoM2: 100, maxBonoInicial: 500 }; };

  useEffect(() => {
    const limites = calcularLimitesMaximos();
    setDescuentoCredito(limites.maxCreditoPct);
    setDescuentoContado(limites.maxContadoPct);
  }, [modoInicial, inicialPorcentaje, inicialMonto, superficie, precio, proyecto, categoria, aplicarDescM2, aplicarDescCreditoPct]);

  const handleDescContadoChange = (e) => { const val = Number(e.target.value); const max = calcularLimitesMaximos().maxContadoPct; setDescuentoContado(val > max ? max : val); };
  const handleDescCreditoChange = (e) => { const val = Number(e.target.value); const max = calcularLimitesMaximos().maxCreditoPct; setDescuentoCredito(val > max ? max : val); };
  const handleDescM2Change = (e) => { setDescuentoM2(Number(e.target.value)); };
  const handleDescContadoM2Change = (e) => { setDescuentoContadoM2(Number(e.target.value)); };

  const formatMoney = (amount) => {
    if (isNaN(amount) || amount === undefined || amount === null) return "0.00";
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };
  
  const showNotification = (message) => { setToast(message); setTimeout(() => setToast(null), 4000); };

  const calcular = () => {
    const sup = Number(superficie) || 0; 
    const prec = Number(precio) || 0; 
    const ans = tipoCotizacion === 'credito' ? (Number(años) || 0) : 0; 

    if (!sup || !prec) { setResultado(null); return; }
    if (tipoCotizacion === 'credito' && ans <= 0) { setResultado(null); return; }

    const valor_original = sup * prec;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;
    
    let valor_final = 0, ahorro_total = 0, cuota_inicial = 0, pct_efectivo = 0, pago_puro = 0, seguro = 0, cbdi = 0, cuota_final = 0;
    let planPagosArreglo = [], transicionData = [], totalAhorroTransicion = 0;
    let ahorro_contra_mercado = 0, costo_esperar_octubre = 0, descPctOct = 0;
    const TC_FLEX_NUMBER = Number(tcFlexible) || 11.58;

    if (tipoCotizacion === 'contado') {
        const descContadoM2Val = aplicarDescContadoM2 ? (Number(descuentoContadoM2) || 0) : 0;
        const descContadoPct = aplicarDescContadoPct ? ((Number(descuentoContado) || 0) / 100) : 0; 
        
        let monto_desc_contado_m2 = sup * descContadoM2Val;
        let base_post_m2 = valor_original - monto_desc_contado_m2;
        
        ahorro_total = monto_desc_contado_m2 + (base_post_m2 * descContadoPct);
        valor_final = valor_original - ahorro_total;
        ahorro_contra_mercado = (valor_final * TC_FLEX_NUMBER) - (valor_final * TC_PROMOCIONAL);
        descPctOct = 28; 
        let tc_octubre = TC_FLEX_NUMBER * (1 - (descPctOct / 100));
        costo_esperar_octubre = (valor_final * tc_octubre) - (valor_final * TC_PROMOCIONAL);

    } else {
        const descCreditoPct = aplicarDescCreditoPct ? ((Number(descuentoCredito) || 0) / 100) : 0;
        const descM2Val = aplicarDescM2 ? (Number(descuentoM2) || 0) : 0;
        let descIniVal = (proyecto === "OTRO" && aplicarBonoInicialOtro) ? Math.min((Number(descuentoInicial) || 0), 500) : 0;

        let monto_descuento_m2 = sup * descM2Val;
        const valor_post_desc_m2 = valor_original - monto_descuento_m2;
        const monto_desc_credito_pct = valor_post_desc_m2 * descCreditoPct;
        
        ahorro_total = monto_descuento_m2 + monto_desc_credito_pct + descIniVal;
        valor_final = valor_original - ahorro_total; 

        const base_para_inicial = valor_post_desc_m2 - monto_desc_credito_pct;
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

        for (let i = 14; i >= 1; i--) {
          const m_i = i * 12;
          let pp_i = tasa === 0 ? saldo / m_i : saldo * (tasa * Math.pow(1 + tasa, m_i)) / (Math.pow(1 + tasa, m_i) - 1);
          if(isNaN(pp_i) || !isFinite(pp_i)) pp_i = 0;
          const fS_i = baseSeguro[i] ? (baseSeguro[i] / refSaldo) : (26.38 + (i - 10) * 1.3) / refSaldo;
          const c_final_i = pp_i + (saldo * fS_i) + cbdi;
          
          planPagosArreglo.push({ 
            año: i, 
            cuotaUsd: formatMoney(c_final_i), 
            cuotaBs: formatMoney(c_final_i * TC_FLEX_NUMBER), 
            isCurrent: i === ans 
          });
        }

        const mesesNombres = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        let baseMonthIndex = 8; 
        let baseYear = 26; 
        
        for(let m=1; m<=meses; m++) {
            let tc_efectivo = TC_FLEX_NUMBER; 
            let descPctExacto = 0;
            let currentMIndex = (baseMonthIndex + (m - 1)) % 12;
            let currentY = baseYear + Math.floor((baseMonthIndex + (m - 1)) / 12);

            if (aplicarBonificacion) {
                if (currentY === 26 && currentMIndex === 8) { 
                  tc_efectivo = TC_PROMOCIONAL; 
                  descPctExacto = ((TC_FLEX_NUMBER - TC_PROMOCIONAL) / TC_FLEX_NUMBER) * 100; 
                } 
                else if (currentY === 26 && currentMIndex === 9) { 
                  descPctExacto = 28; 
                  tc_efectivo = TC_FLEX_NUMBER * (1 - (descPctExacto / 100)); 
                } 
                else if (currentY === 26 && currentMIndex === 10) { 
                  descPctExacto = 23; 
                  tc_efectivo = TC_FLEX_NUMBER * (1 - (descPctExacto / 100)); 
                } 
                else if (currentY === 26 && currentMIndex === 11) { 
                  descPctExacto = 18; 
                  tc_efectivo = TC_FLEX_NUMBER * (1 - (descPctExacto / 100)); 
                } 
                else if (currentY === 27 && currentMIndex === 0) { 
                  descPctExacto = 13; 
                  tc_efectivo = TC_FLEX_NUMBER * (1 - (descPctExacto / 100)); 
                } 
                else if (currentY === 27 && currentMIndex === 1) { 
                  descPctExacto = 8; 
                  tc_efectivo = TC_FLEX_NUMBER * (1 - (descPctExacto / 100)); 
                } 
                else if (currentY === 27 && currentMIndex === 2) { 
                  descPctExacto = 3; 
                  tc_efectivo = TC_FLEX_NUMBER * (1 - (descPctExacto / 100)); 
                } 
                else { 
                  descPctExacto = 0; 
                  tc_efectivo = TC_FLEX_NUMBER; 
                }
            }

            const montoBs = cuota_final * tc_efectivo;
            const pagoUsdDesc = montoBs / TC_FLEX_NUMBER; 
            const ahorroBs = (cuota_final * TC_FLEX_NUMBER) - montoBs;

            if (ahorroBs > 0 && aplicarBonificacion) totalAhorroTransicion += ahorroBs;

            transicionData.push({
                mesNum: m, 
                mesLabel: `${mesesNombres[currentMIndex]} ${currentY}`,
                pagoUsdNormal: cuota_final || 0, 
                descPct: ahorroBs > 0 ? descPctExacto : 0,
                conDescUsd: pagoUsdDesc || 0, 
                montoBs: montoBs || 0, 
                tcEfectivo: tc_efectivo || 0,
                ahorroBs: ahorroBs > 0 ? ahorroBs : 0, 
                isDiscounted: aplicarBonificacion && tc_efectivo < TC_FLEX_NUMBER
            });
        }
    }

    const formatPct = (pct_efectivo % 1 === 0) ? pct_efectivo.toFixed(0) : pct_efectivo.toFixed(2);

    setResultado({
      tipoCotizacion, regional, proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, categoria,
      valorOriginalRaw: valor_original, 
      valorOriginal: formatMoney(valor_original), 
      valorOriginalBs: formatMoney(valor_original * TC_PROMOCIONAL),
      valorFinal: formatMoney(valor_final), 
      valorFinalBs: formatMoney(valor_final * TC_PROMOCIONAL),
      ahorroTotalRaw: ahorro_total, 
      ahorroTotal: formatMoney(ahorro_total),
      ahorroContraMercado: formatMoney(ahorro_contra_mercado), 
      costoEsperarOctubre: formatMoney(costo_esperar_octubre), 
      descOctubre: descPctOct.toFixed(1),
      descuentoContadoM2: aplicarDescContadoM2 ? Number(descuentoContadoM2) : 0, 
      descuentoM2: aplicarDescM2 ? Number(descuentoM2) : 0,
      inicialRaw: cuota_inicial, 
      inicial: formatMoney(cuota_inicial), 
      inicialBs: formatMoney(cuota_inicial * TC_PROMOCIONAL), 
      inicialPct: formatPct,
      saldoRaw: tipoCotizacion === 'credito' ? valor_final - cuota_inicial : 0, 
      pagoAmortizacion: formatMoney(pago_puro), 
      seguro: formatMoney(seguro), 
      cbdi: formatMoney(cbdi),
      mensualRaw: cuota_final, 
      mensual: formatMoney(cuota_final), 
      mensualBs: formatMoney(cuota_final * TC_FLEX_NUMBER), 
      plazo: ans, 
      planPagos: planPagosArreglo, 
      transicionData: transicionData, 
      totalAhorroTransicion: formatMoney(totalAhorroTransicion), 
      timestampId: new Date().getTime()
    });
    setCopiado(false); 
  };

  useEffect(() => {
    if (resultado && !isCalculating) {
       try { calcular(); } catch(e) {}
    }
  }, [aplicarBonificacion, tipoCotizacion, tcFlexible]);

  const getTextToCopy = () => {
    if (!resultado) return "";
    const saludo = "Estimado cliente, es un gusto saludarle. Le presento su propuesta oficial de inversión:\n\n";
    const nombreProyectoCapitalizado = resultado.proyecto.charAt(0).toUpperCase() + resultado.proyecto.slice(1).toLowerCase();
    const catStr = resultado.categoria && resultado.categoria !== "ESTÁNDAR" ? `\n🏷️ ${resultado.categoria}` : '';
    const ubicacion = `📍 *Proyecto ${nombreProyectoCapitalizado}*\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)${catStr}\n\n`;
    const precioLista = `💎 *Precio de Lista:* $ ${resultado.valorOriginal} (Bs. ${resultado.valorOriginalBs})\n\n`;
    let contentStr = "";

    if (resultado.tipoCotizacion === 'contado') {
        let arrContado = [];
        if (resultado.descuentoContadoM2 > 0) arrContado.push(`$${resultado.descuentoContadoM2}/m²`);
        contentStr += `💰 *PROPUESTA EXCLUSIVA AL CONTADO*\n`;
        if (arrContado.length > 0) contentStr += `¡Aplica descuento especial de ${arrContado.join(' + ')}!\n`;
        contentStr += `*Inversión Final:* $${resultado.valorFinal}\n(Equivalente a Bs. ${resultado.valorFinalBs} con TC promocional de 6.97 hasta Septiembre)\n\n`;
        contentStr += `🔥 *ANÁLISIS DE OPORTUNIDAD:*\n• Ahorro real vs T.C. Calle (${tcFlexible}): *Bs. ${resultado.ahorroContraMercado}*\n• Si espera a Octubre, el descuento bajará y usted *perderá Bs. ${resultado.costoEsperarOctubre}* adicionales.\n\n`;
    } else {
        let arrCredito = [];
        if (resultado.descuentoM2 > 0) arrCredito.push(`$${resultado.descuentoM2}/m²`);
        contentStr += `✅ *INVERSIÓN A CRÉDITO DIRECTO*\n`;
        if (arrCredito.length > 0) contentStr += `¡Descuento de ${arrCredito.join(' + ')} incluido!\n`;
        contentStr += `*Valor del Terreno:* $ ${resultado.valorFinal}\n\n`;
        contentStr += `📊 *Su Plan de Financiamiento* (${resultado.plazo} años)\n*Cuota inicial:* ${resultado.inicialPct}% ($${resultado.inicial})\n👉 *Inicial congelada a Bs. ${resultado.inicialBs}* (TC 6.97 hasta Septiembre)\n\n*Cuota mensual regular:* $${resultado.mensual}\n`;
        if (aplicarBonificacion && resultado.transicionData && resultado.transicionData.length > 0) {
            contentStr += `🔥 *PROGRAMA DE DESCUENTO ESCALONADO:*\n• Hasta Septiembre 2026: Pagará al TC congelado de 6.97.\n• De Octubre a Marzo: El descuento comercial se ajusta ordenadamente mes a mes.\n• Recién desde Abril 2027 pagará al TC de mercado actual.\n\n¡Usted asegura un ahorro de Bs. ${resultado.totalAhorroTransicion} gracias a este plan!\n\n`;
        }
    }
    return saludo + ubicacion + precioLista + contentStr + `¿Le gustaría que agendemos una visita para conocer su próximo terreno? 🤝`;
  };

  const enviarWhatsApp = () => { 
    if (!resultado) return; 
    window.open(`https://wa.me/?text=${encodeURIComponent(getTextToCopy())}`, '_blank'); 
  };

  const copiarTexto = () => {
    if (!resultado) return;
    const mensaje = getTextToCopy();
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(mensaje).then(() => showNotification("¡Copiado al portapapeles con éxito!"));
    } else {
        let textArea = document.createElement("textarea"); 
        textArea.value = mensaje;
        textArea.style.position = "fixed"; 
        textArea.style.left = "-999999px"; 
        document.body.appendChild(textArea);
        textArea.focus(); 
        textArea.select();
        try { document.execCommand('copy'); showNotification("¡Copiado al portapapeles con éxito!"); } catch (error) {}
        textArea.remove();
    }
  };

  const handleProcesar = (e) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      try { calcular(); } catch(err) { showNotification("Error en los datos de entrada. Verifica."); } 
      finally { 
        setIsCalculating(false); 
        if (resultadosRef.current) resultadosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
      }
    }, 500);
  };

  const EscenarioCard = ({ data, isGuardado, otherData }) => {
    let bestAhorro = false; let bestCuota = false;
    if (otherData && data) {
      if (data.ahorroTotalRaw > otherData.ahorroTotalRaw) bestAhorro = true;
      if (data.tipoCotizacion === 'credito' && otherData.tipoCotizacion === 'credito') { 
        if (data.mensualRaw < otherData.mensualRaw) bestCuota = true; 
      }
    }
    return (
      <div className={`bg-white border rounded-3xl p-6 relative overflow-hidden flex flex-col h-full shadow-md transition-all duration-300 ${isGuardado ? 'border-slate-200' : (data?.tipoCotizacion === 'contado' ? 'border-cyan-400 bg-cyan-50/20' : 'border-emerald-400 bg-emerald-50/20')}`}>
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl ${isGuardado ? 'bg-slate-200/50' : (data?.tipoCotizacion === 'contado' ? 'bg-cyan-200/50' : 'bg-emerald-200/50')}`}></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${isGuardado ? 'bg-slate-100 text-slate-600 border-slate-200' : (data?.tipoCotizacion === 'contado' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200')}`}>
            {isGuardado ? 'Escenario A (Guardado)' : 'Escenario B (Actual)'}
          </div>
          {bestAhorro && <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2 py-1 rounded border border-amber-200 flex items-center gap-1 shadow-sm"><TrendingUp className="w-3 h-3"/> Mayor Ahorro</span>}
        </div>
        <div className="text-center mb-8 relative z-10">
          <div className="text-4xl font-black text-slate-900 mb-1">
            {data?.tipoCotizacion === 'contado' ? 'Al Contado' : `${data?.plazo} Años`}
          </div>
          {data?.tipoCotizacion === 'credito' && ( 
            <div className="text-emerald-600 font-bold tracking-wide bg-emerald-50 w-fit mx-auto px-4 py-1 rounded-full border border-emerald-100">
              Inicial: {data?.inicialPct}% (${data?.inicial})
            </div> 
          )}
        </div>
        <div className="space-y-4 relative z-10 flex-1">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 text-sm">Superficie:</span>
            <span className="text-slate-900 font-bold text-sm">{data?.superficie} m²</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 text-sm">{data?.tipoCotizacion === 'contado' ? 'Inversión Final:' : 'Total a Financiar:'}</span>
            <span className="text-slate-900 font-bold text-sm">${data?.valorFinal}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 text-sm font-bold">Ahorro Promocional:</span>
            <span className={`font-black text-base ${data?.ahorroTotalRaw > 0 ? (data?.tipoCotizacion === 'contado' ? 'text-cyan-600' : 'text-emerald-600') : 'text-slate-400'}`}>
              {data?.ahorroTotalRaw > 0 ? `$${data?.ahorroTotal}` : "$0.00"}
            </span>
          </div>
        </div>
        {data?.tipoCotizacion === 'credito' && (
          <div className={`mt-8 border rounded-2xl p-5 flex justify-between items-center relative z-10 shadow-sm ${isGuardado ? 'bg-slate-50 border-slate-200' : 'bg-emerald-500 border-emerald-600'}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isGuardado ? 'text-slate-500' : 'text-emerald-100'}`}>
              Cuota<br/>Mensual
            </div>
            <div className="text-right flex items-center gap-3">
              {bestCuota && (
                <div className={`text-[9px] font-black uppercase px-2 py-1 rounded ${isGuardado ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-400 text-white'}`}>
                  Mejor Cuota
                </div>
              )}
              <div>
                <div className={`text-3xl font-black leading-none mb-1 ${isGuardado ? 'text-slate-900' : 'text-white'}`}>${data?.mensual}</div>
                <div className={`text-[10px] font-bold ${isGuardado ? 'text-slate-500' : 'text-emerald-200'}`}>Bs. {data?.mensualBs}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
           {toast.includes('🛡️') ? <AlertCircle className="w-5 h-5 text-amber-400" /> : <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
           {toast}
        </div>
      )}

      {mostrarComparativa && escenarioGuardado && resultado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300 no-print">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <h3 className="flex items-center gap-3 text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                <div className="bg-cyan-100 p-2 rounded-xl text-cyan-600"><Scale className="w-5 h-5 sm:w-6 sm:h-6" /></div> Comparativa Estratégica
              </h3>
              <button onClick={() => setMostrarComparativa(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white border border-slate-200 hover:bg-slate-100 p-2.5 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 bg-slate-50/50 overflow-y-auto">
              <EscenarioCard data={escenarioGuardado} isGuardado={true} otherData={resultado} />
              <EscenarioCard data={resultado} isGuardado={false} otherData={escenarioGuardado} />
            </div>
          </div>
        </div>
      )}

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
             <button onClick={() => setIsAuthenticated(false)} className="bg-slate-900/50 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-colors p-2.5 rounded-xl shadow-inner flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shrink-0">
               <Lock className="w-4 h-4"/> Salir
             </button>
             {isAdmin && (
                <div className="bg-amber-500/10 border border-amber-500/50 text-amber-400 px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse shrink-0">
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
             <div className="relative shrink-0 flex-1 sm:flex-none max-w-[140px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-bold text-sm">Bs.</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={tcFlexible} 
                  onChange={(e) => setTcFlexible(Number(e.target.value))} 
                  className="bg-[#04070b] border border-slate-700/80 text-cyan-400 font-black text-lg rounded-xl pl-10 pr-3 py-2 w-full text-center outline-none focus:border-cyan-500 transition-all shadow-inner focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
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
                {/* BOTÓN KILL-SWITCH (MODO SIGILOSO) */}
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
                    className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${tipoCotizacion === 'contado' ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'text-slate-500 hover:text-cyan-400'}`}
                  >
                    <Wallet className="w-4 h-4"/> Al Contado
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
                      className={`w-full glass-input rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]'}`}
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
                      className={`w-full glass-input rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none ${tipoCotizacion === 'contado' ? 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]'}`}
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
                      className="w-full glass-input rounded-2xl p-3.5 sm:p-4 transition-all font-semibold mt-3 animate-pop focus:shadow-[0_0_15px_rgba(34,211,238,0.15)] focus:border-cyan-500" 
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
                      className={`w-full rounded-xl p-3.5 text-xs sm:text-sm font-semibold placeholder-slate-600 outline-none transition-colors ${modoBD ? (tipoCotizacion==='contado' ? 'bg-cyan-950/30 border border-cyan-500/40 text-cyan-100 shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-100 shadow-[inset_0_0_15px_rgba(52,211,153,0.1)] focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(52,211,153,0.2)]') : 'glass-input'}`} 
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
                      className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 transition-all outline-none ${modoBD ? `bg-[#060b13] border border-slate-700 shadow-inner ${tipoCotizacion === 'contado' ? 'text-cyan-400 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'text-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(52,211,153,0.15)]'}` : 'glass-input'}`} 
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
                      className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 transition-all outline-none ${modoBD ? `bg-[#060b13] border border-slate-700 shadow-inner ${tipoCotizacion === 'contado' ? 'text-cyan-400 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'text-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_20px_rgba(52,211,153,0.15)]'}` : 'glass-input'}`} 
                    />
                  </div>
                </div>

                <div className={`bg-[#060b13]/50 border p-4 sm:p-5 rounded-[2rem] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] relative overflow-hidden group backdrop-blur-md mt-4 ${tipoCotizacion === 'contado' ? 'border-cyan-500/40 hover:border-cyan-500/60' : 'border-emerald-500/40 hover:border-emerald-500/60'} transition-colors`}>
                  <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl transition-colors ${tipoCotizacion === 'contado' ? 'bg-cyan-500/10 group-hover:bg-cyan-400/20' : 'bg-emerald-500/10 group-hover:bg-emerald-400/20'}`}></div>
                  <div className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 mb-4 ${tipoCotizacion === 'contado' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}>
                    <div className={`p-1.5 rounded-lg border shadow-sm shrink-0 ${tipoCotizacion === 'contado' ? 'bg-cyan-900/50 border-cyan-500/50' : 'bg-emerald-900/50 border-emerald-500/50'}`}>
                      <Gift className={`w-4 h-4 ${tipoCotizacion === 'contado' ? 'text-cyan-300' : 'text-emerald-300'}`} />
                    </div>
                    Descuentos Exclusivos
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
                    {tipoCotizacion === 'contado' && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors w-max">
                          <input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-cyan-500 shrink-0" /> Contado x m² ($us)
                        </label>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          disabled={!aplicarDescContadoM2} 
                          value={descuentoContadoM2} 
                          onChange={handleDescContadoM2Change} 
                          className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoM2 ? 'glass-input focus:ring-1 focus:ring-cyan-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} 
                        />
                      </div>
                    )}
                    {tipoCotizacion === 'credito' && (
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
                          onChange={handleDescM2Change} 
                          className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescM2 ? 'glass-input focus:ring-1 focus:ring-emerald-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {tipoCotizacion === 'credito' && (
                <div className="grid grid-cols-12 gap-4 sm:gap-5 mt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="col-span-12 md:col-span-8 bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 relative shadow-[inset_0_0_15px_rgba(52,211,153,0.1)]">
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 shrink-0" /> Inicial (%)
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        required={modoInicial === 'porcentaje'} 
                        value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''} 
                        onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                        placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 5'} 
                        className="w-full bg-[#060b13] border border-slate-700 rounded-xl p-3 sm:p-3.5 outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all font-bold text-white text-sm sm:text-base placeholder-slate-600 shadow-inner" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 shrink-0" /> Monto ($us)
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        required={modoInicial === 'monto'} 
                        value={modoInicial === 'monto' ? inicialMonto : ''} 
                        onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} 
                        placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 500'} 
                        className="w-full bg-[#060b13] border border-slate-700 rounded-xl p-3 sm:p-3.5 outline-none focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all font-black text-amber-400 text-sm sm:text-base placeholder-slate-600 shadow-inner" 
                      />
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-4 space-y-2 mt-2 md:mt-0">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-400 shrink-0" /> Plazo
                    </label>
                    <div className="relative h-[calc(100%-1.5rem)]">
                      <select 
                        required 
                        value={años} 
                        onChange={e => setAños(e.target.value)} 
                        className="w-full glass-input rounded-2xl p-3.5 outline-none transition-all font-bold text-white text-sm sm:text-base appearance-none pr-10 cursor-pointer h-full min-h-[50px] focus:border-emerald-500 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
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
                  type="submit" 
                  disabled={isCalculating} 
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
                    {resultado.tipoCotizacion === 'contado' ? 'Al Contado' : 'A Crédito'}
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

                  {resultado.tipoCotizacion === 'contado' && (
                    <div className="animate-in zoom-in-95 duration-500 mt-8 space-y-6">
                       <div className="relative overflow-hidden bg-gradient-to-br from-cyan-950 via-[#04070b] to-[#04070b] p-8 sm:p-12 rounded-[2rem] shadow-[0_0_50px_rgba(6,182,212,0.15)] border border-cyan-500/50 group text-center">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                          <div className="absolute -bottom-20 -right-20 opacity-10"><Wallet className="w-64 h-64 text-cyan-400" /></div>
                          <div className="relative z-10 flex flex-col items-center justify-center">
                             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                               <Tag className="w-3.5 h-3.5"/> Precio Final al Contado
                             </div>
                             <div className="text-[3.5rem] sm:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] leading-none mb-3">
                               $ {resultado.valorFinal}
                             </div>
                             <div className="text-xl sm:text-2xl font-bold text-cyan-200">
                               Bs. {resultado.valorFinalBs} <span className="text-[10px] text-cyan-400 uppercase tracking-widest ml-2 bg-cyan-950/80 px-2 py-1 rounded-md border border-cyan-500/50 shadow-sm">TC 6.97 HASTA SEP</span>
                             </div>
                             {resultado.ahorroTotalRaw > 0 && (
                               <div className="mt-8 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-[0_0_20px_rgba(52,211,153,0.15)] max-w-xl mx-auto w-full">
                                 <div className="bg-emerald-500/20 p-3 rounded-full shrink-0 border border-emerald-500/40">
                                   <Gift className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"/>
                                 </div>
                                 <div className="text-center sm:text-left">
                                   <div className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">Ahorro Promocional Aplicado</div>
                                   <div className="text-2xl font-black text-white">$ {resultado.ahorroTotal}</div>
                                 </div>
                               </div>
                             )}
                             <div className="mt-8 flex justify-between w-full max-w-xl mx-auto border-t border-cyan-500/30 pt-6">
                               <div className="text-center">
                                 <div className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Precio de Lista</div>
                                 <div className="text-slate-300 font-bold text-lg line-through decoration-rose-500/50 decoration-2">$ {resultado.valorOriginal}</div>
                               </div>
                               <div className="text-center">
                                 <div className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Superficie</div>
                                 <div className="text-white font-bold text-lg">{resultado.superficie} m²</div>
                               </div>
                             </div>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-gradient-to-br from-amber-950/50 to-[#04070b] border border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-[0_0_25px_rgba(245,158,11,0.1)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-amber-500/70 transition-colors">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                           <div className="text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-widest mb-1 z-10 flex items-center gap-1.5">
                             <Wallet className="w-3.5 h-3.5" /> Ahorro Total vs T.C. Mercado ({tcFlexible})
                           </div>
                           <div className="text-2xl sm:text-3xl font-black text-white z-10 drop-shadow-md">
                             Bs. {resultado.ahorroContraMercado}
                           </div>
                         </div>
                         <div className="bg-gradient-to-br from-rose-950/50 to-[#04070b] border border-rose-500/50 rounded-2xl p-5 sm:p-6 shadow-[0_0_25px_rgba(244,63,94,0.1)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-rose-500/70 transition-colors">
                           <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                           <div className="text-[10px] sm:text-xs font-black text-rose-400 uppercase tracking-widest mb-1 z-10 flex items-center gap-1.5">
                             <AlertCircle className="w-3.5 h-3.5" /> Costo por esperar a Octubre (Baja al {resultado.descOctubre}%)
                           </div>
                           <div className="text-2xl sm:text-3xl font-black text-white z-10 drop-shadow-md">
                             Pierde Bs. {resultado.costoEsperarOctubre}
                           </div>
                         </div>
                       </div>
                    </div>
                  )}

                  {resultado.tipoCotizacion === 'credito' && (
                    <div className="animate-in fade-in duration-500 space-y-6">
                      <div className="bg-gradient-to-br from-[#0b111a] to-[#04070b] p-5 sm:p-6 rounded-2xl border border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                        <div className="text-center sm:text-left">
                          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Valor Original del Lote</span>
                          <div className="text-2xl sm:text-3xl font-black text-white">$ {resultado.valorOriginal}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="bg-[#0b111a] p-5 rounded-2xl border border-slate-700 text-center sm:text-left relative overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.4)]">
                          <div className="text-emerald-500 text-[10px] font-extrabold uppercase tracking-widest">Total a Financiar</div>
                          <div className="text-2xl font-black text-white mt-1 truncate drop-shadow-sm">$ {resultado.valorFinal}</div>
                          {resultado.ahorroTotalRaw > 0 && (
                            <div className="mt-2 text-[9px] text-amber-400 font-bold bg-amber-950/60 px-2 py-1 rounded border border-amber-500/40 inline-block uppercase truncate max-w-full shadow-sm">
                              Ahorro Incluido: $ {resultado.ahorroTotal}
                            </div>
                          )}
                        </div>
                        <div className="bg-[#0b111a] p-5 rounded-2xl border border-slate-700 text-center sm:text-left relative shadow-[0_0_25px_rgba(0,0,0,0.4)]">
                          <div className="absolute right-0 top-0 text-[8px] bg-emerald-500 text-slate-900 font-black px-2 py-1 rounded-bl-lg shadow-sm">TC 6.97 HASTA SEP</div>
                          <div className="text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest truncate">Cuota Inicial ({resultado.inicialPct}%)</div>
                          <div className="text-2xl font-black text-white mt-1 truncate drop-shadow-sm">$ {resultado.inicial}</div>
                          <div className="text-[11px] font-bold text-emerald-500 mt-1 truncate">Bs. {resultado.inicialBs}</div>
                        </div>
                      </div>

                      <div className="bg-[#04070b] border border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(16,185,129,0.15)] mt-8 relative w-full">
                          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 bg-gradient-to-r from-emerald-950/40 to-transparent">
                              <div>
                                <h3 className="text-white font-black text-base sm:text-lg flex items-center gap-2 drop-shadow-sm">
                                  <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${aplicarBonificacion ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.6)]' : 'text-slate-500'}`}/> 
                                  Descuento Escalonado
                                </h3>
                                <p className="text-slate-400 text-[9px] sm:text-[10px] mt-1 font-medium">Pago regular: ${resultado.mensual} · TC Mercado: {tcFlexible}</p>
                              </div>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                                <div className={`flex items-center justify-between sm:justify-start gap-3 p-2.5 rounded-2xl border transition-all duration-300 shadow-inner w-full sm:w-auto ${aplicarBonificacion ? 'bg-slate-900/80 border-emerald-500/50' : 'bg-slate-900/50 border-slate-700'}`}>
                                  <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${aplicarBonificacion ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    Aplicar Descuento
                                  </span>
                                  <button 
                                    type="button" 
                                    onClick={() => setAplicarBonificacion(!aplicarBonificacion)} 
                                    className={`relative inline-flex h-6 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] ${aplicarBonificacion ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]' : 'bg-slate-800 border border-slate-600'}`}
                                  >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${aplicarBonificacion ? 'translate-x-7 shadow-[0_0_10px_rgba(255,255,255,0.9)]' : 'translate-x-1'}`} />
                                  </button>
                                </div>
                                <div className={`border px-4 py-2.5 rounded-xl text-center transition-all duration-300 w-full sm:w-auto ${aplicarBonificacion ? 'bg-amber-950/60 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : 'bg-slate-800/50 border-slate-700'}`}>
                                  <div className={`text-[9px] uppercase font-black tracking-widest ${aplicarBonificacion ? 'text-amber-400' : 'text-slate-500'}`}>Ahorro Total Cliente</div>
                                  <div className={`text-lg sm:text-xl font-black truncate drop-shadow-sm ${aplicarBonificacion ? 'text-amber-500' : 'text-slate-600'}`}>Bs. {resultado.totalAhorroTransicion}</div>
                                </div>
                              </div>
                          </div>
                          <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar relative w-full">
                            {!aplicarBonificacion && <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] z-20 pointer-events-none transition-all duration-300"></div>}
                            <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
                              <thead className="sticky top-0 bg-[#090e17] z-30 border-b border-slate-700">
                                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                  <th className="p-3 text-center">Mes</th>
                                  <th className="p-3 text-center">Pago Fijo ($)</th>
                                  <th className={`p-3 text-center transition-colors ${aplicarBonificacion ? 'text-emerald-400' : 'text-slate-600'}`}>Desc.</th>
                                  <th className={`p-3 text-center transition-colors ${aplicarBonificacion ? 'text-emerald-300 bg-emerald-950/50' : 'text-slate-500'}`}>Pago c/Desc ($)</th>
                                  <th className="p-3 text-center text-white">Monto Real (Bs)</th>
                                  <th className="p-3 text-center">TC Efe.</th>
                                </tr>
                              </thead>
                              <tbody className="font-semibold relative z-10">
                                {resultado.transicionData?.map((row, i) => (
                                  <tr key={i} className={`border-b border-slate-800/50 text-center hover:bg-slate-800/60 transition-colors ${row.isDiscounted ? 'bg-emerald-950/20' : 'text-slate-500'}`}>
                                    <td className={`p-3 font-bold ${row.isDiscounted ? 'text-emerald-400' : 'text-slate-600'}`}>{row.mesLabel}</td>
                                    <td className="p-3 text-slate-300">{Number(row.pagoUsdNormal).toFixed(2)}</td>
                                    <td className={`p-3 ${row.isDiscounted ? 'text-emerald-500' : 'text-slate-600'}`}>{row.descPct > 0 ? `${row.descPct.toFixed(1)}%` : '-'}</td>
                                    <td className={`p-3 font-bold ${row.isDiscounted ? 'text-emerald-300 bg-emerald-950/40 shadow-inner' : 'text-slate-500'}`}>{Number(row.conDescUsd).toFixed(2)}</td>
                                    <td className={`p-3 font-black ${row.isDiscounted ? 'text-white' : 'text-slate-400'}`}>{Number(row.montoBs).toFixed(2)}</td>
                                    <td className="p-3 text-slate-400">{Number(row.tcEfectivo).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="p-3 bg-[#060b13] text-[8px] sm:text-[9px] text-slate-500 text-center border-t border-slate-800 font-bold">
                            *Simulación referencial. El descuento comercial se ajusta gradualmente hasta alcanzar el TC de Mercado actual.
                          </div>
                      </div>

                      <div className="mt-8 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-[#0b111a] w-full">
                        <div className="bg-[#060b13] p-4 border-b border-emerald-500/30 flex justify-between items-center">
                          <h3 className="text-slate-200 font-bold text-sm tracking-wide flex items-center gap-2 drop-shadow-sm">
                            <Calendar className="w-4 h-4 text-emerald-500 shrink-0 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"/> Resumen de Plazos Alternativos
                          </h3>
                        </div>
                        <div className="p-3 sm:p-5 max-h-[350px] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 pb-3 border-b border-slate-800 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center sticky top-0 bg-[#0b111a] z-10">
                              <div>Plazo</div>
                              <div className="text-emerald-400">Cuota ($us)</div>
                              <div className="text-emerald-400">Cuota (Bs.)</div>
                            </div>
                            <div className="pt-2">
                              {resultado.planPagos?.map((plan, i) => (
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 no-print">
                    <button 
                      onClick={() => setEscenarioGuardado(resultado)} 
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm hover:shadow-md"
                    >
                       <Scale className="w-4 h-4"/>
                       {escenarioGuardado ? "Actualizar Escenario A" : "Guardar como Escenario A"}
                    </button>
                    {escenarioGuardado && (
                      <button 
                        onClick={() => setMostrarComparativa(true)} 
                        className={`w-full hover:bg-opacity-90 border text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg ${resultado.tipoCotizacion === 'contado' ? 'bg-cyan-600 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-emerald-600 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}
                      >
                         <Scale className="w-4 h-4"/> Comparar Escenarios
                      </button>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-800 no-print">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={() => window.print()} 
                          className="w-full sm:w-1/4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold py-3 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm hover:shadow-md"
                        >
                          <Printer className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        </button>
                        <button 
                          onClick={copiarTexto} 
                          className={`w-full sm:w-1/3 bg-[#060b13] border font-black py-4 sm:py-5 px-4 sm:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm uppercase tracking-wider relative overflow-hidden ${resultado.tipoCotizacion === 'contado' ? 'hover:bg-cyan-950/60 border-cyan-500/60 text-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'hover:bg-emerald-950/60 border-emerald-500/60 text-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]'}`}
                        >
                          {copiado ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> : <FileText className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />}
                          <span className="truncate">{copiado ? 'COPIADO' : 'COPIAR TEXTO'}</span>
                        </button>
                        <button 
                          onClick={enviarWhatsApp} 
                          className="w-full sm:w-2/3 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#15873e] text-[#020617] font-black py-4 sm:py-5 px-4 sm:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:shadow-[0_0_40px_rgba(37,211,102,0.6)] hover:-translate-y-1 text-xs sm:text-sm uppercase tracking-wider"
                        >
                          <Send className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> <span className="truncate">Enviar por WhatsApp</span>
                        </button>
                    </div>
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
