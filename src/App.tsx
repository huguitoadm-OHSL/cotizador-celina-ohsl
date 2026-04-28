import React, { useState, useEffect, useRef } from "react";
import { 
  Calculator, Send, Map, DollarSign, Percent, Calendar, 
  CheckCircle2, Building2, ChevronRight, FileText, Tag, 
  MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, ChevronDown, ListOrdered,
  Database, Edit2
} from "lucide-react";

// BASE DE DATOS DE REGIONALES Y PROYECTOS
const proyectosPorRegional = {
  "SANTA CRUZ": [
    "EL ENCANTO",
    "EL ENCANTO 2",
    "SANTA ROSA FASE 1",
    "SANTA ROSA FASE 2",
    "SANTA ROSA FASE 3",
    "TAMARINDO",
    "JARDINES DEL BOSQUE",
    "EL PORVENIR",
    "EL PORVENIR 2"
  ],
  "MONTERO": [
    "LOS JARDINES",
    "EL RENACER",
    "MUYURINA",
    "CELINA 3",
    "CELINA 4",
    "CELINA 5",
    "RANCHO NUEVO",
    "CELINA X",
    "CAÑAVERAL",
    "SANTA FE",
    "VILLA BELLA"
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
// 📁 BASE DE DATOS DE LOTES (INVENTARIO)
// ============================================================================
// Ya no usamos el array fijo aquí. Ahora lo cargaremos desde public/lotes.json
// de forma asíncrona para no saturar el código con los 20,000 lotes.

export default function App() {
  const [regional, setRegional] = useState("SANTA CRUZ");
  const [proyecto, setProyecto] = useState(proyectosPorRegional["SANTA CRUZ"][0]);
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  
  // Estado para almacenar los 20,000 lotes descargados del JSON
  const [baseDeDatosLotes, setBaseDeDatosLotes] = useState([]);
  const [cargandoBD, setCargandoBD] = useState(true);

  // Inicializados vacíos
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState("");
  
  // Estado para la Base de Datos
  const [usarBD, setUsarBD] = useState(true);

  // Estados de Descuentos
  const [descuentoCredito, setDescuentoCredito] = useState(20);
  const [descuentoContado, setDescuentoContado] = useState(30);
  const [descuentoM2, setDescuentoM2] = useState(0);
  const [descuentoInicial, setDescuentoInicial] = useState(0);
  const [descuentoContadoM2, setDescuentoContadoM2] = useState(0); 

  // Estados para ACTIVAR/DESACTIVAR DESCUENTOS
  const [aplicarDescContadoPct, setAplicarDescContadoPct] = useState(true);
  const [aplicarDescCreditoPct, setAplicarDescCreditoPct] = useState(true);
  const [aplicarDescM2, setAplicarDescM2] = useState(true);
  const [aplicarDescContadoM2, setAplicarDescContadoM2] = useState(true);
  const [aplicarBonoInicialOtro, setAplicarBonoInicialOtro] = useState(true);

  // Estados de Inicial
  const [modoInicial, setModoInicial] = useState("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  
  const [años, setAños] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mostrarPlan, setMostrarPlan] = useState(false);
  
  // Referencia para auto-scroll
  const resultadosRef = useRef(null);

  // Cargar el archivo JSON de lotes al iniciar la aplicación
  useEffect(() => {
    const cargarLotes = async () => {
      try {
        // Usamos ruta relativa por defecto (ideal para producción en GitHub Pages/Vercel)
        let url = './lotes.json';
        
        // Si estamos en la vista previa (blob:), intentamos descargar desde tu repositorio real
        // para evitar el error de "Failed to parse URL"
        if (window.location.protocol === 'blob:' || window.location.protocol === 'data:' || window.location.origin === 'null') {
          url = 'https://raw.githubusercontent.com/huguitoadm-OHSL/cotizador-celina-ohsl/main/public/lotes.json';
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo descargar el archivo JSON');
        
        const data = await response.json();
        setBaseDeDatosLotes(data);
        setCargandoBD(false);
      } catch (error) {
        console.error('Error al cargar la base de datos de lotes:', error);
        // Si falla (ej. si aún no subes el archivo a GitHub), pasamos a ingreso manual
        setCargandoBD(false);
        setUsarBD(false); 
      }
    };

    cargarLotes();
  }, []);

  // Inyectar fuente y animaciones CSS
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Actualizar proyectos al cambiar de regional
  useEffect(() => {
    setProyecto(proyectosPorRegional[regional]?.[0] || "OTRO");
  }, [regional]);

  // Lógica Automática de Proyectos
  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños("");
    setResultado(null); setProyectoPersonalizado("");
    setMostrarPlan(false);

    // Resetear activadores de descuento al cambiar de proyecto
    setAplicarDescContadoPct(true);
    setAplicarDescCreditoPct(true);
    setAplicarDescM2(true);
    setAplicarDescContadoM2(true);
    setAplicarBonoInicialOtro(true);

    if (proyecto === "MUYURINA") {
      setDescuentoCredito(20); setDescuentoContado(30); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0);
    } else if (proyecto === "EL RENACER" || proyecto === "LOS JARDINES" || proyecto === "SANTA FE" || proyecto === "RANCHO NUEVO") {
      setDescuentoCredito(0); setDescuentoContado(0); 
      setDescuentoM2(1); // 1$ por m2 crédito base (1.5% a 4.9%)
      setDescuentoInicial(0); 
      setDescuentoContadoM2(3); // 3$ por m2 contado (Sin límite)
    } else if (proyecto === "CAÑAVERAL") {
      setDescuentoCredito(0); setDescuentoContado(0); 
      setDescuentoM2(1); // 1$ por m2 crédito base (1.5% a 4.9%)
      setDescuentoInicial(0); 
      setDescuentoContadoM2(4); // 4$ por m2 contado
    } else {
      // Para OTRO o proyectos sin regla específica
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0);
    }
  }, [proyecto]);

  // ==========================================================================
  // LÓGICA PARA AUTO-COMPLETAR CON LA BASE DE DATOS
  // ==========================================================================
  const lotesDelProyecto = baseDeDatosLotes.filter(l => l.proyecto === proyecto);
  const tieneBD = lotesDelProyecto.length > 0;
  const modoBD = usarBD && tieneBD;
  
  // Extraer Manzanos únicos del proyecto seleccionado
  const mznsDisponibles = [...new Set(lotesDelProyecto.map(l => l.mzn))].sort((a,b)=> Number(a) - Number(b));
  // Extraer Lotes únicos del manzano seleccionado
  const lotesDisponibles = lotesDelProyecto.filter(l => l.mzn === mzn).map(l => l.lote).sort((a,b)=> Number(a) - Number(b));

  // 1. Auto-seleccionar el primer MZN cuando se entra al modo BD
  useEffect(() => {
    if (modoBD && mznsDisponibles.length > 0 && !mznsDisponibles.includes(mzn)) {
      setMzn(mznsDisponibles[0]);
    }
  }, [modoBD, mznsDisponibles, mzn]);

  // 2. Auto-seleccionar el primer LOTE cuando cambia el MZN
  useEffect(() => {
    if (modoBD && mzn && lotesDisponibles.length > 0 && !lotesDisponibles.includes(lote)) {
      setLote(lotesDisponibles[0]);
    }
  }, [modoBD, mzn, lotesDisponibles, lote]);

  // 3. Auto-rellenar Superficie y Precio cuando cambia MZN o LOTE
  useEffect(() => {
    if (modoBD && mzn && lote) {
      const loteEncontrado = lotesDelProyecto.find(l => l.mzn === mzn && l.lote === lote);
      if (loteEncontrado) {
        setSuperficie(loteEncontrado.superficie.toString());
        setPrecio(loteEncontrado.precio.toString());
        if(loteEncontrado.uv) setUv(loteEncontrado.uv);
      }
    }
  }, [modoBD, mzn, lote, lotesDelProyecto]);
  // ==========================================================================


  // EFECTO DINÁMICO: Ajuste automático de descuento a crédito según % o Monto Fijo de Cuota Inicial
  useEffect(() => {
    let pct = 0;

    if (modoInicial === 'porcentaje') {
      pct = Number(inicialPorcentaje);
    } else {
      const sup = Number(superficie);
      const prec = Number(precio);
      const monto = Number(inicialMonto);

      if (sup > 0 && prec > 0 && monto > 0) {
        const val_orig = sup * prec;
        const desc_m2_val = aplicarDescM2 ? Number(descuentoM2) : 0;
        const m_desc_m2 = sup * desc_m2_val;
        const val_post_desc_m2 = val_orig - m_desc_m2;
        
        const desc_cred_pct = aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0;
        const m_desc_cred = val_post_desc_m2 * desc_cred_pct;
        const base = val_post_desc_m2 - m_desc_cred;

        if (base > 0) {
          pct = (monto / base) * 100;
        }
      }
    }

    if (pct > 0) {
      if (proyecto === "MUYURINA") {
        if (pct >= 4.99) setDescuentoCredito(23);
        else setDescuentoCredito(20);
      } else if (["LOS JARDINES", "SANTA FE", "EL RENACER", "RANCHO NUEVO", "CAÑAVERAL"].includes(proyecto)) {
        if (pct >= 5) setDescuentoM2(2); // De 5% en adelante -> $2 de descuento
        else setDescuentoM2(1);          // De 1.5% al 4.9% -> $1 de descuento
      }
    }
  }, [modoInicial, inicialPorcentaje, inicialMonto, superficie, precio, proyecto, descuentoM2, descuentoCredito, aplicarDescM2, aplicarDescCreditoPct]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calcular = () => {
    const sup = Number(superficie);
    const prec = Number(precio);
    const ans = Number(años);
    
    const descCreditoPct = aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0;
    const descContadoPct = aplicarDescContadoPct ? (Number(descuentoContado) / 100) : 0;
    const descM2Val = aplicarDescM2 ? Number(descuentoM2) : 0;
    const descContadoM2Val = aplicarDescContadoM2 ? Number(descuentoContadoM2) : 0;

    if (!sup || !prec || ans <= 0) {
      setResultado(null);
      return;
    }

    const valor_original = sup * prec;

    // --- CÁLCULO DE CRÉDITO ---
    let monto_descuento_m2 = sup * descM2Val;
    const valor_post_desc_m2 = valor_original - monto_descuento_m2;

    const monto_desc_credito_pct = valor_post_desc_m2 * descCreditoPct;
    const base_para_inicial = valor_post_desc_m2 - monto_desc_credito_pct;
    
    let cuota_inicial = 0;
    if (modoInicial === 'porcentaje') {
      cuota_inicial = base_para_inicial * (Number(inicialPorcentaje) / 100);
    } else {
      cuota_inicial = Number(inicialMonto);
    }

    let descIniVal = 0;
    if (proyecto === "OTRO" && aplicarBonoInicialOtro) {
       descIniVal = Math.min(Number(descuentoInicial), 500);
    }

    const monto_descuento_total_credito = monto_descuento_m2 + monto_desc_credito_pct + descIniVal;
    const valor_credito = valor_original - monto_descuento_total_credito;
    

    // --- CÁLCULO DE CONTADO ---
    let monto_desc_contado_m2 = sup * descContadoM2Val;

    let monto_descuento_total_contado = 0;
    if (["SANTA FE", "LOS JARDINES", "CAÑAVERAL", "EL RENACER", "RANCHO NUEVO"].includes(proyecto)) {
      const monto_desc_contado_pct = valor_original * descContadoPct;
      monto_descuento_total_contado = monto_desc_contado_m2 + monto_desc_contado_pct;
    } else {
      const monto_desc_contado_pct = valor_post_desc_m2 * descContadoPct;
      monto_descuento_total_contado = monto_descuento_m2 + monto_desc_contado_pct + monto_desc_contado_m2;
    }
    const valor_contado = valor_original - monto_descuento_total_contado;

    // --- MATEMÁTICA DEL PRÉSTAMO ---
    const saldo = valor_credito - cuota_inicial;
    const meses = ans * 12;
    
    const tasa_anual = 0.121733; 
    const tasa = tasa_anual / 12;

    let pago_puro = 0;
    if (tasa === 0) {
      pago_puro = saldo / meses;
    } else {
      pago_puro = saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
    }

    const refSaldo = 34278.00;
    const baseSeguro = {
      1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38
    };

    const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1) / refSaldo;

    const seguro = saldo * factorSeguro;
    
    const cbdi = 0;
    const cuota_final = pago_puro + seguro + cbdi;

    const TIPO_CAMBIO = 6.97;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;

    // --- CÁLCULO PLAN DE PAGOS (10 A 1 AÑOS) ---
    let planPagosArreglo = [];
    for (let i = 10; i >= 1; i--) {
      const m_i = i * 12;
      let pp_i = 0;
      if (tasa === 0) pp_i = saldo / m_i;
      else pp_i = saldo * (tasa * Math.pow(1 + tasa, m_i)) / (Math.pow(1 + tasa, m_i) - 1);
      
      const fS_i = baseSeguro[i] ? (baseSeguro[i] / refSaldo) : (26.38 + (i - 10) * 1) / refSaldo;
      const seg_i = saldo * fS_i;
      const c_final_i = pp_i + seg_i + cbdi;
      
      planPagosArreglo.push({
        año: i,
        cuotaUsd: formatMoney(c_final_i),
        cuotaBs: formatMoney(c_final_i * TIPO_CAMBIO)
      });
    }

    setResultado({
      regional: regional,
      proyecto: nombreProyectoFinal,
      uv, mzn, lote, superficie: sup,
      valorOriginal: formatMoney(valor_original),
      valorOriginalBs: formatMoney(valor_original * TIPO_CAMBIO),
      
      valorContado: formatMoney(valor_contado),
      valorContadoBs: formatMoney(valor_contado * TIPO_CAMBIO),
      ahorroContado: formatMoney(monto_descuento_total_contado),
      porcentajeContado: aplicarDescContadoPct ? descuentoContado : 0,
      descuentoContadoM2: aplicarDescContadoM2 ? descContadoM2Val : 0,
      
      valorCredito: formatMoney(valor_credito),
      valorCreditoBs: formatMoney(valor_credito * TIPO_CAMBIO),
      ahorroCredito: formatMoney(monto_descuento_total_credito),
      porcentajeCredito: aplicarDescCreditoPct ? descuentoCredito : 0,
      
      descuentoM2: aplicarDescM2 ? descM2Val : 0,
      descuentoInicial: descIniVal,
      
      inicial: formatMoney(cuota_inicial),
      inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO),
      pagoAmortizacion: formatMoney(pago_puro),
      seguro: formatMoney(seguro),
      cbdi: formatMoney(cbdi),
      mensual: formatMoney(cuota_final),
      mensualBs: formatMoney(cuota_final * TIPO_CAMBIO),
      plazo: ans,
      planPagos: planPagosArreglo
    });
  };

  useEffect(() => {
    if(años && precio && superficie) {
      calcular();
    }
  }, [modoInicial, aplicarBonoInicialOtro, aplicarDescContadoPct, aplicarDescCreditoPct, aplicarDescM2, aplicarDescContadoM2, superficie, precio, inicialPorcentaje, inicialMonto, años, descuentoContado, descuentoCredito, descuentoM2, descuentoInicial, descuentoContadoM2]);

  // Mensaje de WhatsApp
  const enviarWhatsApp = () => {
    if (!resultado) return;

    const saludo = "Estimado cliente, un gusto saludarle. Presento la propuesta de inversión:\n\n";
    
    const nombreProyectoCapitalizado = resultado.proyecto.charAt(0).toUpperCase() + resultado.proyecto.slice(1).toLowerCase();
    const ubicacion = `📍 *Proyecto ${nombreProyectoCapitalizado || 'S/N'} (${resultado.regional})*\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)\n\n`;

    const precioLista = `💎 *Precio:* $ ${resultado.valorOriginal} (Bs. ${resultado.valorOriginalBs})\n\n`;
    
    // --- Sección Contado ---
    let arrContado = [];
    if (resultado.porcentajeContado > 0) arrContado.push(`${resultado.porcentajeContado}%`);
    
    let isProyectosEspeciales = ["SANTA FE", "LOS JARDINES", "CAÑAVERAL", "EL RENACER", "RANCHO NUEVO"].includes(resultado.proyecto.toUpperCase());
    let descM2ContadoVal = isProyectosEspeciales ? Number(resultado.descuentoContadoM2 || 0) : Number(resultado.descuentoM2 || 0) + Number(resultado.descuentoContadoM2 || 0);
    
    if (descM2ContadoVal > 0) {
        arrContado.push(`$${descM2ContadoVal}/m²`);
    }

    let contadoStr = "";
    if (arrContado.length > 0) {
        let textoDescContado = ` - ¡Con ${arrContado.join(' + ')} de descuento!`;
        contadoStr = `💰 *Contado${textoDescContado}*\n*Inversión:* $${resultado.valorContado} (Bs. ${resultado.valorContadoBs})\n\n`;
    }

    // --- Sección Crédito ---
    let arrCredito = [];
    if (resultado.porcentajeCredito > 0) arrCredito.push(`${resultado.porcentajeCredito}%`);
    if (resultado.descuentoM2 > 0) arrCredito.push(`$${resultado.descuentoM2}/m²`);
    if (resultado.descuentoInicial > 0) arrCredito.push(`Bono Inicial Doble`);
    
    let creditoStr = "";
    if (arrCredito.length > 0) {
        let textoDescCredito = ` - ¡Con ${arrCredito.join(' + ')} de descuento!`;
        creditoStr = `✅ *Crédito${textoDescCredito}*\n*Inversión:* $ ${resultado.valorCredito} (Bs. ${resultado.valorCreditoBs})\n\n`;
    }

    const financiamiento = `📊 *Plan de Financiamiento* (${resultado.plazo} años)\n` +
      `*Cuota inicial:* $${resultado.inicial} (Bs. ${resultado.inicialBs})\n` +
      `*Cuota mensual:* $${resultado.mensual} (Bs. ${resultado.mensualBs})\n\n`;

    const cierre = `¿Le gustaría agendar una visita al terreno o prefiere una breve llamada para coordinar el cierre? Quedo a su disposición. 🤝`;

    const mensaje = saludo + ubicacion + precioLista + contadoStr + creditoStr + financiamiento + cierre;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // Función para manejar el clic de procesar y bajar la pantalla
  const handleProcesar = (e) => {
    e.preventDefault();
    calcular();
    
    setTimeout(() => {
      if (resultadosRef.current) {
        resultadosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const showDescPorcentaje = ["MUYURINA", "OTRO"].includes(proyecto);
  const showDescM2 = ["SANTA FE", "EL RENACER", "LOS JARDINES", "CAÑAVERAL", "RANCHO NUEVO", "OTRO"].includes(proyecto);
  const showBonoInicial = ["OTRO"].includes(proyecto);
  const showDescContadoM2 = ["SANTA FE", "LOS JARDINES", "CAÑAVERAL", "EL RENACER", "RANCHO NUEVO"].includes(proyecto);

  return (
    <div className="min-h-screen bg-[#020617] relative font-['Plus_Jakarta_Sans'] text-slate-200 overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Estilos para animaciones custom y Dark Glassmorphism */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1.2); }
          50% { transform: translateY(-20px) scale(1.2); }
        }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animate-float { animation: float 15s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .glass-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(16, 185, 129, 0.15);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255,255,255,0.05);
        }
        .glass-input {
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }
        .glass-input:focus {
          background: rgba(15, 23, 42, 0.8);
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        }
        /* Ajuste para el select en modo oscuro */
        select option {
          background: #0f172a;
          color: #f8fafc;
        }
      `}</style>

      {/* DIBUJO DESCOMUNAL: Mapa Isométrico de Urbanización (Terrenos) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.25] flex items-center justify-center mix-blend-screen animate-float">
        <svg viewBox="0 0 1000 1000" className="w-full h-full max-w-[1600px] absolute right-[-20%] bottom-[-10%]" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(500, 400) scale(1.6)">
            {/* Grid Topográfico */}
            {[...Array(15)].map((_, i) => (
              <path key={`grid-v-${i}`} d={`M${-450 + i*60} ${225 + i*30} L${450 + i*60} ${-225 + i*30}`} stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
            ))}
            {[...Array(15)].map((_, i) => (
              <path key={`grid-h-${i}`} d={`M${-450 + i*60} ${-225 + i*30} L${450 + i*60} ${225 + i*30}`} stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
            ))}
            {/* Lotes Abstractos Brillantes */}
            <polygon points="0,0 60,30 0,60 -60,30" fill="rgba(16, 185, 129, 0.1)" stroke="#059669" strokeWidth="1" />
            <polygon points="60,30 120,60 60,90 0,60" fill="rgba(52, 211, 153, 0.15)" stroke="#10b981" strokeWidth="1.5" />
            <polygon points="-60,30 0,60 -60,90 -120,60" fill="rgba(5, 150, 105, 0.1)" stroke="#064e3b" strokeWidth="1" />
            {/* Lote Dorado / VIP */}
            <polygon points="0,60 60,90 0,120 -60,90" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="2" className="animate-pulse" />
            {/* Volumen / Bloque 3D */}
            <path d="M0,60 L0,10 L60,-20 L60,30 Z" fill="url(#vol1)" stroke="#059669" strokeWidth="1" />
            <path d="M0,60 L0,10 L-60,40 L-60,90 Z" fill="url(#vol2)" stroke="#047857" strokeWidth="1" />
            <polygon points="0,10 60,-20 0,-50 -60,-20" fill="rgba(16, 185, 129, 0.4)" stroke="#34d399" strokeWidth="2" />
          </g>
          <defs>
            <linearGradient id="vol1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.5)" />
              <stop offset="100%" stopColor="rgba(2, 6, 23, 0.9)" />
            </linearGradient>
            <linearGradient id="vol2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(5, 150, 105, 0.5)" />
              <stop offset="100%" stopColor="rgba(2, 6, 23, 0.9)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* BACKGROUND ORBS - PREMIUM LUXURY EMERALD */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-emerald-900/40 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[45rem] h-[45rem] bg-teal-800/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[55rem] h-[55rem] bg-cyan-900/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Marca de Agua Lateral */}
      <div className="hidden xl:flex fixed left-0 top-0 h-full w-20 items-center justify-center z-0">
        <div className="transform -rotate-90 whitespace-nowrap text-slate-800/80 font-black tracking-[0.5em] text-3xl select-none">
          CELINA PREMIUM
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto py-10 px-4 sm:px-6 lg:px-12 xl:pl-24 relative z-10">
        
        {/* CABECERA PREMIUM CELINA */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mb-12 gap-6 relative">
          <div className="hidden md:block w-32"></div>
          <div className="text-center flex-1 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-800/50 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-5 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Plataforma Inteligente Inmobiliaria</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-xl flex items-center gap-4">
              Simulador <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500">Celina</span>
            </h1>
            <p className="text-slate-400 text-sm mt-4 font-semibold tracking-widest uppercase">Desarrollado por Oscar Saravia®</p>
          </div>
          <div className="hidden md:block w-32"></div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* --- PANEL IZQUIERDO: FORMULARIO GLASS OSCURO --- */}
          <div className="lg:col-span-5 glass-panel rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.15)]">
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 text-white flex items-center gap-3 relative overflow-hidden border-b border-emerald-500/10">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl backdrop-blur-md relative z-10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold tracking-wide relative z-10 text-white">Datos de Inversión</h2>
            </div>
            
            <div className="p-7 sm:p-8">
              <form onSubmit={handleProcesar} className="space-y-6">

                {/* REGIONAL */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Map className="w-4 h-4 text-teal-400" /> Regional
                  </label>
                  <select 
                    value={regional}
                    onChange={e => setRegional(e.target.value)} 
                    className="w-full glass-input rounded-2xl p-4 outline-none transition-all font-bold text-lg cursor-pointer appearance-none" 
                  >
                    {Object.keys(proyectosPorRegional).map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
                
                {/* PROYECTO */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-400" /> Proyecto
                  </label>
                  <select 
                    value={proyecto}
                    onChange={e => setProyecto(e.target.value)} 
                    className="w-full glass-input rounded-2xl p-4 outline-none transition-all font-bold text-lg cursor-pointer appearance-none" 
                  >
                    {proyectosPorRegional[regional]?.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="OTRO">OTRO...</option>
                  </select>
                  {proyecto === "OTRO" && (
                    <input 
                      type="text" value={proyectoPersonalizado} onChange={e => setProyectoPersonalizado(e.target.value)} 
                      className="w-full glass-input rounded-2xl p-4 outline-none transition-all font-semibold mt-3" 
                      placeholder="Escribe el nombre del proyecto..."
                    />
                  )}
                </div>

                {/* CONTROLES DE BASE DE DATOS MÁGICOS */}
                <div className="flex items-center justify-between mt-6 mb-3 pt-4 border-t border-slate-700/50">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400" /> Ubicación del Lote
                  </label>
                  {cargandoBD ? (
                    <span className="text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <div className="w-3 h-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
                      Cargando Inventario...
                    </span>
                  ) : tieneBD ? (
                    <button 
                      type="button"
                      onClick={() => setUsarBD(!usarBD)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${usarBD ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-800/50 text-slate-400 border border-slate-700'}`}
                    >
                      {usarBD ? <Database className="w-3 h-3"/> : <Edit2 className="w-3 h-3"/>}
                      {usarBD ? 'Usando Base de Datos' : 'Ingreso Manual'}
                    </button>
                  ) : null}
                </div>

                {/* UV / MZN / LOTE */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 text-center group">
                    <label className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">UV</label>
                    <input type="text" value={uv} onChange={e => setUv(e.target.value)} placeholder="Ej. 49" className="w-full glass-input rounded-2xl p-3.5 text-center font-bold transition-all placeholder-slate-600" />
                  </div>
                  <div className="space-y-2 text-center group">
                    <label className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">MZN</label>
                    {modoBD ? (
                       <select value={mzn} onChange={e => setMzn(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 text-center font-bold appearance-none cursor-pointer bg-emerald-950/20 border-emerald-500/30 text-emerald-100">
                         {mznsDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                    ) : (
                       <input type="text" value={mzn} onChange={e => setMzn(e.target.value)} placeholder="Ej. 6" className="w-full glass-input rounded-2xl p-3.5 text-center font-bold transition-all placeholder-slate-600" />
                    )}
                  </div>
                  <div className="space-y-2 text-center group">
                    <label className="text-[10px] font-bold text-slate-500 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">LOTE</label>
                    {modoBD ? (
                       <select value={lote} onChange={e => setLote(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 text-center font-bold appearance-none cursor-pointer bg-emerald-950/20 border-emerald-500/30 text-emerald-100">
                         {lotesDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
                       </select>
                    ) : (
                       <input type="text" value={lote} onChange={e => setLote(e.target.value)} placeholder="Ej. 9" className="w-full glass-input rounded-2xl p-3.5 text-center font-bold transition-all placeholder-slate-600" />
                    )}
                  </div>
                </div>

                {/* SUP & PRECIO */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><Map className="w-4 h-4 text-emerald-400" /> Superficie <span className="text-slate-600 normal-case">(m²)</span></span>
                      {modoBD && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1"><Sparkles className="w-2 h-2"/> BD</span>}
                    </label>
                    <input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="Ej. 240" className={`w-full rounded-2xl p-4 font-extrabold text-xl transition-all placeholder-slate-600 ${modoBD ? 'bg-slate-800/80 border border-emerald-500/30 text-emerald-50' : 'glass-input'}`} />
                  </div>

                  <div className="space-y-2.5 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400" /> Precio <span className="text-slate-600 normal-case">/ m²</span></span>
                      {modoBD && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1"><Sparkles className="w-2 h-2"/> BD</span>}
                    </label>
                    <input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. 145" className={`w-full rounded-2xl p-4 font-extrabold text-xl transition-all placeholder-slate-600 ${modoBD ? 'bg-slate-800/80 border border-emerald-500/30 text-emerald-50' : 'glass-input'}`} />
                  </div>
                </div>

                {/* DESCUENTOS - PANEL PREMIUM */}
                <div className="bg-slate-800/40 border border-emerald-500/20 p-5 rounded-[2rem] shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] relative overflow-hidden group backdrop-blur-md">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-400/20 transition-colors"></div>
                  
                  <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/30">
                      <Gift className="w-4 h-4 text-emerald-300" />
                    </div>
                    Descuentos Promocionales
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {showDescPorcentaje && (
                      <>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                            <input type="checkbox" checked={aplicarDescContadoPct} onChange={e => setAplicarDescContadoPct(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" />
                            A Contado (%)
                          </label>
                          <input type="number" step="0.01" disabled={!aplicarDescContadoPct} value={descuentoContado} onChange={e=>setDescuentoContado(e.target.value)} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoPct ? 'glass-input' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                            <input type="checkbox" checked={aplicarDescCreditoPct} onChange={e => setAplicarDescCreditoPct(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" />
                            A Crédito (%)
                          </label>
                          <input type="number" step="0.01" disabled={!aplicarDescCreditoPct} value={descuentoCredito} onChange={e=>setDescuentoCredito(e.target.value)} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescCreditoPct ? 'glass-input' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        </div>
                      </>
                    )}
                    {showDescM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                          <input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" />
                          {["SANTA FE", "LOS JARDINES", "CAÑAVERAL", "EL RENACER", "RANCHO NUEVO"].includes(proyecto) ? "Crédito x m² ($us)" : "Desc. x m² ($us)"}
                        </label>
                        <input type="number" step="0.01" disabled={!aplicarDescM2} value={descuentoM2} onChange={e=>setDescuentoM2(e.target.value)} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescM2 ? 'glass-input' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        {["SANTA FE", "LOS JARDINES", "CAÑAVERAL", "EL RENACER", "RANCHO NUEVO"].includes(proyecto) && <p className={`text-[10px] font-extrabold mt-1 ${aplicarDescM2 ? 'text-emerald-400' : 'text-slate-600'}`}>Sin límite</p>}
                      </div>
                    )}
                    {showDescContadoM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                          <input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" />
                          Contado x m² ($us)
                        </label>
                        <input type="number" step="0.01" min="0" disabled={!aplicarDescContadoM2} value={descuentoContadoM2} onChange={e=>setDescuentoContadoM2(e.target.value)} placeholder={["SANTA FE", "LOS JARDINES", "EL RENACER", "RANCHO NUEVO"].includes(proyecto) ? "Ej. 3" : "Ej. 4"} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarDescContadoM2 ? 'glass-input' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        <p className={`text-[10px] font-extrabold mt-1 ${aplicarDescContadoM2 ? 'text-emerald-400' : 'text-slate-600'}`}>Sin límite</p>
                      </div>
                    )}
                    {showBonoInicial && proyecto === "OTRO" && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-300 cursor-pointer hover:text-white transition-colors">
                          <input type="checkbox" checked={aplicarBonoInicialOtro} onChange={e => setAplicarBonoInicialOtro(e.target.checked)} className="w-4 h-4 rounded bg-slate-900 border-slate-600 accent-emerald-500" />
                          Bono Inicial ($us)
                        </label>
                        <input type="number" step="0.01" max="500" disabled={!aplicarBonoInicialOtro} value={descuentoInicial} onChange={e=>{
                          let v = Number(e.target.value);
                          setDescuentoInicial(v > 500 ? 500 : v);
                        }} className={`w-full rounded-xl p-3 outline-none transition-all font-bold text-sm shadow-sm ${aplicarBonoInicialOtro ? 'glass-input' : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'}`} />
                        <p className={`text-[10px] font-extrabold mt-1 ${aplicarBonoInicialOtro ? 'text-emerald-400' : 'text-slate-600'}`}>Máx. permitido $500</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* INICIAL & PLAZO */}
                <div className="grid grid-cols-12 gap-5 mt-4">
                  <div className="col-span-12 md:col-span-8 bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-2xl grid grid-cols-2 gap-4 backdrop-blur-sm">
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" /> Inicial (%)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''}
                        onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                        placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 1.5'}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-white text-base shadow-inner placeholder-slate-600" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Monto ($us)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        value={modoInicial === 'monto' ? inicialMonto : ''}
                        onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} 
                        placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 500'}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-black text-amber-400 text-base shadow-inner placeholder-slate-600" 
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1 md:mt-0">
                      <Calendar className="w-4 h-4 text-emerald-400" /> Plazo
                    </label>
                    <div className="relative h-[calc(100%-1.5rem)]">
                      <select 
                        required 
                        value={años} 
                        onChange={e => setAños(e.target.value)} 
                        className="w-full glass-input rounded-2xl p-3.5 outline-none transition-all font-bold text-white text-base appearance-none pr-10 cursor-pointer h-full"
                      >
                        <option value="" disabled hidden>Selec.</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500">
                        <ChevronRight className="w-5 h-5 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-8 bg-gradient-to-r from-[#059669] via-[#10b981] to-[#059669] hover:from-[#047857] hover:via-[#059669] hover:to-[#047857] text-white font-extrabold py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] hover:-translate-y-1 border border-emerald-400/50 uppercase tracking-widest text-lg relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                  <span className="relative z-10 flex items-center gap-3">Procesar Cotización <TrendingUp className="w-6 h-6" /></span>
                </button>
              </form>
            </div>
          </div>

          {/* --- PANEL DERECHO: RESULTADOS PREMIUM --- */}
          <div ref={resultadosRef} className="lg:col-span-7 flex flex-col gap-6 scroll-mt-6">
            {!resultado ? (
              <div className="glass-panel rounded-[2.5rem] h-full min-h-[600px] flex flex-col items-center justify-center text-slate-400 p-10 text-center transition-all duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="bg-slate-800 p-8 rounded-full mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)] border border-emerald-500/30 relative z-10">
                    <Calculator className="w-16 h-16 text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white tracking-tight mb-3">Plataforma Activa</h3>
                <p className="text-base max-w-md text-slate-400 font-medium leading-relaxed">Completa los parámetros de inversión a la izquierda para generar una propuesta financiera detallada y lista para el cliente.</p>
              </div>
            ) : (
              <div className="glass-panel rounded-[2.5rem] p-7 sm:p-10 animate-in fade-in slide-in-from-bottom-12 duration-700 ease-out relative overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] border border-emerald-500/20">
                  
                {/* Resplandores internos de la tarjeta de resultado */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 pb-6 border-b border-slate-700/80 gap-4 relative z-10">
                  <h2 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                      <ShieldCheck className="w-6 h-6 text-slate-900" />
                    </div>
                    Propuesta Oficial
                  </h2>
                  <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-2 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-pulse"></span>
                    Aprobada
                  </span>
                </div>
                
                <div className="relative z-10 space-y-6">
                  
                  {/* Fila: Proyecto y Lote */}
                  {(resultado.proyecto || resultado.uv || resultado.mzn || resultado.lote) && (
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                      <div className="flex items-center gap-4 pl-2">
                        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-3.5 rounded-xl border border-emerald-500/30">
                          <MapPin className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Desarrollo Urbanístico</div>
                          <div className="text-white font-black text-xl uppercase leading-none tracking-tight">{resultado.proyecto || 'S/N'}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="text-center px-5 py-2.5 bg-slate-900/80 rounded-xl border border-slate-700 shadow-sm">
                          <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">UV</div>
                          <div className="text-emerald-400 font-black text-lg leading-none">{resultado.uv || '-'}</div>
                        </div>
                        <div className="text-center px-5 py-2.5 bg-slate-900/80 rounded-xl border border-slate-700 shadow-sm">
                          <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">MZN</div>
                          <div className="text-emerald-400 font-black text-lg leading-none">{resultado.mzn || '-'}</div>
                        </div>
                        <div className="text-center px-5 py-2.5 bg-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400">
                          <div className="text-[9px] font-extrabold text-emerald-950 uppercase tracking-widest mb-1">LOTE</div>
                          <div className="text-slate-900 font-black text-lg leading-none">{resultado.lote || '-'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fila: Precio Contado */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-7 rounded-[2rem] border border-slate-700/60 shadow-lg flex flex-col sm:flex-row justify-between sm:items-end gap-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>
                    <div>
                      <span className="text-slate-400 text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 mb-2">
                        Precio de Lista Original
                      </span>
                      <div className="text-4xl font-black text-white tracking-tighter drop-shadow-md">$ {resultado.valorOriginal}</div>
                      <div className="text-sm font-bold text-slate-500 mt-1.5">Bs. {resultado.valorOriginalBs}</div>
                    </div>
                    
                    {resultado.ahorroContado !== "0.00" && (
                      <div className="bg-emerald-950/60 backdrop-blur-md text-emerald-400 px-5 py-3 rounded-2xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] relative z-10">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest mb-1 text-emerald-300 flex items-center gap-1.5"><Tag className="w-3 h-3"/> Oferta al Contado</div>
                        <div className="text-2xl font-black tracking-tight text-white">$ {resultado.valorContado}</div>
                      </div>
                    )}
                  </div>

                  {/* Fila: Crédito Directo y Cuota Inicial */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="bg-slate-800/50 backdrop-blur-md p-7 rounded-[2rem] border border-slate-700/50 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)] hover:border-emerald-500/30">
                      <span className="text-teal-400 text-xs font-extrabold uppercase tracking-widest">Total a Financiar</span>
                      <div className="text-3xl font-black text-white tracking-tight mt-2">$ {resultado.valorCredito}</div>
                      
                      {resultado.ahorroCredito !== "0.00" && (
                          <div className="mt-3 text-[10px] text-amber-400 font-extrabold bg-amber-950/30 inline-block px-3 py-1.5 rounded-lg border border-amber-500/30 uppercase tracking-widest shadow-sm">
                            Ahorro Incluido: $ {resultado.ahorroCredito}
                          </div>
                      )}
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-md p-7 rounded-[2rem] border border-slate-700/50 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)] hover:border-emerald-500/30">
                      <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest">Cuota Inicial</span>
                      <div className="text-3xl font-black text-white tracking-tight mt-2">$ {resultado.inicial}</div>
                      <div className="text-sm font-bold text-slate-400 mt-1">Bs. {resultado.inicialBs}</div>
                    </div>
                  </div>

                  {/* Fila: Cuota Mensual ESTILO VIP CARD CELINA */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#020617] p-8 sm:p-10 rounded-[2rem] shadow-[0_0_40px_rgba(5,150,105,0.3)] border border-emerald-400/40 group mt-4">
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '2.5s' }}></div>
                    <div className="absolute top-0 right-0 w-64 h-full bg-emerald-500/10 skew-x-12 transform translate-x-10 pointer-events-none"></div>
                    <div className="absolute -bottom-10 -right-10 opacity-20 group-hover:opacity-40 transition-opacity">
                       <Building2 className="w-64 h-64 text-emerald-300" />
                    </div>
                    
                    <span className="text-emerald-200/90 text-[11px] font-extrabold uppercase tracking-widest relative z-10 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,1)] animate-pulse"></div>
                      Cuota Mensual Fija ({resultado.plazo} Años)
                    </span>
                    <div className="flex items-baseline gap-4 mt-3 flex-wrap relative z-10">
                      <div className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-lg">$ {resultado.mensual}</div>
                      <div className="text-2xl sm:text-3xl font-bold text-emerald-300">Bs. {resultado.mensualBs}</div>
                    </div>
                    <div className="text-xs text-emerald-200/60 mt-6 font-semibold tracking-widest relative z-10 flex gap-4 border-t border-emerald-500/30 pt-4 uppercase">
                      <span>Amort. ${resultado.pagoAmortizacion}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 my-auto"></span>
                      <span>Seguro ${resultado.seguro}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 my-auto"></span>
                      <span>CBDI ${resultado.cbdi}</span>
                    </div>
                  </div>

                  {/* ACORDEÓN: PLAN DE PAGOS DE 10 A 1 AÑOS */}
                  <div className="mt-6">
                    <button
                      onClick={() => setMostrarPlan(!mostrarPlan)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-slate-800/60 hover:border-emerald-500/40 transition-all duration-300 group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                          <ListOrdered className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="tracking-wide">Ver Plan de Pagos (10 a 1 años)</span>
                      </div>
                      <div className={`bg-slate-900 p-1.5 rounded-full border border-slate-700 transition-transform duration-500 ${mostrarPlan ? 'rotate-180 bg-emerald-900 border-emerald-500' : ''}`}>
                        <ChevronDown className={`w-4 h-4 ${mostrarPlan ? 'text-emerald-400' : 'text-slate-400'}`} />
                      </div>
                    </button>
                    
                    {mostrarPlan && (
                      <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-emerald-500/20 bg-[#020f18]/80 backdrop-blur-xl animate-in slide-in-from-top-4 fade-in duration-500 shadow-[0_10px_30px_-10px_rgba(5,150,105,0.2)]">
                        <div className="grid grid-cols-3 gap-4 p-4 border-b border-emerald-500/10 bg-slate-900/50 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                          <div>Plazo</div>
                          <div className="text-emerald-400 flex items-center justify-center gap-1"><DollarSign className="w-3 h-3"/> Cuota ($us)</div>
                          <div className="text-emerald-200 flex items-center justify-center gap-1">Cuota (Bs.)</div>
                        </div>
                        <div className="p-2">
                          {resultado.planPagos.map((plan, i) => (
                            <div key={i} className={`grid grid-cols-3 gap-4 p-3 rounded-xl text-center text-sm font-bold transition-all duration-300 ${plan.año === resultado.plazo ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-emerald-500/20 border border-emerald-500/40 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02] transform my-1' : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'}`}>
                              <div className="flex items-center justify-center gap-2">
                                {plan.año === resultado.plazo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                                {plan.año} {plan.año === 1 ? 'Año' : 'Años'}
                              </div>
                              <div className={`font-black ${plan.año === resultado.plazo ? 'text-white' : 'text-emerald-100'}`}>$ {plan.cuotaUsd}</div>
                              <div className={plan.año === resultado.plazo ? 'text-emerald-300' : 'text-slate-400'}>Bs. {plan.cuotaBs}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción */}
                  <div className="mt-8 pt-6 border-t border-slate-700/80">
                    <button
                      onClick={enviarWhatsApp}
                      className="w-full bg-gradient-to-r from-[#20bd5a] to-[#25D366] hover:from-[#1da850] hover:to-[#20bd5a] text-slate-900 font-black py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:shadow-[0_0_35px_rgba(37,211,102,0.6)] hover:-translate-y-1 text-lg uppercase tracking-wider relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-white/30 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                      <Send className="w-6 h-6 relative z-10" /> 
                      <span className="relative z-10">Enviar Propuesta por WhatsApp</span>
                    </button>
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
