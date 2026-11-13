// Celina Quantum v3.0 · Edición Noviembre 2026
// Reemplazar src/App.tsx. Conserva las fuentes API/lotes.json y los GeoJSON de public/.
// Compatible con react-map-gl 7 (entrada /maplibre) y maplibre-gl 4.
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Calculator, Send, Map as MapIcon, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, MapPin, Gift, TrendingUp, ShieldCheck, ChevronDown, 
  Database, Edit2, LayoutTemplate, Loader2, AlertCircle, Scale, Activity, Wallet, CreditCard, Lock, Unlock,
  Maximize, Minimize, Eye, Crosshair, Server, Timer, Sparkles, User
} from "lucide-react";
import Map, { Source, Layer, GeolocateControl, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ============================================================================
// BASE DE DATOS DE REGIONALES Y PROYECTOS
// ============================================================================
const PROYECTOS_POR_REGIONAL: Record<string, string[]> = {
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

const ALIAS_PROYECTOS: Record<string, string[]> = {
  "URUBÓ NORTE": ["CELINA URUBO DEL NORTE", "URUBO NORTE"],
  "ROSA RODALI": ["ROSA RODALI", "ROSA DE RODALI", "CELINA ROSA RODALI"],
  "CELINA PAILÓN": ["CELINA PAILON", "PAILON"],
  "EL ENCANTO": ["EL ENCANTO", "CELINA EL ENCANTO"],
  "EL ENCANTO FASE 2": ["EL ENCANTO FASE 2", "EL ENCANTO 2", "EL ENCANTO FASE II", "CELINA EL ENCANTO FASE 2"],
  "SANTA ROSA - FASE 1": ["SANTA ROSA FASE 1", "SANTA ROSA - FASE 1", "SANTA ROSA 1"],
  "SANTA ROSA - FASE 2": ["SANTA ROSA FASE 2", "SANTA ROSA - FASE 2", "SANTA ROSA 2"],
  "SANTA ROSA - FASE 3": ["SANTA ROSA FASE 3", "SANTA ROSA - FASE 3", "SANTA ROSA 3"],
  "TAMARINDO": ["TAMARINDO", "CELINA TAMARINDO"],
  "JARDINES DEL BOSQUE": ["JARDINES DEL BOSQUE"],
  "EL PORVENIR": ["EL PORVENIR", "CELINA EL PORVENIR"],
  "EL PORVENIR FASE 2": ["EL PORVENIR FASE 2", "EL PORVENIR 2", "EL PORVENIR FASE II", "CELINA EL PORVENIR FASE 2"],
  "MUYURINA": ["CELINA MUYURINA", "MUYURINA"],
  "LOS JARDINES": ["LOS JARDINES", "CELINA LOS JARDINES"],
  "EL RENACER": ["EL RENACER", "CELINA EL RENACER"],
  "CELINA 3": ["CELINA III", "CELINA 3"],
  "CELINA 4": ["CELINA IV", "CELINA 4"],
  "CELINA 5": ["CELINA V", "CELINA 5"],
  "RANCHO NUEVO": ["CELINA - RANCHO NUEVO", "RANCHO NUEVO", "CELINA RANCHO NUEVO"],
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

// ============================================================================
// MOTOR DE REGLAS COMERCIALES: CAMPAÑA NOVIEMBRE 2026
// ============================================================================
const fechaBolivia = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const fechaLegible = (iso: string) => iso.split('-').reverse().join('/');

const PROMOCION = {
  desde: '2026-11-01',
  contado: {
    '1': { pct: 0.18, label: 'Venta al contado (cliente nuevo)' },
    '5': { pct: 0.15, label: 'Liquidación en 5 días (cliente nuevo)' },
    '30': { pct: 0.10, label: 'Liquidación en 30 días (cliente nuevo)' }
  } as Record<string, { pct: number; label: string }>
};

// Índice de columna según el Valor Contado del Lote ($us)
const obtenerIndiceTramoValor = (valorTotal: number): number => {
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) return -1;
  if (valorTotal <= 7500) return 0;
  if (valorTotal <= 15000) return 1;
  if (valorTotal <= 22500) return 2;
  if (valorTotal <= 30000) return 3;
  if (valorTotal <= 45000) return 4;
  return 5;
};

// 2. VENTA A PLAZOS: Descuento base por valor contado del lote ($us)
const DESCUENTOS_PLAZO_POR_TRAMO = [250, 500, 800, 1200, 1500, 1800];
const descuentoCreditoPorValor = (valorTotal: number): number => {
  const idx = obtenerIndiceTramoValor(valorTotal);
  return idx >= 0 ? DESCUENTOS_PLAZO_POR_TRAMO[idx] : 0;
};

// 3. ANEXO III: Descuento adicional por incremento de cuota inicial (en puntos porcentuales)
export type EscalaIncremento = 'ninguno' | '3_599' | '6_799' | '8_mas';

const MATRIZ_ANEXO_III: Record<Exclude<EscalaIncremento, 'ninguno'>, number[]> = {
  '3_599': [100, 170, 270, 400, 500, 600],
  '6_799': [150, 250, 400, 600, 750, 900],
  '8_mas': [200, 330, 530, 800, 1000, 1200]
};

const ETIQUETAS_ANEXO_III: Record<EscalaIncremento, string> = {
  'ninguno': 'Sin incremento adicional',
  '3_599': 'Incremento de 3% a 5,99% (+pp)',
  '6_799': 'Incremento de 6% a 7,99% (+pp)',
  '8_mas': 'Incremento de 8% o más (+pp)'
};

const descuentoPorIncrementoInicial = (valorTotal: number, escala: EscalaIncremento): number => {
  if (escala === 'ninguno') return 0;
  const idx = obtenerIndiceTramoValor(valorTotal);
  if (idx < 0) return 0;
  return MATRIZ_ANEXO_III[escala]?.[idx] || 0;
};

const clasificarIncrementoPuntos = (puntosAdicionales: number): EscalaIncremento => {
  if (!Number.isFinite(puntosAdicionales) || puntosAdicionales < 3) return 'ninguno';
  if (puntosAdicionales < 6) return '3_599';
  if (puntosAdicionales < 8) return '6_799';
  return '8_mas';
};

const siguienteMes = () => {
  const [y, m] = fechaBolivia().split('-').map(Number);
  return `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}`;
};

const archivoPlano = (proyecto: string) => {
  const especiales: Record<string, string> = {
    'URUBÓ NORTE': 'urubó_norte.geojson',
    'SANTA ROSA - FASE 1': 'santa_rosa_-_fase_1.geojson',
    'SANTA ROSA - FASE 2': 'santa_rosa_-_fase_2.geojson',
    'SANTA ROSA - FASE 3': 'santa_rosa_-_fase_3.geojson'
  };
  return '/' + encodeURIComponent(especiales[proyecto] || `${proyecto.toLowerCase().replace(/\s+/g, '_')}.geojson`);
};

// Caché en memoria para acelerar el cambio de proyectos en campo
const cacheLotesAPI = new Map<string, LoteData[]>();
let cacheLotesLocal: LoteData[] | null = null;

// ============================================================================
// VISOR ESPACIAL GEORREFERENCIADO
// ============================================================================
const MapaEspacial = React.memo(({ proyectoActivo }: { proyectoActivo: string }) => {
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
    if (boundsRef.current && mapRef.current) {
      mapRef.current.fitBounds(boundsRef.current, { padding: 45, maxZoom: 17, pitch: 0, duration: 900 });
    }
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    setCargando(true); setPlano(null); setErrorPlano(''); boundsRef.current = null;
    (async () => {
      try {
        const res = await fetch(archivoPlano(proyectoActivo), { signal: abort.signal });
        if (!res.ok) throw new Error('No se encontró el archivo del plano.');
        const data = await res.json();
        if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
          throw new Error('El archivo no es una colección GeoJSON válida.');
        }
        let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
        const visit = (coords: any) => {
          if (!Array.isArray(coords)) return;
          if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            const [lng, lat] = coords;
            if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
              throw new Error('El plano debe usar coordenadas WGS84 en longitud y latitud.');
            }
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
      } finally {
        if (!abort.signal.aborted) setCargando(false);
      }
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
    <section className={fullscreen ? 'fixed inset-0 z-[99999] bg-slate-950 flex flex-col h-[100dvh]' : 'relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-slate-950 shadow-2xl flex flex-col h-[500px] sm:h-[580px]'} aria-label="Visor del proyecto">
      <div className="p-4 bg-slate-900/95 border-b border-slate-700 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400"/>{proyectoActivo}</h3>
          <p className="text-slate-400 text-xs mt-1">Plano de referencia geoespacial · Vista satelital</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={localizar} className="px-3 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 hover:bg-cyan-300 transition-colors"><Crosshair className="w-4 h-4"/>{siguiendo ? 'Pausar GPS' : 'Mi ubicación'}</button>
          <button type="button" disabled={!plano} onClick={verProyecto} className="px-3 py-2.5 rounded-xl border border-slate-600 text-white text-xs disabled:opacity-40 hover:bg-slate-800 transition-colors">Centrar plano</button>
          <button type="button" onClick={() => setFullscreen(!fullscreen)} aria-label={fullscreen ? 'Cerrar pantalla completa' : 'Pantalla completa'} className="p-2.5 rounded-xl border border-slate-600 text-white hover:bg-slate-800 transition-colors">{fullscreen ? <Minimize className="w-4 h-4"/> : <Maximize className="w-4 h-4"/>}</button>
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
         { setReady(true); setErrorMapa(''); }} onError={() => setErrorMapa('No se pudo cargar parte del mapa. Revisa tu conexión.')} style={{ width: '100%', height: '100%' }}>
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
      <div role="status" aria-live="polite" className="px-4 py-3 text-xs text-slate-300 bg-slate-900 flex flex-wrap justify-between gap-2">
        <span>{siguiendo ? '● ' : ''}{gps}{precision !== null ? ` · Precisión aproximada ±${Math.ceil(precision)} m` : ''}</span>
        <span className="text-slate-500">Ubicación orientativa · Consulta el lote en el formulario</span>
      </div>
    </section>
  );
});

// ============================================================================
// INTERFACES DE DATOS ESTRUCTURADOS
// ============================================================================
interface LoteData {
  proyecto: string; uv: string; mzn: string; lote: string; superficie: number; precio: number;
  estado: string; categoria: string; vendedor: string;
  api_cuota_inicial: number; api_initial_tipo: string; api_initial_pct: number; api_initial_valor: number;
}

interface ResultadoData {
  nombreCliente: string; fechaTC: string; primerMesPago: string; tipoCotizacion: string; regional: string; proyecto: string;
  uv: string; mzn: string; lote: string; superficie: number; categoria: string;
  valorOriginalRaw: number; valorOriginal: string; valorFinal: string; valorFinalBs: string;
  ahorroTotalRaw: number; ahorroTotal: string; inicialRaw: number; inicial: string; inicialBs: string;
  inicialPct: string; saldoRaw: number; mensualRaw: number; mensual: string; mensualBs: string; plazo: number;
  planPagosDetallado: { nro: number; mesLabel: string; cuotaUsd: number }[];
  planPlazosAlternativos: { año: number; cuotaUsd: string; cuotaBs: string; isCurrent: boolean }[];
  descPctAplicado: number; tcOriginal: number; tcEfectivo: number; totalBsA: string; totalBsB: string;
  plazoLiquidacionVisual: string; descuentoFijoAplicado: number; descuentoAnexoIIIAplicado: number;
  escalaAnexoIIILabel: string; descuentoM2Equivalente: number; timestampId: number;
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

  const [nombreCliente, setNombreCliente] = useState("");
  const [regional, setRegional] = useState("MONTERO");
  const [proyecto, setProyecto] = useState("MUYURINA");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  const [usarAPI, setUsarAPI] = useState(true); 
  const [baseDeDatosLotes, setBaseDeDatosLotes] = useState<LoteData[]>([]);
  const [cargandoBD, setCargandoBD] = useState(true);
  const [usarBD, setUsarBD] = useState(true);
  const [tipoCotizacion, setTipoCotizacion] = useState<"credito" | "contado">("credito"); 
  const [tcFlexible, setTcFlexible] = useState(11.67);
  const [fechaTC, setFechaTC] = useState(fechaBolivia());
  const [primerMesPago, setPrimerMesPago] = useState(siguienteMes()); 
  
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState(""); 
  const [categoria, setCategoria] = useState("");
  const [pctInicialParametrizado, setPctInicialParametrizado] = useState<number>(7); // Referencia parametrizada del lote
  
  // Controles de Campaña Noviembre 2026
  const [aplicarDescuentoCredito, setAplicarDescuentoCredito] = useState(true); 
  const [modoAnexoIII, setModoAnexoIII] = useState<'auto' | EscalaIncremento>('auto');
  const [plazoLiquidacion, setPlazoLiquidacion] = useState("1"); // '1' (Contado 18%), '5' (5 días 15%), '30' (30 días 10%)

  const [modoInicial, setModoInicial] = useState<"porcentaje" | "monto">("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  const [años, setAños] = useState("");
  
  const [resultado, setResultado] = useState<ResultadoData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const resultadosRef = useRef<HTMLDivElement | null>(null);

  const formatMoney = useCallback((amount: number) => {
    if (isNaN(amount) || amount === undefined || amount === null) return "0.00";
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }, []);

  const showNotification = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Cálculos reactivos en tiempo real para previsualización de descuentos a crédito
  const valorLoteActual = (Number(superficie) || 0) * (Number(precio) || 0);
  const descuentoBaseCreditoActual = aplicarDescuentoCredito ? descuentoCreditoPorValor(valorLoteActual) : 0;

  // Cálculo de porcentaje de inicial actual y puntos porcentuales de incremento (Anexo III)
  const pctInicialEfectivoPreview = useMemo(() => {
    if (valorLoteActual <= 0) return 0;
    const basePreliminar = Math.max(valorLoteActual - descuentoBaseCreditoActual, 1);
    if (modoInicial === 'porcentaje') return Number(inicialPorcentaje) || 0;
    const monto = Number(inicialMonto) || 0;
    return (monto / basePreliminar) * 100;
  }, [valorLoteActual, descuentoBaseCreditoActual, modoInicial, inicialPorcentaje, inicialMonto]);

  const puntosIncrementoPreview = Math.max(0, pctInicialEfectivoPreview - pctInicialParametrizado);
  const escalaAnexoIIIActiva: EscalaIncremento = modoAnexoIII === 'auto'
    ? clasificarIncrementoPuntos(puntosIncrementoPreview)
    : modoAnexoIII;

  const descuentoAnexoIIIActual = aplicarDescuentoCredito
    ? descuentoPorIncrementoInicial(valorLoteActual, escalaAnexoIIIActiva)
    : 0;

  const descuentoCreditoTotalActual = descuentoBaseCreditoActual + descuentoAnexoIIIActual;
  const descuentoM2InformativoActual = (Number(superficie) || 0) > 0 ? descuentoCreditoTotalActual / Number(superficie) : 0;

  useEffect(() => {
    setResultado(null);
    setCopiado(false);
  }, [tcFlexible, fechaTC, primerMesPago, uv, mzn, lote, superficie, precio, categoria, años, modoInicial, inicialMonto, inicialPorcentaje, aplicarDescuentoCredito, modoAnexoIII, plazoLiquidacion, proyectoPersonalizado, nombreCliente]);

  // ============================================================================
  // CARGADOR UNIFICADO CON CACHÉ EN MEMORIA: EXCEL LOCAL vs API SERVER
  // ============================================================================
  useEffect(() => {
    if (!isAuthenticated || !proyecto) return;
    let isMounted = true;

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

    const cargarDatos = async () => {
      setCargandoBD(true);

      if (usarAPI) {
        if (cacheLotesAPI.has(proyecto)) {
          if (isMounted) {
            setBaseDeDatosLotes(cacheLotesAPI.get(proyecto)!);
            setCargandoBD(false);
          }
          return;
        }

        try {
          const resProj = await fetch('https://simulador.data-gc.net/api/proyectos');
          if (!resProj.ok) throw new Error("API Falló");
          const dataProj = await resProj.json();
          const local = proyecto.trim().toUpperCase();
          const projAPI = dataProj.proyectos.find((p: { proyecto: string }) => {
            const apiName = String(p.proyecto).trim().toUpperCase();
            if (ALIAS_PROYECTOS[local]?.includes(apiName)) return true;
            return apiName === local || apiName === `CELINA ${local}`;
          });
          
          if (projAPI && projAPI.project_id) {
            const resLotes = await fetch(`https://simulador.data-gc.net/api/lotes?project_id=${projAPI.project_id}`);
            if (!resLotes.ok) throw new Error("API Lotes Falló");
            const dataLotes = await resLotes.json();
            if (dataLotes.lotes) {
              const apiMapped: LoteData[] = dataLotes.lotes.map((loteFresco: Record<string, any>) => {
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
              cacheLotesAPI.set(proyecto, apiMapped);
              if (isMounted) {
                setBaseDeDatosLotes(apiMapped);
                setCargandoBD(false);
              }
              return; 
            }
          }
          throw new Error("Proyecto no encontrado en API");
        } catch {
          if (isMounted) setUsarAPI(false);
        }
      } else {
        if (cacheLotesLocal) {
          if (isMounted) {
            setBaseDeDatosLotes(cacheLotesLocal);
            setCargandoBD(false);
          }
          return;
        }

        try {
          let rawData;
          try {
            const response = await fetch('/lotes.json');
            if (!response.ok) throw new Error('Fallo local');
            rawData = await response.json();
          } catch {
            const timestamp = new Date().getTime();
            const githubRawUrl = `https://raw.githubusercontent.com/huguitoadm-OHSL/cotizador-celina-ohsl/main/public/lotes.json?t=${timestamp}`;
            const fallbackResponse = await fetch(githubRawUrl);
            if (!fallbackResponse.ok) throw new Error('Fallo github');
            rawData = await fallbackResponse.json();
          }
          if (!Array.isArray(rawData)) rawData = [];
          const normalizedData: LoteData[] = rawData.map(item => ({
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
          cacheLotesLocal = lotesPermitidos;
          if (isMounted) {
            setBaseDeDatosLotes(lotesPermitidos);
            setCargandoBD(false);
          }
        } catch {
          if (isMounted) {
            setCargandoBD(false);
            setUsarBD(false);
          }
        }
      }
    };
    cargarDatos();
    return () => { isMounted = false; };
  }, [proyecto, isAuthenticated, usarAPI]); 

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (PROYECTOS_POR_REGIONAL[regional] && !PROYECTOS_POR_REGIONAL[regional].includes(proyecto)) {
      setProyecto(PROYECTOS_POR_REGIONAL[regional][0] || "OTRO");
    }
  }, [regional, proyecto]);

  const handleUvChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => { setUv(e.target.value); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoria(""); };
  const handleMznChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => { setMzn(e.target.value); setLote(""); setSuperficie(""); setPrecio(""); setCategoria(""); };
  const handleLoteChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => { setLote(e.target.value); };

  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños(""); setCategoria("");
    setResultado(null); setProyectoPersonalizado(""); 
    setExpandedPlan(false);
  }, [proyecto, tipoCotizacion]);

  const lotesDelProyecto = useMemo(() => {
    const aliases = [proyecto, `CELINA ${proyecto}`, ...(ALIAS_PROYECTOS[proyecto] || [])];
    return baseDeDatosLotes?.filter(l => 
      aliases.some(alias => l.proyecto === alias || l?.proyecto?.includes(alias)) || aliases.includes(l.proyecto)
    ) || [];
  }, [baseDeDatosLotes, proyecto]);
  
  const tieneBD = lotesDelProyecto.length > 0;
  const modoBD = usarBD && tieneBD;
  
  const lotesParaDropdown = useMemo(() => 
    lotesDelProyecto.filter(l => isAdmin || ["LIBRE", "DISPONIBLE", "BLOQUEADO", "RESERVADO", ""].includes(l.estado)),
  [lotesDelProyecto, isAdmin]);

  const sortAlphaNum = (a: string, b: string) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  const uvsDisponibles = useMemo(() => [...new Set(lotesParaDropdown.map(l => l.uv))].sort(sortAlphaNum), [lotesParaDropdown]);
  const mznsDisponibles = useMemo(() => [...new Set(lotesParaDropdown.filter(l => l.uv === uv).map(l => l.mzn))].sort(sortAlphaNum), [lotesParaDropdown, uv]);
  const lotesDisponibles = useMemo(() => lotesParaDropdown.filter(l => l.uv === uv && l.mzn === mzn).map(l => l.lote).sort(sortAlphaNum), [lotesParaDropdown, uv, mzn]);

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
          setPctInicialParametrizado(loteEncontrado.api_initial_pct);
        } else if (loteEncontrado.api_initial_tipo === '1' && loteEncontrado.api_initial_valor > 0) {
          iniCalculada = Math.round(loteEncontrado.api_initial_valor);
          setPctInicialParametrizado(precioCalculado > 0 ? (iniCalculada / precioCalculado) * 100 : 7);
        } else if (iniCalculada > 0 && precioCalculado > 0) {
          setPctInicialParametrizado((iniCalculada / precioCalculado) * 100);
        } else {
          setPctInicialParametrizado(7);
        }
        
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
  }, [modoBD, uv, mzn, lote, lotesDelProyecto]); 

  // ============================================================================
  // MOTOR DE CÁLCULO FINANCIERO DETERMINISTA (CAMPAÑA NOVIEMBRE 2026)
  // ============================================================================
  const calcular = () => {
    const sup = Number(superficie) || 0; 
    const prec = Number(precio) || 0; 
    const ans = tipoCotizacion === 'credito' ? (Number(años) || 0) : 0; 
    if (!Number.isFinite(sup) || !Number.isFinite(prec) || sup <= 0 || prec <= 0) {
      setResultado(null);
      showNotification('⚠️ Ingresa superficie y precio mayores que cero.');
      return;
    }
    if (!Number.isFinite(tcFlexible) || tcFlexible <= 0) {
      setResultado(null);
      showNotification('⚠️ Confirma un Tipo de Cambio válido.');
      return;
    }
    if (tipoCotizacion === 'credito' && (!Number.isInteger(ans) || ans < 1 || ans > 14)) {
      setResultado(null);
      showNotification('⚠️ Selecciona un plazo entre 1 y 14 años.');
      return;
    }
    
    const valor_original = sup * prec;
    const nombreProyectoFinal = proyecto === "OTRO" ? (proyectoPersonalizado || "PROYECTO ESPECIAL") : proyecto;
    
    let valor_final = 0, ahorro_total = 0, cuota_inicial = 0, pct_efectivo = 0, pago_puro = 0, seguro = 0, cbdi = 0, cuota_final = 0;
    let planPagosDetallado: { nro: number; mesLabel: string; cuotaUsd: number }[] = [];
    let planPlazosAlternativos: { año: number; cuotaUsd: string; cuotaBs: string; isCurrent: boolean }[] = [];
    
    const TC_FLEX_NUMBER = Number(tcFlexible);
    let tcEfectivoAplicado = TC_FLEX_NUMBER;
    let descPctMapeo = 0;
    let totalBs_OpcionA = 0;
    let totalBs_OpcionB = 0;
    let descFijoBase = 0;
    let descAnexoIII = 0;

    if (tipoCotizacion === 'contado') {
      const reglaContado = PROMOCION.contado[plazoLiquidacion] || PROMOCION.contado['1'];
      descPctMapeo = reglaContado.pct;

      ahorro_total = valor_original * descPctMapeo;
      valor_final = valor_original - ahorro_total;
      tcEfectivoAplicado = TC_FLEX_NUMBER * (1 - descPctMapeo);

      totalBs_OpcionA = valor_final * TC_FLEX_NUMBER;
      totalBs_OpcionB = totalBs_OpcionA;
    } else {
      descFijoBase = aplicarDescuentoCredito ? descuentoCreditoPorValor(valor_original) : 0;
      descAnexoIII = aplicarDescuentoCredito ? descuentoPorIncrementoInicial(valor_original, escalaAnexoIIIActiva) : 0;
      ahorro_total = descFijoBase + descAnexoIII;
      valor_final = Math.max(0, valor_original - ahorro_total);
      const base_para_inicial = valor_final;

      if (modoInicial === 'porcentaje') {
        pct_efectivo = Number(inicialPorcentaje) || 0;
        cuota_inicial = base_para_inicial * (pct_efectivo / 100);
      } else {
        cuota_inicial = Number(inicialMonto) || 0;
        pct_efectivo = base_para_inicial > 0 ? (cuota_inicial / base_para_inicial) * 100 : 0;
      }

      if (!Number.isFinite(cuota_inicial) || cuota_inicial < 0 || cuota_inicial > valor_final) {
        setResultado(null);
        showNotification('⚠️ La cuota inicial debe estar entre cero y el valor final del terreno.');
        return;
      }
      if (!/^\d{4}-\d{2}$/.test(primerMesPago)) {
        setResultado(null);
        showNotification('⚠️ Revisa el primer mes de pago.');
        return;
      }

      const saldo = valor_final - cuota_inicial;
      const meses = ans * 12;
      const tasa_anual = 0.121733;
      const tasa = tasa_anual / 12;
      const refSaldo = 34278.00;
      const baseSeguro: Record<number, number> = {
        1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71,
        8: 23.90, 9: 25.12, 10: 26.38, 11: 27.67, 12: 29.00, 13: 30.36, 14: 31.75
      };
      
      pago_puro = tasa === 0 ? saldo / meses : saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
      if (isNaN(pago_puro) || !isFinite(pago_puro)) pago_puro = 0;
      const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1.3) / refSaldo;
      seguro = saldo * factorSeguro;
      cuota_final = pago_puro + seguro + cbdi;

      const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const [añoInicio, mesInicio] = primerMesPago.split('-').map(Number);
      const mesInicioIndex = mesInicio - 1; 

      for (let m = 1; m <= meses; m++) {
        const currentMIndex = (mesInicioIndex + (m - 1)) % 12;
        const currentY = añoInicio + Math.floor((mesInicioIndex + (m - 1)) / 12);
        planPagosDetallado.push({
          nro: m, 
          mesLabel: `${mesesNombres[currentMIndex]} ${currentY}`,
          cuotaUsd: cuota_final
        });
      }

      for (let i = 14; i >= 1; i--) {
        const m_i = i * 12;
        let pp_i = tasa === 0 ? saldo / m_i : saldo * (tasa * Math.pow(1 + tasa, m_i)) / (Math.pow(1 + tasa, m_i) - 1);
        if (isNaN(pp_i) || !isFinite(pp_i)) pp_i = 0;
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
      nombreCliente: nombreCliente.trim(),
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
      planPagosDetallado,
      planPlazosAlternativos, 
      descPctAplicado: descPctMapeo,
      tcOriginal: TC_FLEX_NUMBER,
      tcEfectivo: tcEfectivoAplicado,
      totalBsA: formatMoney(totalBs_OpcionA),
      totalBsB: formatMoney(totalBs_OpcionB),
      plazoLiquidacionVisual: PROMOCION.contado[plazoLiquidacion]?.label || PROMOCION.contado['1'].label,
      descuentoFijoAplicado: descFijoBase,
      descuentoAnexoIIIAplicado: descAnexoIII,
      escalaAnexoIIILabel: ETIQUETAS_ANEXO_III[escalaAnexoIIIActiva],
      descuentoM2Equivalente: tipoCotizacion === 'credito' && aplicarDescuentoCredito && sup > 0 ? ahorro_total / sup : 0,
      timestampId: new Date().getTime()
    });
    setCopiado(false); 
  };

  const handleProcesar = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      try { calcular(); } catch { showNotification("⚠️ Error de ingesta de datos. Revisa la integridad del lote."); } 
      finally { 
        setIsCalculating(false); 
        if (resultadosRef.current) resultadosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
      }
    }, 350);
  };

  // ============================================================================
  // PLANTILLA DE WHATSAPP B2C DE ALTA CONVERSIÓN
  // ============================================================================
  const getTextToCopy = () => {
    if (!resultado) return '';
    const r = resultado;
    const destinatario = r.nombreCliente ? `*${r.nombreCliente}*` : `*[Nombre_Cliente]*`;
    const saludo = `Hola ${destinatario}, te comparto la propuesta oficial de inversión con los beneficios de nuestra *Campaña Noviembre 2026*:\n\n`;
    const encabezado = `📍 *Proyecto:* ${r.proyecto}\n📐 *Ubicación:* UV ${r.uv || '-'} | MZN ${r.mzn || '-'} | Lote ${r.lote || '-'} (${r.superficie} m²)\n${r.categoria && r.categoria !== 'ESTÁNDAR' ? `🏷️ *Categoría:* ${r.categoria}\n` : ''}💎 *Precio de lista:* US$ ${r.valorOriginal}\n📅 *TC Referencial (${fechaLegible(r.fechaTC)}):* Bs ${r.tcOriginal.toFixed(2)}\n\n`;

    if (r.tipoCotizacion === 'contado') {
      return saludo + encabezado +
        `🔥 *MODALIDAD: ${r.plazoLiquidacionVisual.toUpperCase()}*\n` +
        `🎁 *Descuento Campaña (${(r.descPctAplicado * 100).toFixed(0)}%):* -US$ ${r.ahorroTotal}\n` +
        `✅ *Valor Final de Inversión:* *US$ ${r.valorFinal}*\n` +
        `💵 *Equivalencia Total Hoy:* *Bs ${r.totalBsA}* (TC equiv. Bs ${r.tcEfectivo.toFixed(2)})\n\n` +
        `⏳ *Nota:* Beneficio exclusivo por campaña vigente. ¿Agendamos la reserva de tu terreno hoy?`;
    }

    const bloqueDescuentos = r.ahorroTotalRaw > 0
      ? `🎁 *Beneficio Campaña A Plazos:* -US$ ${formatMoney(r.descuentoFijoAplicado)}\n` +
        (r.descuentoAnexoIIIAplicado > 0 ? `🚀 *Bono Anexo III (${r.escalaAnexoIIILabel}):* -US$ ${formatMoney(r.descuentoAnexoIIIAplicado)}\n` : '') +
        `✨ *Ahorro Total Directo:* *US$ ${r.ahorroTotal}* (Equiv. US$ ${formatMoney(r.descuentoM2Equivalente)}/m²)\n`
      : '';

    return saludo + encabezado +
      `💳 *INVERSIÓN A CRÉDITO DIRECTO (SIN BANCOS)*\n` +
      bloqueDescuentos +
      `✅ *Valor Final del Terreno:* *US$ ${r.valorFinal}*\n\n` +
      `📊 *Plan de Financiamiento (${r.plazo} ${r.plazo === 1 ? 'año' : 'años'}):*\n` +
      `🔹 *Cuota Inicial (${r.inicialPct}%):* US$ ${r.inicial} (*Bs ${r.inicialBs}*)\n` +
      `🔹 *Cuota Mensual Fija:* *US$ ${r.mensual}* (Ref. hoy: *Bs ${r.mensualBs}*)\n\n` +
      `🛡️ *Aprobación inmediata a sola firma.* ¿Confirmamos la reserva de esta ubicación antes de que cambie su disponibilidad?`;
  };

  const enviarWhatsApp = () => { 
    if (!resultado) return; 
    window.open(`https://wa.me/?text=${encodeURIComponent(getTextToCopy())}`, '_blank', 'noopener,noreferrer'); 
  };

  const copiarTexto = async () => {
    if (!resultado) return;
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
      setCopiado(true); showNotification('✅ Cotización copiada al portapapeles.');
    } catch { showNotification('⚠️ No se pudo copiar. Usa el botón de WhatsApp.'); }
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
              <div className="absolute inset-0 bg-sky-400/30 rounded-full blur-xl"></div>
              <Lock className="w-10 h-10 text-[#06090f] relative z-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Celina <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">Quantum</span></h1>
            <p className="text-sky-400 text-xs uppercase tracking-[0.2em] font-black mb-8 border border-sky-500/30 bg-sky-950/40 px-4 py-1.5 rounded-full">Asesores · Campaña Noviembre 2026</p>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-sky-950/90 text-sky-50 px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(14,165,233,0.3)] flex items-center gap-3 font-bold text-sm tracking-wide border border-sky-500/50 backdrop-blur-md w-max max-w-[90vw]">
          {toast.includes('⚠️') ? <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />}
          <span className="truncate">{toast}</span>
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
              <div className="bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Eye className="w-4 h-4" /> MODO DIRECTOR
              </div>
            )}
          </div>
          <div className="bg-[#090e17]/80 backdrop-blur-md border border-sky-500/30 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shadow-[0_0_20px_rgba(14,165,233,0.15)] w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="bg-sky-500/20 p-2 rounded-xl border border-sky-500/30 shrink-0"><Activity className="w-5 h-5 text-sky-400" /></div>
              <div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">TC de la cotización</div>
                <div className="text-xs font-bold text-white flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></div> Ingreso manual</div>
              </div>
            </div>
            <div className="relative shrink-0 flex-1 sm:flex-none">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500 font-bold text-sm">Bs.</span>
              <input 
                aria-label="Tipo de cambio de hoy en bolivianos por dólar" type="number" min="0.01" step="0.01" value={tcFlexible || ''} onChange={(e) => setTcFlexible(Number(e.target.value))} 
                className="bg-[#080d15] border border-slate-700/80 text-sky-400 font-black text-lg rounded-xl pl-10 pr-3 py-2 w-full sm:w-28 text-center outline-none focus:border-sky-500 transition-all shadow-inner" 
              />
            </div>
          </div>
        </div>

        <header className="quantum-hero no-print">
          <div className="quantum-hero-content">
            <div className="quantum-eyebrow"><span /> PLATAFORMA COMERCIAL / ASESORES</div>
            <h1><span>CELINA</span><strong>QUANTUM<span className="quantum-dot">.</span></strong></h1>
            <p>Motor predictivo y espacial.<br className="sm:hidden" /> Campaña Oficial de Descuentos · Noviembre 2026.</p>
            <div className="quantum-modules"><span><MapPin size={14}/> EXPLORA</span><span><Calculator size={14}/> COTIZA</span><span><Send size={14}/> CONVIERTE</span></div>
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
              <text x="115" y="241" fill="#5f8fab" fontSize="9" letterSpacing="4">QUANTUM / NOV 2026</text>
            </svg>
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-sky-500/25 bg-slate-900/70 p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <p className="text-sky-300 font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400"/> Campaña Descuentos de Celina · Noviembre 2026</p>
            <p className="text-slate-400 text-xs mt-1">Contado: 18% (al contado), 15% (5 días), 10% (30 días) · Plazos: Descuento por tramo ($250 a $1.800) + Bono Anexo III por incremento de inicial</p>
          </div>
          <label className="text-xs text-slate-300">Fecha del TC <input aria-label="Fecha del tipo de cambio" type="date" value={fechaTC} onChange={e => setFechaTC(e.target.value)} className="ml-2 bg-slate-950 border border-slate-600 rounded-lg p-2 text-white" /></label>
        </div>

        <div className="w-full mb-8 sm:mb-12 no-print relative z-20">
          <MapaEspacial proyectoActivo={proyecto} />
        </div>

        <div ref={formRef} className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start w-full min-w-0">
          
          <div className="lg:col-span-5 glass-panel rounded-2xl overflow-hidden transition-all duration-500 flex flex-col no-print min-w-0 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-700/50">
            <div className="bg-[#0d1420]/90 backdrop-blur-xl p-5 sm:p-6 flex items-center justify-between gap-3 relative overflow-hidden border-b border-slate-800 flex-wrap">
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/30">
                  <FileText className="w-5 h-5 text-sky-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-wide text-white">Prepara tu propuesta</h2>
              </div>
              
              <div className="relative z-10 flex items-center gap-2 bg-slate-950 p-1.5 rounded-full border border-slate-700 shadow-inner">
                <button 
                  type="button"
                  onClick={() => setUsarAPI(false)} 
                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all duration-300 flex items-center gap-1 ${!usarAPI ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Database className="w-3 h-3" /> JSON Local
                </button>
                <button 
                  type="button"
                  onClick={() => setUsarAPI(true)} 
                  className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all duration-300 flex items-center gap-1 ${usarAPI ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(5,150,105,0.5)]' : 'text-slate-500 hover:text-cyan-400'}`}
                >
                  <Server className="w-3 h-3" /> API Viva
                </button>
              </div>
            </div>
            
            <div className="p-5 sm:p-8 flex-1 bg-[#090e17]/60 backdrop-blur-md">
              <form onSubmit={handleProcesar} className="space-y-5 sm:space-y-6">
                <div className="flex bg-[#080d15] p-1.5 rounded-2xl border border-slate-800 shadow-inner mb-4 relative overflow-hidden">
                  <button 
                    type="button" 
                    onClick={() => setTipoCotizacion('credito')} 
                    className={`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${tipoCotizacion === 'credito' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'text-slate-500 hover:text-cyan-400'}`}
                  >
                    <CreditCard className="w-4 h-4"/> Venta a Plazos
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTipoCotizacion('contado')} 
                    className={`flex-1 py-3 text-xs sm:text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${tipoCotizacion === 'contado' ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.5)]' : 'text-slate-500 hover:text-sky-400'}`}
                  >
                    <Wallet className="w-4 h-4 shrink-0"/> Contado / Liquidación
                  </button>
                </div>

                {/* Nombre opcional del cliente para personalizar WhatsApp */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-cyan-400" /> Nombre del Cliente (Opcional para WhatsApp)
                  </label>
                  <input 
                    type="text"
                    value={nombreCliente}
                    onChange={(e) => setNombreCliente(e.target.value)}
                    placeholder="Ej. Juan Pérez (o dejar vacío)"
                    className="w-full bg-[#0b111b]/60 border border-slate-700 text-white rounded-xl p-3 text-xs sm:text-sm font-semibold placeholder-slate-600 outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapIcon className={`w-4 h-4 shrink-0 ${tipoCotizacion === 'contado' ? 'text-sky-500' : 'text-cyan-500'}`} /> Regional
                  </label>
                  <div className="relative">
                    <select 
                      value={regional} 
                      onChange={e => setRegional(e.target.value)} 
                      className="w-full bg-[#0b111b]/50 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none focus:border-cyan-500"
                    >
                      {Object.keys(PROYECTOS_POR_REGIONAL).map(reg => <option key={reg} value={reg}>{reg}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-500">
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
                        <Loader2 className="w-3 h-3 animate-spin"/> Sincronizando...
                      </span>
                    ) : tieneBD ? (
                      <button 
                        type="button" 
                        onClick={() => setUsarBD(!usarBD)} 
                        className={`text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shrink-0 shadow-sm ${usarBD ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800/50 text-slate-400 border border-slate-700'}`}
                      >
                        {usarBD ? <Database className="w-3 h-3 text-cyan-400"/> : <Edit2 className="w-3 h-3"/>} {usarBD ? 'CATÁLOGO ACTIVO' : 'MODO MANUAL'}
                      </button>
                    ) : null}
                  </div>
                  <div className="relative">
                    <select 
                      value={proyecto} 
                      onChange={e => setProyecto(e.target.value)} 
                      className="w-full bg-[#0b111b]/50 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none focus:border-cyan-500"
                    >
                      {PROYECTOS_POR_REGIONAL[regional]?.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="OTRO">OTRO...</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-500">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                  {proyecto === "OTRO" && (
                    <input 
                      type="text" 
                      value={proyectoPersonalizado} 
                      onChange={e => setProyectoPersonalizado(e.target.value)} 
                      className="w-full bg-[#0b111b]/50 border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 transition-all font-semibold mt-3 focus:border-sky-500" 
                      placeholder="Escribe el nombre del proyecto..." 
                    />
                  )}
                </div>

                <div className="pt-2">
                  <div className="bg-[#101925] border border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col gap-3 relative shadow-inner">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0 text-cyan-400" />
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
                        <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cyan-500">UV</label>
                        {modoBD ? (
                          <div className="relative">
                            <select value={uv} onChange={handleUvChange} className="w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer outline-none focus:border-cyan-500">
                              <option value="" disabled hidden>Selec.</option>
                              {uvsDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-500"><ChevronDown className="w-3 h-3" /></div>
                          </div>
                        ) : (
                          <input type="text" value={uv} onChange={handleUvChange} placeholder="Ej. 49" className="w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600 outline-none focus:border-cyan-500" />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cyan-500">MZN</label>
                        {modoBD ? (
                          <div className="relative">
                            <select value={mzn} onChange={handleMznChange} className="w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer outline-none focus:border-cyan-500">
                              <option value="" disabled hidden>Selec.</option>
                              {mznsDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-500"><ChevronDown className="w-3 h-3" /></div>
                          </div>
                        ) : (
                          <input type="text" value={mzn} onChange={handleMznChange} placeholder="Ej. 6" className="w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600 outline-none focus:border-cyan-500" />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cyan-500">LOTE</label>
                        {modoBD ? (
                          <div className="relative">
                            <select value={lote} onChange={handleLoteChange} className="w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer outline-none focus:border-cyan-500">
                              <option value="" disabled hidden>Selec.</option>
                              {lotesDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-500"><ChevronDown className="w-3 h-3" /></div>
                          </div>
                        ) : (
                          <input type="text" value={lote} onChange={handleLoteChange} placeholder="Ej. 9" className="w-full bg-[#0b111b] border border-slate-700 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600 outline-none focus:border-cyan-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 relative mt-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LayoutTemplate className="w-3 h-3 shrink-0 text-cyan-500" /> Categoría del Lote
                  </label>
                  <input 
                    type="text" 
                    value={categoria} 
                    onChange={e => setCategoria(e.target.value)} 
                    placeholder="Ej. LOTE S/CALLE ESQ. A" 
                    className="w-full rounded-xl p-3.5 text-xs sm:text-sm font-semibold placeholder-slate-600 outline-none bg-[#0b111b] border border-slate-700 text-white focus:border-cyan-500" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-4">
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapIcon className="w-4 h-4 shrink-0 text-cyan-500" /> Superficie <span className="text-slate-600 normal-case">(m²)</span>
                    </label>
                    <input 
                      type="number" required step="0.01" value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="Ej. 300" 
                      className="w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 outline-none bg-[#0b111b] border border-slate-700 text-cyan-400 focus:border-cyan-500" 
                    />
                  </div>
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 shrink-0 text-cyan-500" /> Precio <span className="text-slate-600 normal-case">/ m²</span>
                    </label>
                    <input 
                      type="number" required step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. 45" 
                      className="w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 outline-none bg-[#0b111b] border border-slate-700 text-cyan-400 focus:border-cyan-500" 
                    />
                  </div>
                </div>

                {/* CAMPAÑA NOVIEMBRE 2026: BLOQUE DE DESCUENTOS */}
                <div className={`bg-[#0b111b]/80 border p-4 sm:p-5 rounded-xl relative overflow-hidden mt-4 ${tipoCotizacion === 'contado' ? 'border-sky-500/40' : 'border-cyan-500/40'}`}>
                  <div className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 mb-4 ${tipoCotizacion === 'contado' ? 'text-sky-400' : 'text-cyan-400'}`}>
                    <div className="p-1.5 rounded-lg border bg-cyan-900/50 border-cyan-500/50 shrink-0">
                      <Gift className="w-4 h-4 text-cyan-300" />
                    </div>
                    {tipoCotizacion === 'contado' ? '1. Venta al Contado (Noviembre 2026)' : '2 y 3. Campaña Venta a Plazos + Anexo III'}
                  </div>
                  
                  <div className="relative z-10">
                    {tipoCotizacion === 'contado' ? (
                      <div className="space-y-3">
                        <label className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                          <Timer className="w-4 h-4 text-sky-400"/> Modalidad de Liquidación (Cliente Nuevo)
                        </label>
                        <div className="relative">
                          <select 
                            value={plazoLiquidacion} 
                            onChange={(e) => setPlazoLiquidacion(e.target.value)} 
                            className="w-full bg-[#080d15] border border-sky-500/50 text-sky-100 rounded-xl p-3.5 outline-none font-bold text-xs sm:text-sm appearance-none cursor-pointer focus:border-sky-400" 
                          >
                            <option value="1">{`Venta al contado (-18% | TC equiv: Bs ${(tcFlexible * 0.82).toFixed(2)})`}</option>
                            <option value="5">{`Liquidación en 5 días (-15% | TC equiv: Bs ${(tcFlexible * 0.85).toFixed(2)})`}</option>
                            <option value="30">{`Liquidación en 30 días (-10% | TC equiv: Bs ${(tcFlexible * 0.90).toFixed(2)})`}</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-sky-500">
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                            <input type="checkbox" checked={aplicarDescuentoCredito} onChange={e => setAplicarDescuentoCredito(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-cyan-500 shrink-0" />
                            Aplicar Beneficios Campaña Noviembre 2026
                          </label>
                          <span className="text-xs font-black text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                            Total: -$us {formatMoney(descuentoCreditoTotalActual)}
                          </span>
                        </div>

                        {aplicarDescuentoCredito && (
                          <div className="grid grid-cols-1 gap-3 text-xs">
                            <div className="bg-[#080d15] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">2. Descuento Base por Valor Lote</div>
                                <div className="text-[11px] text-slate-500">Valor lista: $us {formatMoney(valorLoteActual)}</div>
                              </div>
                              <div className="text-sm font-black text-emerald-400">-$us {formatMoney(descuentoBaseCreditoActual)}</div>
                            </div>

                            <div className="bg-[#080d15] p-3 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1">
                                  <Sparkles className="w-3 h-3"/> 3. Anexo III · Incremento Cuota Inicial
                                </span>
                                <span className="text-sm font-black text-cyan-300">-$us {formatMoney(descuentoAnexoIIIActual)}</span>
                              </div>
                              <select
                                value={modoAnexoIII}
                                onChange={(e) => setModoAnexoIII(e.target.value as 'auto' | EscalaIncremento)}
                                className="w-full bg-[#0b111b] border border-slate-700 text-slate-200 rounded-lg p-2 text-xs font-bold outline-none focus:border-cyan-500"
                              >
                                <option value="auto">{`Automático s/inicial (+${puntosIncrementoPreview.toFixed(1)} pp sobre base ${pctInicialParametrizado.toFixed(0)}%)`}</option>
                                <option value="ninguno">Sin incremento adicional ($us 0)</option>
                                <option value="3_599">Escala 3% a 5,99% (+pp)</option>
                                <option value="6_799">Escala 6% a 7,99% (+pp)</option>
                                <option value="8_mas">Escala 8% o más (+pp)</option>
                              </select>
                              <p className="text-[10px] text-slate-500">
                                Descuento combinado equivalente: <strong className="text-slate-300">$us {formatMoney(descuentoM2InformativoActual)}/m²</strong>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {tipoCotizacion === 'credito' && (
                  <label className="block text-xs text-slate-300 mt-4">
                    Primer mes de pago propuesto (confirmar con el cliente)
                    <input type="month" min={fechaTC.slice(0, 7)} value={primerMesPago} onChange={e => setPrimerMesPago(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl p-3 text-white" />
                  </label>
                )}

                {tipoCotizacion === 'credito' && (
                  <div className="grid grid-cols-12 gap-4 sm:gap-5 mt-4">
                    <div className="col-span-12 md:col-span-8 bg-cyan-950/30 border border-cyan-500/40 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                      <div className="space-y-2">
                        <label className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${modoInicial === 'porcentaje' ? 'text-cyan-400' : 'text-slate-500'}`}>
                          <Percent className="w-3.5 h-3.5 shrink-0" /> Inicial (%)
                        </label>
                        <input 
                          type="number" step="0.01" min="0" value={inicialPorcentaje} 
                          onFocus={() => setModoInicial('porcentaje')}
                          onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                          placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 10'} 
                          className={`w-full bg-[#0b111b] border rounded-xl p-3 sm:p-3.5 outline-none font-bold text-sm sm:text-base placeholder-slate-600 ${modoInicial === 'porcentaje' ? 'border-cyan-500 text-white' : 'border-slate-700 text-slate-500'}`} 
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
                          placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 1000'} 
                          className={`w-full bg-[#0b111b] border rounded-xl p-3 sm:p-3.5 outline-none font-black text-sm sm:text-base placeholder-slate-600 ${modoInicial === 'monto' ? 'border-cyan-500 text-cyan-400' : 'border-slate-700 text-slate-500'}`} 
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-12 md:col-span-4 space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-cyan-400 shrink-0" /> Plazo
                      </label>
                      <div className="relative h-[calc(100%-1.5rem)]">
                        <select 
                          required value={años} onChange={e => setAños(e.target.value)} 
                          className="w-full bg-[#0b111b]/50 border border-slate-700 text-white rounded-2xl p-3.5 outline-none font-bold text-sm sm:text-base appearance-none pr-10 cursor-pointer h-full min-h-[50px] focus:border-cyan-500"
                        >
                          <option value="" disabled hidden>Selec.</option>
                          {[...Array(14)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>)}
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
                  className={`w-full mt-6 sm:mt-8 bg-gradient-to-r ${tipoCotizacion === 'contado' ? 'from-sky-500 via-blue-500 to-sky-400' : 'from-cyan-500 via-blue-500 to-cyan-400'} text-[#06090f] font-black py-4 sm:py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 uppercase tracking-widest text-sm sm:text-lg relative overflow-hidden group ${isCalculating ? 'opacity-80 scale-95' : 'hover:-translate-y-1 shadow-[0_0_30px_rgba(34,211,238,0.4)]'}`}
                >
                  <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                    {isCalculating ? (
                      <><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin shrink-0 text-[#06090f]" /> Procesando...</>
                    ) : (
                      <>Calcular Propuesta <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /></>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
          
          <div ref={resultadosRef} className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 scroll-mt-6 min-w-0 w-full">
            {!resultado || isCalculating ? (
              <div className="glass-panel rounded-2xl h-full min-h-[400px] sm:min-h-[600px] flex flex-col items-center justify-center text-slate-500 p-6 sm:p-10 text-center border border-slate-700/50 bg-[#0d1420]/60 backdrop-blur-xl">
                <div className="bg-[#0b111b] p-6 sm:p-8 rounded-full mb-6 border border-cyan-500/50 shadow-[0_0_40px_rgba(14,165,233,0.3)]">
                  {isCalculating ? <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-cyan-400" /> : <Calculator className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400" />}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
                  {isCalculating ? "Calculando Escenarios..." : "Simulador Financiero Quantum"}
                </h3>
                <p className="text-sm sm:text-base max-w-md text-slate-400 font-medium leading-relaxed px-2">
                  Selecciona el lote o ingresa las dimensiones para proyectar la inversión con las condiciones vigentes de Noviembre 2026.
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-xl sm:rounded-2xl p-5 sm:p-8 relative overflow-hidden border border-slate-600/50 bg-[#0d1420]/95 backdrop-blur-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-slate-700 gap-4 relative z-10">
                  <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                    <div className="p-2 rounded-xl text-[#0b111b] shrink-0 bg-gradient-to-br from-cyan-400 to-blue-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div> 
                    Propuesta de Inversión
                  </h2>
                  <span className="border text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest flex items-center justify-center gap-2 bg-cyan-950/60 text-cyan-400 border-cyan-500/50">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span> 
                    {resultado.tipoCotizacion === 'contado' ? resultado.plazoLiquidacionVisual : 'Venta a Plazos · Campaña Nov 2026'}
                  </span>
                </div>
                
                <div className="relative z-10 space-y-6">
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#080d15]/80 p-4 rounded-2xl border border-slate-700">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-600 shrink-0">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Proyecto</div>
                        <div className="text-white font-black text-lg uppercase leading-none truncate">{resultado.proyecto}</div>
                        {resultado.categoria && resultado.categoria !== "ESTÁNDAR" && (
                          <div className="text-[9px] text-cyan-400 font-bold mt-1 tracking-wider truncate bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20 w-max">{resultado.categoria}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 w-full sm:w-auto">
                      <div className="text-center px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700 flex-1 sm:flex-none">
                        <div className="text-[8px] font-extrabold text-slate-500 uppercase mb-1">UV</div>
                        <div className="text-cyan-400 font-black text-base leading-none">{resultado.uv || '-'}</div>
                      </div>
                      <div className="text-center px-4 py-2 bg-slate-900/80 rounded-xl border border-slate-700 flex-1 sm:flex-none">
                        <div className="text-[8px] font-extrabold text-slate-500 uppercase mb-1">MZN</div>
                        <div className="text-cyan-400 font-black text-base leading-none">{resultado.mzn || '-'}</div>
                      </div>
                      <div className="text-center px-4 py-2 rounded-xl border flex-1 sm:flex-none bg-cyan-950/60 border-cyan-500/50">
                        <div className="text-[8px] font-extrabold uppercase mb-1 text-cyan-400">LOTE</div>
                        <div className="text-white font-black text-base leading-none">{resultado.lote || '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 text-sm text-slate-200 leading-relaxed">
                    <strong>TC cotizado el {fechaLegible(resultado.fechaTC)}: Bs {resultado.tcOriginal.toFixed(2)} / US$ 1.</strong>{' '}
                    {resultado.tipoCotizacion === 'credito'
                      ? 'Cuota inicial al TC del día de la venta. Mensualidades fijas en dólares convertibles al TC vigente de cada fecha de pago.'
                      : 'El descuento promocional se aplica una sola vez: directo al precio en dólares o como TC equivalente en bolivianos.'}
                  </div>

                  {/* BLOQUE AL CONTADO */}
                  {resultado.tipoCotizacion === 'contado' && (
                    <div className="space-y-6">
                      <div className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-[#080d15] to-[#080d15] p-6 sm:p-10 rounded-xl border border-sky-500/50 text-center">
                        <div className="relative z-10 flex flex-col items-center justify-center">
                          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-950/80 border border-sky-500/50 mb-5">
                            <Timer className="w-4 h-4 text-sky-400"/>
                            <span className="text-sky-200 text-xs font-black uppercase tracking-widest">{resultado.plazoLiquidacionVisual} (-{(resultado.descPctAplicado * 100).toFixed(0)}%)</span>
                          </div>

                          <div className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none mb-3">
                            $us {resultado.valorFinal}
                          </div>
                          
                          <div className="mt-6 w-full max-w-3xl">
                            <div className="flex items-center justify-center gap-2 text-sky-400 text-xs font-black uppercase tracking-widest mb-4">
                              <Scale className="w-4 h-4" /> Equivalencia Financiera Conmutativa
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-[#101925] border border-sky-500/30 p-5 rounded-2xl text-left">
                                <div className="text-sky-400 font-bold text-[10px] tracking-widest uppercase mb-3 text-center border-b border-sky-500/20 pb-2">
                                  Opción A: Descuento al Precio
                                </div>
                                <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Precio Lista</span> <span className="font-bold text-slate-200">$us {resultado.valorOriginal}</span></div>
                                <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Descuento ({(resultado.descPctAplicado * 100).toFixed(0)}%)</span> <span className="text-cyan-400 font-bold">-$us {resultado.ahorroTotal}</span></div>
                                <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2 mb-1.5"><span className="text-slate-300 font-bold">Precio Final</span> <span className="font-black text-white">$us {resultado.valorFinal}</span></div>
                                <div className="flex justify-between text-sm mb-3"><span className="text-slate-400">T.C. Referencial</span> <span className="font-bold text-slate-200">x Bs {resultado.tcOriginal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-base border-t border-sky-500/50 pt-3">
                                  <span className="text-sky-400 font-black">Total Bs.</span> 
                                  <span className="font-black text-sky-300">Bs. {resultado.totalBsA}</span>
                                </div>
                              </div>

                              <div className="bg-[#101925] border border-cyan-500/30 p-5 rounded-2xl text-left">
                                <div className="text-cyan-400 font-bold text-[10px] tracking-widest uppercase mb-3 text-center border-b border-cyan-500/20 pb-2">
                                  Opción B: Descuento al T.C.
                                </div>
                                <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">T.C. Referencial</span> <span className="font-bold text-slate-200">Bs {resultado.tcOriginal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-400">Descuento ({(resultado.descPctAplicado * 100).toFixed(0)}%)</span> <span className="text-cyan-400 font-bold">-{(resultado.descPctAplicado * 100).toFixed(0)}%</span></div>
                                <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2 mb-1.5"><span className="text-slate-300 font-bold">TC Equivalente</span> <span className="font-black text-white">Bs {resultado.tcEfectivo.toFixed(2)}</span></div>
                                <div className="flex justify-between text-sm mb-3"><span className="text-slate-400">Precio Lista</span> <span className="font-bold text-slate-200">x $us {resultado.valorOriginal}</span></div>
                                <div className="flex justify-between text-base border-t border-cyan-500/50 pt-3">
                                  <span className="text-cyan-400 font-black">Total Bs.</span> 
                                  <span className="font-black text-cyan-300">Bs. {resultado.totalBsB}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BLOQUE A CRÉDITO */}
                  {resultado.tipoCotizacion === 'credito' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="bg-[#101925] p-5 rounded-2xl border border-slate-700">
                          <div className="text-cyan-500 text-[10px] font-extrabold uppercase tracking-widest">Valor Final del Lote</div>
                          <div className="text-3xl font-black text-white mt-1">$us {resultado.valorFinal}</div>
                          <div className="text-xs font-bold text-cyan-500 mt-1">Ref. hoy: Bs. {resultado.valorFinalBs}</div>
                          {resultado.ahorroTotalRaw > 0 && (
                            <div className="mt-3 space-y-1 text-[10px] text-cyan-300 font-bold bg-cyan-950/60 p-2.5 rounded-xl border border-cyan-500/30">
                              <div>• Desc. Base Campaña: -$us {formatMoney(resultado.descuentoFijoAplicado)}</div>
                              {resultado.descuentoAnexoIIIAplicado > 0 && (
                                <div>• Bono Anexo III ({resultado.escalaAnexoIIILabel}): -$us {formatMoney(resultado.descuentoAnexoIIIAplicado)}</div>
                              )}
                              <div className="text-emerald-400 pt-1 border-t border-cyan-500/20">
                                Ahorro Total: $us {resultado.ahorroTotal} ($us {formatMoney(resultado.descuentoM2Equivalente)}/m²)
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="bg-[#101925] p-5 rounded-2xl border border-slate-700 flex flex-col justify-between">
                          <div>
                            <div className="text-cyan-400 text-[10px] font-extrabold uppercase tracking-widest">Cuota Inicial ({resultado.inicialPct}%)</div>
                            <div className="text-3xl font-black text-white mt-1">$us {resultado.inicial}</div>
                            <div className="text-xs font-bold text-cyan-500 mt-1">Al TC de hoy: Bs. {resultado.inicialBs}</div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-baseline">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Cuota Mensual ({resultado.plazo}a):</span>
                            <span className="text-lg font-black text-emerald-400">$us {resultado.mensual} <span className="text-xs text-slate-400">(Bs. {resultado.mensualBs})</span></span>
                          </div>
                        </div>
                      </div>

                      {/* ACORDEÓN DE PAGOS */}
                      <div className="border border-cyan-500/40 rounded-2xl overflow-hidden bg-[#080d15] w-full">
                        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-cyan-950/40 to-transparent">
                          <h3 className="text-white font-black text-lg flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-cyan-400"/> Cronograma de Pagos ({resultado.plazo * 12} cuotas)
                          </h3>
                          <p className="text-slate-400 text-xs mt-1">
                            Inicio proyectado: <strong className="text-cyan-400">{resultado.planPagosDetallado?.[0]?.mesLabel}</strong>.
                          </p>
                        </div>
                        
                        <button type="button" onClick={() => setExpandedPlan(!expandedPlan)} className="w-full bg-[#101925] p-4 flex justify-between items-center hover:bg-slate-900 transition-colors border-b border-slate-800">
                          <span className="text-cyan-400 font-bold text-xs sm:text-sm tracking-widest uppercase">Desplegar tabla de amortización</span>
                          <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${expandedPlan ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedPlan && (
                          <div className="overflow-y-auto max-h-[320px] bg-[#0b111b]">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                              <thead className="sticky top-0 bg-[#090e17] z-30 border-b border-slate-700">
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                                  <th className="p-3.5">Cuota</th>
                                  <th className="p-3.5">Mes</th>
                                  <th className="p-3.5 text-cyan-400">Monto Fijo ($us)</th>
                                </tr>
                              </thead>
                              <tbody className="font-semibold">
                                {resultado.planPagosDetallado?.map((row) => (
                                  <tr key={row.nro} className="border-b border-slate-800/50 text-center hover:bg-slate-800/60">
                                    <td className="p-3 text-slate-500 font-bold">#{row.nro}</td>
                                    <td className="p-3 text-slate-300">{row.mesLabel}</td>
                                    <td className="p-3 font-black text-cyan-400">$us {Number(row.cuotaUsd).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* COMPARADOR DE PLAZOS ALTERNATIVOS (1 A 14 AÑOS) */}
                      <div className="border border-cyan-500/40 rounded-2xl overflow-hidden bg-[#101925] w-full">
                        <div className="bg-[#0b111b] p-4 border-b border-cyan-500/30">
                          <h3 className="text-slate-200 font-bold text-sm tracking-wide flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyan-500 shrink-0"/> Comparativa de Plazos (1 a 14 Años)
                          </h3>
                        </div>
                        <div className="p-3 sm:p-5 max-h-[320px] overflow-y-auto">
                          <div className="grid grid-cols-3 gap-2 pb-3 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center sticky top-0 bg-[#101925]">
                            <div>Plazo</div>
                            <div className="text-cyan-400">Cuota ($us)</div>
                            <div className="text-cyan-400">Equiv. Hoy (Bs)</div>
                          </div>
                          <div className="pt-2 space-y-1">
                            {resultado.planPlazosAlternativos?.map((plan) => (
                              <div key={plan.año} className={`grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center text-xs sm:text-sm font-bold ${plan.isCurrent ? 'bg-cyan-950/80 border border-cyan-500/60 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800/60'}`}>
                                <div>{plan.año} {plan.año === 1 ? 'Año' : 'Años'}</div>
                                <div className="font-black text-cyan-300">$us {plan.cuotaUsd}</div>
                                <div className="text-slate-400">Bs. {plan.cuotaBs}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                    <button 
                      type="button"
                      onClick={copiarTexto} 
                      className="flex-1 bg-[#0b111b] border border-cyan-500/60 text-cyan-400 hover:bg-cyan-900/30 font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                    >
                      {copiado ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />} {copiado ? 'COPIADO' : 'COPIAR PROPUESTA'}
                    </button>
                    <button 
                      type="button"
                      onClick={enviarWhatsApp} 
                      className="flex-1 bg-gradient-to-r from-[#25D366] to-[#1DA851] hover:from-[#1DA851] hover:to-[#15873e] text-[#06090f] font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:-translate-y-0.5 text-sm uppercase tracking-wider"
                    >
                      <Send className="w-5 h-5" /> Enviar por WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <footer className="quantum-footer no-print">
          <span>CELINA <strong>QUANTUM v3.0</strong> · Campaña Noviembre 2026</span>
          <span>Arquitectura y Desarrollo · <strong>OSCAR SARAVIA ®</strong></span>
        </footer>
      </div>
    </div>
  );
}
