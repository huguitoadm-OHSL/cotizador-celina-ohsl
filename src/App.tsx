import React, { useState, useEffect, useRef } from "react";
import { 
  Calculator, Send, Map, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, Tag, 
  MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, ChevronDown, ListOrdered,
  Database, Edit2, LayoutTemplate, Loader2, AlertCircle, Scale, X, Flame, Printer, Activity
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

export default function App() {
  const [regional, setRegional] = useState("MONTERO");
  const [proyecto, setProyecto] = useState("MUYURINA");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  
  const [baseDeDatosLotes, setBaseDeDatosLotes] = useState([]);
  const [cargandoBD, setCargandoBD] = useState(true);
  const [usarBD, setUsarBD] = useState(true);

  // TC DINÁMICO
  const [tcFlexible, setTcFlexible] = useState(10.40);
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
  const [descuentoInicial, setDescuentoInicial] = useState(0);
  const [descuentoContadoM2, setDescuentoContadoM2] = useState(2); 

  // Por defecto arrancan apagados para generar el "Efecto Revelación"
  const [aplicarDescContadoPct, setAplicarDescContadoPct] = useState(false);
  const [aplicarDescCreditoPct, setAplicarDescCreditoPct] = useState(false);
  const [aplicarDescM2, setAplicarDescM2] = useState(false);
  const [aplicarDescContadoM2, setAplicarDescContadoM2] = useState(false);
  const [aplicarBonoInicialOtro, setAplicarBonoInicialOtro] = useState(false);
  
  // TOGGLE DE BONIFICACIÓN TRANSITORIA
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

  const resultadosRef = useRef(null);

  useEffect(() => {
    const cargarLotes = async () => {
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
    setResultado(null); setProyectoPersonalizado(""); 
    setEscenarioGuardado(null); setMostrarComparativa(false);

    // Apagados por defecto para el efecto revelación
    setAplicarDescContadoPct(false); setAplicarDescCreditoPct(false); setAplicarDescM2(false);
    setAplicarDescContadoM2(false); setAplicarBonoInicialOtro(false);

    // Valores estándar universales
    setDescuentoContado(0); setDescuentoCredito(0); setDescuentoM2(1); setDescuentoContadoM2(2); setDescuentoInicial(0);
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

  const calcularLimitesMaximos = () => {
    // REGLA UNIVERSAL: $1 Crédito y $2 Contado. Sin porcentajes.
    return { maxCreditoPct: 0, maxContadoPct: 0, maxDescM2: 1, maxContadoM2: 2, maxBonoInicial: 500 };
  };

  useEffect(() => {
    const limites = calcularLimitesMaximos();
    setDescuentoCredito(limites.maxCreditoPct);
    setDescuentoContado(limites.maxContadoPct);
    setDescuentoM2(limites.maxDescM2);
    setDescuentoContadoM2(limites.maxContadoM2);
  }, [modoInicial, inicialPorcentaje, inicialMonto, superficie, precio, proyecto, categoria, aplicarDescM2, aplicarDescCreditoPct]);

  const handleDescContadoChange = (e) => {
    const val = Number(e.target.value); const max = calcularLimitesMaximos().maxContadoPct;
    setDescuentoContado(val > max ? max : val);
  };
  const handleDescCreditoChange = (e) => {
    const val = Number(e.target.value); const max = calcularLimitesMaximos().maxCreditoPct;
    setDescuentoCredito(val > max ? max : val);
  };
  const handleDescM2Change = (e) => {
    const val = Number(e.target.value); const max = calcularLimitesMaximos().maxDescM2;
    setDescuentoM2(val > max ? max : val);
  };
  const handleDescContadoM2Change = (e) => {
    const val = Number(e.target.value); const max = calcularLimitesMaximos().maxContadoM2;
    setDescuentoContadoM2(val > max ? max : val);
  };
  const handleBonoInicialChange = (e) => {
    const val = Number(e.target.value);
    setDescuentoInicial(val > 500 ? 500 : val);
  };

  const formatMoney = (amount) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const showNotification = (message) => { setToast(message); setTimeout(() => setToast(null), 3000); };

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
    const monto_descuento_total_contado = monto_descuento_m2 + (valor_post_desc_m2 * descContadoPct) + monto_desc_contado_m2;
    const valor_contado = valor_original - monto_descuento_total_contado;

    // MATEMÁTICA Y SEGURO (HASTA 14 AÑOS)
    const saldo = valor_credito - cuota_inicial;
    const meses = ans * 12;
    const tasa_anual = 0.121733; const tasa = tasa_anual / 12;
    const refSaldo = 34278.00;
    const baseSeguro = { 1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38, 11: 27.67, 12: 29.00, 13: 30.36, 14: 31.75 };
    const cbdi = 0;
    
    let pago_puro = tasa === 0 ? saldo / meses : saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
    const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1.3) / refSaldo;
    const seguro = saldo * factorSeguro;
    const cuota_final = pago_puro + seguro + cbdi;
    
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;
    const formatPct = (pct_efectivo % 1 === 0) ? pct_efectivo.toFixed(0) : pct_efectivo.toFixed(2);

    // TABLA DE RESUMEN DE AÑOS (1 a 14)
    let planPagosArreglo = [];
    for (let i = 14; i >= 1; i--) {
      const m_i = i * 12;
      let pp_i = tasa === 0 ? saldo / m_i : saldo * (tasa * Math.pow(1 + tasa, m_i)) / (Math.pow(1 + tasa, m_i) - 1);
      const fS_i = baseSeguro[i] ? (baseSeguro[i] / refSaldo) : (26.38 + (i - 10) * 1.3) / refSaldo;
      const seg_i = saldo * fS_i;
      const c_final_i = pp_i + seg_i + cbdi;
      
      planPagosArreglo.push({ 
        año: i, 
        cuotaUsd: formatMoney(c_final_i), 
        cuotaBs: formatMoney(c_final_i * tcFlexible),
        isCurrent: i === ans
      });
    }

    // TABLA DE TRANSICIÓN INFINITA (1 a N meses, con caída exacta de 5 puntos)
    const transicionData = [];
    let totalAhorroTransicion = 0;
    const mesesNombres = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    
    // Mes 1 de compra es Agosto 2026 (mes 7 en JS, index 0 es ene)
    let baseMonthIndex = 7; 
    let baseYear = 26;
    
    for(let m=1; m<=meses; m++) {
        let tc_efectivo = tcFlexible;
        let descPctExacto = 0;
        
        if (aplicarBonificacion) {
            if(m <= 6) {
                // Algoritmo: Descuento baja 5 puntos porcentuales exactos cada mes
                let baseDiscount = ((tcFlexible - TC_PROMOCIONAL) / tcFlexible) * 100;
                descPctExacto = baseDiscount - (5 * (m - 1));
                if (descPctExacto < 0) descPctExacto = 0;
                
                tc_efectivo = tcFlexible * (1 - (descPctExacto / 100));
                if (m === 1) tc_efectivo = TC_PROMOCIONAL; // Forzar exactitud mes 1
                if (tc_efectivo > tcFlexible) tc_efectivo = tcFlexible;
            } else {
                tc_efectivo = tcFlexible;
            }
        }

        const montoBs = cuota_final * tc_efectivo;
        const pagoUsdDesc = montoBs / tcFlexible; 
        const ahorroBs = (cuota_final * tcFlexible) - montoBs;

        if (ahorroBs > 0 && aplicarBonificacion) totalAhorroTransicion += ahorroBs;

        let currentMIndex = (baseMonthIndex + (m - 1)) % 12;
        let currentY = baseYear + Math.floor((baseMonthIndex + (m - 1)) / 12);
        let mesLabel = `${mesesNombres[currentMIndex]} ${currentY}`;

        transicionData.push({
            mesNum: m,
            mesLabel: mesLabel,
            pagoUsdNormal: cuota_final,
            descPct: ahorroBs > 0 ? descPctExacto : 0,
            conDescUsd: pagoUsdDesc,
            montoBs: montoBs,
            tcEfectivo: tc_efectivo,
            ahorroBs: ahorroBs > 0 ? ahorroBs : 0,
            isDiscounted: aplicarBonificacion && tc_efectivo < tcFlexible
        });
    }

    setResultado({
      regional: regional, proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, categoria: categoria,
      valorOriginal: formatMoney(valor_original), valorOriginalBs: formatMoney(valor_original * TC_PROMOCIONAL),
      valorContado: formatMoney(valor_contado), valorContadoBs: formatMoney(valor_contado * TC_PROMOCIONAL),
      ahorroContadoRaw: monto_descuento_total_contado,
      ahorroContado: formatMoney(monto_descuento_total_contado), porcentajeContado: aplicarDescContadoPct ? descuentoContado : 0,
      descuentoContadoM2: aplicarDescContadoM2 ? descContadoM2Val : 0,
      valorCreditoRaw: valor_credito,
      valorCredito: formatMoney(valor_credito), valorCreditoBs: formatMoney(valor_credito * TC_PROMOCIONAL), 
      ahorroCreditoRaw: monto_descuento_total_credito,
      ahorroCredito: formatMoney(monto_descuento_total_credito), porcentajeCredito: aplicarDescCreditoPct ? descuentoCredito : 0,
      descuentoM2: aplicarDescM2 ? descM2Val : 0, descuentoInicial: descIniVal,
      inicialRaw: cuota_inicial,
      inicial: formatMoney(cuota_inicial), inicialBs: formatMoney(cuota_inicial * TC_PROMOCIONAL), inicialPct: formatPct,
      saldoRaw: saldo,
      pagoAmortizacion: formatMoney(pago_puro), seguro: formatMoney(seguro), cbdi: formatMoney(cbdi),
      mensualRaw: cuota_final,
      mensual: formatMoney(cuota_final), mensualBs: formatMoney(cuota_final * tcFlexible),
      plazo: ans, 
      planPagos: planPagosArreglo,
      transicionData: transicionData,
      totalAhorroTransicion: formatMoney(totalAhorroTransicion),
      timestampId: new Date().getTime()
    });
    setCopiado(false); 
  };

  // Re-calcular si el usuario hace toggle de la bonificación mientras ve el resultado
  useEffect(() => {
    if (resultado && !isCalculating) {
      calcular();
    }
  }, [aplicarBonificacion]);

  const getTextToCopy = () => {
    if (!resultado) return "";
    const saludo = "Estimado cliente, es un gusto saludarle. Le presento su propuesta oficial de inversión:\n\n";
    const nombreProyectoCapitalizado = resultado.proyecto.charAt(0).toUpperCase() + resultado.proyecto.slice(1).toLowerCase();
    const catStr = resultado.categoria && resultado.categoria !== "ESTÁNDAR" ? `\n🏷️ ${resultado.categoria}` : '';
    const ubicacion = `📍 *Proyecto ${nombreProyectoCapitalizado}*\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)${catStr}\n\n`;
    
    let arrContado = [];
    if (resultado.descuentoContadoM2 > 0) arrContado.push(`$${resultado.descuentoContadoM2}/m²`);
    let contadoStr = arrContado.length > 0 ? `💰 *INVERSIÓN AL CONTADO*\n¡Aplica descuento especial de ${arrContado.join(' + ')}!\n*Inversión Final:* $${resultado.valorContado} (Bs. ${resultado.valorContadoBs} al TC 6.97 exclusivo de Julio)\n\n` : "";

    let arrCredito = [];
    if (resultado.descuentoM2 > 0) arrCredito.push(`$${resultado.descuentoM2}/m²`);
    let creditoStr = arrCredito.length > 0 ? `✅ *INVERSIÓN A CRÉDITO DIRECTO*\n¡Descuento de ${arrCredito.join(' + ')} incluido!\n*Valor del Terreno:* $ ${resultado.valorCredito}\n\n` : "";

    const financiamiento = `📊 *Su Plan de Financiamiento* (${resultado.plazo} años)\n` + 
                           `*Cuota inicial:* ${resultado.inicialPct}% ($${resultado.inicial})\n` +
                           `👉 *Inicial congelada a Bs. ${resultado.inicialBs}* (TC 6.97 solo por Julio)\n\n` +
                           `*Cuota mensual regular:* $${resultado.mensual}\n` +
                           `🔥 *BENEFICIO DE TRANSICIÓN EN CUOTAS:*\n` + 
                           `• Cuota 1 (Agosto): Pagará al TC 6.97 (Bs. ${resultado.transicionData[0].montoBs.toFixed(2)})\n` +
                           `• Cuotas 2 al 6: Su descuento se ajusta ordenadamente mes a mes.\n` +
                           `• Recién desde la Cuota 7 (Febrero) pagará al TC de mercado actual.\n\n`;
                           
    const cierre = `¡Usted se ahorra Bs. ${resultado.totalAhorroTransicion} solo en esta transición! ¿Le gustaría que agendemos una visita para conocer su próximo terreno? 🤝`;

    return saludo + ubicacion + contadoStr + creditoStr + financiamiento + cierre;
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
        try { document.execCommand('copy'); showNotification("¡Copiado al portapapeles con éxito!"); } catch (error) {}
        textArea.remove();
    }
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

  const showDescPorcentaje = false; // Desactivado por reglas globales
  const showDescM2 = true;
  const showDescContadoM2 = true;
  const showBonoInicial = proyecto === "OTRO";

  return (
    <div className="min-h-screen bg-[#020617] relative font-['Plus_Jakarta_Sans'] text-slate-300 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200 pb-20">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0) scale(1.2); } 50% { transform: translateY(-20px) scale(1.2); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideUpFade { 0% { opacity: 0; transform: translate(-50%, 20px); } 10% { opacity: 1; transform: translate(-50%, 0); } 90% { opacity: 1; transform: translate(-50%, 0); } 100% { opacity: 0; transform: translate(-50%, -20px); } }
        
        .animate-blob { animation: blob 10s infinite alternate; }
        .animate-float { animation: float 15s ease-in-out infinite; }
        .animate-pop { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-toast { animation: slideUpFade 3s ease-in-out forwards; }
        
        /* Dark Quantum Glassmorphism */
        .glass-panel { background: rgba(9, 14, 23, 0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(6, 182, 212, 0.15); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.05); }
        .glass-input { background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); color: #f8fafc; }
        .glass-input:focus { background: rgba(15, 23, 42, 0.8); border-color: #06b6d4; box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.15); outline: none;}
        select option { background: #0f172a; color: #f8fafc; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.6); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.5); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.8); }

        @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: #020617; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .glass-panel { box-shadow: none; border: 1px solid #1e293b; }
        }
      `}</style>

      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-cyan-950/90 text-cyan-50 px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(6,182,212,0.3)] flex items-center gap-3 font-bold text-sm tracking-wide animate-toast border border-cyan-500/50 backdrop-blur-md">
           <CheckCircle2 className="w-5 h-5 text-cyan-400" /> {toast}
        </div>
      )}

      {/* MAPA ISOMÉTRICO */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15] flex items-center justify-center mix-blend-screen animate-float no-print">
        <svg viewBox="0 0 1000 1000" className="w-full h-full max-w-[1600px] absolute right-[-20%] bottom-[-10%]" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(500, 400) scale(1.6)">
            {[...Array(15)].map((_, i) => <path key={`grid-v-${i}`} d={`M${-450 + i*60} ${225 + i*30} L${450 + i*60} ${-225 + i*30}`} stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" strokeDasharray="4 4" />)}
            {[...Array(15)].map((_, i) => <path key={`grid-h-${i}`} d={`M${-450 + i*60} ${-225 + i*30} L${450 + i*60} ${225 + i*30}`} stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1" strokeDasharray="4 4" />)}
            <polygon points="0,0 60,30 0,60 -60,30" fill="rgba(6, 182, 212, 0.1)" stroke="#0891b2" strokeWidth="1" />
            <polygon points="60,30 120,60 60,90 0,60" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1.5" />
            <polygon points="-60,30 0,60 -60,90 -120,60" fill="rgba(2, 132, 199, 0.1)" stroke="#0369a1" strokeWidth="1" />
          </g>
        </svg>
      </div>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none no-print">
        <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-cyan-900/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45rem] h-[45rem] bg-emerald-900/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[55rem] h-[55rem] bg-indigo-900/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="hidden xl:flex fixed left-0 top-0 h-full w-20 items-center justify-center z-0 no-print">
        <div className="transform -rotate-90 whitespace-nowrap text-slate-800 font-black tracking-[0.5em] text-3xl select-none">CELINA QUANTUM</div>
      </div>

      <div className="max-w-[1280px] mx-auto py-8 px-4 sm:px-6 lg:px-12 xl:pl-24 relative z-10">
        
        {/* TOP BAR: TC DINÁMICO */}
        <div className="flex justify-end mb-6 no-print">
          <div className="bg-[#090e17]/80 backdrop-blur-md border border-cyan-500/30 p-2.5 sm:p-3 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-in slide-in-from-top-4">
             <div className="flex items-center gap-2">
               <div className="bg-cyan-500/20 p-2 rounded-xl border border-cyan-500/20"><Activity className="w-5 h-5 text-cyan-400" /></div>
               <div className="hidden sm:block">
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TC Mercado (Hoy)</div>
                 <div className="text-xs font-bold text-white flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> En Vivo</div>
               </div>
             </div>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-bold text-sm">Bs.</span>
                <input 
                  type="number" step="0.01" value={tcFlexible} 
                  onChange={(e) => setTcFlexible(Number(e.target.value))}
                  className="bg-[#04070b] border border-slate-700/80 text-cyan-400 font-black text-lg rounded-xl pl-9 pr-3 py-2 w-28 text-center outline-none focus:border-cyan-500 transition-all shadow-inner"
                />
             </div>
          </div>
        </div>

        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mb-8 sm:mb-12 gap-6 relative no-print">
          <div className="hidden md:block w-32"></div>
          <div className="text-center flex-1 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-slate-900/50 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-4 sm:mb-5 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cyan-300 text-center">Plataforma Fintech de Alta Precisión</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg flex items-center justify-center flex-wrap gap-2 sm:gap-4 w-full">
              Celina <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400">Quantum</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-3 sm:mt-4 font-semibold tracking-widest uppercase">Motor Financiero V 3.0</p>
          </div>
          <div className="hidden md:block w-32"></div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* PANEL IZQUIERDO: FORMULARIO */}
          <div className="lg:col-span-5 glass-panel rounded-[2.5rem] overflow-hidden transition-all duration-500 flex flex-col no-print">
            <div className="bg-[#0d1420]/80 p-5 sm:p-6 flex items-center justify-between gap-3 relative overflow-hidden border-b border-slate-800">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 shadow-inner">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-wide text-white">Datos de Inversión</h2>
              </div>
              
              <div className="relative z-10">
                {!cargandoBD && baseDeDatosLotes.length > 0 && (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/30 border border-emerald-500/30 rounded-full text-[9px] font-bold text-emerald-400 tracking-wider shadow-sm">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> BD Online
                   </span>
                )}
                {!cargandoBD && baseDeDatosLotes.length === 0 && (
                   <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/30 border border-rose-500/30 rounded-full text-[9px] font-bold text-rose-400 tracking-wider shadow-sm">
                     <AlertCircle className="w-3 h-3" /> BD Offline
                   </span>
                )}
              </div>
            </div>
            
            <div className="p-5 sm:p-8 flex-1 bg-[#090e17]/50">
              <form onSubmit={handleProcesar} className="space-y-5 sm:space-y-6">

                {/* REGIONAL Y PROYECTO */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Map className="w-4 h-4 text-cyan-500" /> Regional
                  </label>
                  <div className="relative">
                    <select value={regional} onChange={e => setRegional(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none">
                      {Object.keys(proyectosPorRegional).map(reg => <option key={reg} value={reg}>{reg}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-500"><ChevronDown className="w-5 h-5" /></div>
                  </div>
                </div>
                
                <div className="space-y-2.5 relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-500" /> Proyecto
                    </label>
                    {cargandoBD ? (
                      <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 flex items-center gap-1.5 border border-amber-500/30 px-3 py-1.5 rounded-full bg-amber-500/10">
                        <Loader2 className="w-3 h-3 animate-spin"/> Cargando BD...
                      </span>
                    ) : tieneBD ? (
                      <button type="button" onClick={() => setUsarBD(!usarBD)} className={`text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${usarBD ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-800/50' : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700/50'}`}>
                        {usarBD ? <Database className="w-3 h-3 text-cyan-400"/> : <Edit2 className="w-3 h-3"/>} BÚSQUEDA INTELIGENTE
                      </button>
                    ) : null}
                  </div>
                  <div className="relative">
                    <select value={proyecto} onChange={e => setProyecto(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 sm:p-4 transition-all font-bold text-base sm:text-lg cursor-pointer appearance-none">
                      {proyectosPorRegional[regional]?.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="OTRO">OTRO...</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-500"><ChevronDown className="w-5 h-5" /></div>
                  </div>
                  {proyecto === "OTRO" && <input type="text" value={proyectoPersonalizado} onChange={e => setProyectoPersonalizado(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 sm:p-4 transition-all font-semibold mt-3 animate-pop" placeholder="Escribe el nombre del proyecto..." />}
                </div>

                {/* UV / MZN / LOTE */}
                <div className="pt-2 sm:pt-3">
                  <div className="bg-[#0d1420]/80 border border-slate-800/80 rounded-[1.5rem] p-4 sm:p-5 flex flex-col gap-3 relative shadow-inner">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-teal-400" />
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ubicación del Lote</span>
                      </div>
                      {!usarBD && tieneBD && (
                        <span className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase flex items-center gap-1"><Edit2 className="w-3 h-3"/> Ingreso Manual</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold text-teal-500 uppercase tracking-widest">UV</label>
                        {modoBD ? (
                           <div className="relative">
                             <select value={uv} onChange={handleUvChange} className="w-full bg-[#060b13] border border-slate-800 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer">
                               <option value="" disabled hidden>Selec.</option>
                               {uvsDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-teal-500"><ChevronDown className="w-3 h-3" /></div>
                           </div>
                        ) : <input type="text" value={uv} onChange={handleUvChange} placeholder="Ej. 49" className="w-full bg-[#060b13] border border-slate-800 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600" />}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold text-teal-500 uppercase tracking-widest">MZN</label>
                        {modoBD ? (
                           <div className="relative">
                             <select value={mzn} onChange={handleMznChange} className="w-full bg-[#060b13] border border-slate-800 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer">
                               <option value="" disabled hidden>Selec.</option>
                               {mznsDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-teal-500"><ChevronDown className="w-3 h-3" /></div>
                           </div>
                        ) : <input type="text" value={mzn} onChange={handleMznChange} placeholder="Ej. 6" className="w-full bg-[#060b13] border border-slate-800 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600" />}
                      </div>
                      <div className="space-y-1.5 text-center flex flex-col">
                        <label className="text-[9px] sm:text-[10px] font-bold text-teal-500 uppercase tracking-widest">LOTE</label>
                        {modoBD ? (
                           <div className="relative">
                             <select value={lote} onChange={handleLoteChange} className="w-full bg-[#060b13] border border-slate-800 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold appearance-none cursor-pointer">
                               <option value="" disabled hidden>Selec.</option>
                               {lotesDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
                             </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-teal-500"><ChevronDown className="w-3 h-3" /></div>
                           </div>
                        ) : <input type="text" value={lote} onChange={handleLoteChange} placeholder="Ej. 9" className="w-full bg-[#060b13] border border-slate-800 text-white rounded-xl p-3 text-center text-xs sm:text-sm font-bold placeholder-slate-600" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CATEGORIA, SUP & PRECIO */}
                <div className="space-y-2.5 relative mt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <LayoutTemplate className="w-3 h-3 text-cyan-500" /> Categoría del Lote
                    </label>
                    <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Ej. LOTE S/CALLE ESQ. A" className={`w-full rounded-xl p-3.5 text-xs sm:text-sm font-semibold placeholder-slate-600 ${modoBD ? 'bg-cyan-950/20 border border-cyan-500/30 text-cyan-100' : 'glass-input'}`} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-4">
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><Map className="w-4 h-4 text-teal-400" /> Superficie <span className="text-slate-600 normal-case">(m²)</span></span>
                    </label>
                    <input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="Ej. 240" className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 ${modoBD ? 'bg-[#060b13] border border-slate-800 text-cyan-400 shadow-inner' : 'glass-input'}`} />
                  </div>
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-teal-400" /> Precio <span className="text-slate-600 normal-case">/ m²</span></span>
                    </label>
                    <input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. 145" className={`w-full rounded-2xl p-3.5 sm:p-4 font-extrabold text-lg sm:text-xl placeholder-slate-600 ${modoBD ? 'bg-[#060b13] border border-slate-800 text-cyan-400 shadow-inner' : 'glass-input'}`} />
                  </div>
                </div>

                {/* DESCUENTOS OPCIONALES */}
                <div className="bg-slate-800/40 border border-cyan-500/20 p-4 sm:p-5 rounded-[2rem] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] relative overflow-hidden group backdrop-blur-md mt-4">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-400/20 transition-colors"></div>
                  <div className="text-[10px] sm:text-xs font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-4 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                    <div className="bg-cyan-500/20 p-1.5 rounded-lg border border-cyan-500/30"><Gift className="w-4 h-4 text-cyan-300" /></div>
                    Descuentos Promocionales
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {showDescM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                          <input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-cyan-500" /> Crédito x m² ($us)
                        </label>
                        <input type="number" step="0.01" min="0" disabled={!aplicarDescM2} value={descuentoM2} onChange={handleDescM2Change} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescM2 ? 'glass-input focus:ring-1 focus:ring-cyan-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescM2 ? 'text-cyan-400' : 'text-slate-600'}`}>Máx: ${calcularLimitesMaximos().maxDescM2}</p>
                      </div>
                    )}
                    {showDescContadoM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                          <input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-cyan-500" /> Contado x m² ($us)
                        </label>
                        <input type="number" step="0.01" min="0" disabled={!aplicarDescContadoM2} value={descuentoContadoM2} onChange={handleDescContadoM2Change} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoM2 ? 'glass-input focus:ring-1 focus:ring-cyan-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarDescContadoM2 ? 'text-cyan-400' : 'text-slate-600'}`}>Máx: ${calcularLimitesMaximos().maxContadoM2}</p>
                      </div>
                    )}
                    {showBonoInicial && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                          <input type="checkbox" checked={aplicarBonoInicialOtro} onChange={e => setAplicarBonoInicialOtro(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-cyan-500" /> Bono Inicial ($us)
                        </label>
                        <input type="number" step="0.01" min="0" max="500" disabled={!aplicarBonoInicialOtro} value={descuentoInicial} onChange={handleBonoInicialChange} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarBonoInicialOtro ? 'glass-input focus:ring-1 focus:ring-cyan-500' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        <p className={`text-[9px] sm:text-[10px] font-extrabold mt-1 ${aplicarBonoInicialOtro ? 'text-cyan-400' : 'text-slate-600'}`}>Máx: $500</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* INICIAL & PLAZO */}
                <div className="grid grid-cols-12 gap-4 sm:gap-5 mt-4">
                  <div className="col-span-12 md:col-span-8 bg-cyan-950/20 border border-cyan-500/20 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" /> Inicial (%)
                      </label>
                      <input 
                        type="number" step="0.01" min="0" required={modoInicial === 'porcentaje'}
                        value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''} 
                        onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                        placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 5'}
                        className="w-full bg-[#060b13] border border-slate-700 rounded-xl p-3 sm:p-3.5 outline-none focus:border-cyan-500 transition-all font-bold text-white text-sm sm:text-base placeholder-slate-600" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-[11px] font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Monto ($us)
                      </label>
                      <input 
                        type="number" step="0.01" min="0" required={modoInicial === 'monto'}
                        value={modoInicial === 'monto' ? inicialMonto : ''} 
                        onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} 
                        placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 500'}
                        className="w-full bg-[#060b13] border border-slate-700 rounded-xl p-3 sm:p-3.5 outline-none focus:border-cyan-500 transition-all font-black text-amber-400 text-sm sm:text-base placeholder-slate-600" 
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-12 md:col-span-4 space-y-2 mt-2 md:mt-0">
                    <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-cyan-400" /> Plazo
                    </label>
                    <div className="relative h-[calc(100%-1.5rem)]">
                      <select required value={años} onChange={e => setAños(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 outline-none transition-all font-bold text-white text-sm sm:text-base appearance-none pr-10 cursor-pointer h-full min-h-[50px]">
                        <option value="" disabled hidden>Selec.</option>
                        {[...Array(14)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-cyan-500"><ChevronDown className="w-5 h-5" /></div>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={isCalculating} className={`w-full mt-6 sm:mt-8 bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 hover:from-cyan-500 hover:via-teal-400 hover:to-emerald-400 text-slate-900 font-black py-4 sm:py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-[0_0_20px_rgba(6,182,212,0.4)] uppercase tracking-widest text-sm sm:text-lg relative overflow-hidden group ${isCalculating ? 'opacity-80 scale-95' : 'hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:-translate-y-1'}`}>
                  <div className="absolute inset-0 bg-white/30 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                  <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                    {isCalculating ? (
                      <><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> Procesando Núcleo...</>
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
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="bg-[#060b13] p-6 sm:p-8 rounded-full mb-6 sm:mb-8 shadow-[0_0_30px_rgba(6,182,212,0.2)] border border-cyan-500/30 relative z-10">
                    {isCalculating ? <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 animate-spin" /> : <Calculator className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400" />}
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 sm:mb-3">
                  {isCalculating ? "Analizando Transición TC..." : "Plataforma Fintech"}
                </h3>
                <p className="text-sm sm:text-base max-w-md text-slate-400 font-medium leading-relaxed px-2">
                  {isCalculating ? "Calculando cuota escalonada, seguros y ahorro promocional." : "Completa los parámetros de inversión a la izquierda para generar una propuesta financiera de alta precisión."}
                </p>
              </div>
            ) : (
              <div className="glass-panel rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 animate-in fade-in slide-in-from-bottom-12 duration-700 ease-out relative overflow-hidden shadow-2xl border border-slate-700/50">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-slate-800 gap-4 relative z-10">
                  <h2 className="text-2xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                    <div className="bg-gradient-to-br from-cyan-400 to-teal-500 p-2 rounded-xl text-[#060b13]"><ShieldCheck className="w-5 h-5" /></div> 
                    Resumen de Inversión
                  </h2>
                  <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse"></span> Cotización Válida
                  </span>
                </div>
                
                <div className="relative z-10 space-y-6">
                  
                  {/* Fila: Proyecto y Lote */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#060b13]/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700"><MapPin className="w-5 h-5 text-cyan-400" /></div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Proyecto</div>
                          <div className="text-white font-black text-lg uppercase leading-none">{resultado.proyecto}</div>
                          {resultado.categoria && resultado.categoria !== "ESTÁNDAR" && <div className="text-[8px] text-amber-400 font-bold mt-1 tracking-wider">{resultado.categoria}</div>}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 w-full sm:w-auto">
                        <div className="text-center px-4 py-2 bg-slate-900 rounded-xl border border-slate-800"><div className="text-[8px] font-extrabold text-slate-500 uppercase mb-1">UV</div><div className="text-cyan-400 font-black text-base leading-none">{resultado.uv || '-'}</div></div>
                        <div className="text-center px-4 py-2 bg-slate-900 rounded-xl border border-slate-800"><div className="text-[8px] font-extrabold text-slate-500 uppercase mb-1">MZN</div><div className="text-cyan-400 font-black text-base leading-none">{resultado.mzn || '-'}</div></div>
                        <div className="text-center px-4 py-2 bg-cyan-900/30 rounded-xl border border-cyan-500/30"><div className="text-[8px] font-extrabold text-cyan-500 uppercase mb-1">LOTE</div><div className="text-white font-black text-base leading-none">{resultado.lote || '-'}</div></div>
                      </div>
                  </div>

                  {/* Fila: Precio y Contado */}
                  <div className="bg-gradient-to-br from-[#0d1420] to-[#060b13] p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
                    <div className="text-center sm:text-left">
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Valor Original</span>
                      <div className="text-2xl sm:text-3xl font-black text-white">$ {resultado.valorOriginal}</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-500 mt-1">Bs. {resultado.valorOriginalBs}</div>
                    </div>
                    {resultado.ahorroContado !== "0.00" && (
                      <div className="bg-emerald-950/40 text-emerald-400 px-5 py-3 rounded-2xl border border-emerald-500/30 text-center w-full sm:w-auto">
                        <div className="text-[9px] font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Tag className="w-3 h-3"/> Oferta Contado (TC 6.97)</div>
                        <div className="text-xl font-black text-emerald-300">$ {resultado.valorContado}</div>
                      </div>
                    )}
                  </div>

                  {/* Fila: Crédito Directo y Cuota Inicial */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="bg-[#0d1420]/60 p-5 rounded-2xl border border-slate-800 text-center sm:text-left relative overflow-hidden">
                      <div className="text-cyan-500 text-[10px] font-extrabold uppercase tracking-widest">Total a Financiar</div>
                      <div className="text-2xl font-black text-white mt-1">$ {resultado.valorCredito}</div>
                      {resultado.ahorroCredito !== "0.00" && (
                          <div className="mt-2 text-[9px] text-amber-400 font-bold bg-amber-900/20 px-2 py-1 rounded border border-amber-500/20 inline-block uppercase">
                            Ahorro Incluido: $ {resultado.ahorroCredito}
                          </div>
                      )}
                    </div>
                    <div className="bg-[#0d1420]/60 p-5 rounded-2xl border border-slate-800 text-center sm:text-left relative">
                      <div className="absolute right-0 top-0 text-[8px] bg-emerald-500 text-slate-900 font-black px-2 py-1 rounded-bl-lg">TC 6.97 CONGELADO</div>
                      <div className="text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest">Cuota Inicial ({resultado.inicialPct}%)</div>
                      <div className="text-2xl font-black text-white mt-1">$ {resultado.inicial}</div>
                      <div className="text-[11px] font-bold text-emerald-500 mt-1">Bs. {resultado.inicialBs}</div>
                    </div>
                  </div>

                  {/* TABLA DE TRANSICIÓN INFINITA CON TOGGLE CYBERPUNK */}
                  <div className="bg-[#04070b] border border-cyan-500/20 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(6,182,212,0.1)] mt-8 relative">
                      
                      <div className="p-5 border-b border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 bg-gradient-to-r from-cyan-950/20 to-transparent">
                          <div>
                            <h3 className="text-white font-black text-lg flex items-center gap-2">
                               <Sparkles className={`w-5 h-5 ${aplicarBonificacion ? 'text-amber-400' : 'text-slate-500'}`}/> 
                               Bonificación de Transición
                            </h3>
                            <p className="text-slate-400 text-[10px] mt-1">Pago regular: ${resultado.mensual} · TC Mercado: {tcFlexible}</p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                             {/* TOGGLE CYBERPUNK DE OTRO PLANETA */}
                             <div className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-300 shadow-inner ${aplicarBonificacion ? 'bg-slate-900/80 border-cyan-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                               <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${aplicarBonificacion ? 'text-cyan-400' : 'text-slate-500'}`}>
                                  Con Bonificación
                               </span>
                               <button 
                                 type="button" 
                                 onClick={() => setAplicarBonificacion(!aplicarBonificacion)} 
                                 className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 focus:outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] ${aplicarBonificacion ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'bg-slate-800 border border-slate-700'}`}
                               >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${aplicarBonificacion ? 'translate-x-7 shadow-[0_0_10px_rgba(255,255,255,0.9)]' : 'translate-x-1'}`} />
                               </button>
                             </div>
                             
                             <div className={`border px-5 py-2.5 rounded-xl text-center transition-all duration-300 flex-1 lg:flex-none ${aplicarBonificacion ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-slate-800/50 border-slate-700'}`}>
                               <div className={`text-[9px] uppercase font-black tracking-widest ${aplicarBonificacion ? 'text-amber-400' : 'text-slate-500'}`}>Ahorro Total Cliente</div>
                               <div className={`text-xl font-black ${aplicarBonificacion ? 'text-amber-500' : 'text-slate-600'}`}>Bs. {resultado.totalAhorroTransicion}</div>
                             </div>
                          </div>
                      </div>
                      
                      <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar relative">
                        {/* Overlay visual cuando está desactivado */}
                        {!aplicarBonificacion && <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] z-20 pointer-events-none"></div>}

                        <table className="w-full text-left text-xs whitespace-nowrap min-w-[700px]">
                          <thead className="sticky top-0 bg-[#090e17] z-30 border-b border-slate-800">
                            <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              <th className="p-3 text-center">Mes</th>
                              <th className="p-3 text-center">Pago Fijo ($)</th>
                              <th className={`p-3 text-center transition-colors ${aplicarBonificacion ? 'text-cyan-400' : 'text-slate-600'}`}>Descuento</th>
                              <th className={`p-3 text-center transition-colors ${aplicarBonificacion ? 'text-cyan-300 bg-cyan-950/20' : 'text-slate-500'}`}>Pago c/Desc ($)</th>
                              <th className="p-3 text-center text-white">Monto Real (Bs)</th>
                              <th className="p-3 text-center">TC Efe.</th>
                            </tr>
                          </thead>
                          <tbody className="font-semibold relative z-10">
                            {resultado.transicionData && resultado.transicionData.map((row, i) => (
                              <tr key={i} className={`border-b border-slate-800/50 text-center hover:bg-slate-800/30 transition-colors ${row.isDiscounted ? 'bg-cyan-950/10' : 'text-slate-500'}`}>
                                <td className={`p-3 font-bold ${row.isDiscounted ? 'text-cyan-400' : 'text-slate-600'}`}>{row.mesLabel}</td>
                                <td className="p-3 text-slate-300">{Number(row.pagoUsdNormal).toFixed(2)}</td>
                                <td className={`p-3 ${row.isDiscounted ? 'text-cyan-500' : 'text-slate-600'}`}>{row.descPct > 0 ? `${row.descPct.toFixed(1)}%` : '-'}</td>
                                <td className={`p-3 font-bold ${row.isDiscounted ? 'text-cyan-300 bg-cyan-950/20' : 'text-slate-500'}`}>{row.conDescUsd.toFixed(2)}</td>
                                <td className={`p-3 font-black ${row.isDiscounted ? 'text-white' : 'text-slate-400'}`}>{row.montoBs.toFixed(2)}</td>
                                <td className="p-3 text-slate-400">{row.tcEfectivo.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-3 bg-[#060b13] text-[9px] text-slate-500 text-center border-t border-slate-800">
                        *Simulación referencial. Descuento matemático ordenado.
                      </div>
                  </div>

                  {/* TABLA DE PLAN DE PAGOS (1 a 14 Años) */}
                  <div className="mt-8 border border-emerald-500/20 rounded-2xl overflow-hidden shadow-sm bg-[#0d1420]/50">
                    <div className="bg-[#040810] p-4 border-b border-emerald-500/10 flex justify-between items-center">
                       <h3 className="text-slate-300 font-bold text-sm tracking-wide flex items-center gap-2">
                         <Calendar className="w-4 h-4 text-emerald-500"/> Resumen de Plazos Alternativos
                       </h3>
                    </div>
                    <div className="p-3 sm:p-5 max-h-[350px] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 pb-3 border-b border-slate-800 text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest text-center sticky top-0 bg-[#0d1420] z-10">
                          <div>Plazo</div><div className="text-emerald-400">Cuota ($us)</div><div className="text-emerald-400">Cuota (Bs.)</div>
                        </div>
                        <div className="pt-2">
                          {resultado.planPagos && resultado.planPagos.map((plan, i) => (
                            <div key={i} className={`grid grid-cols-3 gap-2 sm:gap-4 p-3 rounded-xl text-center text-sm font-bold transition-all duration-300 ${plan.isCurrent ? 'bg-emerald-900/30 border border-emerald-500/40 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.02] transform my-2' : 'text-slate-300 hover:bg-slate-800/50 border border-transparent'}`}>
                              <div className="flex items-center justify-center gap-2">
                                {plan.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block"></span>} 
                                {plan.año} {plan.año === 1 ? 'Año' : 'Años'}
                              </div>
                              <div className={`font-black ${plan.isCurrent ? 'text-white' : 'text-emerald-50'}`}>$ {plan.cuotaUsd}</div>
                              <div className={plan.isCurrent ? 'text-emerald-400' : 'text-slate-400'}>Bs. {plan.cuotaBs}</div>
                            </div>
                          ))}
                        </div>
                    </div>
                  </div>

                  {/* BOTONERAS DE ACCIÓN */}
                  <div className="mt-8 pt-6 border-t border-slate-800 no-print">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => window.print()} className="w-full sm:w-1/4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 sm:py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm hover:shadow-md">
                          <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button onClick={copiarTexto} className="w-full sm:w-1/3 bg-transparent hover:bg-cyan-900/30 border border-cyan-500/50 text-cyan-400 font-black py-4 sm:py-5 px-4 sm:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm uppercase tracking-wider relative overflow-hidden">
                          {copiado ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300" /> : <FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
                          <span>{copiado ? 'COPIADO' : 'COPIAR TEXTO'}</span>
                        </button>
                        <button onClick={enviarWhatsApp} className="w-full sm:w-2/3 bg-[#25D366] hover:bg-[#1DA851] text-slate-900 font-black py-4 sm:py-5 px-4 sm:px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-md hover:shadow-lg hover:-translate-y-1 text-xs sm:text-sm uppercase tracking-wider">
                          <Send className="w-5 h-5 sm:w-6 sm:h-6" /> <span>Enviar por WhatsApp</span>
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER OSCAR SARAVIA - FIRMA DE AUTOR (DE OTRO PLANETA) */}
        <div className="mt-32 pt-16 border-t border-slate-800/40 flex flex-col items-center justify-center text-center pb-16 no-print relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
          
          <div className="text-[#48b5db] text-[10px] sm:text-xs font-black tracking-[0.5em] uppercase mb-8 opacity-80">
            Concepto, Arquitectura y Desarrollo Web
          </div>
          
          <div className="text-5xl sm:text-7xl md:text-[6rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#48b5db] tracking-tighter mb-8 drop-shadow-[0_0_30px_rgba(72,181,219,0.3)] select-none">
            OSCAR SARAVIA
          </div>
          
          <p className="text-slate-400 text-[10px] sm:text-xs max-w-3xl font-semibold tracking-[0.2em] leading-relaxed uppercase opacity-60">
            Esta plataforma de clase mundial fue inventada y programada de forma exclusiva para elevar el estándar de ventas y la experiencia del cliente.
          </p>
        </div>

      </div>
    </div>
  );
}
