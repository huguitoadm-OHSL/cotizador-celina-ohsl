// Celina Quantum · Versión para asesores · Condiciones actualizadas a 06/10/2026[cite: 1].
// Reemplazar src/App.tsx. Conserva las fuentes API/lotes.json y los GeoJSON de public/[cite: 1].
// Compatible con react-map-gl 7 (entrada /maplibre) y maplibre-gl 4[cite: 1].
// El TC se ingresa manualmente: Bs 11.97 es la referencia proporcionada[cite: 1].
// GPS: requiere HTTPS/localhost y autorización de ubicación del dispositivo[cite: 1].
// El acceso por contraseña del prototipo es solo una barrera de interfaz, no autenticación de servidor[cite: 1].
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Calculator, Send, Map as MapIcon, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, MapPin, Gift, TrendingUp, ShieldCheck, ChevronDown, 
  Database, Edit2, LayoutTemplate, Loader2, AlertCircle, Scale, Activity, Wallet, CreditCard, Lock, Unlock,
  Maximize, Minimize, Eye, Crosshair, Server,
  Timer
} from "lucide-react";
import Map, { Source, Layer, GeolocateControl, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ============================================================================
// BASE DE DATOS DE REGIONALES Y PROYECTOS
// ============================================================================
const proyectosPorRegional: Record<string, string[]> = {
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

// Fecha comercial en Bolivia, independiente de la zona horaria del dispositivo.
const fechaBolivia = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const fechaLegible = (iso: string) => iso.split('-').reverse().join('/');
const PROMOCION = { desde: '2026-10-06', contado: { '5': 0.25, '30': 0.20, '60': 0.10 } as Record<string, number> };
const descuentoCreditoPorValor = (valorTotal: number) => {
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) return 0;
  if (valorTotal <= 7500) return 300;
  if (valorTotal <= 15000) return 600;
  if (valorTotal <= 22500) return 900;
  if (valorTotal <= 30000) return 1200;
  if (valorTotal <= 45000) return 1500;
  return 1800;
};
const siguienteMes = () => {
  const [y, m] = fechaBolivia().split('-').map(Number);
  return `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}`;
};
const archivoPlano = (proyecto: string) => {
  const especiales: Record<string, string> = { 'URUBÓ NORTE': 'urubó_norte.geojson', 'SANTA ROSA - FASE 1': 'santa_rosa_-_fase_1.geojson', 'SANTA ROSA - FASE 2': 'santa_rosa_-_fase_2.geojson', 'SANTA ROSA - FASE 3': 'santa_rosa_-_fase_3.geojson' };
  return '/' + encodeURIComponent(especiales[proyecto] || `${proyecto.toLowerCase().replace(/\s+/g, '_')}.geojson`);
};

// Visor de referencia: nunca selecciona lotes ni representa disponibilidad comercial.
const MapaEspacial = ({ proyectoActivo }: { proyectoActivo: string }) => {
  const mapRef = useRef<any>(null);
  const geoRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [plano, setPlano] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [errorPlano, setErrorPlano] = useState('');
  const [errorMapa, setErrorMapa] = useState('');
  const [gps, setGps] = useState('GPS sin activar');
  const [siguiendo, setSiguiendo] = useState(false);
  const [precision, setPrecision] = useState<number | null>(null);
  const boundsRef = useRef<any>(null);
  const verProyecto = useCallback(() => {
    if (boundsRef.current && mapRef.current) mapRef.current.fitBounds(boundsRef.current, { padding: 45, maxZoom: 17, pitch: 0, duration: 900 });
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    setCargando(true); setPlano(null); setErrorPlano(''); boundsRef.current = null;
    (async () => {
      try {
        const res = await fetch(archivoPlano(proyectoActivo), { signal: abort.signal });
        if (!res.ok) throw new Error('No se encontró el archivo del plano.');
        const data = await res.json();
        if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('El archivo no es una colección GeoJSON válida.');
        let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
        const visit = (coords: any) => {
          if (!Array.isArray(coords)) return;
          if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            const [lng, lat] = coords;
            if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) throw new Error('El plano debe usar coordenadas WGS84 en longitud y latitud.');
            west = Math.min(west, lng); east = Math.max(east, lng); south = Math.min(south, lat); north = Math.max(north, lat);
          } else coords.forEach(visit);
        };
        const geometry = (g: any) => { if (g?.type === 'GeometryCollection') g.geometries.forEach(geometry); else visit(g?.coordinates); };
        data.features.forEach((f: any) => geometry(f.geometry));
        if (!Number.isFinite(west)) throw new Error('El plano no contiene geometrías visibles.');
        if (abort.signal.aborted) return;
        boundsRef.current = [[west, south], [east, north]];
        setPlano(data);
      } catch (err: any) {
        if (!abort.signal.aborted) setErrorPlano(err.message || 'No se pudo cargar el plano.');
      } finally { if (!abort.signal.aborted) setCargando(false); }
    })();
    return () => abort.abort();
  }, [proyectoActivo]);
  useEffect(() => { if (ready && plano) verProyecto(); }, [ready, plano, verProyecto]);
  useEffect(() => {
    const timer = setTimeout(() => mapRef.current?.resize(), 100);
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', escape);
    const previous = document.body.style.overflow;
    if (fullscreen) document.body.style.overflow = 'hidden';
    return () => { clearTimeout(timer); window.removeEventListener('keydown', escape); document.body.style.overflow = previous; };
  }, [fullscreen]);
  const localizar = () => {
    if (!window.isSecureContext) { setGps('La ubicación requiere HTTPS o localhost.'); return; }
    if (!navigator.geolocation) { setGps('Este dispositivo no permite geolocalización.'); return; }
    if (!ready) { setGps('Espera a que cargue el mapa.'); return; }
    setGps(siguiendo ? 'GPS pausado' : 'Buscando tu ubicación…');
    geoRef.current?.trigger();
  };
  const textProperty: any = ['coalesce', ['get', 'name'], ['get', 'Name'], ['get', 'Text'], ['get', 'text'], ['get', 'Lote'], ['get', 'lote'], ''];
  return (
    <section className={fullscreen ? 'fixed inset-0 z-[99999] bg-slate-950 flex flex-col h-[100dvh]' : 'relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-slate-950 shadow-2xl flex flex-col h-[540px] sm:h-[620px]'} aria-label="Visor del proyecto">
      <div className="p-4 bg-slate-900/95 border-b border-slate-700 flex flex-wrap justify-between items-center gap-3">
        <div><h3 className="text-white font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400"/>{proyectoActivo}</h3><p className="text-slate-400 text-xs mt-1">Plano de referencia · Vista de terreno</p></div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={localizar} className="px-3 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2"><Crosshair className="w-4 h-4"/>{siguiendo ? 'Pausar GPS' : 'Mi ubicación'}</button>
          <button type="button" disabled={!plano} onClick={verProyecto} className="px-3 py-2.5 rounded-xl border border-slate-600 text-white text-xs disabled:opacity-40">Ver plano</button>
          <button type="button" onClick={() => setFullscreen(!fullscreen)} aria-label={fullscreen ? 'Cerrar pantalla completa' : 'Pantalla completa'} className="p-2.5 rounded-xl border border-slate-600 text-white">{fullscreen ? <Minimize className="w-4 h-4"/> : <Maximize className="w-4 h-4"/>}</button>
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <Map ref={mapRef} mapLib={maplibregl} initialViewState={{ longitude: -63.2435, latitude: -17.3635, zoom: 12, pitch: 0 }} mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" maxZoom={21} onLoad={() => { setReady(true); setErrorMapa(''); }} onError={() => setErrorMapa('No se pudo cargar parte del mapa. Revisa tu conexión.')} style={{ width: '100%', height: '100%' }}>
          <GeolocateControl ref={geoRef} position="bottom-right" trackUserLocation showUserLocation showAccuracyCircle positionOptions={{ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }} fitBoundsOptions={{ maxZoom: 19 }}
            onGeolocate={(e) => { setPrecision(e.coords.accuracy); setGps('Ubicación recibida'); }}
            onTrackUserLocationStart={() => { setSiguiendo(true); setGps('Seguimiento activado'); }}
            onTrackUserLocationEnd={() => { setSiguiendo(false); setGps('Seguimiento pausado · pulsa Mi ubicación para volver'); }}
            onError={(e) => { setSiguiendo(false); setPrecision(null); setGps(e.code === 1 ? 'Permite el acceso a tu ubicación en el navegador.' : e.code === 3 ? 'Se agotó la espera del GPS. Intenta de nuevo al aire libre.' : 'No se pudo obtener tu ubicación. Activa el GPS e intenta nuevamente.'); }} />
          <NavigationControl position="bottom-right" visualizePitch />
          <Source id="satellite-source" type="raster" tiles={['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}']} tileSize={256} maxzoom={20} attribution="Imágenes © Google">
            <Layer id="satellite-layer" type="raster" paint={{ 'raster-opacity': 1 }} />
          </Source>
          {plano && <Source id="plano-referencia" type="geojson" data={plano}>
            <Layer id="plano-sombra" type="line" paint={{ 'line-color': '#082f49', 'line-width': 4, 'line-opacity': 0.7 }} />
            <Layer id="plano-lineas" type="line" paint={{ 'line-color': '#67e8f9', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.7, 18, 1.8], 'line-opacity': 0.95 }} />
            <Layer id="plano-textos" type="symbol" minzoom={17} filter={['==', ['geometry-type'], 'Point']} layout={{ 'text-field': textProperty, 'text-size': 11, 'text-font': ['Open Sans Regular'], 'text-allow-overlap': false }} paint={{ 'text-color': '#ffffff', 'text-halo-color': '#0f172a', 'text-halo-width': 1.5 }} />
          </Source>}
        </Map>
        {(cargando || errorPlano || errorMapa) && <div role="status" className="absolute top-3 left-3 right-14 bg-slate-950/90 border border-slate-600 rounded-xl p-3 text-xs text-slate-100 pointer-events-none">{errorPlano || errorMapa || 'Cargando plano…'}</div>}
      </div>
      <div role="status" aria-live="polite" className="px-4 py-3 text-xs text-slate-300 bg-slate-900 flex flex-wrap justify-between gap-2"><span>{siguiendo ? '● ' : ''}{gps}{precision !== null ? ` · Precisión aproximada ±${Math.ceil(precision)} m` : ''}</span><span className="text-slate-500">Ubicación orientativa · Consulta el lote en el formulario</span></div>
    </section>
  );
};


interface LoteData {
  proyecto: string; uv: string; mzn: string; lote: string; superficie: number; precio: number;
  estado: string; categoria: string; vendedor: string;
  api_cuota_inicial: number; api_initial_tipo: string; api_initial_pct: number; api_initial_valor: number;
}
interface ResultadoData {
  fechaTC: string; primerMesPago: string; tipoCotizacion: string; regional: string; proyecto: string;
  uv: string; mzn: string; lote: string; superficie: number; categoria: string;
  valorOriginalRaw: number; valorOriginal: string; valorFinal: string; valorFinalBs: string;
  ahorroTotalRaw: number; ahorroTotal: string; inicialRaw: number; inicial: string; inicialBs: string;
  inicialPct: string; saldoRaw: number; mensualRaw: number; mensual: string; mensualBs: string; plazo: number;
  planPagosDetallado: { nro: number; mesLabel: string; cuotaUsd: number }[];
  planPlazosAlternativos: { año: number; cuotaUsd: string; cuotaBs: string; isCurrent: boolean }[];
  descPctAplicado: number; tcOriginal: number; tcEfectivo: number; totalBsA: string; totalBsB: string;
  plazoLiquidacionVisual: string; descuentoFijoAplicado: number; descuentoM2Equivalente: number; timestampId: number;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(false); 
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "SALMO23") { setIsAuthenticated(true); setIsAdmin(false); setLoginError(false); } 
    else if (passwordInput === "OHSARAVIA") { setIsAuthenticated(true); setIsAdmin(true); setLoginError(false); } 
    else { setLoginError(true); setTimeout(() => setLoginError(false), 2000); }
  };

  const [regional, setRegional] = useState("MONTERO");
  const [proyecto, setProyecto] = useState("MUYURINA");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  const [usarAPI, setUsarAPI] = useState(true); 
  const [baseDeDatosLotes, setBaseDeDatosLotes] = useState<LoteData[]>([]);
  const [cargandoBD, setCargandoBD] = useState(true);
  const [usarBD, setUsarBD] = useState(true);
  const [tipoCotizacion, setTipoCotizacion] = useState("credito"); 
  const [tcFlexible, setTcFlexible] = useState(11.73);
  const [fechaTC, setFechaTC] = useState(fechaBolivia());
  const [primerMesPago, setPrimerMesPago] = useState(siguienteMes()); 
  
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState(""); 
  const [categoria, setCategoria] = useState("");
  
  const [aplicarDescuentoCredito, setAplicarDescuentoCredito] = useState(true); 
  
  const [plazoLiquidacion, setPlazoLiquidacion] = useState("5"); 

  const valorLoteActual = (Number(superficie) || 0) * (Number(precio) || 0);
  const descuentoCreditoActual = aplicarDescuentoCredito ? descuentoCreditoPorValor(valorLoteActual) : 0;
  const descuentoM2InformativoActual = (Number(superficie) || 0) > 0 ? descuentoCreditoActual / Number(superficie) : 0;

  const [modoInicial, setModoInicial] = useState("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  const [años, setAños] = useState("");
  
  const [resultado, setResultado] = useState<ResultadoData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const resultadosRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setResultado(null); setCopiado(false); }, [tcFlexible, fechaTC, primerMesPago, uv, mzn, lote, superficie, precio, categoria, años, modoInicial, inicialMonto, inicialPorcentaje, aplicarDescuentoCredito, plazoLiquidacion, proyectoPersonalizado]);

  // ============================================================================
  // CARGADOR UNIFICADO: EXCEL LOCAL vs API SERVER
  // ============================================================================
  useEffect(() => {
    if (!isAuthenticated || !proyecto) return;
    const cargarDatos = async () => {
      setCargandoBD(true);
      const getSafeVal = (obj: Record<string, any>, propName: string) => {
          const key = Object.keys(obj).find(k => k.trim().toLowerCase().includes(propName.toLowerCase()));
          return key ? obj[key] : undefined;
      };
      const extractNumber = (val: unknown) => {
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
          const projAPI = dataProj.proyectos.find((p: { proyecto: string }) => {
             const apiName = String(p.proyecto).trim().toUpperCase();
             const local = proyecto.trim().toUpperCase();
             const map: Record<string, string[]> = {
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
              const apiMapped = dataLotes.lotes.map((loteFresco: Record<string, any>) => {
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
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (proyectosPorRegional[regional] && !proyectosPorRegional[regional].includes(proyecto)) {
      setProyecto(proyectosPorRegional[regional][0] || "OTRO");
    }
  }, [regional]);

  const handleUvChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => { setUv(e.target.value); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoria(""); };
  const handleMznChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => { setMzn(e.target.value); setLote(""); setSuperficie(""); setPrecio(""); setCategoria(""); };
  const handleLoteChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => { setLote(e.target.value); };
  


  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños(""); setCategoria("");
    setResultado(null); setProyectoPersonalizado(""); 
    setExpandedPlan(false);
  }, [proyecto, tipoCotizacion]);

  const getAlias = (p: string) => {
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
  const sortAlphaNum = (a: string, b: string) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
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
  
  const formatMoney = (amount: number) => {
    if (isNaN(amount) || amount === undefined || amount === null) return "0.00";
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };
  
  const showNotification = (message: string) => { setToast(message); setTimeout(() => setToast(null), 4000); };

  // ============================================================================
  // MOTOR DE CÁLCULO REFACTORIZADO 
  // ============================================================================
  const calcular = () => {
    const sup = Number(superficie) || 0; 
    const prec = Number(precio) || 0; 
    const ans = tipoCotizacion === 'credito' ? (Number(años) || 0) : 0; 
    if (!Number.isFinite(sup) || !Number.isFinite(prec) || sup <= 0 || prec <= 0) { setResultado(null); showNotification('Ingresa superficie y precio mayores que cero.'); return; }
    if (!Number.isFinite(tcFlexible) || tcFlexible <= 0 || fechaTC !== fechaBolivia()) { setResultado(null); showNotification('Confirma el TC y su fecha para la cotización de hoy.'); return; }
    if (fechaTC < PROMOCION.desde) { setResultado(null); showNotification('La promoción empieza el 06/10/2026.'); return; }
    if (tipoCotizacion === 'credito' && (!Number.isInteger(ans) || ans < 1 || ans > 14)) { setResultado(null); return; }
    
    const valor_original = sup * prec;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;
    
    let valor_final = 0, ahorro_total = 0, cuota_inicial = 0, pct_efectivo = 0, pago_puro = 0, seguro = 0, cbdi = 0, cuota_final = 0;
    let planPagosDetallado = [];
    let planPlazosAlternativos = [];
    
    const TC_FLEX_NUMBER = Number(tcFlexible);
    
    let tcEfectivoAplicado = TC_FLEX_NUMBER;
    let descPctMapeo = 0;
    
    let totalBs_OpcionA = 0;
    let totalBs_OpcionB = 0;

    if (tipoCotizacion === 'contado') {
        descPctMapeo = PROMOCION.contado[plazoLiquidacion];

        ahorro_total = valor_original * descPctMapeo;
        valor_final = valor_original - ahorro_total;
        tcEfectivoAplicado = TC_FLEX_NUMBER * (1 - descPctMapeo);

        totalBs_OpcionA = valor_final * TC_FLEX_NUMBER;
        // Ambas modalidades deben mostrar exactamente el mismo total en Bs.
        totalBs_OpcionB = totalBs_OpcionA;
        
    } else {
        const descuentoFijoCredito = aplicarDescuentoCredito ? descuentoCreditoPorValor(valor_original) : 0;
        ahorro_total = descuentoFijoCredito;
        valor_final = valor_original - ahorro_total; 
        const base_para_inicial = valor_final;

        if (modoInicial === 'porcentaje') {
           pct_efectivo = Number(inicialPorcentaje) || 0;
           cuota_inicial = base_para_inicial * (pct_efectivo / 100);
        } else {
           cuota_inicial = Number(inicialMonto) || 0;
           pct_efectivo = base_para_inicial > 0 ? (cuota_inicial / base_para_inicial) * 100 : 0;
        }

        if (!Number.isFinite(cuota_inicial) || cuota_inicial < 0 || cuota_inicial > valor_final) { setResultado(null); showNotification('La inicial debe estar entre cero y el valor del terreno.'); return; }
        if (!/^\d{4}-\d{2}$/.test(primerMesPago) || primerMesPago < fechaTC.slice(0, 7)) { setResultado(null); showNotification('Revisa el primer mes de pago.'); return; }
        const saldo = valor_final - cuota_inicial;
        const meses = ans * 12;
        const tasa_anual = 0.121733; const tasa = tasa_anual / 12;
        const refSaldo = 34278.00;
        const baseSeguro: Record<number, number> = { 1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38, 11: 27.67, 12: 29.00, 13: 30.36, 14: 31.75 };
        
        pago_puro = tasa === 0 ? saldo / meses : saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
        if(isNaN(pago_puro) || !isFinite(pago_puro)) pago_puro = 0;
        const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1.3) / refSaldo;
        seguro = saldo * factorSeguro;
        cuota_final = pago_puro + seguro + cbdi;

        const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const [añoInicio, mesInicio] = primerMesPago.split('-').map(Number);
        const mesInicioIndex = mesInicio - 1; 

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
      fechaTC, primerMesPago, tipoCotizacion, regional, proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, categoria,
      valorOriginalRaw: valor_original, 
      valorOriginal: formatMoney(valor_original), 
      valorFinal: formatMoney(valor_final), 
      valorFinalBs: formatMoney(valor_final * TC_FLEX_NUMBER), 
      ahorroTotalRaw: ahorro_total, 
      ahorroTotal: formatMoney(ahorro_total),
      inicialRaw: cuota_inicial, 
      inicial: formatMoney(cuota_inicial), 
      inicialBs: formatMoney(cuota_inicial * TC_FLEX_NUMBER), 
      inicialPct: formatPct,
      saldoRaw: tipoCotizacion === 'credito' ? valor_final - cuota_inicial : 0, 
      mensualRaw: cuota_final, 
      mensual: formatMoney(cuota_final), 
      mensualBs: formatMoney(cuota_final * TC_FLEX_NUMBER), 
      plazo: ans, 
      planPagosDetallado: planPagosDetallado,
      planPlazosAlternativos: planPlazosAlternativos, 
      descPctAplicado: descPctMapeo,
      tcOriginal: TC_FLEX_NUMBER,
      tcEfectivo: tcEfectivoAplicado,
      totalBsA: formatMoney(totalBs_OpcionA),
      totalBsB: formatMoney(totalBs_OpcionB),
      plazoLiquidacionVisual: plazoLiquidacion === '5' ? 'Primeros 5 días' : plazoLiquidacion === '30' ? '6 a 30 días' : '31 a 60 días',
      descuentoFijoAplicado: tipoCotizacion === 'credito' && aplicarDescuentoCredito ? descuentoCreditoPorValor(valor_original) : 0,
      descuentoM2Equivalente: tipoCotizacion === 'credito' && aplicarDescuentoCredito && sup > 0 ? descuentoCreditoPorValor(valor_original) / sup : 0,
      timestampId: new Date().getTime()
    });
    setCopiado(false); 
  };

  const handleProcesar = (e: React.FormEvent) => {
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
    if (!resultado) return '';
    const r = resultado;
    const encabezado = `📍 *Proyecto ${r.proyecto}*\nUV ${r.uv || '-'} | MZN ${r.mzn || '-'} | Lote ${r.lote || '-'} (${r.superficie} m²)\n${r.categoria && r.categoria !== 'ESTÁNDAR' ? `🏷️ ${r.categoria}\n` : ''}💎 Precio de lista: US$ ${r.valorOriginal}\n📅 TC ${fechaLegible(r.fechaTC)}: Bs ${r.tcOriginal.toFixed(2)}\n\n`;
    if (r.tipoCotizacion === 'contado') {
      return encabezado + `✅ *INVERSIÓN AL CONTADO / LIQUIDACIÓN*\nPlazo: ${r.plazoLiquidacionVisual}.\nDescuento: ${(r.descPctAplicado * 100).toFixed(0)}% incluido.\n*Valor del terreno: US$ ${r.valorFinal}*\nEquivalencia hoy: *Bs ${r.totalBsA}*.\n\nBeneficio no acumulable. El pago en Bs se convierte al TC vigente del día de pago.`;
    }
    return encabezado + `✅ *INVERSIÓN A CRÉDITO DIRECTO*\n${r.descuentoFijoAplicado > 0 ? `Descuento fijo por lote: US$ ${formatMoney(r.descuentoFijoAplicado)} incluido.\nEquivalente informativo: US$ ${formatMoney(r.descuentoM2Equivalente)}/m².\n` : ''}*Valor del terreno: US$ ${r.valorFinal}*\n\n📊 *Plan de financiamiento* (${r.plazo} años)\n*Cuota inicial: ${r.inicialPct}%* (US$ ${r.inicial}) = Bs ${r.inicialBs} al TC indicado, vigente para la venta de hoy.\n\n*Cuota mensual fija: US$ ${r.mensual}*\nReferencia hoy: Bs ${r.mensualBs}. Cada cuota mensual se convierte al TC vigente del día efectivo de pago.`;
  };

  const enviarWhatsApp = () => { 
    if (!resultado) return; 
    if (resultado.fechaTC !== fechaBolivia()) { showNotification('Actualiza el TC y vuelve a cotizar antes de compartir.'); return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(getTextToCopy())}`, '_blank', 'noopener,noreferrer'); 
  };

  const copiarTexto = async () => {
    if (!resultado) return;
    if (resultado.fechaTC !== fechaBolivia()) { showNotification('Actualiza el TC y vuelve a cotizar antes de copiar.'); return; }
    try {
      const mensaje = getTextToCopy();
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(mensaje);
      } else {
        const field = document.createElement('textarea');
        field.value = mensaje; field.style.position = 'fixed'; field.style.left = '-9999px';
        document.body.appendChild(field);
        try { field.select(); if (!document.execCommand('copy')) throw new Error('No se pudo copiar'); }
        finally { field.remove(); }
      }
      setCopiado(true); showNotification('Cotización copiada.');
    } catch { showNotification('No se pudo copiar. Puedes abrir la cotización con el botón WhatsApp.'); }
  };
  return (
    <div className="quantum-command min-h-screen bg-[#06090f] relative font-['Plus_Jakarta_Sans'] text-slate-300 overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200 pb-20 w-full max-w-[100vw]">
      <style>{`
        .quantum-command { background: #06090f !important; color-scheme: dark; }
        .quantum-command .glass-panel { background: linear-gradient(145deg,#111c29,#080e16) !important; border-color:#253648 !important; box-shadow:0 18px 50px #0005 !important; }
        .quantum-command input,.quantum-command select { border-radius:8px; }
        .quantum-command input:focus-visible,.quantum-command select:focus-visible,.quantum-command button:focus-visible { outline:2px solid #38bdf8; outline-offset:3px; }
        .quantum-command .quantum-grid { background-image:linear-gradient(#1e3a501f 1px,transparent 1px),linear-gradient(90deg,#1e3a501f 1px,transparent 1px);background-size:64px 64px;mask-image:linear-gradient(#000,transparent 75%); }
        .quantum-hero { position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:30px 34px;margin-bottom:24px;border:1px solid #253b50;border-left:3px solid #22d3ee;border-radius:12px;background:linear-gradient(110deg,#0d1825 0%,#09111b 65%,#0a1c2b 100%); }
        .quantum-hero:after { content:'';position:absolute;right:0;top:0;height:2px;width:40%;background:linear-gradient(90deg,transparent,#38bdf8); }
        .quantum-hero-content { position:relative;z-index:1; }
        .quantum-eyebrow { display:flex;align-items:center;gap:9px;font-size:9px;letter-spacing:2px;font-weight:800;color:#8ca9bf; }
        .quantum-eyebrow>span { width:6px;height:6px;background:#22d3ee;box-shadow:0 0 12px #22d3ee88; }
        .quantum-hero h1 { margin:18px 0 12px;line-height:.95;letter-spacing:-2px; }
        .quantum-hero h1>span { display:block;font-size:17px;letter-spacing:8px;font-weight:600;color:#94aabd;margin-bottom:10px; }
        .quantum-hero h1>strong { display:block;font-size:clamp(36px,5.5vw,70px);font-weight:900;color:#f2f7fc; }
        .quantum-dot { color:#22d3ee; }
        .quantum-hero p { margin:16px 0 22px;color:#8ea5b9;font-size:14px;line-height:1.65; }
        .quantum-modules { display:flex;flex-wrap:wrap;gap:18px; }
        .quantum-modules>span { display:flex;gap:7px;align-items:center;color:#7dd3fc;font-size:9px;font-weight:800;letter-spacing:1.2px; }
        .quantum-orbit { width:310px;flex-shrink:0;opacity:.9; }
        .quantum-orbit svg { width:100%;height:auto; }
        .quantum-footer { margin-top:42px;padding:22px 0;border-top:1px solid #203042;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font-size:10px;letter-spacing:1px;color:#698296; }
        .quantum-footer strong { color:#adbfce; }
        @media(max-width:640px) { .quantum-hero {padding:25px 20px;min-height:255px;} .quantum-orbit {position:absolute;right:-100px;width:280px;opacity:.2;} .quantum-eyebrow {font-size:8px;letter-spacing:1px;} .quantum-hero h1>strong {font-size:42px;} .quantum-modules {gap:12px;} }
        @media(prefers-reduced-motion:reduce) { .quantum-command * {animation:none !important;transition:none !important;scroll-behavior:auto !important;} }
      `}</style>

      
      {!isAuthenticated && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-[#06090f]/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-[#0f172a]/90 backdrop-blur-3xl border border-sky-500/20 p-8 sm:p-12 rounded-2xl w-full max-w-md relative shadow-[0_24px_80px_rgba(0,0,0,0.4)] flex flex-col items-center text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-cyan-500"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(14,165,233,0.5)] relative">
               <div className="absolute inset-0 bg-sky-400/30 rounded-full blur-xl "></div>
               <Lock className="w-10 h-10 text-[#06090f] relative z-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Celina <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">Quantum</span></h1>
            <p className="text-sky-500/80 text-xs uppercase tracking-[0.2em] font-black mb-8 border border-sky-500/20 px-4 py-1 rounded-full">Asesores · Edición Octubre</p>
            <form onSubmit={handleLogin} className="w-full space-y-6 relative z-10">
              <div className="relative">
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  placeholder="Tu clave de acceso" 
                  className={`w-full bg-[#0b111b] border ${loginError ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-slate-700 focus:border-sky-500 focus:shadow-[0_0_20px_rgba(14,165,233,0.2)]'} text-white text-center text-lg tracking-widest p-4 rounded-2xl outline-none transition-all shadow-inner`} 
                />
                {loginError && (<div className="absolute -bottom-6 left-0 right-0 text-rose-400 text-xs font-bold animate-in slide-in-from-top-1">Acceso denegado. Intenta de nuevo.</div>)}
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-[#06090f] font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_40px_rgba(14,165,233,0.6)] flex items-center justify-center gap-2 uppercase tracking-widest text-sm hover:-translate-y-1">
                <Unlock className="w-5 h-5"/> Ingresar a mi espacio
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-sky-950/90 text-sky-50 px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(14,165,233,0.3)] flex items-center gap-3 font-bold text-sm tracking-wide animate-toast border border-sky-500/50 backdrop-blur-md w-max">
           {toast.includes('🛡️') || toast.includes('⚠️') ? <AlertCircle className="w-5 h-5 text-cyan-400" /> : <CheckCircle2 className="w-5 h-5 text-sky-400" />}
           {toast}
        </div>
      )}

      <div className="quantum-grid fixed inset-0 pointer-events-none no-print" aria-hidden="true" />

      <div className={`max-w-[1280px] mx-auto py-8 px-4 sm:px-6 lg:px-12 xl:pl-24 relative z-10 w-full min-w-0 transition-opacity duration-700 ${!isAuthenticated ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'}`}>
        
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 no-print w-full min-w-0">
          <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-center sm:justify-start">
             <button onClick={() => setIsAuthenticated(false)} className="bg-slate-900/50 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-colors p-2.5 rounded-xl shadow-inner flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest shrink-0">
               <Lock className="w-4 h-4"/> Salir
             </button>
             {isAdmin && (
                <div className="bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.2)] ">
                  <Eye className="w-4 h-4" /> MODO DIRECTOR
                </div>
             )}
          </div>
          <div className="bg-[#090e17]/80 backdrop-blur-md border border-sky-500/30 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shadow-[0_0_20px_rgba(14,165,233,0.15)] w-full sm:w-auto hover:shadow-[0_0_25px_rgba(14,165,233,0.3)] transition-shadow">
             <div className="flex items-center gap-2">
               <div className="bg-sky-500/20 p-2 rounded-xl border border-sky-500/30 shrink-0"><Activity className="w-5 h-5 text-sky-400" /></div>
               <div>
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">TC de la cotización</div>
                 <div className="text-xs font-bold text-white flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400  shrink-0"></div> Ingreso manual</div>
               </div>
             </div>
             <div className="relative shrink-0 flex-1 sm:flex-none">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500 font-bold text-sm">Bs.</span>
                <input 
                  aria-label="Tipo de cambio de hoy en bolivianos por dólar" type="number" min="0.01" step="0.01" value={tcFlexible || ''} onChange={(e) => setTcFlexible(Number(e.target.value))} 
                  className="bg-[#080d15] border border-slate-700/80 text-sky-400 font-black text-lg rounded-xl pl-10 pr-3 py-2 w-full sm:w-28 text-center outline-none focus:border-sky-500 transition-all shadow-inner focus:shadow-[0_0_15px_rgba(14,165,233,0.2)]" 
                />
             </div>
          </div>
        </div>

        <header className="quantum-hero no-print">
          <div className="quantum-hero-content">
            <div className="quantum-eyebrow"><span /> PLATAFORMA COMERCIAL / ASESORES</div>
            <h1><span>CELINA</span><strong>QUANTUM<span className="quantum-dot">.</span></strong></h1>
            <p>Control de inversión.<br className="sm:hidden" /> Precisión en cada visita.</p>
            <div className="quantum-modules"><span><MapPin size={14}/> EXPLORA</span><span><Calculator size={14}/> COTIZA</span><span><Send size={14}/> COMPARTE</span></div>
          </div>
          <div className="quantum-orbit" aria-hidden="true">
            <svg viewBox="0 0 340 260" fill="none">
              <defs><linearGradient id="quantum-orbit-light" x1="70" y1="30" x2="290" y2="230" gradientUnits="userSpaceOnUse"><stop stopColor="#22d3ee"/><stop offset="1" stopColor="#2563eb"/></linearGradient></defs>
              <circle cx="176" cy="128" r="97" stroke="#1e3449" strokeWidth="1"/>
              <circle cx="176" cy="128" r="78" stroke="#1e3449" strokeDasharray="2 9"/>
              <ellipse cx="176" cy="128" rx="140" ry="39" stroke="url(#quantum-orbit-light)" transform="rotate(-31 176 128)"/>
              <ellipse cx="176" cy="128" rx="118" ry="50" stroke="#1675ac" transform="rotate(42 176 128)"/>
              <path d="M176 56 237 92v72l-61 36-61-36V92l61-36Z" fill="#0b2032" stroke="url(#quantum-orbit-light)" strokeWidth="2"/>
              <path d="m115 92 61 36 61-36M176 128v72M145 74l62 36v72M206 74l-61 36v72M115 128l61 36 61-36" stroke="#2682b5"/>
              <circle cx="290" cy="64" r="5" fill="#67e8f9"/><circle cx="61" cy="181" r="3" fill="#3b82f6"/>
              <path d="M24 43h26m-13-13v26M283 218h26m-13-13v26" stroke="#3b6c8d"/>
              <text x="115" y="241" fill="#5f8fab" fontSize="9" letterSpacing="4">QUANTUM / 2026</text>
            </svg>
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-sky-500/25 bg-slate-900/70 p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div><p className="text-sky-300 font-bold text-sm">Condiciones comerciales desde el 06/10/2026</p><p className="text-slate-400 text-xs mt-1">Descuentos por plazo · Crédito con descuento fijo por valor de lote · TC variable</p></div>
          <label className="text-xs text-slate-300">Fecha del TC <input aria-label="Fecha del tipo de cambio" type="date" value={fechaTC} onChange={e => setFechaTC(e.target.value)} className="ml-2 bg-slate-950 border border-slate-600 rounded-lg p-2 text-white" /></label>
        </div>
        <div className="w-full mb-8 sm:mb-12 no-print relative z-20">
           <MapaEspacial proyectoActivo={proyecto} />
        </div>

        <div ref={formRef} className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start w-full min-w-0">
          
          <div className="lg:col-span-5 glass-panel rounded-2xl overflow-hidden transition-all duration-500 flex flex-col no-print min-w-0 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700/50">
            <div className="bg-[#0d1420]/90 backdrop-blur-xl p-5 sm:p-6 flex items-center justify-between gap-3 relative overflow-hidden border-b border-slate-800 flex-wrap">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/30 shadow-[inset_0_0_15px_rgba(56,189,248,0.15)]">
                  <FileText className="w-5 h-5 text-sky-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-wide text-white drop-shadow-md">Prepara tu propuesta</h2>
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
                    className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all duration-300 flex items-center gap-1 ${usarAPI ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(5,150,105,0.5)]' : 'text-slate-500 hover:text-cyan-400'}`}
                >
                    <Server className="w-3 h-3" /> API Server
                </button>
              </div>
            </div>
            
            <div className="p-5 sm:p-8 flex-1 bg-[#090e17]/60 backdrop-blur-md">
              <form onSubmit={handleProcesar} className="space-y-5 sm:space-y-6">
                <div className="flex bg-[#080d15] p-1.5 rounded-2xl border border-slate-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] mb-6 relative overflow-hidden">
                  <button 
                    type="button" 
                    onClick={() => { setTipoCotizacion('credito'); }} 
                    className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${tipoCotizacion === 'credito' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'text-slate-500 hover:text-cyan-400'}`}
                  >
                    <CreditCard className="w-4 h-4"/> A Crédito
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setTipoCotizacion('contado'); }} 
                    className={`flex-1 py-3 text-xs sm:text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${tipoCotizacion === 'contado' ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-slate-900 shadow-[0_0_20px_rgba(14,165,233,0.5)]' : 'text-slate-500 hover:text-sky-400'}`}
                  >
                    <Wallet className="w-4 h-4 shrink-0"/> Contado / Liquidación
                  </button>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapIcon className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`} /> Regional
                  </label>
                  <div className="relative">
                    <select 
                      value={regional} 
                      onChange={e => setRegional(e.target.value)} 
                      className={`w-full bg-[#0b111b]/50 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none ${tipoCotizacion === 'contado' ? 'focus:border-sky-500 focus:shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]'}`}
                    >
                      {Object.keys(proyectosPorRegional)?.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2.5 relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`} /> Proyecto
                    </label>
                    {cargandoBD ? (
                      <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 flex items-center gap-1.5 border border-cyan-500/30 px-3 py-1.5 rounded-full bg-cyan-500/10 shrink-0">
                        <Loader2 className="w-3 h-3 animate-spin"/> Cargando BD...
                      </span>
                    ) : tieneBD ? (
                      <button 
                        type="button" 
                        onClick={() => setUsarBD(!usarBD)} 
                        className={`text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shrink-0 shadow-sm ${usarBD ? (tipoCotizacion === 'contado' ? 'bg-sky-900/50 text-sky-300 border border-sky-500/40 hover:bg-sky-800/50 hover:shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-800/50 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]') : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50'}`}
                      >
                        {usarBD ? <Database className={`w-3 h-3 ${tipoCotizacion === 'contado' ? 'text-sky-400' : 'text-cyan-400'}`}/> : <Edit2 className="w-3 h-3"/>} BÚSQUEDA INTELIGENTE
                      </button>
                    ) : null}
                  </div>
                  <div className="relative">
                    <select 
                      value={proyecto} 
                      onChange={e => setProyecto(e.target.value)} 
                      className={`w-full bg-[#0b111b]/50 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none ${tipoCotizacion === 'contado' ? 'focus:border-sky-500 focus:shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]'}`}
                    >
                      {proyectosPorRegional[regional]?.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="OTRO">OTRO...</option>
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                  {proyecto === "OTRO" && (
                    <input 
                      type="text" 
                      value={proyectoPersonalizado} 
                      onChange={e => setProyectoPersonalizado(e.target.value)} 
                      className="w-full bg-[#0b111b]/50 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 transition-all font-semibold mt-3 animate-pop focus:shadow-[0_0_15px_rgba(56,189,248,0.15)] focus:border-sky-500" 
                      placeholder="Escribe el nombre del proyecto..." 
                    />
                  )}
                </div>

                <div className="pt-2 sm:pt-3">
                  <div className="bg-[#101925] border border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col gap-3 relative shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]' : 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]'}`} />
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
                        <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`}>UV</label>
                        {modoBD ? (
                           <div className="relative group">
                             <select 
                               value={uv} 
                               onChange={handleUvChange} 
                               className={`w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer transition-colors outline-none ${tipoCotizacion === 'contado' ? 'focus:border-sky-500 focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]'}`}
                             >
                               <option value="" disabled hidden>Selec.</option>
                               {uvsDisponibles?.map(u => <option key={u} value={u}>{u}</option>)}
                             </select>
                             <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`}>
                               <ChevronDown className="w-3 h-3" />
                             </div>
                           </div>
                        ) : (
                          <input 
                            type="text" 
                            value={uv} 
                            onChange={handleUvChange} 
                            placeholder="Ej. 49" 
                            className={`w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600 min-w-0 transition-colors outline-none ${tipoCotizacion === 'contado' ? 'focus:border-sky-500 focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]'}`} 
                          />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`}>MZN</label>
                        {modoBD ? (
                           <div className="relative group">
                             <select 
                               value={mzn} 
                               onChange={handleMznChange} 
                               className={`w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer transition-colors outline-none ${tipoCotizacion === 'contado' ? 'focus:border-sky-500 focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]'}`}
                             >
                               <option value="" disabled hidden>Selec.</option>
                               {mznsDisponibles?.map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                             <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`}>
                               <ChevronDown className="w-3 h-3" />
                             </div>
                           </div>
                        ) : (
                          <input 
                            type="text" 
                            value={mzn} 
                            onChange={handleMznChange} 
                            placeholder="Ej. 6" 
                            className={`w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600 min-w-0 transition-colors outline-none ${tipoCotizacion === 'contado' ? 'focus:border-sky-500 focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]'}`} 
                          />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`}>LOTE</label>
                        {modoBD ? (
                           <div className="relative group">
                             <select 
                               value={lote} 
                               onChange={handleLoteChange} 
                               className={`w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer transition-colors shadow-inner outline-none ${tipoCotizacion === 'contado' ? 'focus:border-sky-500 focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]'}`}
                             >
                               <option value="" disabled hidden>Selec.</option>
                               {lotesDisponibles?.map(l => <option key={l} value={l}>{l}</option>)}
                             </select>
                             <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`}>
                               <ChevronDown className="w-3 h-3" />
                             </div>
                           </div>
                        ) : (
                          <input 
                            type="text" 
                            value={lote} 
                            onChange={handleLoteChange} 
                            placeholder="Ej. 9" 
                            className={`w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600 min-w-0 transition-colors shadow-inner outline-none ${tipoCotizacion === 'contado' ? 'focus:border-sky-500 focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]' : 'focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]'}`} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 relative mt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutTemplate className={`w-3 h-3 shrink-0 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`} /> 
                      Categoría del Lote
                    </label>
                    <input 
                      type="text" 
                      value={categoria} 
                      onChange={e => setCategoria(e.target.value)} 
                      placeholder="Ej. LOTE S/CALLE ESQ. A" 
                      className={`w-full rounded-xl p-3.5 text-xs sm:text-sm font-semibold placeholder-slate-600 outline-none transition-colors ${modoBD ? (tipoCotizacion==='contado' ? 'bg-sky-950/30 border border-sky-500/40 text-sky-100 shadow-[inset_0_0_15px_rgba(56,189,248,0.1)] focus:border-sky-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-cyan-950/30 border border-cyan-500/40 text-cyan-100 shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]') : 'bg-[#0b111b] border border-slate-700 text-white'}`} 
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-4">
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5">
                        <MapIcon className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`} /> 
                        Superficie <span className="text-slate-600 normal-case">(m²)</span>
                      </span>
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={superficie} 
                      onChange={e => setSuperficie(e.target.value)} 
                      placeholder="Ej. 240" 
                      className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 transition-all outline-none bg-[#0b111b] border border-slate-700 shadow-inner ${tipoCotizacion === 'contado' ? 'text-sky-400 focus:border-sky-500 focus:shadow-[0_0_20px_rgba(56,189,248,0.15)]' : 'text-cyan-400 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]'}`} 
                    />
                  </div>
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`} /> 
                        Precio <span className="text-slate-600 normal-case">/ m²</span>
                      </span>
                    </label>
                    <input 
                      type="number" 
                      required 
                      value={precio} 
                      onChange={e => setPrecio(e.target.value)} 
                      placeholder="Ej. 145" 
                      className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 transition-all outline-none bg-[#0b111b] border border-slate-700 shadow-inner ${tipoCotizacion === 'contado' ? 'text-sky-400 focus:border-sky-500 focus:shadow-[0_0_20px_rgba(56,189,248,0.15)]' : 'text-cyan-400 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]'}`} 
                    />
                  </div>
                </div>

                <div className={`bg-[#0b111b]/50 border p-4 sm:p-5 rounded-xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] relative overflow-hidden group backdrop-blur-md mt-4 ${tipoCotizacion === 'contado' ? 'border-sky-500/40 hover:border-sky-500/60' : 'border-cyan-500/40 hover:border-cyan-500/60'} transition-colors`}>
                  <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl transition-colors ${tipoCotizacion === 'contado' ? 'bg-sky-500/10 group-hover:bg-sky-400/20' : 'bg-cyan-500/10 group-hover:bg-cyan-400/20'}`}></div>
                  <div className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 mb-4 ${tipoCotizacion === 'contado' ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`}>
                    <div className={`p-1.5 rounded-lg border shadow-sm shrink-0 ${tipoCotizacion === 'contado' ? 'bg-sky-900/50 border-sky-500/50' : 'bg-cyan-900/50 border-cyan-500/50'}`}>
                      <Gift className={`w-4 h-4 ${tipoCotizacion === 'contado' ? 'text-sky-300' : 'text-cyan-300'}`} />
                    </div>
                    {tipoCotizacion === 'contado' ? 'Esquema de Descuento Promocional' : 'Descuentos Exclusivos (Crédito)'}
                  </div>
                  
                  <div className="relative z-10">
                    {tipoCotizacion === 'contado' && (
                      <div className="space-y-3">
                        <label className="text-[10px] sm:text-[11px] font-bold text-slate-300 w-max uppercase tracking-widest flex items-center gap-2">
                          <Timer className="w-4 h-4 text-sky-400"/> Plazo de Pago o Liquidación
                        </label>
                        <div className="relative">
                          <select 
                            value={plazoLiquidacion} 
                            onChange={(e) => setPlazoLiquidacion(e.target.value)} 
                            className="w-full bg-[#0b111b] border border-sky-500/50 text-sky-100 rounded-xl p-3.5 outline-none transition-all font-bold text-sm shadow-[0_0_15px_rgba(56,189,248,0.1)] appearance-none cursor-pointer focus:ring-1 focus:ring-sky-500 focus:border-sky-400" 
                          >
                            <option value="5">{`Primeros 5 días (-25% | TC equivalente: ${(tcFlexible * 0.75).toFixed(2)})`}</option>
                            <option value="30">{`De 6 a 30 días (-20% | TC equivalente: ${(tcFlexible * 0.80).toFixed(2)})`}</option>
                            <option value="60">{`De 31 a 60 días (-10% | TC equivalente: ${(tcFlexible * 0.90).toFixed(2)})`}</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-sky-500">
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    )}
                    {tipoCotizacion === 'credito' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors w-max">
                            <input type="checkbox" checked={aplicarDescuentoCredito} onChange={e => setAplicarDescuentoCredito(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-cyan-500 shrink-0" /> Descuento fijo por lote ($us)
                          </label>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            disabled={!aplicarDescuentoCredito} 
                            value={descuentoCreditoActual} 
                            readOnly aria-label="Descuento fijo a crédito según el valor total del lote" 
                            className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescuentoCredito ? 'bg-[#0b111b] border border-cyan-500 text-white focus:ring-1 focus:ring-cyan-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} 
                          />
                          <p className="text-[9px] text-slate-500">Equivalente informativo: $us {formatMoney(descuentoM2InformativoActual)}/m²</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {tipoCotizacion === 'credito' && <label className="block text-xs text-slate-300 mt-4">Primer mes de pago propuesto (confirmar con el cliente)
                  <input type="month" min={fechaTC.slice(0, 7)} value={primerMesPago} onChange={e => setPrimerMesPago(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl p-3 text-white" />
                </label>}
                {tipoCotizacion === 'credito' && (
                <div className="grid grid-cols-12 gap-4 sm:gap-5 mt-4 animate-in slide-in-from-top-4 fade-in duration-300">
                  <div className="col-span-12 md:col-span-8 bg-cyan-950/30 border border-cyan-500/40 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 relative shadow-[inset_0_0_15px_rgba(34,211,238,0.1)]">
                    <div className="space-y-2">
                      <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${modoInicial === 'porcentaje' ? 'text-cyan-400' : 'text-slate-500'}`}>
                        <Percent className="w-3.5 h-3.5 shrink-0" /> Inicial (%)
                      </label>
                      <input 
                        type="number" step="0.01" min="0" value={inicialPorcentaje} 
                        onFocus={() => setModoInicial('porcentaje')}
                        onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                        placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 5'} 
                        className={`w-full bg-[#0b111b] border rounded-xl p-3 sm:p-3.5 outline-none transition-all font-bold text-sm sm:text-base placeholder-slate-600 shadow-inner ${modoInicial === 'porcentaje' ? 'border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)] text-white' : 'border-slate-700 text-slate-500'}`} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${modoInicial === 'monto' ? 'text-cyan-400' : 'text-slate-500'}`}>
                        <DollarSign className="w-3.5 h-3.5 shrink-0" /> Monto ($us)
                      </label>
                      <input 
                        type="number" step="0.01" min="0" value={inicialMonto} 
                        onFocus={() => setModoInicial('monto')}
                        onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} 
                        placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 500'} 
                        className={`w-full bg-[#0b111b] border rounded-xl p-3 sm:p-3.5 outline-none transition-all font-black text-sm sm:text-base placeholder-slate-600 shadow-inner ${modoInicial === 'monto' ? 'border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)] text-cyan-400' : 'border-slate-700 text-slate-500'}`} 
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-12 md:col-span-4 space-y-2 mt-2 md:mt-0">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-cyan-400 shrink-0" /> Plazo
                    </label>
                    <div className="relative h-[calc(100%-1.5rem)]">
                      <select 
                        required value={años} onChange={e => setAños(e.target.value)} 
                        className="w-full bg-[#0b111b]/50 border border-slate-700 text-white rounded-2xl p-3.5 outline-none transition-all font-bold text-sm sm:text-base appearance-none pr-10 cursor-pointer h-full min-h-[50px] focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      >
                        <option value="" disabled hidden>Selec.</option>
                        {[...Array(14)]?.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-500">
                        <ChevronRight className="w-5 h-5 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
                )}

                <button 
                  type="submit" disabled={isCalculating} 
                  className={`w-full mt-6 sm:mt-8 bg-gradient-to-r ${tipoCotizacion === 'contado' ? 'from-sky-500 via-blue-500 to-sky-400 hover:from-sky-400 hover:via-blue-400 hover:to-sky-300 shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:shadow-[0_0_45px_rgba(56,189,248,0.6)]' : 'from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:via-blue-400 hover:to-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_45px_rgba(34,211,238,0.6)]'} text-[#06090f] font-black py-4 sm:py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-widest text-sm sm:text-lg relative overflow-hidden group ${isCalculating ? 'opacity-80 scale-95' : 'hover:-translate-y-1'}`}
                >
                  <div className="absolute inset-0 bg-white/40 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                  <span className="relative z-10 flex items-center gap-2 sm:gap-3 drop-shadow-sm">
                    {isCalculating ? (
                      <><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin shrink-0 text-[#06090f]" /> Renderizando...</>
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
              <div className="glass-panel rounded-2xl h-full min-h-[400px] sm:min-h-[600px] flex flex-col items-center justify-center text-slate-500 p-6 sm:p-10 text-center transition-all duration-500 border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#0d1420]/60 backdrop-blur-xl">
                <div className="relative">
                  <div className={`absolute inset-0 rounded-full blur-2xl  ${tipoCotizacion === 'contado' ? 'bg-sky-500/30' : 'bg-cyan-500/30'}`}></div>
                  <div className={`bg-[#0b111b] p-6 sm:p-8 rounded-full mb-6 sm:mb-8 shadow-[0_0_40px_rgba(14,165,233,0.3)] border relative z-10 ${tipoCotizacion === 'contado' ? 'border-sky-500/50' : 'border-cyan-500/50'}`}>
                    {isCalculating ? <Loader2 className={`w-12 h-12 sm:w-16 sm:h-16 animate-spin ${tipoCotizacion === 'contado' ? 'text-sky-400' : 'text-cyan-400'}`} /> : <Calculator className={`w-12 h-12 sm:w-16 sm:h-16 ${tipoCotizacion === 'contado' ? 'text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]' : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]'}`} />}
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
              <div className="glass-panel rounded-xl sm:rounded-2xl p-5 sm:p-8 animate-in fade-in slide-in-from-bottom-12 duration-700 ease-out relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-600/50 bg-[#0d1420]/95 backdrop-blur-2xl">
                <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none ${resultado.tipoCotizacion === 'contado' ? 'bg-sky-500/15' : 'bg-cyan-500/15'}`}></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-slate-700 gap-4 relative z-10">
                  <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 tracking-tight drop-shadow-sm">
                    <div className={`p-2 rounded-xl text-[#0b111b] shadow-[0_0_15px_rgba(255,255,255,0.2)] shrink-0 bg-gradient-to-br ${resultado.tipoCotizacion === 'contado' ? 'from-sky-400 to-blue-500' : 'from-cyan-400 to-blue-500'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div> 
                    Tu propuesta de inversión
                  </h2>
                  <span className={`border text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center gap-2 w-full sm:w-auto ${resultado.tipoCotizacion === 'contado' ? 'bg-sky-950/60 text-sky-400 border-sky-500/50' : 'bg-cyan-950/60 text-cyan-400 border-cyan-500/50'}`}>
                    <span className={`w-2 h-2 rounded-full  shrink-0 ${resultado.tipoCotizacion === 'contado' ? 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,1)]' : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]'}`}></span> 
                    {resultado.tipoCotizacion === 'contado' ? 'Liquidación / Contado' : 'A Crédito'}
                  </span>
                </div>
                
                <div className="relative z-10 space-y-6">
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#080d15]/80 p-4 rounded-2xl border border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-600 shrink-0 shadow-sm">
                          <MapPin className={`w-5 h-5 ${resultado.tipoCotizacion === 'contado' ? 'text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]' : 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Proyecto</div>
                          <div className="text-white font-black text-lg uppercase leading-none truncate drop-shadow-sm">{resultado.proyecto}</div>
                          {resultado.categoria && resultado.categoria !== "ESTÁNDAR" && (
                            <div className="text-[8px] text-cyan-400 font-bold mt-1 tracking-wider truncate bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20 w-max">{resultado.categoria}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 w-full sm:w-auto">
                        <div className="text-center px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700 flex-1 sm:flex-none shadow-inner">
                          <div className="text-[8px] font-extrabold text-slate-500 uppercase mb-1">UV</div>
                          <div className={`${resultado.tipoCotizacion === 'contado' ? 'text-sky-400' : 'text-cyan-400'} font-black text-base leading-none truncate`}>{resultado.uv || '-'}</div>
                        </div>
                        <div className="text-center px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700 flex-1 sm:flex-none shadow-inner">
                          <div className="text-[8px] font-extrabold text-slate-500 uppercase mb-1">MZN</div>
                          <div className={`${resultado.tipoCotizacion === 'contado' ? 'text-sky-400' : 'text-cyan-400'} font-black text-base leading-none truncate`}>{resultado.mzn || '-'}</div>
                        </div>
                        <div className={`text-center px-4 py-2 rounded-xl border flex-1 sm:flex-none shadow-[0_0_15px_rgba(0,0,0,0.5)] ${resultado.tipoCotizacion === 'contado' ? 'bg-sky-950/60 border-sky-500/50' : 'bg-cyan-950/60 border-cyan-500/50'}`}>
                          <div className={`text-[8px] font-extrabold uppercase mb-1 ${resultado.tipoCotizacion === 'contado' ? 'text-sky-400' : 'text-cyan-400'}`}>LOTE</div>
                          <div className="text-white font-black text-base leading-none truncate">{resultado.lote || '-'}</div>
                        </div>
                      </div>
                  </div>

                  <div className="mb-5 p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 text-sm text-slate-200 leading-relaxed">
                    <strong>TC cotizado el {fechaLegible(resultado.fechaTC)}: Bs {resultado.tcOriginal.toFixed(2)} / US$ 1.</strong>{' '}
                    {resultado.tipoCotizacion === 'credito' ? 'Inicial al TC del día de la venta. Mensualidades fijas en dólares; cada pago en bolivianos se convierte al TC vigente de su fecha. Las equivalencias futuras en Bs son referenciales.' : 'El descuento se aplica una sola vez: al precio o como TC equivalente. Ambas opciones dan el mismo total; no se combinan con el descuento a crédito. El TC de pago debe confirmarse.'}
                  </div>
                  {/* BLOQUE AL CONTADO REDISEÑADO CON COMPARACIÓN CONMUTATIVA */}
                  {resultado.tipoCotizacion === 'contado' && (
                    <div className="animate-in zoom-in-95 duration-500 space-y-6">
                       <div className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-[#080d15] to-[#080d15] p-8 sm:p-12 rounded-xl shadow-[0_0_50px_rgba(14,165,233,0.15)] border border-sky-500/50 group text-center">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                          <div className="absolute -bottom-20 -right-20 opacity-10"><Wallet className="w-64 h-64 text-sky-400" /></div>
                          <div className="relative z-10 flex flex-col items-center justify-center">
                             
                             <div className="inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl bg-sky-950/80 border border-sky-500/50 shadow-[0_0_20px_rgba(56,189,248,0.2)] mb-6">
                               <span className="text-sky-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 <Timer className="w-4 h-4 text-sky-400"/> Liquidación: {resultado.plazoLiquidacionVisual}
                               </span>
                             </div>

                             <div className="text-[3.5rem] sm:text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] leading-none mb-3">
                               $us {resultado.valorFinal}
                             </div>
                             
                             {/* DEMOSTRADOR DE PROPIEDAD CONMUTATIVA */}
                             <div className="mt-8 w-full max-w-3xl">
                               <div className="flex items-center justify-center gap-3 text-sky-400 text-xs font-black uppercase tracking-widest mb-4">
                                 <Scale className="w-4 h-4" /> Un beneficio · Dos formas equivalentes
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 
                                 {/* DEMO A: DESC. AL PRECIO */}
                                 <div className="bg-[#101925] border border-sky-500/30 p-5 rounded-2xl relative shadow-[0_0_20px_rgba(14,165,233,0.1)] text-left hover:border-sky-500/50 transition-colors">
                                   <div className="text-sky-400 font-bold text-[10px] tracking-widest uppercase mb-4 text-center border-b border-sky-500/20 pb-2">
                                     Opción A: Descuento al Precio
                                   </div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Precio Lista</span> <span className="font-bold text-slate-200">$us {resultado.valorOriginal}</span></div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Descuento ({(resultado.descPctAplicado * 100).toFixed(0)}%)</span> <span className="text-cyan-400 font-bold">-$us {resultado.ahorroTotal}</span></div>
                                   <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2 mb-1.5"><span className="text-slate-300 font-bold">Precio Final</span> <span className="font-black text-white">$us {resultado.valorFinal}</span></div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">T.C. Referencial</span> <span className="font-bold text-slate-200">x {resultado.tcOriginal}</span></div>
                                   <div className="flex justify-between text-lg border-t border-sky-500/50 pt-2 mt-2 bg-sky-950/20 -mx-5 -mb-5 px-5 pb-5 rounded-b-2xl">
                                     <span className="text-sky-400 font-black mt-2">Total Bs.</span> 
                                     <span className="font-black text-sky-300 mt-2">Bs. {resultado.totalBsA}</span>
                                   </div>
                                 </div>

                                 {/* DEMO B: DESC. AL TC */}
                                 <div className="bg-[#101925] border border-cyan-500/30 p-5 rounded-2xl relative shadow-[0_0_20px_rgba(6,182,212,0.1)] text-left hover:border-cyan-500/50 transition-colors">
                                   <div className="text-cyan-400 font-bold text-[10px] tracking-widest uppercase mb-4 text-center border-b border-cyan-500/20 pb-2">
                                     Opción B: Descuento al T.C.
                                   </div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">T.C. Referencial</span> <span className="font-bold text-slate-200">{resultado.tcOriginal}</span></div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Descuento ({(resultado.descPctAplicado * 100).toFixed(0)}%)</span> <span className="text-cyan-400 font-bold">-{resultado.descPctAplicado * 100}%</span></div>
                                   <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2 mb-1.5"><span className="text-slate-300 font-bold">TC equivalente</span> <span className="font-black text-white">{resultado.tcEfectivo.toFixed(2)}</span></div>
                                   <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Precio Lista</span> <span className="font-bold text-slate-200">x $us {resultado.valorOriginal}</span></div>
                                   <div className="flex justify-between text-lg border-t border-cyan-500/50 pt-2 mt-2 bg-cyan-950/20 -mx-5 -mb-5 px-5 pb-5 rounded-b-2xl">
                                     <span className="text-cyan-400 font-black mt-2">Total Bs.</span> 
                                     <span className="font-black text-cyan-300 mt-2">Bs. {resultado.totalBsB}</span>
                                   </div>
                                 </div>

                               </div>
                             </div>

                             <div className="mt-8 flex justify-between w-full max-w-xl mx-auto border-t border-sky-500/30 pt-6">
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
                        <div className="bg-[#101925] p-5 rounded-2xl border border-slate-700 text-center sm:text-left relative shadow-lg">
                          <div className="text-cyan-500 text-[10px] font-extrabold uppercase tracking-widest">Inversión Total</div>
                          <div className="text-3xl font-black text-white mt-1">$us {resultado.valorFinal}</div>
                          <div className="text-[11px] font-bold text-cyan-500 mt-1 truncate">Referencia al TC cotizado: Bs. {resultado.valorFinalBs}</div>
                          {resultado.ahorroTotalRaw > 0 && (
                            <div className="mt-2 text-[9px] text-cyan-400 font-bold bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/40 inline-block uppercase shadow-sm">
                              Descuento fijo incluido: $us {resultado.ahorroTotal} · Equiv. $us {formatMoney(resultado.descuentoM2Equivalente)}/m²
                            </div>
                          )}
                        </div>
                        <div className="bg-[#101925] p-5 rounded-2xl border border-slate-700 text-center sm:text-left relative shadow-lg">
                          <div className="text-cyan-400 text-[10px] font-extrabold uppercase tracking-widest">Cuota Inicial ({resultado.inicialPct}%)</div>
                          <div className="text-3xl font-black text-white mt-1">$us {resultado.inicial}</div>
                          <div className="text-[11px] font-bold text-cyan-500 mt-1 truncate">Al TC de la venta: Bs. {resultado.inicialBs}</div>
                        </div>
                      </div>

                      {/* ACORDEÓN DE PAGOS */}
                      <div className="mt-8 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(6,182,212,0.15)] bg-[#080d15] w-full">
                          <div className="p-5 border-b border-slate-800 flex flex-col justify-between items-start bg-gradient-to-r from-cyan-950/40 to-transparent">
                                <h3 className="text-white font-black text-lg flex items-center gap-2">
                                  <Calendar className="w-5 h-5 text-cyan-400"/> Proyección Financiera Estructural
                                </h3>
                                <p className="text-slate-400 text-xs mt-2">
                                  Primer mes propuesto: <strong className="text-cyan-400">{resultado.planPagosDetallado?.[0]?.mesLabel}</strong>. Confirmar al acordar el cronograma.
                                </p>
                          </div>
                          
                          <button onClick={() => setExpandedPlan(!expandedPlan)} className="w-full bg-[#101925] p-4 flex justify-between items-center hover:bg-slate-900 transition-colors border-b border-slate-800">
                             <span className="text-cyan-400 font-bold text-sm tracking-widest uppercase">Ver mensualidades fijas en dólares</span>
                             <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${expandedPlan ? 'rotate-180' : ''}`} />
                          </button>

                          {expandedPlan && (
                            <div className="overflow-y-auto max-h-[350px] custom-scrollbar p-0 bg-[#0b111b]">
                              <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="sticky top-0 bg-[#090e17] z-30 border-b border-slate-700">
                                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                                    <th className="p-4">Nro.</th>
                                    <th className="p-4">Mes de Pago</th>
                                    <th className="p-4 text-cyan-400">Cuota Fija ($us)</th>
                                  </tr>
                                </thead>
                                <tbody className="font-semibold relative z-10">
                                  {resultado.planPagosDetallado?.map((row, i) => (
                                    <tr key={i} className="border-b border-slate-800/50 text-center hover:bg-slate-800/60 transition-colors">
                                      <td className="p-4 text-slate-600 font-bold">{row.nro}</td>
                                      <td className="p-4 text-slate-300">{row.mesLabel}</td>
                                      <td className="p-4 font-black text-cyan-400 text-sm">$ {Number(row.cuotaUsd).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                      </div>

                      {/* MOTOR DE PLAZOS ALTERNATIVOS 1 A 14 AÑOS */}
                      <div className="mt-8 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-[#101925] w-full">
                        <div className="bg-[#0b111b] p-4 border-b border-cyan-500/30 flex justify-between items-center">
                          <h3 className="text-slate-200 font-bold text-sm tracking-wide flex items-center gap-2 drop-shadow-sm">
                            <Activity className="w-4 h-4 text-cyan-500 shrink-0 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"/> Resumen de Plazos Alternativos
                          </h3>
                        </div>
                        <div className="p-3 sm:p-5 max-h-[350px] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 pb-3 border-b border-slate-800 text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest text-center sticky top-0 bg-[#101925] z-10">
                              <div>Plazo</div>
                              <div className="text-cyan-400">Cuota ($us)</div>
                              <div className="text-cyan-400">Bs. referenciales</div>
                            </div>
                            <div className="pt-2">
                              {resultado.planPlazosAlternativos?.map((plan, i) => (
                                <div key={i} className={`grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl text-center text-xs sm:text-sm font-bold transition-all duration-300 ${plan.isCurrent ? 'bg-cyan-950/80 border border-cyan-500/60 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02] transform my-2' : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'}`}>
                                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                    {plan.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400  hidden sm:inline-block shrink-0 shadow-[0_0_8px_rgba(34,211,238,1)]"></span>} 
                                    <span className="truncate">{plan.año} {plan.año === 1 ? 'Año' : 'Años'}</span>
                                  </div>
                                  <div className={`font-black truncate ${plan.isCurrent ? 'text-white' : 'text-cyan-50'}`}>$ {plan.cuotaUsd}</div>
                                  <div className={`truncate ${plan.isCurrent ? 'text-cyan-400' : 'text-slate-400'}`}>Bs. {plan.cuotaBs}</div>
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
                          className={`flex-1 bg-[#0b111b] border font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-inner ${resultado.tipoCotizacion === 'contado' ? 'border-sky-500/60 text-sky-400 hover:bg-sky-900/30' : 'border-cyan-500/60 text-cyan-400 hover:bg-cyan-900/30'}`}
                        >
                          {copiado ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />} {copiado ? 'COPIADO' : 'COPIAR TEXTO'}
                        </button>
                        <button 
                          onClick={enviarWhatsApp} 
                          className="flex-1 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#15873e] text-[#06090f] font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:-translate-y-1 text-sm uppercase tracking-wider"
                        >
                          <Send className="w-5 h-5" /> WhatsApp
                        </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <footer className="quantum-footer no-print"><span>CELINA <strong>QUANTUM</strong></span><span>Diseño y desarrollo · <strong>OSCAR SARAVIA ®</strong></span></footer>
      </div>
    </div>
  );
}
