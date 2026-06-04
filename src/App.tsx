import React, { useState, useEffect, useRef } from "react";
import { 
  Calculator, Send, Map, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, Tag, 
  MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, ChevronDown, ListOrdered,
  Database, Edit2, LayoutTemplate, Loader2, AlertCircle, Scale, X, Flame, Printer,
  Info, ArrowRight
} from "lucide-react";

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
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    if (!proyectosPorRegional[regional].includes(proyecto)) {
      setProyecto(proyectosPorRegional[regional]?.[0] || "OTRO");
    }
  }, [regional]);

  const handleUvChange = (e) => { setUv(e.target.value); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoria(""); };
  const handleMznChange = (e) => { setMzn(e.target.value); setLote(""); setSuperficie(""); setPrecio(""); setCategoria(""); };
  const handleLoteChange = (e) => { setLote(e.target.value); };

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

  useEffect(() => { if (modoBD && uv && !uvsDisponibles.includes(uv)) setUv(""); }, [modoBD, uvsDisponibles, uv]);
  useEffect(() => { if (modoBD && mzn && !mznsDisponibles.includes(mzn)) setMzn(""); }, [modoBD, mznsDisponibles, mzn]);
  useEffect(() => { if (modoBD && lote && !lotesDisponibles.includes(lote)) setLote(""); }, [modoBD, lotesDisponibles, lote]);

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

  const isPremiumLote = categoria.toUpperCase().includes('AVENIDA') || categoria.toUpperCase().includes('PARQUE') || categoria.toUpperCase().includes('RADIAL');
  
  const calcularLimitesMaximos = () => {
    let maxCreditoPct = 0; let maxContadoPct = 0; let maxDescM2 = 0; let maxContadoM2 = 0;
    const maxBonoInicial = 500;
    let pct = 0;
    if (modoInicial === 'porcentaje') {
      pct = Number(inicialPorcentaje);
    } else {
      const sup = Number(superficie); const prec = Number(precio); const monto = Number(inicialMonto);
      if (sup > 0 && prec > 0 && monto > 0) {
        const val_orig = sup * prec;
        const base = val_orig - (sup * (aplicarDescM2 ? Number(descuentoM2) : 0));
        const val_final = base - (base * (aplicarDescCreditoPct ? (Number(descuentoCredito)/100) : 0));
        if (val_final > 0) pct = (monto / val_final) * 100;
      }
    }

    if (descGroup4_30PCT.includes(proyecto)) {
      maxContadoPct = 30; maxCreditoPct = (pct >= 4.99) ? 23 : 20; 
    } else if (descGroup5_32PCT.includes(proyecto)) {
      maxContadoPct = 32; maxCreditoPct = (pct >= 4.99) ? 28 : 25; 
    } else if (descGroup1_3USD.includes(proyecto)) {
      maxContadoM2 = 3; maxDescM2 = (pct >= 4.99) ? 2 : 1;
    } else if (descGroup2_4USD.includes(proyecto)) {
      maxContadoM2 = 4;
      const catU = categoria.toUpperCase();
      const isCanavPrem = proyecto === "CAÑAVERAL" && (catU.includes('CARRETERA') || catU.includes('PAVIMENTO') || catU.includes('4TO ANILLO') || catU.includes('4 ANILLO'));
      maxDescM2 = isCanavPrem ? 3 : ((pct >= 4.99) ? 2 : 1);
    } else if (descGroup3_7USD.includes(proyecto)) {
      maxContadoM2 = 7; maxDescM2 = 5;
    } else if (descGroup6_20PCT.includes(proyecto)) {
      maxContadoPct = 20; maxCreditoPct = 15;
    } else if (descGroup7_15PCT.includes(proyecto)) {
      maxContadoPct = 15; maxCreditoPct = 10;
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

  const showNotification = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const formatMoney = (amount) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const calcular = () => {
    let cuota_inicial = 0; let pct_efectivo = 0; let descIniVal = 0;
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
    const formatPct = (pct_efectivo % 1 === 0) ? pct_efectivo.toFixed(0) : pct_efectivo.toFixed(2);

    let planPagosArreglo = [];
    for (let i = 10; i >= 1; i--) {
      const m_i = i * 12;
      let pp_i = tasa === 0 ? saldo / m_i : saldo * (tasa * Math.pow(1 + tasa, m_i)) / (Math.pow(1 + tasa, m_i) - 1);
      const fS_i = baseSeguro[i] ? (baseSeguro[i] / refSaldo) : (26.38 + (i - 10) * 1) / refSaldo;
      const seg_i = saldo * fS_i;
      const c_final_i = pp_i + seg_i + cbdi;
      planPagosArreglo.push({ año: i, cuotaUsd: formatMoney(c_final_i), cuotaBs: formatMoney(c_final_i * TIPO_CAMBIO), isCurrent: i === ans });
    }

    setResultado({
      regional: regional, proyecto: proyecto === "OTRO" ? proyectoPersonalizado : proyecto, uv, mzn, lote, superficie: sup, categoria: categoria,
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
      inicialRaw: cuota_inicial, saldoRaw: saldo,
      inicial: formatMoney(cuota_inicial), inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO), inicialPct: formatPct,
      pagoAmortizacion: formatMoney(pago_puro), seguro: formatMoney(seguro), cbdi: formatMoney(cbdi),
      mensualRaw: cuota_final,
      mensual: formatMoney(cuota_final), mensualBs: formatMoney(cuota_final * TIPO_CAMBIO),
      plazo: ans, planPagos: planPagosArreglo, timestampId: new Date().getTime()
    });
  };

  const handleProcesar = (e) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      calcular();
      setIsCalculating(false);
      if (resultadosRef.current) resultadosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  };

  const getTextToCopy = () => {
    if (!resultado) return "";
    const pName = resultado.proyecto.charAt(0).toUpperCase() + resultado.proyecto.slice(1).toLowerCase();
    const catStr = resultado.categoria && resultado.categoria !== "ESTÁNDAR" ? `\n🏷️ ${resultado.categoria}` : '';
    const ubi = `📍 *Proyecto ${pName || 'S/N'} (${resultado.regional})*\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)${catStr}\n\n`;
    const precioLista = `💎 *Precio:* $ ${resultado.valorOriginal} (Bs. ${resultado.valorOriginalBs})\n\n`;
    
    let arrContado = [];
    if (resultado.porcentajeContado > 0) arrContado.push(`${resultado.porcentajeContado}%`);
    let isSpec = descGroup1_3USD.includes(resultado.proyecto.toUpperCase()) || descGroup2_4USD.includes(resultado.proyecto.toUpperCase()) || descGroup3_7USD.includes(resultado.proyecto.toUpperCase());
    let descM2ContadoVal = isSpec ? Number(resultado.descuentoContadoM2 || 0) : Number(resultado.descuentoM2 || 0) + Number(resultado.descuentoContadoM2 || 0);
    if (descM2ContadoVal > 0) arrContado.push(`$${descM2ContadoVal}/m²`);
    let contadoStr = arrContado.length > 0 ? `💰 *Contado - ¡Con ${arrContado.join(' + ')} de descuento!*\n*Inversión:* $${resultado.valorContado} (Bs. ${resultado.valorContadoBs})\n\n` : "";

    let arrCredito = [];
    if (resultado.porcentajeCredito > 0) arrCredito.push(`${resultado.porcentajeCredito}%`);
    if (resultado.descuentoM2 > 0) arrCredito.push(`$${resultado.descuentoM2}/m²`);
    if (resultado.descuentoInicial > 0) arrCredito.push(`Bono Inicial Doble`);
    let creditoStr = arrCredito.length > 0 ? `✅ *Crédito - ¡Con ${arrCredito.join(' + ')} de descuento!*\n*Inversión:* $ ${resultado.valorCredito} (Bs. ${resultado.valorCreditoBs})\n\n` : "";

    const fin = `📊 *Plan de Financiamiento* (${resultado.plazo} años)\n*Cuota inicial:* ${resultado.inicialPct}% ($${resultado.inicial})\n*Cuota mensual:* $${resultado.mensual} (Bs. ${resultado.mensualBs})\n\n`;
    const cierre = `¿Le gustaría agendar una visita al terreno o prefiere una breve llamada para coordinar el cierre? Quedo a su disposición. 🤝`;
    return "Estimado cliente, un gusto saludarle. Presento la propuesta de inversión:\n\n" + ubi + precioLista + contadoStr + creditoStr + fin + cierre;
  };

  const enviarWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(getTextToCopy())}`, '_blank'); };
  const copiarTexto = () => {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(getTextToCopy()).then(() => showNotification("¡Copiado al portapapeles!"));
    } else {
        let t = document.createElement("textarea"); t.value = getTextToCopy();
        t.style.position = "fixed"; t.style.left = "-999999px";
        document.body.appendChild(t); t.select(); document.execCommand('copy');
        showNotification("¡Copiado al portapapeles!"); t.remove();
    }
  };

  // Comparativa Card Component
  const EscenarioCard = ({ data, isGuardado, otherData }) => {
    let bestAhorro = false; let bestCuota = false;
    if (otherData) {
      if (data.ahorroCreditoRaw > otherData.ahorroCreditoRaw) bestAhorro = true;
      if (data.mensualRaw < otherData.mensualRaw) bestCuota = true;
    }
    return (
      <div className={`bg-white border rounded-3xl p-6 relative overflow-hidden flex flex-col h-full shadow-md transition-all duration-300 ${isGuardado ? 'border-slate-200' : 'border-emerald-400 ring-4 ring-emerald-500/10'}`}>
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
          <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-500 text-sm">Superficie:</span><span className="text-slate-900 font-bold text-sm">{data.superficie} m²</span></div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-500 text-sm">Financiamiento:</span><span className="text-slate-900 font-bold text-sm">${data.valorCredito}</span></div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100"><span className="text-slate-500 text-sm font-bold">Ahorro Promo:</span><span className={`font-black text-base ${data.ahorroCredito !== "0.00" ? 'text-emerald-600' : 'text-slate-400'}`}>{data.ahorroCredito !== "0.00" ? `$${data.ahorroCredito}` : "$0.00"}</span></div>
        </div>
        <div className={`mt-8 border rounded-2xl p-5 flex justify-between items-center relative z-10 shadow-sm ${isGuardado ? 'bg-slate-50 border-slate-200' : 'bg-emerald-600 border-emerald-500'}`}>
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

  const calculateBars = () => {
    if(!resultado || resultado.valorOriginalRaw <= 0) return { pAhorro: 0, pInicial: 0, pSaldo: 100 };
    const tot = resultado.valorOriginalRaw;
    return { pAhorro: (resultado.ahorroCreditoRaw / tot)*100, pInicial: (resultado.inicialRaw / tot)*100, pSaldo: (resultado.saldoRaw / tot)*100 };
  };
  const bars = calculateBars();

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-['Plus_Jakarta_Sans'] text-slate-800 overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-900">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95) translateY(5px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideUpFade { 0% { opacity: 0; transform: translate(-50%, 20px); } 10% { opacity: 1; transform: translate(-50%, 0); } 90% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -20px); } }
        .animate-pop { animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-toast { animation: slideUpFade 3s ease-in-out forwards; }
        
        .glass-panel { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.05); }
        .input-premium { background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; transition: all 0.3s ease; }
        .input-premium:focus { background: #ffffff; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); outline: none; }
        .input-premium:hover:not(:focus) { border-color: #cbd5e1; }
        
        @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .glass-panel { box-shadow: none; border: 1px solid #e2e8f0; }
        }
      `}</style>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm tracking-wide animate-toast border border-slate-700">
           <CheckCircle2 className="w-5 h-5 text-emerald-400" /> {toast}
        </div>
      )}

      {mostrarComparativa && escenarioGuardado && resultado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300 no-print">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 shrink-0 bg-slate-50/80">
              <h3 className="flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><Scale className="w-5 h-5" /></div> Comparativa Estratégica
              </h3>
              <button onClick={() => setMostrarComparativa(false)} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 p-2 rounded-full transition-colors shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 bg-slate-50/50 overflow-y-auto">
              <EscenarioCard data={escenarioGuardado} isGuardado={true} otherData={resultado} />
              <EscenarioCard data={resultado} isGuardado={false} otherData={escenarioGuardado} />
            </div>

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

      {/* Elementos de fondo elegantes */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] flex items-center justify-center no-print">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none no-print">
        <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-emerald-200/40 rounded-full mix-blend-multiply filter blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[55rem] h-[55rem] bg-cyan-100/50 rounded-full mix-blend-multiply filter blur-[120px]"></div>
      </div>

      <div className="hidden xl:flex fixed left-0 top-0 h-full w-20 items-center justify-center z-0 no-print">
        <div className="transform -rotate-90 whitespace-nowrap text-slate-200 font-black tracking-[0.5em] text-3xl select-none">CELINA PREMIUM</div>
      </div>

      <div className="max-w-[1280px] mx-auto py-10 px-4 sm:px-6 lg:px-12 xl:pl-24 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mb-10 gap-6 no-print">
          <div className="hidden md:block w-32"></div>
          <div className="text-center flex-1 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-white border border-emerald-100 shadow-sm mb-4">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Plataforma Inteligente de Inversión</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-900 drop-shadow-sm flex items-center justify-center flex-wrap gap-2 sm:gap-4 w-full">
              Simulador <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Celina</span>
            </h1>
          </div>
          <div className="hidden md:block w-32"></div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* PANEL IZQUIERDO: FORMULARIO */}
          <div className="lg:col-span-5 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col no-print">
            <div className="bg-slate-50/80 p-5 sm:p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 tracking-wide">Configuración</h2>
              </div>
              <div>
                {!cargandoBD && baseDeDatosLotes.length > 0 && (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-bold text-emerald-600 tracking-wider shadow-sm">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> BD Online
                   </span>
                )}
              </div>
            </div>
            
            <div className="p-6 sm:p-8 flex-1 bg-white/40">
              <form onSubmit={handleProcesar} className="space-y-6">

                {/* REGIONAL Y PROYECTO */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Map className="w-3.5 h-3.5 text-emerald-500" /> Regional
                    </label>
                    <div className="relative">
                      <select value={regional} onChange={e => setRegional(e.target.value)} className="w-full input-premium rounded-xl p-3 text-sm font-bold appearance-none cursor-pointer">
                        {Object.keys(proyectosPorRegional).map(reg => <option key={reg} value={reg}>{reg}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" /> Proyecto
                    </label>
                    <div className="relative">
                      <select value={proyecto} onChange={e => setProyecto(e.target.value)} className="w-full input-premium rounded-xl p-3 text-sm font-bold appearance-none cursor-pointer">
                        {proyectosPorRegional[regional]?.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="OTRO">OTRO...</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {proyecto === "OTRO" && <input type="text" value={proyectoPersonalizado} onChange={e => setProyectoPersonalizado(e.target.value)} className="w-full input-premium rounded-xl p-3 font-semibold text-sm animate-pop" placeholder="Nombre del proyecto..." />}

                {/* UBICACIÓN DEL LOTE (CASCADA) */}
                <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Ubicación del Terreno</span>
                    </div>
                    {tieneBD && (
                      <button type="button" onClick={() => setUsarBD(!usarBD)} className={`text-[9px] font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-all ${usarBD ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {usarBD ? <Database className="w-3 h-3"/> : <Edit2 className="w-3 h-3"/>} {usarBD ? 'Modo BD' : 'Manual'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center block">UV</label>
                      {modoBD ? (
                         <div className="relative">
                           <select value={uv} onChange={handleUvChange} className="w-full input-premium rounded-xl p-2.5 text-center text-sm font-bold appearance-none cursor-pointer">
                             <option value="" disabled hidden>--</option>
                             {uvsDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                           </select>
                           <ChevronDown className="w-3 h-3 absolute right-2 top-3 text-slate-400 pointer-events-none" />
                         </div>
                      ) : ( <input type="text" value={uv} onChange={handleUvChange} placeholder="49" className="w-full input-premium rounded-xl p-2.5 text-center text-sm font-bold" /> )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center block">MZN</label>
                      {modoBD ? (
                         <div className="relative">
                           <select value={mzn} onChange={handleMznChange} className="w-full input-premium rounded-xl p-2.5 text-center text-sm font-bold appearance-none cursor-pointer">
                             <option value="" disabled hidden>--</option>
                             {mznsDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                           </select>
                           <ChevronDown className="w-3 h-3 absolute right-2 top-3 text-slate-400 pointer-events-none" />
                         </div>
                      ) : ( <input type="text" value={mzn} onChange={handleMznChange} placeholder="6" className="w-full input-premium rounded-xl p-2.5 text-center text-sm font-bold" /> )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center block">LOTE</label>
                      {modoBD ? (
                         <div className="relative">
                           <select value={lote} onChange={handleLoteChange} className="w-full input-premium rounded-xl p-2.5 text-center text-sm font-bold appearance-none cursor-pointer">
                             <option value="" disabled hidden>--</option>
                             {lotesDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
                           </select>
                           <ChevronDown className="w-3 h-3 absolute right-2 top-3 text-slate-400 pointer-events-none" />
                         </div>
                      ) : ( <input type="text" value={lote} onChange={handleLoteChange} placeholder="9" className="w-full input-premium rounded-xl p-2.5 text-center text-sm font-bold" /> )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5 text-emerald-500" /> Categoría (Opcional)
                    </label>
                    <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej. LOTE S/AVENIDA" className="w-full input-premium rounded-xl p-3 text-sm font-semibold" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Map className="w-3.5 h-3.5 text-emerald-500" /> M²</span>
                    </label>
                    <input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="240" className="w-full input-premium rounded-xl p-3.5 font-black text-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Prec./m²</span>
                    </label>
                    <input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} placeholder="145" className="w-full input-premium rounded-xl p-3.5 font-black text-lg" />
                  </div>
                </div>

                {/* DESCUENTOS PROMOCIONALES */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-[1.5rem] shadow-sm relative">
                  <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Gift className="w-4 h-4 text-emerald-500" /> Promociones Activas
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {showDescPorcentaje && (
                      <>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={aplicarDescContadoPct} onChange={e => setAplicarDescContadoPct(e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" /> A Contado (%)
                          </label>
                          <input type="number" step="0.01" disabled={!aplicarDescContadoPct} value={descuentoContado} onChange={handleDescContadoChange} className="w-full input-premium rounded-lg p-2.5 text-sm font-bold" />
                          <div className="text-[9px] font-bold text-emerald-600">Tope: {calcularLimitesMaximos().maxContadoPct}%</div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={aplicarDescCreditoPct} onChange={e => setAplicarDescCreditoPct(e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" /> A Crédito (%)
                          </label>
                          <input type="number" step="0.01" disabled={!aplicarDescCreditoPct} value={descuentoCredito} onChange={handleDescCreditoChange} className="w-full input-premium rounded-lg p-2.5 text-sm font-bold" />
                          <div className="text-[9px] font-bold text-emerald-600">Tope: {calcularLimitesMaximos().maxCreditoPct}%</div>
                        </div>
                      </>
                    )}
                    {showDescM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" /> Crédito x m² ($us)
                        </label>
                        <input type="number" step="0.01" disabled={!aplicarDescM2} value={descuentoM2} onChange={handleDescM2Change} className="w-full input-premium rounded-lg p-2.5 text-sm font-bold" />
                        <div className="text-[9px] font-bold text-emerald-600">Tope: ${calcularLimitesMaximos().maxDescM2}</div>
                      </div>
                    )}
                    {showDescContadoM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" /> Contado x m² ($us)
                        </label>
                        <input type="number" step="0.01" disabled={!aplicarDescContadoM2} value={descuentoContadoM2} onChange={handleDescContadoM2Change} className="w-full input-premium rounded-lg p-2.5 text-sm font-bold" />
                        <div className="text-[9px] font-bold text-emerald-600">Tope: ${calcularLimitesMaximos().maxContadoM2}</div>
                      </div>
                    )}
                    {showBonoInicial && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                          <input type="checkbox" checked={aplicarBonoInicialOtro} onChange={e => setAplicarBonoInicialOtro(e.target.checked)} className="accent-emerald-500 w-3.5 h-3.5" /> Bono Inicial ($us)
                        </label>
                        <input type="number" step="0.01" disabled={!aplicarBonoInicialOtro} value={descuentoInicial} onChange={handleBonoInicialChange} className="w-full input-premium rounded-lg p-2.5 text-sm font-bold" />
                      </div>
                    )}
                  </div>
                </div>

                {/* INICIAL & PLAZO */}
                <div className="grid grid-cols-12 gap-4 mt-4">
                  <div className="col-span-12 md:col-span-8 bg-slate-50 border border-slate-200 p-4 rounded-[1.5rem] grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Percent className="w-3 h-3 text-emerald-500" /> Inicial (%)
                      </label>
                      <input type="number" step="0.01" min="0" required={modoInicial === 'porcentaje'} value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''} onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} placeholder={modoInicial === 'monto' ? 'Auto' : '1.5'} className="w-full input-premium rounded-xl p-3 text-sm font-black text-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-emerald-500" /> Monto ($us)
                      </label>
                      <input type="number" step="0.01" min="0" required={modoInicial === 'monto'} value={modoInicial === 'monto' ? inicialMonto : ''} onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} placeholder={modoInicial === 'porcentaje' ? 'Auto' : '500'} className="w-full input-premium rounded-xl p-3 text-sm font-black text-emerald-600" />
                    </div>
                  </div>
                  
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-1 md:mt-0">
                      <Calendar className="w-3 h-3 text-emerald-500" /> Plazo
                    </label>
                    <div className="relative h-[calc(100%-1.5rem)]">
                      <select required value={años} onChange={e => setAños(e.target.value)} className="w-full input-premium rounded-[1.5rem] p-3 font-bold text-slate-800 text-sm appearance-none cursor-pointer h-full">
                        <option value="" disabled hidden>--</option>
                        {[...Array(10)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isCalculating} className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(15,23,42,0.15)] uppercase tracking-wider text-sm group">
                  {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generar Propuesta <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>
            </div>
          </div>

          {/* PANEL DERECHO: RESULTADOS */}
          <div ref={resultadosRef} className="lg:col-span-7 flex flex-col gap-6 scroll-mt-6">
            {!resultado || isCalculating ? (
              <div className="glass-panel rounded-[2.5rem] h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                <div className="bg-slate-50 p-8 rounded-full mb-6 border border-slate-100 shadow-sm relative">
                  {isCalculating ? <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /> : <Calculator className="w-12 h-12 text-emerald-500" />}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Simulador de Inversión</h3>
                <p className="text-sm max-w-sm text-slate-500 font-medium leading-relaxed">Ajusta los parámetros para visualizar la estructura financiera detallada y el plan de pagos.</p>
              </div>
            ) : (
              <div className="glass-panel rounded-[2.5rem] p-6 sm:p-10 animate-pop">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-slate-100 gap-4">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                    <div className="bg-emerald-100 p-2 rounded-xl"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div> Propuesta Oficial
                  </h2>
                  <span className="bg-slate-900 text-white text-[10px] font-extrabold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-2 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Generado
                  </span>
                </div>
                
                <div className="space-y-6">
                  
                  {/* Fila: Proyecto y Lote */}
                  {(resultado.proyecto || resultado.uv || resultado.mzn || resultado.lote) && (
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-5 rounded-3xl border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100"><MapPin className="w-6 h-6 text-slate-900" /></div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Desarrollo Urbanístico</div>
                          <div key={`proj-${resultado.timestampId}`} className="text-slate-900 font-black text-xl uppercase tracking-tight animate-pop">{resultado.proyecto || 'S/N'}</div>
                          {resultado.categoria && resultado.categoria !== "ESTÁNDAR" && <div key={`cat-${resultado.timestampId}`} className="text-[9px] text-emerald-600 font-bold tracking-wider animate-pop mt-0.5">{resultado.categoria}</div>}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="text-center px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm"><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">UV</div><div key={`uv-${resultado.timestampId}`} className="text-slate-800 font-black text-lg leading-none animate-pop">{resultado.uv || '-'}</div></div>
                        <div className="text-center px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm"><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MZN</div><div key={`mzn-${resultado.timestampId}`} className="text-slate-800 font-black text-lg leading-none animate-pop">{resultado.mzn || '-'}</div></div>
                        <div className="text-center px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm"><div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">LOTE</div><div key={`lt-${resultado.timestampId}`} className="text-emerald-800 font-black text-lg leading-none animate-pop">{resultado.lote || '-'}</div></div>
                      </div>
                    </div>
                  )}

                  {/* Fila: Precio Contado */}
                  <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200/60 shadow-md flex flex-col sm:flex-row justify-between sm:items-end gap-6 group hover:border-emerald-200 transition-colors">
                    <div>
                      <span className="text-slate-400 text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 mb-2">Precio de Lista Original</span>
                      <div key={`po-${resultado.timestampId}`} className="text-4xl font-black text-slate-900 tracking-tighter animate-pop">$ {resultado.valorOriginal}</div>
                      <div key={`pobs-${resultado.timestampId}`} className="text-sm font-bold text-slate-400 mt-1 animate-pop">Bs. {resultado.valorOriginalBs}</div>
                    </div>
                    {resultado.ahorroContado !== "0.00" && (
                      <div className="bg-emerald-50 text-emerald-800 px-6 py-4 rounded-2xl border border-emerald-200 text-center shadow-sm">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest mb-1 text-emerald-600 flex items-center justify-center gap-1.5"><Tag className="w-3 h-3"/> Oferta Contado</div>
                        <div key={`pc-${resultado.timestampId}`} className="text-2xl font-black tracking-tight animate-pop">$ {resultado.valorContado}</div>
                      </div>
                    )}
                  </div>

                  {/* Fila: Crédito Directo y Cuota Inicial */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-md hover:border-emerald-200 transition-colors">
                      <span className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">Total a Financiar</span>
                      <div key={`pcr-${resultado.timestampId}`} className="text-3xl font-black text-slate-900 tracking-tight mt-2 animate-pop">$ {resultado.valorCredito}</div>
                      {resultado.ahorroCredito !== "0.00" && (
                          <div key={`ac-${resultado.timestampId}`} className="mt-3 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest inline-block animate-pop">
                            Ahorro: $ {resultado.ahorroCredito}
                          </div>
                      )}
                    </div>
                    
                    {/* DESGLOSE VISUAL TIPO FINTECH */}
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/60 shadow-inner flex flex-col justify-center">
                      <span className="text-slate-700 text-[10px] font-extrabold uppercase tracking-widest mb-3">Desglose de Inversión</span>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex animate-pop">
                        <div className="bg-amber-400 h-full transition-all duration-1000" style={{width: `${bars.pAhorro}%`}}></div>
                        <div className="bg-slate-800 h-full transition-all duration-1000" style={{width: `${bars.pInicial}%`}}></div>
                        <div className="bg-emerald-500 h-full transition-all duration-1000" style={{width: `${bars.pSaldo}%`}}></div>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[9px] font-bold text-slate-500 animate-pop" style={{animationDelay: '100ms'}}>
                         <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Ahorro</div>
                         <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-800"></span> Inicial (${resultado.inicial})</div>
                         <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Saldo</div>
                      </div>
                    </div>
                  </div>

                  {/* VIP CARD: CUOTA MENSUAL (Black Emerald Theme) */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#022c22] to-slate-900 p-8 sm:p-12 rounded-[2rem] shadow-2xl shadow-emerald-900/20 border border-emerald-900/50 mt-2">
                    <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12 transform translate-x-20 pointer-events-none"></div>
                    <div className="absolute -bottom-10 -right-10 opacity-10"><Building2 className="w-64 h-64 text-white" /></div>
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <span className="text-emerald-400 text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse"></div> 
                        Cuota Mensual Fija
                      </span>
                      <span className="text-slate-300 text-xs font-black bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10">{resultado.plazo} Años</span>
                    </div>
                    
                    <div className="flex flex-wrap items-baseline gap-4 mt-4 relative z-10">
                      <div key={`c-${resultado.timestampId}`} className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-lg animate-pop">$ {resultado.mensual}</div>
                      <div key={`cbs-${resultado.timestampId}`} className="text-xl sm:text-2xl font-bold text-emerald-200/80 animate-pop" style={{animationDelay: '100ms'}}>Bs. {resultado.mensualBs}</div>
                    </div>
                    
                    <div className="text-[10px] text-slate-400 mt-8 font-semibold tracking-widest relative z-10 flex gap-4 border-t border-white/10 pt-4 uppercase">
                      <span>Amort. ${resultado.pagoAmortizacion}</span><span className="w-1 h-1 rounded-full bg-slate-600 my-auto"></span>
                      <span>Seguro ${resultado.seguro}</span><span className="w-1 h-1 rounded-full bg-slate-600 my-auto"></span>
                      <span>CBDI ${resultado.cbdi}</span>
                    </div>
                  </div>

                  {/* NUEVO: PANEL DE COMPARATIVA CON INSIGNIAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 no-print">
                    <button onClick={() => setEscenarioGuardado(resultado)} className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm group">
                       <Scale className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors"/>
                       {escenarioGuardado ? "Actualizar Escenario A" : "Guardar para Comparar"}
                    </button>
                    {escenarioGuardado && (
                      <button onClick={() => setMostrarComparativa(true)} className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm animate-pop">
                         <Scale className="w-4 h-4"/> Comparar Escenarios
                      </button>
                    )}
                  </div>

                  {/* ACORDEÓN: PLAN DE PAGOS (1 a 10 Años) */}
                  <div className="mt-4 no-print">
                    <button onClick={() => setMostrarPlan(!mostrarPlan)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all shadow-sm text-left group">
                      <div className="flex items-center gap-3"><div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm"><ListOrdered className="w-4 h-4 text-slate-500 group-hover:text-emerald-500" /></div><span className="text-sm">Ver Plan de Pagos (10 a 1 años)</span></div>
                      <div className={`bg-white p-1.5 rounded-full border border-slate-200 transition-transform duration-300 shadow-sm ${mostrarPlan ? 'rotate-180' : ''}`}><ChevronDown className="w-4 h-4 text-slate-500" /></div>
                    </button>
                    {mostrarPlan && (
                      <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm animate-pop">
                        <div className="grid grid-cols-3 gap-4 p-4 border-b border-slate-100 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                          <div>Plazo</div><div className="flex items-center justify-center gap-1"><DollarSign className="w-3 h-3"/> Cuota ($us)</div><div>Cuota (Bs.)</div>
                        </div>
                        <div className="p-2">
                          {resultado.planPagos.map((plan, i) => (
                            <div key={i} className={`grid grid-cols-3 gap-4 p-3 rounded-xl text-center text-sm font-bold transition-all duration-300 ${plan.isCurrent ? 'bg-emerald-50 border border-emerald-100 text-emerald-900 shadow-sm scale-[1.02] my-1' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
                              <div className="flex items-center justify-center gap-2">{plan.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>} {plan.año} {plan.año === 1 ? 'Año' : 'Años'}</div>
                              <div className={`font-black ${plan.isCurrent ? 'text-emerald-700' : 'text-slate-800'}`}>$ {plan.cuotaUsd}</div>
                              <div className={plan.isCurrent ? 'text-emerald-600' : 'text-slate-400'}>Bs. {plan.cuotaBs}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACCIONES FINALES */}
                  <div className="mt-8 pt-6 border-t border-slate-100 no-print">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => window.print()} className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md">
                          <Printer className="w-5 h-5" /> Imprimir
                        </button>
                        <button onClick={copiarTexto} className="w-full sm:w-1/3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-sm hover:shadow-md group">
                          {copiado ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <FileText className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />}
                          <span>{copiado ? 'COPIADO' : 'COPIAR'}</span>
                        </button>
                        <button onClick={enviarWhatsApp} className="w-full sm:w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 hover:-translate-y-1 text-sm uppercase tracking-wider">
                          <Send className="w-5 h-5" /> Enviar por WhatsApp
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
