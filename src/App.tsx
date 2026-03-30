import React, { useState, useEffect } from "react";
import { Calculator, Send, Map, DollarSign, Percent, Calendar, CheckCircle2, Building2, ChevronRight, FileText, Tag, MapPin, Gift, Sparkles } from "lucide-react";

export default function App() {
  const [proyecto, setProyecto] = useState("MUYURINA");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  
  // Inicializados vacíos
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState("");
  
  // Estados de Descuentos
  const [descuentoCredito, setDescuentoCredito] = useState(20);
  const [descuentoContado, setDescuentoContado] = useState(30);
  const [descuentoM2, setDescuentoM2] = useState(0);
  const [descuentoInicial, setDescuentoInicial] = useState(0);
  const [descuentoContadoM2, setDescuentoContadoM2] = useState(0); // Nuevo estado para descuento al contado sin límite
  const [aplicarBonoInicial, setAplicarBonoInicial] = useState(false);

  // Estados de Inicial
  const [modoInicial, setModoInicial] = useState("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  
  const [años, setAños] = useState("");
  const [resultado, setResultado] = useState(null);

  // Inyectar fuente cursiva
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Lógica Automática de Proyectos
  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños("");
    setResultado(null); setProyectoPersonalizado("");

    if (proyecto === "MUYURINA" || proyecto === "SANTA FE") {
      setDescuentoCredito(20); setDescuentoContado(30); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0); setAplicarBonoInicial(false);
    } else if (proyecto === "EL RENACER") {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(2); setDescuentoInicial(0); setDescuentoContadoM2(0); setAplicarBonoInicial(false);
    } else if (proyecto === "LOS JARDINES" || proyecto === "CAÑAVERAL") {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(1); setDescuentoInicial(0); setDescuentoContadoM2(0); setAplicarBonoInicial(true); 
    } else if (proyecto === "OTRO") {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0); setAplicarBonoInicial(false);
    }
  }, [proyecto]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calcular = (e) => {
    if (e) e.preventDefault();
    
    const sup = Number(superficie);
    const prec = Number(precio);
    const ans = Number(años);
    
    const descCreditoPct = Number(descuentoCredito) / 100;
    const descContadoPct = Number(descuentoContado) / 100;
    const descM2Val = Number(descuentoM2);
    const descContadoM2Val = Number(descuentoContadoM2);

    if (!sup || !prec || ans <= 0) {
      setResultado(null);
      return;
    }

    const valor_original = sup * prec;

    let monto_descuento_m2 = sup * descM2Val;
    if ((proyecto === "LOS JARDINES" || proyecto === "CAÑAVERAL") && descM2Val > 0) {
      monto_descuento_m2 = Math.min(monto_descuento_m2, 500);
    }
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
    if ((proyecto === "LOS JARDINES" || proyecto === "CAÑAVERAL") && aplicarBonoInicial) {
       descIniVal = Math.min(cuota_inicial, 500);
    } else if (proyecto === "OTRO") {
       descIniVal = Math.min(Number(descuentoInicial), 500);
    }

    // Cálculo del Precio Contado agregando el nuevo descuento x m2 (sin límite)
    const monto_desc_contado_m2 = sup * descContadoM2Val;
    const monto_desc_contado_pct = valor_post_desc_m2 * descContadoPct;
    const monto_descuento_total_contado = monto_descuento_m2 + monto_desc_contado_pct + monto_desc_contado_m2;
    const valor_contado = valor_original - monto_descuento_total_contado;

    const monto_descuento_total_credito = monto_descuento_m2 + monto_desc_credito_pct + descIniVal;
    const valor_credito = valor_original - monto_descuento_total_credito;
    
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
    const baseCBDI = {
      1: -76.012, 2: -40.519, 3: -28.763, 4: -22.941, 5: -19.493, 6: -17.233, 7: -15.650, 8: -14.492, 9: -13.616, 10: -12.937
    };

    const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1) / refSaldo;
    const factorCBDI = baseCBDI[ans] ? (baseCBDI[ans] / refSaldo) : (-12.937 / refSaldo);

    const seguro = saldo * factorSeguro;
    const cbdi = saldo * factorCBDI;
    const cuota_final = pago_puro + seguro + cbdi;

    const TIPO_CAMBIO = 6.97;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;

    setResultado({
      proyecto: nombreProyectoFinal,
      uv, mzn, lote, superficie: sup,
      valorOriginal: formatMoney(valor_original),
      valorOriginalBs: formatMoney(valor_original * TIPO_CAMBIO),
      
      valorContado: formatMoney(valor_contado),
      valorContadoBs: formatMoney(valor_contado * TIPO_CAMBIO),
      ahorroContado: formatMoney(monto_descuento_total_contado),
      porcentajeContado: descuentoContado,
      descuentoContadoM2: descContadoM2Val,
      
      valorCredito: formatMoney(valor_credito),
      valorCreditoBs: formatMoney(valor_credito * TIPO_CAMBIO),
      ahorroCredito: formatMoney(monto_descuento_total_credito),
      porcentajeCredito: descuentoCredito,
      
      descuentoM2: descM2Val,
      descuentoInicial: descIniVal,
      
      inicial: formatMoney(cuota_inicial),
      inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO),
      pagoAmortizacion: formatMoney(pago_puro),
      seguro: formatMoney(seguro),
      cbdi: formatMoney(cbdi),
      mensual: formatMoney(cuota_final),
      mensualBs: formatMoney(cuota_final * TIPO_CAMBIO),
      plazo: ans
    });
  };

  useEffect(() => {
    calcular();
  }, [modoInicial, aplicarBonoInicial, superficie, precio, inicialPorcentaje, inicialMonto, años, descuentoContado, descuentoCredito, descuentoM2, descuentoInicial, descuentoContadoM2]);

  // Mensaje de WhatsApp
  const enviarWhatsApp = () => {
    if (!resultado) return;

    const saludo = "Estimado cliente, un gusto saludarle. Presento la propuesta de inversión:\n\n";
    
    const nombreProyectoCapitalizado = resultado.proyecto.charAt(0).toUpperCase() + resultado.proyecto.slice(1).toLowerCase();
    const ubicacion = `📍 *Proyecto ${nombreProyectoCapitalizado || 'S/N'}*\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)\n\n`;

    let precioTexto = `💎 *Precio de Contado:* $ ${resultado.valorCredito} (Bs. ${resultado.valorCreditoBs})\n`;
    
    let descCreditoArr = [];
    if (resultado.porcentajeCredito > 0) descCreditoArr.push(`${resultado.porcentajeCredito}%`);
    if (resultado.descuentoM2 > 0) descCreditoArr.push(`$${resultado.descuentoM2}/m²`);
    if (resultado.descuentoInicial > 0) descCreditoArr.push(`Bono Inicial Doble de $${resultado.descuentoInicial}`);
    
    if (descCreditoArr.length > 0) {
         let joined = descCreditoArr.join(' y ');
         precioTexto += `_Incluye descuento exclusivo del ${joined} y Seguro de Vida_\n\n`;
    } else {
         precioTexto += `_Incluye Seguro de Vida_\n\n`;
    }

    let financiamiento = `📊 *Plan de Financiamiento:*\n` +
      `▪ *Cuota Inicial:* $ ${resultado.inicial} (Bs. ${resultado.inicialBs})\n` +
      `▪ *Cuota Mensual:* $ ${resultado.mensual} (Bs. ${resultado.mensualBs})\n` +
      `▪ *Plazo:* ${resultado.plazo} años\n\n`;

    const cierre = `✔️ Una oportunidad estratégica de alta valorización.\n\n` +
      `¿Le gustaría agendar una visita al terreno o prefiere una breve llamada para coordinar el cierre? Quedo a su disposición. 🤝`;

    const mensaje = saludo + ubicacion + precioTexto + financiamiento + cierre;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const showDescPorcentaje = ["MUYURINA", "SANTA FE", "OTRO"].includes(proyecto);
  const showDescM2 = ["EL RENACER", "LOS JARDINES", "CAÑAVERAL", "OTRO"].includes(proyecto);
  const showBonoInicial = ["LOS JARDINES", "CAÑAVERAL", "OTRO"].includes(proyecto);
  const showDescContadoM2 = ["LOS JARDINES", "CAÑAVERAL"].includes(proyecto);

  return (
    <div className="min-h-screen bg-[#e8eef2] relative font-sans text-slate-800 overflow-hidden selection:bg-indigo-200">
      
      {/* BACKGROUND ORBS (GLASSMORPHISM EFFECT) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
      <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[30rem] h-[30rem] bg-cyan-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-30"></div>

      {/* Marca de Agua Lateral */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-16 items-center justify-center z-0">
        <div className="transform -rotate-90 whitespace-nowrap text-slate-400/30 font-black tracking-[0.4em] text-2xl select-none">
          CELINA PREMIUM
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto py-8 px-4 sm:px-8 lg:pl-20 relative z-10">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          
          {/* Espaciador invisible para mantener el título centrado */}
          <div className="hidden md:block w-32">
          </div>

          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 drop-shadow-sm uppercase">
              Cotizador
            </h1>
            <p className="text-slate-500 text-sm md:text-base mt-2 font-medium tracking-wide">Plataforma Inteligente de Cierres | Diseñado por Oscar Saravia®</p>
          </div>

          {/* Espaciador invisible derecho para mantener el título centrado */}
          <div className="hidden md:block w-32">
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* --- PANEL IZQUIERDO: FORMULARIO GLASS --- */}
          <div className="lg:col-span-5 bg-white/60 backdrop-blur-2xl border border-white/50 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden sticky top-6">
            <div className="bg-gradient-to-r from-indigo-900/90 to-slate-900/90 backdrop-blur-md p-5 text-white flex items-center gap-3 border-b border-white/10">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <FileText className="w-4 h-4 text-indigo-200" />
              </div>
              <h2 className="text-lg font-semibold tracking-wide">Datos de Inversión</h2>
            </div>
            
            <div className="p-6 sm:p-7">
              <form onSubmit={calcular} className="space-y-5">
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Proyecto
                  </label>
                  <select 
                    value={proyecto}
                    onChange={e => setProyecto(e.target.value)} 
                    className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl p-3.5 outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-400/50 transition-all font-bold text-slate-800 shadow-sm" 
                  >
                    <option value="MUYURINA">MUYURINA</option>
                    <option value="SANTA FE">SANTA FE</option>
                    <option value="EL RENACER">EL RENACER</option>
                    <option value="LOS JARDINES">LOS JARDINES</option>
                    <option value="CAÑAVERAL">CAÑAVERAL</option>
                    <option value="OTRO">OTRO...</option>
                  </select>
                  {proyecto === "OTRO" && (
                    <input 
                      type="text" value={proyectoPersonalizado} onChange={e => setProyectoPersonalizado(e.target.value)} 
                      className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl p-3.5 outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-400/50 transition-all font-medium text-slate-800 mt-2 shadow-sm" 
                      placeholder="Escribe el nombre del proyecto"
                    />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2 text-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">UV</label>
                    <input type="text" value={uv} onChange={e => setUv(e.target.value)} placeholder="Ej. 49" className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl p-3 outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-400/50 transition-all text-center font-bold text-slate-700 shadow-sm" />
                  </div>
                  <div className="space-y-2 text-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MZN</label>
                    <input type="text" value={mzn} onChange={e => setMzn(e.target.value)} placeholder="Ej. 6" className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl p-3 outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-400/50 transition-all text-center font-bold text-slate-700 shadow-sm" />
                  </div>
                  <div className="space-y-2 text-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LOTE</label>
                    <input type="text" value={lote} onChange={e => setLote(e.target.value)} placeholder="Ej. 9" className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl p-3 outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-400/50 transition-all text-center font-bold text-slate-700 shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Map className="w-3.5 h-3.5 text-indigo-500" /> Superficie (m²)
                    </label>
                    <input type="number" required value={superficie} onChange={e => setSuperficie(e.target.value)} placeholder="Ej. 240" className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl p-3.5 outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-400/50 transition-all font-bold text-slate-700 shadow-sm" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Precio / m²
                    </label>
                    <input type="number" required value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Ej. 145" className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl p-3.5 outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-400/50 transition-all font-bold text-slate-700 shadow-sm" />
                  </div>
                </div>

                {/* Panel Glass para Descuentos */}
                <div className="bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl p-4 rounded-2xl border border-white/80 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl -z-10"></div>
                  
                  <div className="text-[10px] font-black text-emerald-700/80 uppercase tracking-widest flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" /> Descuentos Especiales
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {showDescPorcentaje && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">A Contado (%)</label>
                          <input type="number" step="0.01" value={descuentoContado} onChange={e=>setDescuentoContado(e.target.value)} className="w-full bg-white/60 border border-white/60 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-bold text-slate-700 text-sm shadow-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">A Crédito (%)</label>
                          <input type="number" step="0.01" value={descuentoCredito} onChange={e=>setDescuentoCredito(e.target.value)} className="w-full bg-white/60 border border-white/60 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-bold text-slate-700 text-sm shadow-sm" />
                        </div>
                      </>
                    )}
                    {showDescM2 && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Desc. x m² ($us)</label>
                        <input type="number" step="0.01" value={descuentoM2} onChange={e=>setDescuentoM2(e.target.value)} className="w-full bg-white/60 border border-white/60 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-bold text-slate-700 text-sm shadow-sm" />
                        {(proyecto === "LOS JARDINES" || proyecto === "CAÑAVERAL") && <p className="text-[9px] text-emerald-600/80 font-bold mt-1">Tope $500 en sistema</p>}
                      </div>
                    )}
                    {showDescContadoM2 && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Contado x m² ($us)</label>
                        <input type="number" step="0.01" min="0" value={descuentoContadoM2} onChange={e=>setDescuentoContadoM2(e.target.value)} placeholder="Ej. 2" className="w-full bg-white/60 border border-white/60 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-bold text-slate-700 text-sm shadow-sm" />
                        <p className="text-[9px] text-emerald-600/80 font-bold mt-1">Sin límite</p>
                      </div>
                    )}
                    {showBonoInicial && proyecto === "OTRO" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Bono Inicial ($us)</label>
                        <input type="number" step="0.01" max="500" value={descuentoInicial} onChange={e=>{
                          let v = Number(e.target.value);
                          setDescuentoInicial(v > 500 ? 500 : v);
                        }} className="w-full bg-white/60 border border-white/60 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all font-bold text-slate-700 text-sm shadow-sm" />
                        <p className="text-[9px] text-emerald-600/80 font-bold mt-1">Máx. permitido $500</p>
                      </div>
                    )}
                  </div>
                  {showBonoInicial && (proyecto === "LOS JARDINES" || proyecto === "CAÑAVERAL") && (
                    <div className="pt-2 border-t border-white/40">
                      <label className="flex items-center gap-2.5 cursor-pointer bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-white/60 hover:bg-white/70 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={aplicarBonoInicial} 
                          onChange={e => setAplicarBonoInicial(e.target.checked)} 
                          className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500/50"
                        />
                        <span className="text-[11px] font-bold text-slate-700 leading-tight uppercase tracking-wider">Aplicar Bono Inicial Doble</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-4 mt-2">
                  <div className="col-span-8 bg-indigo-50/40 backdrop-blur-sm p-3.5 rounded-2xl border border-indigo-100/50 grid grid-cols-2 gap-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-indigo-800/70 uppercase tracking-widest flex items-center gap-1.5">
                        <Percent className="w-3 h-3" /> Inicial (%)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''}
                        onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} 
                        placeholder={modoInicial === 'monto' ? 'Auto' : 'Ej. 1.5'}
                        className="w-full bg-white/80 border border-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all font-bold text-slate-700 text-sm shadow-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-indigo-800/70 uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3" /> Monto ($us)
                      </label>
                      <input 
                        type="number" step="0.01" 
                        value={modoInicial === 'monto' ? inicialMonto : ''}
                        onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} 
                        placeholder={modoInicial === 'porcentaje' ? 'Auto' : 'Ej. 500'}
                        className="w-full bg-white/80 border border-white rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all font-black text-indigo-700 text-sm shadow-sm" 
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-4 space-y-2 mt-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-indigo-500" /> Plazo
                    </label>
                    <div className="relative">
                      <select 
                        required 
                        value={años} 
                        onChange={e => setAños(e.target.value)} 
                        className="w-full bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl p-3 outline-none focus:bg-white/80 focus:ring-2 focus:ring-indigo-400/50 transition-all font-bold text-slate-700 shadow-sm appearance-none pr-8 cursor-pointer"
                      >
                        <option value="" disabled hidden>Selec.</option>
                        {[...Array(14)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-500/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-[0.98] border border-white/10"
                >
                  Generar Cotización <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* --- PANEL DERECHO: RESULTADOS GLASS --- */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {!resultado ? (
              <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 p-8 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
                <div className="bg-white/50 p-6 rounded-full mb-6 shadow-inner border border-white/60">
                  <Calculator className="w-12 h-12 text-indigo-300/80" />
                </div>
                <h3 className="text-2xl font-light text-slate-600 tracking-wide">Plataforma Lista</h3>
                <p className="text-sm mt-3 max-w-sm text-slate-500 font-medium leading-relaxed">Ingresa los datos del lote en el panel para calcular y visualizar instantáneamente el plan de pagos.</p>
              </div>
            ) : (
              <>
                <div className="bg-white/70 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] border border-white/60 rounded-[2rem] p-6 sm:p-9 animate-in slide-in-from-bottom-8 duration-700 ease-out relative overflow-hidden">
                  
                  {/* Resplandores internos de la tarjeta */}
                  <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-emerald-300/20 rounded-full filter blur-[80px] pointer-events-none"></div>
                  <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-300/20 rounded-full filter blur-[80px] pointer-events-none"></div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-slate-200/50 pb-5 gap-4 relative z-10">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5 tracking-tight">
                      <div className="bg-emerald-100 p-1.5 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      Propuesta Financiera
                    </h2>
                    <span className="bg-emerald-500 border border-emerald-400 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-500/20">Cotización Aprobada</span>
                  </div>
                  
                  <div className="relative z-10">
                    {/* Fila: Proyecto y Lote (Estilo Ticket) */}
                    {(resultado.proyecto || resultado.uv || resultado.mzn || resultado.lote) && (
                      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-md p-3 pl-4 rounded-2xl border border-white shadow-sm">
                        <div className="flex items-center gap-3.5">
                          <div className="bg-indigo-100 p-3 rounded-xl">
                            <MapPin className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest mb-0.5">Proyecto</div>
                            <div className="text-slate-800 font-black text-lg uppercase leading-tight tracking-wide">{resultado.proyecto || 'S/N'}</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="text-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UV</div>
                            <div className="text-slate-700 font-black text-base">{resultado.uv || '-'}</div>
                          </div>
                          <div className="text-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MZN</div>
                            <div className="text-slate-700 font-black text-base">{resultado.mzn || '-'}</div>
                          </div>
                          <div className="text-center px-4 py-2 bg-slate-800 rounded-xl shadow-md shadow-slate-800/20">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LOTE</div>
                            <div className="text-white font-black text-base">{resultado.lote || '-'}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fila: Precio Contado Glass */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 p-6 rounded-[1.5rem] border border-emerald-100/60 relative mb-5 shadow-sm">
                      <span className="text-emerald-800/60 text-[11px] font-black uppercase tracking-widest">Precio de Lista Original</span>
                      <div className="flex items-end gap-3 mt-1.5">
                        <div className="text-4xl font-black text-slate-800 tracking-tight">$ {resultado.valorOriginal}</div>
                      </div>
                      <div className="text-sm font-bold text-slate-400 mt-1">Bs. {resultado.valorOriginalBs}</div>
                      
                      {resultado.ahorroContado !== "0.00" && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-emerald-700 px-4 py-2 rounded-xl text-xs font-black border border-emerald-100 shadow-sm uppercase tracking-wide">
                          <Tag className="w-4 h-4" /> Pago al Contado: $ {resultado.valorContado}
                        </div>
                      )}
                    </div>

                    {/* Fila: Crédito Directo y Cuota Inicial */}
                    <div className="grid sm:grid-cols-2 gap-5 mb-5">
                      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[1.5rem] border border-white shadow-sm">
                        <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Total a Financiar</span>
                        <div className="flex items-end gap-2 mt-2">
                          <div className="text-3xl font-black text-indigo-900 tracking-tight">$ {resultado.valorCredito}</div>
                        </div>
                        {resultado.ahorroCredito !== "0.00" && (
                           <div className="mt-2.5 text-[10px] text-indigo-600 font-black bg-indigo-50/50 inline-block px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">
                             Ahorro Aplicado: $ {resultado.ahorroCredito}
                           </div>
                        )}
                      </div>

                      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[1.5rem] border border-white shadow-sm">
                        <span className="text-slate-500 text-[11px] font-black uppercase tracking-widest">Cuota Inicial</span>
                        <div className="text-3xl font-black text-indigo-900 tracking-tight mt-2">$ {resultado.inicial}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">Bs. {resultado.inicialBs}</div>
                      </div>
                    </div>

                    {/* Fila: Cuota Mensual Ancha */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-7 rounded-[1.5rem] border border-indigo-500 mb-8 shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-full bg-white/10 skew-x-12 transform translate-x-10 pointer-events-none"></div>
                      <span className="text-blue-200 text-[11px] font-black uppercase tracking-widest relative z-10">
                        Cuota Mensual ({resultado.plazo} Años)
                      </span>
                      <div className="flex items-baseline gap-3 mt-2 flex-wrap relative z-10">
                        <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter drop-shadow-md">$ {resultado.mensual}</div>
                        <div className="text-xl sm:text-2xl font-bold text-indigo-200">Bs. {resultado.mensualBs}</div>
                      </div>
                      <div className="text-[11px] text-indigo-200/80 mt-4 font-bold tracking-wide relative z-10">
                        Desglose: Amort. ${resultado.pagoAmortizacion} • Seguro ${resultado.seguro} • CBDI ${resultado.cbdi}
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="mt-2">
                      <button
                        onClick={enviarWhatsApp}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/30 active:scale-[0.98] border border-[#25D366]/50 text-lg uppercase tracking-wider"
                      >
                        <Send className="w-6 h-6" /> Enviar por WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
