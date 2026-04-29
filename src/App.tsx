import React, { useState, useEffect, useRef } from "react";
import { 
  Calculator, Send, Map, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, Tag, 
  MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, ChevronDown, ListOrdered,
  Database, Edit2, LayoutTemplate, Loader2, AlertCircle
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
  "MONTERO": [
    "MUYURINA",
    "LOS JARDINES",
    "EL RENACER",
    "CELINA 3",
    "CELINA 4",
    "CELINA 5",
    "RANCHO NUEVO",
    "CELINA X",
    "CAÑAVERAL",
    "SANTA FE",
    "VILLA BELLA VIVIENDAS"
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

// ============================================================================
// AGRUPACIONES POR REGLAS DE DESCUENTOS
// ============================================================================
const descGroup1_3USD = ["LOS JARDINES", "SANTA FE", "EL RENACER", "RANCHO NUEVO", "SANTA ROSA - FASE 1", "SANTA ROSA - FASE 2", "SANTA ROSA - FASE 3", "EL ENCANTO FASE 2", "SAN JORGE", "EL PORVENIR", "EL PORVENIR FASE 2"];
const descGroup2_4USD = ["CAÑAVERAL", "EL ENCANTO", "CELINA 7 FASE 3"];
const descGroup3_7USD = ["JARDINES DEL BOSQUE"];
const descGroup4_30PCT = ["MUYURINA", "CELINA VII FASE 1", "CELINA VII FASE 2", "CELINA X", "TAMARINDO", "CLARA CHUCHIO", "URUBÓ NORTE", "CELINA 8"];
const descGroup5_32PCT = ["CELINA 3", "CELINA 4", "CELINA 5", "CELINA PAILÓN", "VILLA BELLA VIVIENDAS"];
const descGroup6_20PCT = ["PRADERAS DEL NORTE"];
const descGroup7_15PCT = ["ROSA RODALI"];

export default function App() {
  const [regional, setRegional] = useState("MONTERO");
  const [proyecto, setProyecto] = useState("MUYURINA");
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
  const [copiado, setCopiado] = useState(false);
  
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

  // Manejadores de cascada
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

  // Reset TOTAL al cambiar de proyecto
  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños(""); setCategoria("");
    setResultado(null); setProyectoPersonalizado(""); setMostrarPlan(false);

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

  // ==========================================================================
  // MOTOR INTELIGENTE DE ALIAS
  // ==========================================================================
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

  // Rellenar Superficie y Precio Final
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


  // ==========================================================================
  // LÓGICA DE DESCUENTOS Y RESTRICCIONES PREMIUM
  // ==========================================================================
  const isPremiumLote = categoria.toUpperCase().includes('AVENIDA') || categoria.toUpperCase().includes('PARQUE') || categoria.toUpperCase().includes('RADIAL');
  
  let minMontoPremium = 0;
  if (isPremiumLote && superficie && precio) {
      const sup = Number(superficie); const prec = Number(precio);
      const val_orig = sup * prec;
      const desc_m2_val = aplicarDescM2 ? Number(descuentoM2) : 0;
      const val_post_desc_m2 = val_orig - (sup * desc_m2_val);
      const m_desc_cred = val_post_desc_m2 * (aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0);
      const base = val_post_desc_m2 - m_desc_cred;
      if (base > 0) minMontoPremium = base * 0.05;
  }

  // --- NUEVA LÓGICA: Calcular los límites MÁXIMOS permitidos ---
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

    if (descGroup4_30PCT.includes(proyecto)) {
      maxContadoPct = 30;
      maxCreditoPct = (pct >= 4.99) ? 23 : 20; // SIN RESTRICCIÓN DE PREMIUM LOTE PARA EL PREMIO
    } else if (descGroup5_32PCT.includes(proyecto)) {
      maxContadoPct = 32;
      maxCreditoPct = (pct >= 4.99) ? 28 : 25; // SIN RESTRICCIÓN DE PREMIUM LOTE PARA EL PREMIO
    } else if (descGroup1_3USD.includes(proyecto)) {
      maxContadoM2 = 3;
      maxDescM2 = (pct >= 4.99) ? 2 : 1;
    } else if (descGroup2_4USD.includes(proyecto)) {
      maxContadoM2 = 4;
      maxDescM2 = (pct >= 4.99) ? 2 : 1;
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

  // Efecto que auto-aplica los descuentos máximos
  useEffect(() => {
    const limites = calcularLimitesMaximos();
    setDescuentoCredito(limites.maxCreditoPct);
    setDescuentoContado(limites.maxContadoPct);
    setDescuentoM2(limites.maxDescM2);
    setDescuentoContadoM2(limites.maxContadoM2);
  }, [modoInicial, inicialPorcentaje, inicialMonto, superficie, precio, proyecto, categoria, aplicarDescM2, aplicarDescCreditoPct]);

  // Manejadores para edición manual con validación de tope
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

  const calcular = () => {
    let cuota_inicial = 0;
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
       cuota_inicial = base_para_inicial * (Number(inicialPorcentaje) / 100);
    } else {
       cuota_inicial = Number(inicialMonto);
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
    const meses = ans * 12;
    const tasa_anual = 0.121733; const tasa = tasa_anual / 12;
    let pago_puro = tasa === 0 ? saldo / meses : saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
    const refSaldo = 34278.00;
    const baseSeguro = { 1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38 };
    const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1) / refSaldo;

    const seguro = saldo * factorSeguro;
    const cbdi = 0;
    const cuota_final = pago_puro + seguro + cbdi;
    const TIPO_CAMBIO = 6.97;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;

    let planPagosArreglo = [];
    for (let i = 10; i >= 1; i--) {
      const m_i = i * 12;
      let pp_i = tasa === 0 ? saldo / m_i : saldo * (tasa * Math.pow(1 + tasa, m_i)) / (Math.pow(1 + tasa, m_i) - 1);
      const fS_i = baseSeguro[i] ? (baseSeguro[i] / refSaldo) : (26.38 + (i - 10) * 1) / refSaldo;
      const seg_i = saldo * fS_i;
      const c_final_i = pp_i + seg_i + cbdi;
      planPagosArreglo.push({ año: i, cuotaUsd: formatMoney(c_final_i), cuotaBs: formatMoney(c_final_i * TIPO_CAMBIO) });
    }

    setResultado({
      regional: regional, proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, categoria: categoria,
      valorOriginal: formatMoney(valor_original), valorOriginalBs: formatMoney(valor_original * TIPO_CAMBIO),
      valorContado: formatMoney(valor_contado), valorContadoBs: formatMoney(valor_contado * TIPO_CAMBIO),
      ahorroContado: formatMoney(monto_descuento_total_contado), porcentajeContado: aplicarDescContadoPct ? descuentoContado : 0,
      descuentoContadoM2: aplicarDescContadoM2 ? descContadoM2Val : 0,
      valorCredito: formatMoney(valor_credito), valorCreditoBs: formatMoney(valor_credito * TIPO_CAMBIO),
      ahorroCredito: formatMoney(monto_descuento_total_credito), porcentajeCredito: aplicarDescCreditoPct ? descuentoCredito : 0,
      descuentoM2: aplicarDescM2 ? descM2Val : 0, descuentoInicial: descIniVal,
      inicial: formatMoney(cuota_inicial), inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO),
      pagoAmortizacion: formatMoney(pago_puro), seguro: formatMoney(seguro), cbdi: formatMoney(cbdi),
      mensual: formatMoney(cuota_final), mensualBs: formatMoney(cuota_final * TIPO_CAMBIO),
      plazo: ans, planPagos: planPagosArreglo,
      timestampId: new Date().getTime()
    });
    setCopiado(false); 
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

    const financiamiento = `📊 *Plan de Financiamiento* (${resultado.plazo} años)\n*Cuota inicial:* $${resultado.inicial} (Bs. ${resultado.inicialBs})\n*Cuota mensual:* $${resultado.mensual} (Bs. ${resultado.mensualBs})\n\n`;
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
        navigator.clipboard.writeText(mensaje).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        });
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
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
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
    }, 400);
  };

  const showDescPorcentaje = descGroup4_30PCT.includes(proyecto) || descGroup5_32PCT.includes(proyecto) || descGroup6_20PCT.includes(proyecto) || descGroup7_15PCT.includes(proyecto) || proyecto === "OTRO";
  const showDescM2 = descGroup1_3USD.includes(proyecto) || descGroup2_4USD.includes(proyecto) || descGroup3_7USD.includes(proyecto) || proyecto === "OTRO";
  const showDescContadoM2 = descGroup1_3USD.includes(proyecto) || descGroup2_4USD.includes(proyecto) || descGroup3_7USD.includes(proyecto);
  const showBonoInicial = proyecto === "OTRO";

  return (
    <div className="min-h-screen bg-[#020617] relative font-['Plus_Jakarta_Sans'] text-slate-200 overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      
      <style>{`
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes float { 0%, 100% { transform: translateY(0) scale(1.2); } 50% { transform: translateY(-20px) scale(1.2); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        
        .animate-blob { animation: blob 10s infinite alternate; }
        .animate-float { animation: float 15s ease-in-out infinite; }
        .animate-pop { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        .glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(16, 185, 129, 0.15); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255,255,255,0.05); }
        .glass-input { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); color: #f8fafc; }
        .glass-input:focus { background: rgba(15, 23, 42, 0.8); border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05); }
        select option { background: #0f172a; color: #f8fafc; }
      `}</style>

      {/* MAPA ISOMÉTRICO */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.25] flex items-center justify-center mix-blend-screen animate-float">
        <svg viewBox="0 0 1000 1000" className="w-full h-full max-w-[1600px] absolute right-[-20%] bottom-[-10%]" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(500, 400) scale(1.6)">
            {[...Array(15)].map((_, i) => <path key={`grid-v-${i}`} d={`M${-450 + i*60} ${225 + i*30} L${450 + i*60} ${-225 + i*30}`} stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" strokeDasharray="4 4" />)}
            {[...Array(15)].map((_, i) => <path key={`grid-h-${i}`} d={`M${-450 + i*60} ${-225 + i*30} L${450 + i*60} ${225 + i*30}`} stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" strokeDasharray="4 4" />)}
            <polygon points="0,0 60,30 0,60 -60,30" fill="rgba(16, 185, 129, 0.1)" stroke="#059669" strokeWidth="1" />
            <polygon points="60,30 120,60 60,90 0,60" fill="rgba(52, 211, 153, 0.15)" stroke="#10b981" strokeWidth="1.5" />
            <polygon points="-60,30 0,60 -60,90 -120,60" fill="rgba(5, 150, 105, 0.1)" stroke="#064e3b" strokeWidth="1" />
            <polygon points="0,60 60,90 0,120 -60,90" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />
            <path d="M0,60 L0,10 L60,-20 L60,30 Z" fill="url(#vol1)" stroke="#059669" strokeWidth="1" />
            <path d="M0,60 L0,10 L-60,40 L-60,90 Z" fill="url(#vol2)" stroke="#047857" strokeWidth="1" />
            <polygon points="0,10 60,-20 0,-50 -60,-20" fill="rgba(16, 185, 129, 0.4)" stroke="#34d399" strokeWidth="2" />
          </g>
          <defs>
            <linearGradient id="vol1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="rgba(16, 185, 129, 0.5)" /><stop offset="100%" stopColor="rgba(2, 6, 23, 0.9)" /></linearGradient>
            <linearGradient id="vol2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="rgba(5, 150, 105, 0.5)" /><stop offset="100%" stopColor="rgba(2, 6, 23, 0.9)" /></linearGradient>
          </defs>
        </svg>
      </div>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-emerald-900/40 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45rem] h-[45rem] bg-teal-800/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[55rem] h-[55rem] bg-cyan-900/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="hidden xl:flex fixed left-0 top-0 h-full w-20 items-center justify-center z-0">
        <div className="transform -rotate-90 whitespace-nowrap text-slate-800/80 font-black tracking-[0.5em] text-3xl select-none">CELINA PREMIUM</div>
      </div>

      <div className="max-w-[1280px] mx-auto py-10 px-4 sm:px-6 lg:px-12 xl:pl-24 relative z-10">
        
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mb-8 sm:mb-12 gap-6 relative">
          <div className="hidden md:block w-32"></div>
          <div className="text-center flex-1 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-slate-800/50 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-4 sm:mb-5 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-400 text-center">Plataforma Inteligente Inmobiliaria</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-xl flex items-center justify-center flex-wrap gap-2 sm:gap-4 w-full">
              Simulador <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500">Celina</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-3 sm:mt-4 font-semibold tracking-widest uppercase">Desarrollado por Oscar Saravia®</p>
          </div>
          <div className="hidden md:block w-32"></div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* PANEL IZQUIERDO: FORMULARIO */}
          <div className="lg:col-span-5 glass-panel rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.15)] flex flex-col">
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between gap-3 relative overflow-hidden border-b border-emerald-500/10">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-emerald-500/10 p-2.5 rounded-xl backdrop-blur-md border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-wide text-white">Datos de Inversión</h2>
              </div>
              
              {/* Badge de estado de BD */}
              <div className="relative z-10">
                {!cargandoBD && baseDeDatosLotes.length > 0 && (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/50 border border-emerald-500/30 rounded-full text-[9px] font-bold text-emerald-400 tracking-wider">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> BD Online
                   </span>
                )}
                {!cargandoBD && baseDeDatosLotes.length === 0 && (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/50 border border-rose-500/30 rounded-full text-[9px] font-bold text-rose-400 tracking-wider">
                     <AlertCircle className="w-3 h-3" /> BD Offline
                   </span>
                )}
              </div>
            </div>
            
            <div className="p-5 sm:p-8 flex-1">
              <form onSubmit={handleProcesar} className="space-y-5 sm:space-y-6">

                {/* REGIONAL */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Map className="w-4 h-4 text-teal-400" /> Regional
                  </label>
                  <div className="relative">
                    <select value={regional} onChange={e => setRegional(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 sm:p-4 outline-none transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none">
                      {Object.keys(proyectosPorRegional).map(reg => <option key={reg} value={reg}>{reg}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500"><ChevronDown className="w-5 h-5" /></div>
                  </div>
                </div>
                
                {/* PROYECTO & BÚSQUEDA INTELIGENTE */}
                <div className="space-y-2.5 relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-400" /> Proyecto
                    </label>
                    {cargandoBD ? (
                      <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 flex items-center gap-1.5 border border-amber-500/30 px-3 py-1.5 rounded-full bg-amber-500/10">
                        <Loader2 className="w-3 h-3 animate-spin"/> Cargando BD...
                      </span>
                    ) : tieneBD ? (
                      <button type="button" onClick={() => setUsarBD(!usarBD)} className={`text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${usarBD ? 'bg-[#0f2c3a] text-[#48b5db] border border-[#1e5875] shadow-[0_0_10px_rgba(72,181,219,0.3)] hover:bg-[#13384a]' : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50'}`}>
                        {usarBD ? <Database className="w-3 h-3 text-[#48b5db]"/> : <Edit2 className="w-3 h-3"/>} BÚSQUEDA INTELIGENTE
                      </button>
                    ) : null}
                  </div>
                  
                  <div className="relative">
                    <select value={proyecto} onChange={e => setProyecto(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 sm:p-4 outline-none transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none">
                      {proyectosPorRegional[regional]?.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="OTRO">OTRO...</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500"><ChevronDown className="w-5 h-5" /></div>
                  </div>
                  {proyecto === "OTRO" && <input type="text" value={proyectoPersonalizado} onChange={e => setProyectoPersonalizado(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 sm:p-4 outline-none transition-all font-semibold mt-3 animate-pop" placeholder="Escribe el nombre del proyecto..." />}
                </div>

                {/* UV / MZN / LOTE */}
                <div className="pt-2 sm:pt-3">
                  <div className="bg-[#0b172a]/80 backdrop-blur-md border border-[#1e3a5f] rounded-[1.5rem] p-4 sm:p-5 flex flex-col gap-3 relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]">
                    
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#48b5db]" />
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-widest">Ubicación del Lote</span>
                      </div>
                      {!usarBD && tieneBD && (
                        <span className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase flex items-center gap-1"><Edit2 className="w-3 h-3"/> Ingreso Manual</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold text-[#48b5db] uppercase tracking-widest">UV</label>
                        {modoBD ? (
                           <div className="relative">
                             <select value={uv} onChange={handleUvChange} className="w-full bg-[#0d1f36] border border-[#1e3a5f] text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer hover:border-[#48b5db] transition-colors focus:outline-none focus:ring-1 focus:ring-[#48b5db]">
                               <option value="" disabled hidden>Selec.</option>
                               {uvsDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#48b5db]"><ChevronDown className="w-3 h-3" /></div>
                           </div>
                        ) : (
                           <input type="text" value={uv} onChange={handleUvChange} placeholder="Ej. 49" className="w-full bg-[#0d1f36] border border-[#1e3a5f] text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold transition-all placeholder-slate-500 focus:outline-none focus:border-[#48b5db]" />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold text-[#48b5db] uppercase tracking-widest">MZN</label>
                        {modoBD ? (
                           <div className="relative">
                             <select value={mzn} onChange={handleMznChange} className="w-full bg-[#0d1f36] border border-[#1e3a5f] text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer hover:border-[#48b5db] transition-colors focus:outline-none focus:ring-1 focus:ring-[#48b5db]">
                               <option value="" disabled hidden>Selec.</option>
                               {mznsDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#48b5db]"><ChevronDown className="w-3 h-3" /></div>
                           </div>
                        ) : (
                           <input type="text" value={mzn} onChange={handleMznChange} placeholder="Ej. 6" className="w-full bg-[#0d1f36] border border-[#1e3a5f] text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold transition-all placeholder-slate-500 focus:outline-none focus:border-[#48b5db]" />
                        )}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold text-[#48b5db] uppercase tracking-widest">LOTE</label>
                        {modoBD ? (
                           <div className="relative">
                             <select value={lote} onChange={handleLoteChange} className="w-full bg-[#0d1f36] border border-[#1e3a5f] text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer hover:border-[#48b5db] transition-colors focus:outline-none focus:ring-1 focus:ring-[#48b5db]">
                               <option value="" disabled hidden>Selec.</option>
                               {lotesDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#48b5db]"><ChevronDown className="w-3 h-3" /></div>
                           </div>
                        ) : (
                           <input type="text" value={lote} onChange={handleLoteChange} placeholder="Ej. 9" className="w-full bg-[#0d1f36] border border-[#1e3a5f] text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold transition-all placeholder-slate-500 focus:outline-none focus:border-[#48b5db]" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CATEGORIA */}
                <div className="space-y-2.5 relative mt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutTemplate className="w-3 h-3 text-emerald-500" /> Categoría del Lote
                    </label>
                    <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej. LOTE S/CALLE ESQ. A" className={`w-full rounded-xl p-3.5 text-xs sm:text-sm font-semibold transition-all placeholder-slate-600 ${modoBD ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-100 shadow-inner' : 'glass-input'}`} />
                </div>

                {/* SUP & PRECIO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-4">
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><Map className="w-4 h-4 text-emerald-400" /> Superficie <span className="text-slate-600 normal-case">(m²)</span></span>
                    </label>
                    <input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="Ej. 240" className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl transition-all placeholder-slate-600 ${modoBD ? 'bg-[#0d1f36] border border-[#1e3a5f] text-[#48b5db] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]' : 'glass-input'}`} />
                  </div>

                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400" /> Precio <span className="text-slate-600 normal-case">/ m²</span></span>
                    </label>
                    <input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. 145" className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl transition-all placeholder-slate-600 ${modoBD ? 'bg-[#0d1f36] border border-[#1e3a5f] text-[#48b5db] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]' : 'glass-input'}`} />
                  </div>
                </div>

                {/* DESCUENTOS PREMIUM */}
                <div className="bg-slate-800/40 border border-emerald-500/20 p-4 sm:p-5 rounded-[2rem] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] relative overflow-hidden group backdrop-blur-md">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-400/20 transition-colors"></div>
                  <div className="text-[10px] sm:text-xs font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/30"><Gift className="w-4 h-4 text-emerald-300" /></div>
                    Descuentos Promocionales
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {showDescPorcentaje && (
                      <>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                            <input type="checkbox" checked={aplicarDescContadoPct} onChange={e => setAplicarDescContadoPct(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" /> A Contado (%)
                          </label>
                          <input type="number" step="0.01" min="0" disabled={!aplicarDescContadoPct} value={descuentoContado} onChange={handleDescContadoChange} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoPct ? 'glass-input focus:ring-1 focus:ring-emerald-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                          <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescContadoPct ? 'text-emerald-400' : 'text-slate-600'}`}>Máx: {calcularLimitesMaximos().maxContadoPct}%</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                            <input type="checkbox" checked={aplicarDescCreditoPct} onChange={e => setAplicarDescCreditoPct(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" /> A Crédito (%)
                          </label>
                          <input type="number" step="0.01" min="0" disabled={!aplicarDescCreditoPct} value={descuentoCredito} onChange={handleDescCreditoChange} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescCreditoPct ? 'glass-input focus:ring-1 focus:ring-emerald-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                          <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescCreditoPct ? 'text-emerald-400' : 'text-slate-600'}`}>Máx: {calcularLimitesMaximos().maxCreditoPct}%</p>
                        </div>
                      </>
                    )}
                    {showDescM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                          <input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" /> Crédito x m² ($us)
                        </label>
                        <input type="number" step="0.01" min="0" disabled={!aplicarDescM2} value={descuentoM2} onChange={handleDescM2Change} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescM2 ? 'glass-input focus:ring-1 focus:ring-emerald-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescM2 ? 'text-emerald-400' : 'text-slate-600'}`}>Máx: ${calcularLimitesMaximos().maxDescM2}</p>
                      </div>
                    )}
                    {showDescContadoM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                          <input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" /> Contado x m² ($us)
                        </label>
                        <input type="number" step="0.01" min="0" disabled={!aplicarDescContadoM2} value={descuentoContadoM2} onChange={handleDescContadoM2Change} placeholder="Ej. 3" className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoM2 ? 'glass-input focus:ring-1 focus:ring-emerald-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescContadoM2 ? 'text-emerald-400' : 'text-slate-600'}`}>Máx: ${calcularLimitesMaximos().maxContadoM2}</p>
                      </div>
                    )}
                    {showBonoInicial && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                          <input type="checkbox" checked={aplicarBonoInicialOtro} onChange={e => setAplicarBonoInicialOtro(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" /> Bono Inicial ($us)
                        </label>
                        <input type="number" step="0.01" min="0" max="500" disabled={!aplicarBonoInicialOtro} value={descuentoInicial} onChange={handleBonoInicialChange} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarBonoInicialOtro ? 'glass-input focus:ring-1 focus:ring-emerald-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarBonoInicialOtro ? 'text-emerald-400' : 'text-slate-600'}`}>Máx: $500</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* INICIAL & PLAZO CON CANDADO PREMIUM */}
                <div className="grid grid-cols-12 gap-4 sm:gap-5 mt-4">
                  <div className="col-span-12 md:col-span-8 bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 backdrop-blur-sm relative">
                    
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" /> Inicial (%)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        min={isPremiumLote && modoInicial === 'porcentaje' ? "5" : "0"} 
                        required={modoInicial === 'porcentaje'}
                        value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''} 
                        onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                        placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 1.5'}
                        className={`w-full bg-slate-900/80 border ${isPremiumLote && modoInicial === 'porcentaje' && Number(inicialPorcentaje) > 0 && Number(inicialPorcentaje) < 5 ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-slate-700'} rounded-xl p-3 sm:p-3.5 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-white text-sm sm:text-base shadow-inner placeholder-slate-600`} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Monto ($us)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        min={isPremiumLote && modoInicial === 'monto' ? minMontoPremium.toFixed(2) : "0"}
                        required={modoInicial === 'monto'}
                        value={modoInicial === 'monto' ? inicialMonto : ''} 
                        onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} 
                        placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 500'}
                        className={`w-full bg-slate-900/80 border ${isPremiumLote && modoInicial === 'monto' && Number(inicialMonto) > 0 && Number(inicialMonto) < minMontoPremium ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-slate-700'} rounded-xl p-3 sm:p-3.5 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-black text-amber-400 text-sm sm:text-base shadow-inner placeholder-slate-600`} 
                      />
                    </div>

                    {/* Banner de Advertencia Premium */}
                    {isPremiumLote && (
                      <div className="col-span-1 sm:col-span-2 mt-1 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[10px] sm:text-[11px] text-amber-400 font-bold flex items-center gap-2 shadow-inner animate-pop">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Lote Premium ({categoria}): La política exige un mínimo del 5% de Cuota Inicial.
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-12 md:col-span-4 space-y-2 mt-2 md:mt-0">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-400" /> Plazo
                    </label>
                    <div className="relative h-[calc(100%-1.5rem)]">
                      <select required value={años} onChange={e => setAños(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 outline-none transition-all font-bold text-white text-sm sm:text-base appearance-none pr-10 cursor-pointer h-full min-h-[50px]">
                        <option value="" disabled hidden>Selec.</option>
                        {[...Array(10)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500"><ChevronRight className="w-5 h-5 rotate-90" /></div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isCalculating} className={`w-full mt-6 sm:mt-8 bg-gradient-to-r from-[#059669] via-[#10b981] to-[#059669] hover:from-[#047857] hover:via-[#059669] hover:to-[#047857] text-white font-extrabold py-4 sm:py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-400/50 uppercase tracking-widest text-sm sm:text-lg relative overflow-hidden group ${isCalculating ? 'opacity-80 scale-95' : 'hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] hover:-translate-y-1'}`}>
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
              <div className="glass-panel rounded-[2.5rem] h-full min-h-[400px] sm:min-h-[600px] flex flex-col items-center justify-center text-slate-400 p-6 sm:p-10 text-center transition-all duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="bg-slate-800 p-6 sm:p-8 rounded-full mb-6 sm:mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)] border border-emerald-500/30 relative z-10">
                    {isCalculating ? <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-400 animate-spin" /> : <Calculator className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-400" />}
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 sm:mb-3">
                  {isCalculating ? "Calculando Propuesta..." : "Plataforma Activa"}
                </h3>
                <p className="text-sm sm:text-base max-w-md text-slate-400 font-medium leading-relaxed px-2">
                  {isCalculating ? "Aplicando promociones e inteligencia artificial de precios." : "Completa los parámetros de inversión a la izquierda para generar una propuesta financiera detallada y lista para el cliente."}
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 animate-in fade-in slide-in-from-bottom-12 duration-700 ease-out relative overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-emerald-500/20">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 pb-5 sm:pb-6 border-b border-slate-700/80 gap-4 relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-3 tracking-tight">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
                    </div> Propuesta Oficial
                  </h2>
                  <span className="mx-auto sm:mx-0 bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-xs font-extrabold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-2 backdrop-blur-sm w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse"></span> Aprobada
                  </span>
                </div>
                
                <div className="relative z-10 space-y-5 sm:space-y-6">
                  
                  {/* Fila: Proyecto y Lote */}
                  {(resultado.proyecto || resultado.uv || resultado.mzn || resultado.lote) && (
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                      <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4 pl-0 sm:pl-2 w-full justify-center sm:justify-start">
                        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-3 sm:p-3.5 rounded-xl border border-emerald-500/30">
                          <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">Desarrollo Urbanístico</div>
                          <div key={`proj-${resultado.timestampId}`} className="text-white font-black text-lg sm:text-xl uppercase leading-none tracking-tight animate-pop">{resultado.proyecto || 'S/N'}</div>
                          {resultado.categoria && resultado.categoria !== "ESTÁNDAR" && <div key={`cat-${resultado.timestampId}`} className="text-[8px] sm:text-[9px] text-amber-400 font-bold mt-1 tracking-wider animate-pop">{resultado.categoria}</div>}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                        <div className="text-center px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900/80 rounded-xl border border-slate-700 shadow-sm"><div className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">UV</div><div key={`uv-${resultado.timestampId}`} className="text-emerald-400 font-black text-base sm:text-lg leading-none animate-pop" style={{animationDelay: '100ms'}}>{resultado.uv || '-'}</div></div>
                        <div className="text-center px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900/80 rounded-xl border border-slate-700 shadow-sm"><div className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">MZN</div><div key={`mzn-${resultado.timestampId}`} className="text-emerald-400 font-black text-base sm:text-lg leading-none animate-pop" style={{animationDelay: '150ms'}}>{resultado.mzn || '-'}</div></div>
                        <div className="text-center px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400"><div className="text-[8px] sm:text-[9px] font-extrabold text-emerald-950 uppercase tracking-widest mb-1">LOTE</div><div key={`lt-${resultado.timestampId}`} className="text-slate-900 font-black text-base sm:text-lg leading-none animate-pop" style={{animationDelay: '200ms'}}>{resultado.lote || '-'}</div></div>
                      </div>
                    </div>
                  )}

                  {/* Fila: Precio Contado */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-700/60 shadow-lg flex flex-col sm:flex-row justify-between sm:items-end gap-4 sm:gap-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
                    <div className="text-center sm:text-left">
                      <span className="text-slate-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2 mb-1 sm:mb-2">Precio de Lista Original</span>
                      <div key={`po-${resultado.timestampId}`} className="text-3xl sm:text-4xl font-black text-white tracking-tighter drop-shadow-md animate-pop">$ {resultado.valorOriginal}</div>
                      <div key={`pobs-${resultado.timestampId}`} className="text-xs sm:text-sm font-bold text-slate-500 mt-1 sm:mt-1.5 animate-pop">Bs. {resultado.valorOriginalBs}</div>
                    </div>
                    
                    {resultado.ahorroContado !== "0.00" && (
                      <div className="bg-emerald-950/60 backdrop-blur-md text-emerald-400 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative z-10 w-full sm:w-auto text-center">
                        <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest mb-1 text-emerald-300 flex items-center justify-center gap-1.5"><Tag className="w-3 h-3"/> Oferta al Contado</div>
                        <div key={`pc-${resultado.timestampId}`} className="text-xl sm:text-2xl font-black tracking-tight text-white animate-pop">$ {resultado.valorContado}</div>
                      </div>
                    )}
                  </div>

                  {/* Fila: Crédito Directo y Cuota Inicial */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="bg-slate-800/50 backdrop-blur-md p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-700/50 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)] hover:border-emerald-500/30 text-center sm:text-left">
                      <span className="text-teal-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest">Total a Financiar</span>
                      <div key={`pcr-${resultado.timestampId}`} className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 sm:mt-2 animate-pop">$ {resultado.valorCredito}</div>
                      {resultado.ahorroCredito !== "0.00" && (
                          <div key={`ac-${resultado.timestampId}`} className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-amber-400 font-extrabold bg-amber-950/30 inline-block px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-amber-500/30 uppercase tracking-widest shadow-sm animate-pop">
                            Ahorro Incluido: $ {resultado.ahorroCredito}
                          </div>
                      )}
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-md p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-700/50 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)] hover:border-emerald-500/30 text-center sm:text-left">
                      <span className="text-emerald-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest">Cuota Inicial</span>
                      <div key={`ini-${resultado.timestampId}`} className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 sm:mt-2 animate-pop">$ {resultado.inicial}</div>
                      <div key={`inibs-${resultado.timestampId}`} className="text-xs sm:text-sm font-bold text-slate-400 mt-1 animate-pop">Bs. {resultado.inicialBs}</div>
                    </div>
                  </div>

                  {/* Fila: Cuota Mensual ESTILO VIP CARD CELINA */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#020617] p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_0_40px_rgba(5,150,105,0.3)] border border-emerald-400/40 group mt-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '2.5s' }}></div>
                    <div className="absolute top-0 right-0 w-32 sm:w-64 h-full bg-emerald-500/10 skew-x-12 transform translate-x-10 pointer-events-none"></div>
                    <div className="absolute -bottom-10 -right-10 opacity-20 group-hover:opacity-40 transition-opacity"><Building2 className="w-48 h-48 sm:w-64 sm:h-64 text-emerald-300" /></div>
                    <span className="text-emerald-200/90 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest relative z-10 flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)] animate-pulse"></div> Cuota Mensual Fija ({resultado.plazo} Años)
                    </span>
                    <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 mt-2 sm:mt-3 relative z-10">
                      <div key={`c-${resultado.timestampId}`} className="text-[2.5rem] leading-none sm:text-7xl font-black text-white tracking-tighter drop-shadow-lg break-all animate-pop">$ {resultado.mensual}</div>
                      <div key={`cbs-${resultado.timestampId}`} className="text-xl sm:text-3xl font-bold text-emerald-300 mt-1 sm:mt-0 animate-pop" style={{animationDelay: '100ms'}}>Bs. {resultado.mensualBs}</div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-emerald-200/60 mt-4 sm:mt-6 font-semibold tracking-widest relative z-10 flex flex-wrap gap-2 sm:gap-4 border-t border-emerald-500/30 pt-3 sm:pt-4 uppercase">
                      <span>Amort. ${resultado.pagoAmortizacion}</span><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 my-auto hidden sm:block"></span>
                      <span>Seguro ${resultado.seguro}</span><span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 my-auto hidden sm:block"></span>
                      <span>CBDI ${resultado.cbdi}</span>
                    </div>
                  </div>

                  {/* ACORDEÓN: PLAN DE PAGOS */}
                  <div className="mt-5 sm:mt-6">
                    <button onClick={() => setMostrarPlan(!mostrarPlan)} className="w-full flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-2xl bg-slate-800/40 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-slate-800/60 hover:border-emerald-500/40 transition-all duration-300 group shadow-sm text-left">
                      <div className="flex items-center gap-2 sm:gap-3"><div className="bg-emerald-500/10 p-1.5 sm:p-2 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors"><ListOrdered className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /></div><span className="tracking-wide text-xs sm:text-base mt-0.5 sm:mt-0">Ver Plan de Pagos (10 a 1 años)</span></div>
                      <div className={`mt-0.5 sm:mt-0 bg-slate-900 p-1 sm:p-1.5 rounded-full border border-slate-700 transition-transform duration-500 flex-shrink-0 ${mostrarPlan ? 'rotate-180 bg-emerald-900 border-emerald-500' : ''}`}><ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 ${mostrarPlan ? 'text-emerald-400' : 'text-slate-400'}`} /></div>
                    </button>
                    {mostrarPlan && (
                      <div className="mt-2 sm:mt-3 overflow-hidden rounded-xl sm:rounded-[1.5rem] border border-emerald-500/20 bg-[#020f18]/80 backdrop-blur-xl animate-in slide-in-from-top-4 fade-in duration-500 shadow-[0_10px_30px_-10px_rgba(5,150,105,0.2)]">
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-emerald-500/10 bg-slate-900/50 text-[9px] sm:text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                          <div>Plazo</div><div className="text-emerald-400 flex items-center justify-center gap-1"><DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> Cuota ($us)</div><div className="text-emerald-200 flex items-center justify-center gap-1">Cuota (Bs.)</div>
                        </div>
                        <div className="p-1.5 sm:p-2">
                          {resultado.planPagos.map((plan, i) => (
                            <div key={i} className={`grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl text-center text-xs sm:text-sm font-bold transition-all duration-300 ${plan.año === resultado.plazo ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-emerald-500/20 border border-emerald-500/40 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02] transform my-1' : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'}`}>
                              <div className="flex items-center justify-center gap-1.5 sm:gap-2">{plan.año === resultado.plazo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block"></span>} {plan.año} {plan.año === 1 ? 'Año' : 'Años'}</div>
                              <div className={`font-black ${plan.año === resultado.plazo ? 'text-white' : 'text-emerald-100'}`}>$ {plan.cuotaUsd}</div>
                              <div className={plan.año === resultado.plazo ? 'text-emerald-300' : 'text-slate-400'}>Bs. {plan.cuotaBs}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-700/80">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={copiarTexto} className="w-full sm:w-1/3 bg-transparent hover:bg-slate-800 border border-[#48b5db] text-[#48b5db] font-black py-4 sm:py-5 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm uppercase tracking-wider relative overflow-hidden group">
                          {copiado ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 relative z-10" /> : <FileText className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />}
                          <span className="relative z-10">{copiado ? 'COPIADO' : 'COPIAR TODO'}</span>
                        </button>
                        <button onClick={enviarWhatsApp} className="w-full sm:w-2/3 bg-gradient-to-r from-[#20bd5a] to-[#25D366] hover:from-[#1da850] hover:to-[#20bd5a] text-slate-900 font-black py-4 sm:py-5 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:shadow-[0_0_35px_rgba(37,211,102,0.6)] hover:-translate-y-1 text-xs sm:text-sm uppercase tracking-wider relative overflow-hidden group">
                          <div className="absolute inset-0 bg-white/30 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                          <Send className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" /> <span className="relative z-10">Enviar Propuesta por WhatsApp</span>
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
