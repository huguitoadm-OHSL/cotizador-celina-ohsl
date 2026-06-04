import React, { useState, useEffect, useRef } from "react";
import { 
  Calculator, Send, Map, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, Tag, 
  MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, ChevronDown, ListOrdered,
  Database, Edit2, LayoutTemplate, Loader2, AlertCircle, Scale, X, Flame, Printer
} from "lucide-react";

// ============================================================================
// BASE DE DATOS DE REGIONALES Y PROYECTOS
// ============================================================================
const proyectosPorRegional = {
  "SANTA CRUZ": [
    "URUBÓ NORTE",
    "ROSA RODALI",
    "CELINA PAILÓN",
    "EL ENCANTO",
    "EL ENCANTO FASE 2",
    "SANTA ROSA - FASE 1",
    "SANTA ROSA - FASE 2",
    "SANTA ROSA - FASE 3",
    "TAMARINDO",
    "JARDINES DEL BOSQUE",
    "EL PORVENIR",
    "EL PORVENIR FASE 2"
  ],
  "SATÉLITE NORTE": [
    "CELINA 7 FASE 3",
    "CELINA 8",
    "CLARA CHUCHIO",
    "SAN JORGE",
    "CELINA VII FASE 1",
    "CELINA VII FASE 2",
    "PRADERAS DEL NORTE"
  ]
};

const descGroup1_3USD = ["LOS JARDINES", "EL RENACER", "RANCHO NUEVO", "SANTA ROSA - FASE 1", "SANTA ROSA - FASE 2", "SANTA ROSA - FASE 3", "EL ENCANTO FASE 2", "SAN JORGE", "EL PORVENIR", "EL PORVENIR FASE 2", "CELINA PAILÓN"];
const descGroup2_4USD = ["CAÑAVERAL", "EL ENCANTO", "CELINA 7 FASE 3", "CELINA VII FASE 1", "CELINA VII FASE 2", "TAMARINDO"];
const descGroup3_7USD = ["JARDINES DEL BOSQUE"];
const descGroup4_30PCT = ["MUYURINA", "SANTA FE", "CLARA CHUCHIO", "CELINA 8", "CELINA X", "URUBÓ NORTE"];
const descGroup5_32PCT = ["CELINA 3", "CELINA 4", "CELINA 5", "VILLA BELLA VIVIENDAS"];
const descGroup6_20PCT = ["PRADERAS DEL NORTE"];
const descGroup7_15PCT = ["ROSA RODALI"];

export default function App() {
  const [regional, setRegional] = useState("SANTA CRUZ");
  const [proyecto, setProyecto] = useState("URUBÓ NORTE");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  
  const [baseDeDatosLotes, setBaseDeDatosLotes] = useState([]);
  const [cargandoBD, setCargandoBD] = useState(true);
  const [usarBD, setUsarBD] = useState(true);

  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("");
  
  const [descuentoCredito, setDescuentoCredito] = useState(20);
  const [descuentoContado, setDescuentoContado] = useState(30);
  const [descuentoM2, setDescuentoM2] = useState(0);
  const [descuentoInicial, setDescuentoInicial] = useState(0);
  const [descuentoContadoM2, setDescuentoContadoM2] = useState(0); 

  const [aplicarDescContadoPct, setAplicarDescContadoPct] = useState(true);
  const [aplicarDescCreditoPct, setAplicarDescCreditoPct] = useState(true);
  const [aplicarDescM2, setAplicarDescM2] = useState(true);
  const [aplicarDescContadoM2, setAplicarDescContadoM2] = useState(true);
  const [aplicarBonoInicialOtro, setAplicarBonoInicialOtro] = useState(true);

  const [modoInicial, setModoInicial] = useState("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  
  const [años, setAños] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mostrarPlan, setMostrarPlan] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [escenarioGuardado, setEscenarioGuardado] = useState(null);
  const [mostrarComparativa, setMostrarComparativa] = useState(false);
  const [toast, setToast] = useState(null);

  const resultadosRef = useRef(null);

  // ==========================================================================
  // CARGA DE BASE DE DATOS
  // ==========================================================================
  useEffect(() => {
    const cargarLotes = async () => {
      try {
        let rawData;
        try {
          const response = await fetch('/lotes.json');
          if (!response.ok) throw new Error('Fallo la ruta local');
          rawData = await response.json();
        } catch (e) {
          const timestamp = new Date().getTime();
          const githubRawUrl = `https://raw.githubusercontent.com/huguitoadm-OHSL/cotizador-celina-ohsl/main/public/lotes.json?t=${timestamp}`;
          const fallbackResponse = await fetch(githubRawUrl);
          if (!fallbackResponse.ok) throw new Error('No se pudo descargar desde GitHub');
          rawData = await fallbackResponse.json();
        }

        const parseNum = (val) => {
            if (val === undefined || val === null) return 0;
            if (typeof val === 'number') return val;
            const strVal = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
            return Number(strVal) || 0;
        };

        const normalizedData = rawData.map(item => ({
            proyecto: String(item.Proyecto || item.proyecto || item.PROYECTO || "").trim().toUpperCase(),
            uv: String(item.uv || item.Uv || item.UV || "").trim().toUpperCase() || "SN", 
            mzn: String(item.mzn || item.Mzn || item.MZN || "").trim().toUpperCase(),
            lote: String(item.lote || item.Lote || item.LOTE || "").trim().toUpperCase(),
            superficie: parseNum(item.superficie || item.Superficie || item.SUPERFICIE),
            precio: parseNum(item.precio || item.Precio || item.PRECIO),
            estado: String(item.estado || item.Estado || item.ESTADO || "LIBRE").trim().toUpperCase(),
            categoria: String(item.categoria || item.Categoria || item.CATEGORIA || "ESTÁNDAR").trim().toUpperCase()
        }));

        const lotesPermitidos = normalizedData.filter(l => 
          l.estado === "LIBRE" || l.estado === "DISPONIBLE" || l.estado === "BLOQUEADO" || l.estado === ""
        );

        setBaseDeDatosLotes(lotesPermitidos);
        setCargandoBD(false);
      } catch (error) {
        console.error('Error al cargar BD:', error);
        setCargandoBD(false);
        setUsarBD(false); 
      }
    };
    cargarLotes();
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    if (!proyectosPorRegional[regional].includes(proyecto)) {
      setProyecto(proyectosPorRegional[regional]?.[0] || "OTRO");
    }
  }, [regional]);

  const handleUvChange = (e) => {
    setUv(e.target.value);
    setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoria("");
  };

  const handleMznChange = (e) => {
    setMzn(e.target.value);
    setLote(""); setSuperficie(""); setPrecio(""); setCategoria("");
  };

  const handleLoteChange = (e) => {
    setLote(e.target.value);
  };

  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños(""); setCategoria("");
    setResultado(null); setProyectoPersonalizado(""); setMostrarPlan(false);
    setEscenarioGuardado(null); setMostrarComparativa(false);

    setAplicarDescContadoPct(true); setAplicarDescCreditoPct(true); setAplicarDescM2(true);
    setAplicarDescContadoM2(true); setAplicarBonoInicialOtro(true);

    if (descGroup1_3USD.includes(proyecto)) {
      setDescuentoContado(0); setDescuentoCredito(0); setDescuentoContadoM2(3); setDescuentoM2(1); setDescuentoInicial(0);
    } else if (descGroup2_4USD.includes(proyecto)) {
      setDescuentoContado(0); setDescuentoCredito(0); setDescuentoContadoM2(4); setDescuentoM2(1); setDescuentoInicial(0);
    } else if (descGroup3_7USD.includes(proyecto)) {
      setDescuentoContado(0); setDescuentoCredito(0); setDescuentoContadoM2(7); setDescuentoM2(5); setDescuentoInicial(0);
    } else if (descGroup4_30PCT.includes(proyecto)) {
      setDescuentoContado(30); setDescuentoCredito(20); setDescuentoContadoM2(0); setDescuentoM2(0); setDescuentoInicial(0);
    } else if (descGroup5_32PCT.includes(proyecto)) {
      setDescuentoContado(32); setDescuentoCredito(25); setDescuentoContadoM2(0); setDescuentoM2(0); setDescuentoInicial(0);
    } else if (descGroup6_20PCT.includes(proyecto)) {
      setDescuentoContado(20); setDescuentoCredito(15); setDescuentoContadoM2(0); setDescuentoM2(0); setDescuentoInicial(0);
    } else if (descGroup7_15PCT.includes(proyecto)) {
      setDescuentoContado(15); setDescuentoCredito(10); setDescuentoContadoM2(0); setDescuentoM2(0); setDescuentoInicial(0);
    } else {
      setDescuentoContado(0); setDescuentoCredito(0); setDescuentoM2(0); setDescuentoContadoM2(0); setDescuentoInicial(0);
    }
  }, [proyecto]);

  const getAlias = (p) => {
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

  const lotesDelProyecto = baseDeDatosLotes.filter(l => 
    currentAliases.some(alias => l.proyecto === alias || l.proyecto.includes(alias)) || currentAliases.includes(l.proyecto)
  );
  
  const tieneBD = lotesDelProyecto.length > 0;
  const modoBD = usarBD && tieneBD;
  
  const sortAlphaNum = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  
  const uvsDisponibles = [...new Set(lotesDelProyecto.map(l => l.uv))].sort(sortAlphaNum);
  const mznsDisponibles = [...new Set(lotesDelProyecto.filter(l => l.uv === uv).map(l => l.mzn))].sort(sortAlphaNum);
  const lotesDisponibles = lotesDelProyecto.filter(l => l.uv === uv && l.mzn === mzn).map(l => l.lote).sort(sortAlphaNum);

  useEffect(() => {
    if (modoBD && uv && !uvsDisponibles.includes(uv)) setUv("");
  }, [modoBD, uvsDisponibles, uv]);

  useEffect(() => {
    if (modoBD && mzn && !mznsDisponibles.includes(mzn)) setMzn("");
  }, [modoBD, mznsDisponibles, mzn]);

  useEffect(() => {
    if (modoBD && lote && !lotesDisponibles.includes(lote)) setLote("");
  }, [modoBD, lotesDisponibles, lote]);

  useEffect(() => {
    if (modoBD && uv && mzn && lote) {
      const loteEncontrado = lotesDelProyecto.find(l => l.uv === uv && l.mzn === mzn && l.lote === lote);
      if (loteEncontrado) {
        setSuperficie(loteEncontrado.superficie.toString());
        setPrecio(loteEncontrado.precio.toString());
        setCategoria(loteEncontrado.categoria || "ESTÁNDAR");
      }
    }
  }, [modoBD, uv, mzn, lote, lotesDelProyecto]);

  const calcularLimitesMaximos = () => {
    let maxCreditoPct = 0;
    let maxContadoPct = 0;
    let maxDescM2 = 0;
    let maxContadoM2 = 0;
    const maxBonoInicial = 500;

    let pct = 0;
    if (modoInicial === 'porcentaje') {
      pct = Number(inicialPorcentaje);
    } else {
      const sup = Number(superficie); const prec = Number(precio); const monto = Number(inicialMonto);
      if (sup > 0 && prec > 0 && monto > 0) {
        const val_orig = sup * prec;
        const desc_m2_val = aplicarDescM2 ? Number(descuentoM2) : 0;
        const val_post_desc_m2 = val_orig - (sup * desc_m2_val);
        const m_desc_cred = val_post_desc_m2 * (aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0);
        const base = val_post_desc_m2 - m_desc_cred;
        if (base > 0) pct = (monto / base) * 100;
      }
    }

    const catUpper = categoria.toUpperCase();
    const isCanaveralPremium = proyecto === "CAÑAVERAL" && (
      catUpper.includes('CARRETERA') || 
      catUpper.includes('PAVIMENTO') || 
      catUpper.includes('4TO ANILLO') || 
      catUpper.includes('4 ANILLO')
    );

    if (descGroup4_30PCT.includes(proyecto)) {
      maxContadoPct = 30;
      maxCreditoPct = (pct >= 4.99) ? 23 : 20; 
    } else if (descGroup5_32PCT.includes(proyecto)) {
      maxContadoPct = 32;
      maxCreditoPct = (pct >= 4.99) ? 28 : 25; 
    } else if (descGroup1_3USD.includes(proyecto)) {
      maxContadoM2 = 3;
      maxDescM2 = (pct >= 4.99) ? 2 : 1;
    } else if (descGroup2_4USD.includes(proyecto)) {
      maxContadoM2 = 4;
      if (isCanaveralPremium) {
        maxDescM2 = 3;
      } else {
        maxDescM2 = (pct >= 4.99) ? 2 : 1;
      }
    } else if (descGroup3_7USD.includes(proyecto)) {
      maxContadoM2 = 7;
      maxDescM2 = 5;
    } else if (descGroup6_20PCT.includes(proyecto)) {
      maxContadoPct = 20;
      maxCreditoPct = 15;
    } else if (descGroup7_15PCT.includes(proyecto)) {
      maxContadoPct = 15;
      maxCreditoPct = 10;
    }

    return { maxCreditoPct, maxContadoPct, maxDescM2, maxContadoM2, maxBonoInicial };
  };

  useEffect(() => {
    const limites = calcularLimitesMaximos();
    setDescuentoCredito(limites.maxCreditoPct);
    setDescuentoContado(limites.maxContadoPct);
    setDescuentoM2(limites.maxDescM2);
    setDescuentoContadoM2(limites.maxContadoM2);
  }, [modoInicial, inicialPorcentaje, inicialMonto, superficie, precio, proyecto, categoria, aplicarDescM2, aplicarDescCreditoPct]);

  const handleDescContadoChange = (e) => {
    const val = Number(e.target.value);
    const max = calcularLimitesMaximos().maxContadoPct;
    setDescuentoContado(val > max ? max : val);
  };

  const handleDescCreditoChange = (e) => {
    const val = Number(e.target.value);
    const max = calcularLimitesMaximos().maxCreditoPct;
    setDescuentoCredito(val > max ? max : val);
  };

  const handleDescM2Change = (e) => {
    const val = Number(e.target.value);
    const max = calcularLimitesMaximos().maxDescM2;
    setDescuentoM2(val > max ? max : val);
  };

  const handleDescContadoM2Change = (e) => {
    const val = Number(e.target.value);
    const max = calcularLimitesMaximos().maxContadoM2;
    setDescuentoContadoM2(val > max ? max : val);
  };

  const handleBonoInicialChange = (e) => {
    const val = Number(e.target.value);
    setDescuentoInicial(val > 500 ? 500 : val);
  };

  const formatMoney = (amount) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const showNotification = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const calcular = () => {
    let cuota_inicial = 0;
    let pct_efectivo = 0;
    let descIniVal = 0;
    const sup = Number(superficie); const prec = Number(precio); const ans = Number(años);
    const descCreditoPct = aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0;
    const descContadoPct = aplicarDescContadoPct ? (Number(descuentoContado) / 100) : 0;
    const descM2Val = aplicarDescM2 ? Number(descuentoM2) : 0;
    const descContadoM2Val = aplicarDescContadoM2 ? Number(descuentoContadoM2) : 0;

    if (!sup || !prec || ans <= 0) { setResultado(null); return; }

    const valor_original = sup * prec;
    let monto_descuento_m2 = sup * descM2Val;
    const valor_post_desc_m2 = valor_original - monto_descuento_m2;
    const monto_desc_credito_pct = valor_post_desc_m2 * descCreditoPct;
    const base_para_inicial = valor_post_desc_m2 - monto_desc_credito_pct;
    
    if (modoInicial === 'porcentaje') {
       pct_efectivo = Number(inicialPorcentaje);
       cuota_inicial = base_para_inicial * (pct_efectivo / 100);
    } else {
       cuota_inicial = Number(inicialMonto);
       pct_efectivo = base_para_inicial > 0 ? (cuota_inicial / base_para_inicial) * 100 : 0;
    }

    descIniVal = (proyecto === "OTRO" && aplicarBonoInicialOtro) ? Math.min(Number(descuentoInicial), 500) : 0;

    const monto_descuento_total_credito = monto_descuento_m2 + monto_desc_credito_pct + descIniVal;
    const valor_credito = valor_original - monto_descuento_total_credito;
    
    let monto_desc_contado_m2 = sup * descContadoM2Val;
    let monto_descuento_total_contado = 0;
    if (descGroup1_3USD.includes(proyecto) || descGroup2_4USD.includes(proyecto) || descGroup3_7USD.includes(proyecto)) {
      monto_descuento_total_contado = monto_desc_contado_m2 + (valor_original * descContadoPct);
    } else {
      monto_descuento_total_contado = monto_descuento_m2 + (valor_post_desc_m2 * descContadoPct) + monto_desc_contado_m2;
    }
    const valor_contado = valor_original - monto_descuento_total_contado;

    // --- MATEMÁTICA Y TABLA DE PLAN DE PAGOS (1 a 10 Años) ---
    const saldo = valor_credito - cuota_inicial;
    const tasa_anual = 0.121733; const tasa = tasa_anual / 12;
    const refSaldo = 34278.00;
    const baseSeguro = { 1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38 };
    const cbdi = 0;
    
    let pago_puro = tasa === 0 ? saldo / (ans*12) : saldo * (tasa * Math.pow(1 + tasa, ans*12)) / (Math.pow(1 + tasa, ans*12) - 1);
    const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1) / refSaldo;
    const seguro = saldo * factorSeguro;
    const cuota_final = pago_puro + seguro + cbdi;
    
    const TIPO_CAMBIO = 6.97;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;
    const formatPct = (pct_efectivo % 1 === 0) ? pct_efectivo.toFixed(0) : pct_efectivo.toFixed(2);

    let planPagosArreglo = [];
    for (let i = 10; i >= 1; i--) {
      const m_i = i * 12;
      let pp_i = tasa === 0 ? saldo / m_i : saldo * (tasa * Math.pow(1 + tasa, m_i)) / (Math.pow(1 + tasa, m_i) - 1);
      const fS_i = baseSeguro[i] ? (baseSeguro[i] / refSaldo) : (26.38 + (i - 10) * 1) / refSaldo;
      const seg_i = saldo * fS_i;
      const c_final_i = pp_i + seg_i + cbdi;
      
      planPagosArreglo.push({ 
        año: i, 
        cuotaUsd: formatMoney(c_final_i), 
        cuotaBs: formatMoney(c_final_i * TIPO_CAMBIO),
        isCurrent: i === ans
      });
    }

    setResultado({
      regional: regional, proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, categoria: categoria,
      valorOriginalRaw: valor_original,
      valorOriginal: formatMoney(valor_original), valorOriginalBs: formatMoney(valor_original * TIPO_CAMBIO),
      valorContado: formatMoney(valor_contado), valorContadoBs: formatMoney(valor_contado * TIPO_CAMBIO),
      ahorroContadoRaw: monto_descuento_total_contado,
      ahorroContado: formatMoney(monto_descuento_total_contado), porcentajeContado: aplicarDescContadoPct ? descuentoContado : 0,
      descuentoContadoM2: aplicarDescContadoM2 ? descContadoM2Val : 0,
      valorCreditoRaw: valor_credito,
      valorCredito: formatMoney(valor_credito), valorCreditoBs: formatMoney(valor_credito * TIPO_CAMBIO),
      ahorroCreditoRaw: monto_descuento_total_credito,
      ahorroCredito: formatMoney(monto_descuento_total_credito), porcentajeCredito: aplicarDescCreditoPct ? descuentoCredito : 0,
      descuentoM2: aplicarDescM2 ? descM2Val : 0, descuentoInicial: descIniVal,
      inicialRaw: cuota_inicial,
      inicial: formatMoney(cuota_inicial), inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO), inicialPct: formatPct,
      saldoRaw: saldo,
      pagoAmortizacion: formatMoney(pago_puro), seguro: formatMoney(seguro), cbdi: formatMoney(cbdi),
      mensualRaw: cuota_final,
      mensual: formatMoney(cuota_final), mensualBs: formatMoney(cuota_final * TIPO_CAMBIO),
      plazo: ans, 
      planPagos: planPagosArreglo,
      timestampId: new Date().getTime()
    });
  };

  const getTextToCopy = () => {
    if (!resultado) return "";
    const saludo = "Estimado cliente, un gusto saludarle. Presento la propuesta de inversión:\n\n";
    const nombreProyectoCapitalizado = resultado.proyecto.charAt(0).toUpperCase() + resultado.proyecto.slice(1).toLowerCase();
    const catStr = resultado.categoria && resultado.categoria !== "ESTÁNDAR" ? `\n🏷️ ${resultado.categoria}` : '';
    const ubicacion = `📍 *Proyecto ${nombreProyectoCapitalizado || 'S/N'} (${resultado.regional})*\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)${catStr}\n\n`;

    const precioLista = `💎 *Precio:* $ ${resultado.valorOriginal} (Bs. ${resultado.valorOriginalBs})\n\n`;
    
    let arrContado = [];
    if (resultado.porcentajeContado > 0) arrContado.push(`${resultado.porcentajeContado}%`);
    let isProyectosEspeciales = descGroup1_3USD.includes(resultado.proyecto.toUpperCase()) || descGroup2_4USD.includes(resultado.proyecto.toUpperCase()) || descGroup3_7USD.includes(resultado.proyecto.toUpperCase());
    let descM2ContadoVal = isProyectosEspeciales ? Number(resultado.descuentoContadoM2 || 0) : Number(resultado.descuentoM2 || 0) + Number(resultado.descuentoContadoM2 || 0);
    if (descM2ContadoVal > 0) arrContado.push(`$${descM2ContadoVal}/m²`);
    let contadoStr = arrContado.length > 0 ? `💰 *Contado - ¡Con ${arrContado.join(' + ')} de descuento!*\n*Inversión:* $${resultado.valorContado} (Bs. ${resultado.valorContadoBs})\n\n` : "";

    let arrCredito = [];
    if (resultado.porcentajeCredito > 0) arrCredito.push(`${resultado.porcentajeCredito}%`);
    if (resultado.descuentoM2 > 0) arrCredito.push(`$${resultado.descuentoM2}/m²`);
    if (resultado.descuentoInicial > 0) arrCredito.push(`Bono Inicial Doble`);
    let creditoStr = arrCredito.length > 0 ? `✅ *Crédito - ¡Con ${arrCredito.join(' + ')} de descuento!*\n*Inversión:* $ ${resultado.valorCredito} (Bs. ${resultado.valorCreditoBs})\n\n` : "";

    const financiamiento = `📊 *Plan de Financiamiento* (${resultado.plazo} años)\n*Cuota inicial:* ${resultado.inicialPct}% ($${resultado.inicial})\n*Cuota mensual:* $${resultado.mensual} (Bs. ${resultado.mensualBs})\n\n`;
    const cierre = `¿Le gustaría agendar una visita al terreno o prefiere una breve llamada para coordinar el cierre? Quedo a su disposición. 🤝`;

    return saludo + ubicacion + precioLista + contadoStr + creditoStr + financiamiento + cierre;
  };

  const enviarWhatsApp = () => {
    if (!resultado) return;
    const mensaje = getTextToCopy();
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
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
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification("¡Copiado al portapapeles con éxito!");
        } catch (error) {
            console.error('No se pudo copiar al portapapeles', error);
        }
        textArea.remove();
    }
  };

  const handleProcesar = (e) => {
    e.preventDefault();
    setIsCalculating(true);
    
    setTimeout(() => {
      calcular();
      setIsCalculating(false);
      if (resultadosRef.current) {
        resultadosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500); // 500ms para que se aprecie la animación de "procesando"
  };

  // Comparar lógica
  const EscenarioCard = ({ data, isGuardado, otherData }) => {
    let bestAhorro = false;
    let bestCuota = false;

    if (otherData) {
      if (data.ahorroCreditoRaw > otherData.ahorroCreditoRaw) bestAhorro = true;
      if (data.mensualRaw < otherData.mensualRaw) bestCuota = true;
    }

    return (
      <div className={`bg-white border rounded-3xl p-6 relative overflow-hidden flex flex-col h-full shadow-md transition-all duration-300 ${isGuardado ? 'border-slate-200' : 'border-emerald-400 bg-emerald-50/20'}`}>
        <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl ${isGuardado ? 'bg-slate-200/50' : 'bg-emerald-200/50'}`}></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${isGuardado ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
            {isGuardado ? 'Escenario A (Guardado)' : 'Escenario B (Actual)'}
          </div>
          {bestAhorro && <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-2 py-1 rounded border border-amber-200 flex items-center gap-1 shadow-sm"><TrendingUp className="w-3 h-3"/> Mayor Ahorro</span>}
        </div>

        <div className="text-center mb-8 relative z-10">
          <div className="text-4xl font-black text-slate-900 mb-1">{data.plazo} Años</div>
          <div className="text-emerald-600 font-bold tracking-wide bg-emerald-50 w-fit mx-auto px-4 py-1 rounded-full border border-emerald-100">Inicial: {data.inicialPct}% (${data.inicial})</div>
        </div>
        
        <div className="space-y-4 relative z-10 flex-1">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 text-sm">Superficie:</span>
            <span className="text-slate-900 font-bold text-sm">{data.superficie} m²</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 text-sm">Total a Financiar:</span>
            <span className="text-slate-900 font-bold text-sm">${data.valorCredito}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500 text-sm font-bold">Ahorro Promocional:</span>
            <span className={`font-black text-base ${data.ahorroCredito !== "0.00" ? 'text-emerald-600' : 'text-slate-400'}`}>
              {data.ahorroCredito !== "0.00" ? `$${data.ahorroCredito}` : "$0.00"}
            </span>
          </div>
        </div>

        <div className={`mt-8 border rounded-2xl p-5 flex justify-between items-center relative z-10 shadow-sm ${isGuardado ? 'bg-slate-50 border-slate-200' : 'bg-emerald-500 border-emerald-600'}`}>
          <div className={`text-[10px] font-black uppercase tracking-widest leading-tight ${isGuardado ? 'text-slate-500' : 'text-emerald-100'}`}>Cuota<br/>Mensual</div>
          <div className="text-right flex items-center gap-3">
            {bestCuota && <div className={`text-[9px] font-black uppercase px-2 py-1 rounded ${isGuardado ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-400 text-white'}`}>Mejor Cuota</div>}
            <div>
              <div className={`text-3xl font-black leading-none mb-1 ${isGuardado ? 'text-slate-900' : 'text-white'}`}>${data.mensual}</div>
              <div className={`text-[10px] font-bold ${isGuardado ? 'text-slate-500' : 'text-emerald-200'}`}>Bs. {data.mensualBs}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isPremiumLote = categoria.toUpperCase().includes('AVENIDA') || categoria.toUpperCase().includes('PARQUE') || categoria.toUpperCase().includes('RADIAL');
  const showDescPorcentaje = descGroup4_30PCT.includes(proyecto) || descGroup5_32PCT.includes(proyecto) || descGroup6_20PCT.includes(proyecto) || descGroup7_15PCT.includes(proyecto) || proyecto === "OTRO";
  const showDescM2 = descGroup1_3USD.includes(proyecto) || descGroup2_4USD.includes(proyecto) || descGroup3_7USD.includes(proyecto) || proyecto === "OTRO";
  const showDescContadoM2 = descGroup1_3USD.includes(proyecto) || descGroup2_4USD.includes(proyecto) || descGroup3_7USD.includes(proyecto);
  const showBonoInicial = proyecto === "OTRO";

  // Data Visualization: Barras de desglose
  const calculateBars = () => {
    if(!resultado) return { pAhorro: 0, pInicial: 0, pSaldo: 100 };
    const total = resultado.valorOriginalRaw;
    if(total <= 0) return { pAhorro: 0, pInicial: 0, pSaldo: 100 };
    
    const pAhorro = (resultado.ahorroCreditoRaw / total) * 100;
    const pInicial = (resultado.inicialRaw / total) * 100;
    const pSaldo = (resultado.saldoRaw / total) * 100;
    return { pAhorro, pInicial, pSaldo };
  };
  const bars = calculateBars();

  return (
    <div className="min-h-screen bg-slate-50 relative font-['Plus_Jakarta_Sans'] text-slate-800 overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-900">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes float { 0%, 100% { transform: translateY(0) scale(1.2); } 50% { transform: translateY(-20px) scale(1.2); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideUpFade { 0% { opacity: 0; transform: translate(-50%, 20px); } 10% { opacity: 1; transform: translate(-50%, 0); } 90% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -20px); } }
        
        .animate-blob { animation: blob 10s infinite alternate; }
        .animate-float { animation: float 15s ease-in-out infinite; }
        .animate-pop { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-toast { animation: slideUpFade 3s ease-in-out forwards; }
        
        .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05); }
        .glass-input { background: #ffffff; border: 1px solid #e2e8f0; color: #0f172a; }
        .glass-input:focus { background: #ffffff; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); outline: none;}
        select option { background: #ffffff; color: #0f172a; }

        @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .glass-panel { box-shadow: none; border: 1px solid #e2e8f0; }
        }
      `}</style>

      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm tracking-wide animate-toast border border-slate-700">
           <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {toast}
        </div>
      )}

      {/* MODAL DE COMPARATIVA */}
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

            {/* BANNER DE URGENCIA */}
            <div className="px-5 sm:px-8 pb-5 sm:pb-8 bg-slate-50/50 shrink-0">
               <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-[2rem] p-5 sm:p-8 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-start gap-4">
                     <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm mt-1">
                        <Flame className="w-8 h-8 text-amber-500" />
                     </div>
                     <div>
                       <h4 className="text-amber-900 font-black tracking-tight text-xl mb-1">Análisis de Oportunidad</h4>
                       <p className="text-amber-700/80 text-sm font-semibold max-w-md leading-relaxed">
                         Al cerrar hoy, te garantizas el descuento promocional válido hasta el <span className="font-bold text-amber-900">31 de mayo de 2026</span>. Evita pagar el precio regular sin promoción.
                       </p>
                     </div>
                   </div>
                   <div className="text-center md:text-right bg-white p-5 rounded-2xl border border-amber-200 w-full md:w-auto shadow-sm">
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Dinero Total Ahorrado</div>
                      <div className="text-4xl font-black text-amber-500 tracking-tighter">${resultado.ahorroCredito !== "0.00" ? resultado.ahorroCredito : resultado.ahorroContado}</div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MAPA ISOMÉTRICO DE FONDO */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15] flex items-center justify-center mix-blend-multiply animate-float no-print">
        <svg viewBox="0 0 1000 1000" className="w-full h-full max-w-[1600px] absolute right-[-20%] bottom-[-10%]" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(500, 400) scale(1.6)">
            {[...Array(15)].map((_, i) => <path key={`grid-v-${i}`} d={`M${-450 + i*60} ${225 + i*30} L${450 + i*60} ${-225 + i*30}`} stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" strokeDasharray="4 4" />)}
            {[...Array(15)].map((_, i) => <path key={`grid-h-${i}`} d={`M${-450 + i*60} ${-225 + i*30} L${450 + i*60} ${225 + i*30}`} stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" strokeDasharray="4 4" />)}
            <polygon points="0,0 60,30 0,60 -60,30" fill="rgba(16, 185, 129, 0.1)" stroke="#059669" strokeWidth="1" />
            <polygon points="60,30 120,60 60,90 0,60" fill="rgba(52, 211, 153, 0.15)" stroke="#10b981" strokeWidth="1.5" />
            <polygon points="-60,30 0,60 -60,90 -120,60" fill="rgba(5, 150, 105, 0.1)" stroke="#064e3b" strokeWidth="1" />
            <polygon points="0,60 60,90 0,120 -60,90" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />
            <path d="M0,60 L0,10 L60,-20 L60,30 Z" fill="url(#vol1)" stroke="#059669" strokeWidth="1" />
            <path d="M0,60 L0,10 L-60,40 L-60,90 Z" fill="url(#vol2)" stroke="#047857" strokeWidth="1" />
            <polygon points="0,10 60,-20 0,-50 -60,-20" fill="rgba(16, 185, 129, 0.2)" stroke="#34d399" strokeWidth="2" />
          </g>
          <defs>
            <linearGradient id="vol1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" /><stop offset="100%" stopColor="rgba(248, 250, 252, 0.9)" /></linearGradient>
            <linearGradient id="vol2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="rgba(5, 150, 105, 0.3)" /><stop offset="100%" stopColor="rgba(248, 250, 252, 0.9)" /></linearGradient>
          </defs>
        </svg>
      </div>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none no-print">
        <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-emerald-200/30 rounded-full mix-blend-multiply filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45rem] h-[45rem] bg-teal-200/20 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[55rem] h-[55rem] bg-cyan-200/20 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="hidden xl:flex fixed left-0 top-0 h-full w-20 items-center justify-center z-0 no-print">
        <div className="transform -rotate-90 whitespace-nowrap text-slate-300 font-black tracking-[0.5em] text-3xl select-none">CELINA PREMIUM</div>
      </div>

      <div className="max-w-[1280px] mx-auto py-10 px-4 sm:px-6 lg:px-12 xl:pl-24 relative z-10">
        
        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mb-8 sm:mb-12 gap-6 relative no-print">
          <div className="hidden md:block w-32"></div>
          <div className="text-center flex-1 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-white/80 border border-emerald-200 shadow-sm mb-4 sm:mb-5 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-700 text-center">Plataforma Inteligente Inmobiliaria</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm flex items-center justify-center flex-wrap gap-2 sm:gap-4 w-full">
              Simulador <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600">Celina</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-3 sm:mt-4 font-semibold tracking-widest uppercase">Desarrollado por Oscar Saravia®</p>
          </div>
          <div className="hidden md:block w-32"></div>
        </div>

        {/* CONTENEDOR GRID */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* PANEL IZQUIERDO: FORMULARIO */}
          <div className="lg:col-span-5 glass-panel rounded-[2.5rem] overflow-hidden transition-all duration-500 flex flex-col no-print">
            <div className="bg-emerald-50/50 p-5 sm:p-6 flex items-center justify-between gap-3 relative overflow-hidden border-b border-emerald-100">
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-sm">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-wide text-slate-800">Datos de Inversión</h2>
              </div>
              
              <div className="relative z-10">
                {!cargandoBD && baseDeDatosLotes.length > 0 && (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 rounded-full text-[9px] font-bold text-emerald-600 tracking-wider shadow-sm">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> BD Online
                   </span>
                )}
                {!cargandoBD && baseDeDatosLotes.length === 0 && (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 rounded-full text-[9px] font-bold text-rose-600 tracking-wider shadow-sm">
                     <AlertCircle className="w-3 h-3" /> BD Offline
                   </span>
                )}
              </div>
            </div>
            
            <div className="p-5 sm:p-8 flex-1 bg-white/50">
              <form onSubmit={handleProcesar} className="space-y-5 sm:space-y-6">

                {/* REGIONAL */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Map className="w-4 h-4 text-emerald-500" /> Regional
                  </label>
                  <div className="relative">
                    <select value={regional} onChange={e => setRegional(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none shadow-sm">
                      {Object.keys(proyectosPorRegional).map(reg => <option key={reg} value={reg}>{reg}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"><ChevronDown className="w-5 h-5" /></div>
                  </div>
                </div>
                
                {/* PROYECTO & BÚSQUEDA INTELIGENTE */}
                <div className="space-y-2.5 relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-500" /> Proyecto
                    </label>
                    {cargandoBD ? (
                      <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 flex items-center gap-1.5 border border-amber-200 px-3 py-1.5 rounded-full bg-amber-50">
                        <Loader2 className="w-3 h-3 animate-spin"/> Cargando BD...
                      </span>
                    ) : tieneBD ? (
                      <button type="button" onClick={() => setUsarBD(!usarBD)} className={`text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${usarBD ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm hover:bg-cyan-100' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}>
                        {usarBD ? <Database className="w-3 h-3 text-cyan-600"/> : <Edit2 className="w-3 h-3"/>} BÚSQUEDA INTELIGENTE
                      </button>
                    ) : null}
                  </div>
                  
                  <div className="relative">
                    <select value={proyecto} onChange={e => setProyecto(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none shadow-sm">
                      {proyectosPorRegional[regional]?.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="OTRO">OTRO...</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"><ChevronDown className="w-5 h-5" /></div>
                  </div>
                  {proyecto === "OTRO" && <input type="text" value={proyectoPersonalizado} onChange={e => setProyectoPersonalizado(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 sm:p-4 transition-all font-semibold mt-3 animate-pop shadow-sm" placeholder="Escribe el nombre del proyecto..." />}
                </div>

                {/* UV / MZN / LOTE */}
                <div className="pt-2 sm:pt-3">
                  <div className="bg-white border border-slate-200 rounded-[1.5rem] p-4 sm:p-5 flex flex-col gap-3 relative shadow-sm">
                    
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-600" />
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-widest">Ubicación del Lote</span>
                      </div>
                      {!usarBD && tieneBD && (
                        <span className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase flex items-center gap-1"><Edit2 className="w-3 h-3"/> Ingreso Manual</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold text-cyan-600 uppercase tracking-widest">UV</label>
                        {modoBD ? (
                           <div className="relative">
                             <select value={uv} onChange={handleUvChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer hover:border-cyan-400 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500">
                               <option value="" disabled hidden>Selec.</option>
                               {uvsDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-600"><ChevronDown className="w-3 h-3" /></div>
                           </div>
                        ) : (
                           <input type="text" value={uv} onChange={handleUvChange} placeholder="Ej. 49" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-center text-xs sm:text-sm font-bold transition-all placeholder-slate-400 focus:outline-none focus:border-cyan-500" />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold text-cyan-600 uppercase tracking-widest">MZN</label>
                        {modoBD ? (
                           <div className="relative">
                             <select value={mzn} onChange={handleMznChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer hover:border-cyan-400 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500">
                               <option value="" disabled hidden>Selec.</option>
                               {mznsDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-600"><ChevronDown className="w-3 h-3" /></div>
                           </div>
                        ) : (
                           <input type="text" value={mzn} onChange={handleMznChange} placeholder="Ej. 6" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-center text-xs sm:text-sm font-bold transition-all placeholder-slate-400 focus:outline-none focus:border-cyan-500" />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold text-cyan-600 uppercase tracking-widest">LOTE</label>
                        {modoBD ? (
                           <div className="relative">
                             <select value={lote} onChange={handleLoteChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer hover:border-cyan-400 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500">
                               <option value="" disabled hidden>Selec.</option>
                               {lotesDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-600"><ChevronDown className="w-3 h-3" /></div>
                           </div>
                        ) : (
                           <input type="text" value={lote} onChange={handleLoteChange} placeholder="Ej. 9" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 text-center text-xs sm:text-sm font-bold transition-all placeholder-slate-400 focus:outline-none focus:border-cyan-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CATEGORIA */}
                <div className="space-y-2.5 relative mt-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <LayoutTemplate className="w-3 h-3 text-emerald-500" /> Categoría del Lote
                    </label>
                    <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej. LOTE S/CALLE ESQ. A" className={`w-full rounded-xl p-3.5 text-xs sm:text-sm font-semibold transition-all placeholder-slate-400 ${modoBD ? 'bg-slate-50 border border-slate-200 text-slate-800 shadow-inner' : 'glass-input'}`} />
                </div>

                {/* SUP & PRECIO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-4">
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><Map className="w-4 h-4 text-emerald-500" /> Superficie <span className="text-slate-400 normal-case">(m²)</span></span>
                    </label>
                    <input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="Ej. 240" className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl transition-all placeholder-slate-400 ${modoBD ? 'bg-white border border-slate-200 text-slate-900 shadow-sm' : 'glass-input shadow-sm'}`} />
                  </div>

                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-500" /> Precio <span className="text-slate-400 normal-case">/ m²</span></span>
                    </label>
                    <input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. 145" className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl transition-all placeholder-slate-400 ${modoBD ? 'bg-white border border-slate-200 text-slate-900 shadow-sm' : 'glass-input shadow-sm'}`} />
                  </div>
                </div>

                {/* DESCUENTOS PREMIUM */}
                <div className="bg-slate-50 border border-emerald-200 p-4 sm:p-5 rounded-[2rem] shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl group-hover:bg-emerald-200/50 transition-colors"></div>
                  <div className="text-[10px] sm:text-xs font-extrabold text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-200 shadow-sm"><Gift className="w-4 h-4 text-emerald-500" /></div>
                    Descuentos Promocionales
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
                    {showDescPorcentaje && (
                      <>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                            <input type="checkbox" checked={aplicarDescContadoPct} onChange={e => setAplicarDescContadoPct(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /> A Contado (%)
                          </label>
                          <input type="number" step="0.01" min="0" disabled={!aplicarDescContadoPct} value={descuentoContado} onChange={handleDescContadoChange} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoPct ? 'bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500' : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}`} />
                          <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescContadoPct ? 'text-emerald-600' : 'text-slate-400'}`}>Máx: {calcularLimitesMaximos().maxContadoPct}%</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                            <input type="checkbox" checked={aplicarDescCreditoPct} onChange={e => setAplicarDescCreditoPct(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /> A Crédito (%)
                          </label>
                          <input type="number" step="0.01" min="0" disabled={!aplicarDescCreditoPct} value={descuentoCredito} onChange={handleDescCreditoChange} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescCreditoPct ? 'bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500' : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}`} />
                          <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescCreditoPct ? 'text-emerald-600' : 'text-slate-400'}`}>Máx: {calcularLimitesMaximos().maxCreditoPct}%</p>
                        </div>
                      </>
                    )}
                    {showDescM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                          <input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /> Crédito x m² ($us)
                        </label>
                        <input type="number" step="0.01" min="0" disabled={!aplicarDescM2} value={descuentoM2} onChange={handleDescM2Change} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescM2 ? 'bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500' : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}`} />
                        <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescM2 ? 'text-emerald-600' : 'text-slate-400'}`}>Máx: ${calcularLimitesMaximos().maxDescM2}</p>
                      </div>
                    )}
                    {showDescContadoM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                          <input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /> Contado x m² ($us)
                        </label>
                        <input type="number" step="0.01" min="0" disabled={!aplicarDescContadoM2} value={descuentoContadoM2} onChange={handleDescContadoM2Change} placeholder="Ej. 3" className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoM2 ? 'bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500' : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}`} />
                        <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescContadoM2 ? 'text-emerald-600' : 'text-slate-400'}`}>Máx: ${calcularLimitesMaximos().maxContadoM2}</p>
                      </div>
                    )}
                    {showBonoInicial && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
                          <input type="checkbox" checked={aplicarBonoInicialOtro} onChange={e => setAplicarBonoInicialOtro(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /> Bono Inicial ($us)
                        </label>
                        <input type="number" step="0.01" min="0" max="500" disabled={!aplicarBonoInicialOtro} value={descuentoInicial} onChange={handleBonoInicialChange} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarBonoInicialOtro ? 'bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500' : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}`} />
                        <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarBonoInicialOtro ? 'text-emerald-600' : 'text-slate-400'}`}>Máx: $500</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* INICIAL & PLAZO */}
                <div className="grid grid-cols-12 gap-4 sm:gap-5 mt-4">
                  <div className="col-span-12 md:col-span-8 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm relative">
                    
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" /> Inicial (%)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        min="0" 
                        required={modoInicial === 'porcentaje'}
                        value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''} 
                        onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                        placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 1.5'}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-900 text-sm sm:text-base shadow-sm placeholder-slate-400" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Monto ($us)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        min="0"
                        required={modoInicial === 'monto'}
                        value={modoInicial === 'monto' ? inicialMonto : ''} 
                        onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} 
                        placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 500'}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-black text-amber-600 text-sm sm:text-base shadow-sm placeholder-slate-400" 
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-12 md:col-span-4 space-y-2 mt-2 md:mt-0">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-500" /> Plazo
                    </label>
                    <div className="relative h-[calc(100%-1.5rem)]">
                      <select required value={años} onChange={e => setAños(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 outline-none transition-all font-bold text-slate-900 text-sm sm:text-base appearance-none pr-10 cursor-pointer h-full min-h-[50px] shadow-sm">
                        <option value="" disabled hidden>Selec.</option>
                        {[...Array(10)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"><ChevronRight className="w-5 h-5 rotate-90" /></div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isCalculating} className={`w-full mt-6 sm:mt-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold py-4 sm:py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-lg shadow-emerald-500/30 uppercase tracking-widest text-sm sm:text-lg relative overflow-hidden group ${isCalculating ? 'opacity-80 scale-95' : 'hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1'}`}>
                  <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                  <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                    {isCalculating ? (
                      <><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> Procesando...</>
                    ) : (
                      <>Procesar Cotización <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /></>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* PANEL DERECHO: RESULTADOS */}
          <div ref={resultadosRef} className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 scroll-mt-6">
            {!resultado || isCalculating ? (
              <div className="glass-panel rounded-[2.5rem] h-full min-h-[400px] sm:min-h-[600px] flex flex-col items-center justify-center text-slate-500 p-6 sm:p-10 text-center transition-all duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full blur-2xl animate-pulse"></div>
                  <div className="bg-white p-6 sm:p-8 rounded-full mb-6 sm:mb-8 shadow-lg border border-emerald-100 relative z-10">
                    {isCalculating ? <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 animate-spin" /> : <Calculator className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500" />}
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-2 sm:mb-3">
                  {isCalculating ? "Calculando Propuesta..." : "Plataforma Activa"}
                </h3>
                <p className="text-sm sm:text-base max-w-md text-slate-500 font-medium leading-relaxed px-2">
                  {isCalculating ? "Aplicando promociones e inteligencia artificial de precios." : "Completa los parámetros de inversión a la izquierda para generar una propuesta financiera detallada y lista para el cliente."}
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 animate-in fade-in slide-in-from-bottom-12 duration-700 ease-out relative overflow-hidden shadow-lg border border-emerald-100 bg-white">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-50 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 pb-5 sm:pb-6 border-b border-slate-100 gap-4 relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-3 tracking-tight">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-500 p-2 rounded-xl shadow-sm">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div> Propuesta Oficial
                  </h2>
                  <span className="mx-auto sm:mx-0 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] sm:text-xs font-extrabold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-2 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span> Aprobada
                  </span>
                </div>
                
                <div className="relative z-10 space-y-5 sm:space-y-6">
                  
                  {/* Fila: Proyecto y Lote */}
                  {(resultado.proyecto || resultado.uv || resultado.mzn || resultado.lote) && (
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4 pl-0 sm:pl-2 w-full justify-center sm:justify-start">
                        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-sm">
                          <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1">Desarrollo Urbanístico</div>
                          <div key={`proj-${resultado.timestampId}`} className="text-slate-900 font-black text-lg sm:text-xl uppercase leading-none tracking-tight animate-pop">{resultado.proyecto || 'S/N'}</div>
                          {resultado.categoria && resultado.categoria !== "ESTÁNDAR" && <div key={`cat-${resultado.timestampId}`} className="text-[8px] sm:text-[9px] text-amber-600 font-bold mt-1 tracking-wider animate-pop">{resultado.categoria}</div>}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                        <div className="text-center px-4 sm:px-5 py-2 sm:py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm"><div className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">UV</div><div key={`uv-${resultado.timestampId}`} className="text-emerald-600 font-black text-base sm:text-lg leading-none animate-pop" style={{animationDelay: '100ms'}}>{resultado.uv || '-'}</div></div>
                        <div className="text-center px-4 sm:px-5 py-2 sm:py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm"><div className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">MZN</div><div key={`mzn-${resultado.timestampId}`} className="text-emerald-600 font-black text-base sm:text-lg leading-none animate-pop" style={{animationDelay: '150ms'}}>{resultado.mzn || '-'}</div></div>
                        <div className="text-center px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm"><div className="text-[8px] sm:text-[9px] font-extrabold text-emerald-800 uppercase tracking-widest mb-1">LOTE</div><div key={`lt-${resultado.timestampId}`} className="text-emerald-700 font-black text-base sm:text-lg leading-none animate-pop" style={{animationDelay: '200ms'}}>{resultado.lote || '-'}</div></div>
                      </div>
                    </div>
                  )}

                  {/* Fila: Precio Contado */}
                  <div className="bg-white p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-end gap-4 sm:gap-6 relative overflow-hidden group">
                    <div className="text-center sm:text-left">
                      <span className="text-slate-500 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2 mb-1 sm:mb-2">Precio de Lista Original</span>
                      <div key={`po-${resultado.timestampId}`} className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter animate-pop">$ {resultado.valorOriginal}</div>
                      <div key={`pobs-${resultado.timestampId}`} className="text-xs sm:text-sm font-bold text-slate-400 mt-1 sm:mt-1.5 animate-pop">Bs. {resultado.valorOriginalBs}</div>
                    </div>
                    
                    {resultado.ahorroContado !== "0.00" && (
                      <div className="bg-emerald-50 text-emerald-800 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-emerald-200 relative z-10 w-full sm:w-auto text-center">
                        <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest mb-1 text-emerald-600 flex items-center justify-center gap-1.5"><Tag className="w-3 h-3"/> Oferta al Contado</div>
                        <div key={`pc-${resultado.timestampId}`} className="text-xl sm:text-2xl font-black tracking-tight text-emerald-900 animate-pop">$ {resultado.valorContado}</div>
                      </div>
                    )}
                  </div>

                  {/* Fila: Crédito Directo y Cuota Inicial */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="bg-white p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md hover:border-emerald-200 text-center sm:text-left flex flex-col justify-between">
                      <div>
                        <span className="text-cyan-600 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest">Total a Financiar</span>
                        <div key={`pcr-${resultado.timestampId}`} className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 sm:mt-2 animate-pop">$ {resultado.valorCredito}</div>
                      </div>
                      {resultado.ahorroCredito !== "0.00" && (
                          <div key={`ac-${resultado.timestampId}`} className="mt-3 sm:mt-4 text-[9px] sm:text-[10px] text-amber-700 font-extrabold bg-amber-50 inline-block px-3 py-1.5 rounded-lg border border-amber-200 uppercase tracking-widest animate-pop w-fit mx-auto sm:mx-0">
                            Ahorro Incluido: $ {resultado.ahorroCredito}
                          </div>
                      )}
                    </div>
                    
                    {/* VISUALIZACIÓN DE DESGLOSE (FINTECH STYLE) */}
                    <div className="bg-slate-50 p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 shadow-inner flex flex-col justify-center">
                      <span className="text-emerald-600 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-center sm:text-left mb-3">Distribución de Inversión</span>
                      <div className="w-full h-3 sm:h-4 bg-slate-200 rounded-full overflow-hidden flex animate-pop">
                        <div className="bg-amber-400 h-full transition-all duration-1000" style={{width: `${bars.pAhorro}%`}}></div>
                        <div className="bg-emerald-600 h-full transition-all duration-1000" style={{width: `${bars.pInicial}%`}}></div>
                        <div className="bg-teal-400 h-full transition-all duration-1000" style={{width: `${bars.pSaldo}%`}}></div>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[9px] sm:text-[10px] font-bold text-slate-500 animate-pop" style={{animationDelay: '100ms'}}>
                         <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Ahorro</div>
                         <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> Inicial (${resultado.inicial})</div>
                         <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400"></span> Saldo</div>
                      </div>
                    </div>
                  </div>

                  {/* Fila: Cuota Mensual ESTILO VIP CARD CELINA (VIBRANTE EN LIGHT MODE) */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-700 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] shadow-lg shadow-emerald-500/20 border border-emerald-400/40 group mt-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '2.5s' }}></div>
                    <div className="absolute top-0 right-0 w-32 sm:w-64 h-full bg-white/5 skew-x-12 transform translate-x-10 pointer-events-none"></div>
                    <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity"><Building2 className="w-48 h-48 sm:w-64 sm:h-64 text-white" /></div>
                    <span className="text-emerald-50 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest relative z-10 flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)] animate-pulse"></div> Cuota Mensual Fija ({resultado.plazo} Años)
                    </span>
                    <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 mt-2 sm:mt-3 relative z-10">
                      <div key={`c-${resultado.timestampId}`} className="text-[2.5rem] leading-none sm:text-7xl font-black text-white tracking-tighter drop-shadow-md break-all animate-pop">$ {resultado.mensual}</div>
                      <div key={`cbs-${resultado.timestampId}`} className="text-xl sm:text-3xl font-bold text-emerald-100 mt-1 sm:mt-0 animate-pop" style={{animationDelay: '100ms'}}>Bs. {resultado.mensualBs}</div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-emerald-50/80 mt-4 sm:mt-6 font-semibold tracking-widest relative z-10 flex flex-wrap gap-2 sm:gap-4 border-t border-white/20 pt-3 sm:pt-4 uppercase">
                      <span>Amort. ${resultado.pagoAmortizacion}</span><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-200 my-auto hidden sm:block"></span>
                      <span>Seguro ${resultado.seguro}</span><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-200 my-auto hidden sm:block"></span>
                      <span>CBDI ${resultado.cbdi}</span>
                    </div>
                  </div>

                  {/* NUEVO: PANEL DE COMPARATIVA (BOTONES) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 no-print">
                    <button onClick={() => setEscenarioGuardado(resultado)} className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm">
                       <Scale className="w-4 h-4"/>
                       {escenarioGuardado ? "Actualizar Escenario A" : "Guardar como Escenario A"}
                    </button>
                    {escenarioGuardado && (
                      <button onClick={() => setMostrarComparativa(true)} className="w-full bg-cyan-50 hover:bg-cyan-100 border border-cyan-300 text-cyan-700 font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm">
                         <Scale className="w-4 h-4"/> Comparar Escenarios
                      </button>
                    )}
                  </div>

                  {/* TABLA DE PLAN DE PAGOS (1 a 10 Años) */}
                  <div className="mt-5 sm:mt-6 print-only block">
                    <div className="bg-white border border-emerald-200 rounded-[1.5rem] overflow-hidden shadow-sm">
                      <div className="bg-emerald-50/80 p-4 border-b border-emerald-100">
                         <h3 className="text-emerald-800 font-bold text-sm tracking-wide flex items-center gap-2">
                           <Calendar className="w-4 h-4"/> Resumen de Plazos Alternativos
                         </h3>
                      </div>
                      <div className="p-3 sm:p-5">
                          <div className="grid grid-cols-3 gap-2 sm:gap-4 pb-3 border-b border-slate-100 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                            <div>Plazo</div><div className="text-emerald-600 flex items-center justify-center gap-1"><DollarSign className="w-3 h-3"/> Cuota ($us)</div><div className="text-emerald-600">Cuota (Bs.)</div>
                          </div>
                          <div className="pt-2">
                            {resultado.planPagos.map((plan, i) => (
                              <div key={i} className={`grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-3 rounded-xl text-center text-xs sm:text-sm font-bold transition-all duration-300 ${plan.isCurrent ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm scale-[1.02] transform my-1' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
                                <div className="flex items-center justify-center gap-1.5 sm:gap-2">{plan.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block"></span>} {plan.año} {plan.año === 1 ? 'Año' : 'Años'}</div>
                                <div className={`font-black ${plan.isCurrent ? 'text-emerald-700' : 'text-slate-800'}`}>$ {plan.cuotaUsd}</div>
                                <div className={plan.isCurrent ? 'text-emerald-600' : 'text-slate-500'}>Bs. {plan.cuotaBs}</div>
                              </div>
                            ))}
                          </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-200 no-print">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => window.print()} className="w-full sm:w-1/4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 font-bold py-3 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm hover:shadow-md">
                          <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button onClick={copiarTexto} className="w-full sm:w-1/3 bg-white hover:bg-cyan-50 border border-cyan-400 text-cyan-600 font-black py-4 sm:py-5 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm uppercase tracking-wider relative overflow-hidden shadow-sm hover:shadow-md">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span>COPIAR TEXTO</span>
                        </button>
                        <button onClick={enviarWhatsApp} className="w-full sm:w-2/3 bg-[#25D366] hover:bg-[#1DA851] text-white font-black py-4 sm:py-5 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-md hover:shadow-lg hover:-translate-y-1 text-xs sm:text-sm uppercase tracking-wider">
                          <Send className="w-5 h-5 sm:w-6 sm:h-6" /> <span>Enviar por WhatsApp</span>
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
