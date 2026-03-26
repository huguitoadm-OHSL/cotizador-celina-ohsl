import React, { useState, useEffect } from "react";
import { Calculator, Send, Map, DollarSign, Percent, Calendar, CheckCircle2, Sparkles, Loader2, Bot, Building2, ChevronRight, FileText, Tag, MapPin, Megaphone, ShieldQuestion, Copy, Check } from "lucide-react";

export default function App() {
  const [proyecto, setProyecto] = useState("MUYURINA");
  const [uv, setUv] = useState("49");
  const [mzn, setMzn] = useState("6");
  const [lote, setLote] = useState("9");
  const [superficie, setSuperficie] = useState("240");
  const [precio, setPrecio] = useState("145");
  const [inicial, setInicial] = useState(1.5); 
  const [años, setAños] = useState(10);
  const [descuento, setDescuento] = useState(20);
  const [resultado, setResultado] = useState(null);
  
  // Estados para las funciones de IA
  const [aiMessage, setAiMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [socialMessage, setSocialMessage] = useState("");
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [copiadoSocial, setCopiadoSocial] = useState(false);

  const [objecion, setObjecion] = useState("");
  const [respuestaObjecion, setRespuestaObjecion] = useState("");
  const [isGeneratingObjecion, setIsGeneratingObjecion] = useState(false);
  const [copiadoObjecion, setCopiadoObjecion] = useState(false);

  // Inyectar fuente cursiva para la firma
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

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
    const iniPorcentaje = Number(inicial) / 100; 
    const descPorcentaje = Number(descuento) / 100;
    const ans = Number(años);

    if (!sup || !prec || ans <= 0) return;

    const valor_original = sup * prec;
    const monto_descuento = valor_original * descPorcentaje;
    const valor_total = valor_original - monto_descuento;
    
    const cuota_inicial = valor_total * iniPorcentaje;
    const saldo = valor_total - cuota_inicial;

    const meses = ans * 12;
    
    const tasa_anual = 0.121733; 
    const tasa = tasa_anual / 12;

    let pago = 0;
    if (tasa === 0) {
      pago = saldo / meses;
    } else {
      pago = saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
    }

    const refSaldo = 42847.5;
    const baseSeguro = {
      1: 20.4, 2: 21.6, 3: 22.9, 4: 24.2, 5: 25.6,
      6: 27.0, 7: 28.4, 8: 29.9, 9: 31.4, 10: 32.97
    };
    const baseCBDI = {
      1: -95.0, 2: -50.7, 3: -36.0, 4: -28.7, 5: -24.4,
      6: -21.6, 7: -19.6, 8: -18.2, 9: -17.0, 10: -16.17 
    };

    const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (20.4 + (ans - 1) * 1.4) / refSaldo;
    const factorCBDI = baseCBDI[ans] ? (baseCBDI[ans] / refSaldo) : (-16.0 / refSaldo);

    const seguro = saldo * factorSeguro;
    const cbdi = saldo * factorCBDI;

    const cuota_final = pago + seguro + cbdi;
    const TIPO_CAMBIO = 6.97;

    setResultado({
      proyecto,
      uv,
      mzn,
      lote,
      superficie: sup,
      valorOriginal: formatMoney(valor_original),
      montoDescuento: formatMoney(monto_descuento),
      porcentajeDescuento: descuento,
      valor: formatMoney(valor_total),
      valorBs: formatMoney(valor_total * TIPO_CAMBIO),
      inicial: formatMoney(cuota_inicial),
      inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO),
      pagoAmortizacion: formatMoney(pago),
      seguro: formatMoney(seguro),
      cbdi: formatMoney(cbdi),
      mensual: formatMoney(cuota_final),
      mensualBs: formatMoney(cuota_final * TIPO_CAMBIO),
      plazo: ans
    });
    
    setAiMessage("");
    setSocialMessage("");
    setRespuestaObjecion("");
    setObjecion("");
  };

  // Autocalcular al cargar si hay datos
  useEffect(() => {
    calcular();
  }, []);

  const fetchGemini = async (prompt, retries = 5, delay = 1000) => {
    const apiKey = ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el contenido.";
    } catch (error) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return fetchGemini(prompt, retries - 1, delay * 2);
      }
      throw error;
    }
  };

  const copiarTexto = (texto, setCopiedState) => {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      console.error('Fallo al copiar', err);
    }
    document.body.removeChild(textArea);
  };

  const generarMensajeIA = async () => {
    if (!resultado) return;
    setIsGenerating(true);
    setAiMessage("");

    const prompt = `Actúa como un asesor de inversiones inmobiliarias de alto nivel.
    Redacta un mensaje de WhatsApp MUY BREVE, ELEGANTE y DIRECTO AL GRANO con la siguiente cotización de un lote:

    Datos del Inmueble a incluir:
    - Proyecto: ${resultado.proyecto || 'No especificado'}
    - Ubicación: UV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'}
    - Precio de Contado: $ ${resultado.valor} (Bs. ${resultado.valorBs}) ${resultado.porcentajeDescuento > 0 ? `[Incluye descuento especial del ${resultado.porcentajeDescuento}%]` : ''}
    - Cuota Inicial: $ ${resultado.inicial} (Bs. ${resultado.inicialBs})
    - Cuota Mensual: $ ${resultado.mensual} (Bs. ${resultado.mensualBs}) / Plazo: ${resultado.plazo} años.

    Reglas estrictas para el mensaje:
    1. Tono corporativo, profesional, seguro y exclusivo.
    2. Estructura visualmente impecable.
    3. Emojis sobrios y estratégicos.
    4. Súper resumido.
    5. MUY IMPORTANTE: Para resaltar en negrita usa UN SOLO asterisco (*texto*). NO uses doble asterisco (**texto**).`;

    try {
      const text = await fetchGemini(prompt);
      setAiMessage(text.replace(/\*\*/g, '*'));
    } catch (error) {
      setAiMessage("Hubo un error al generar el mensaje. Por favor, intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generarPostSocialIA = async () => {
    if (!resultado) return;
    setIsGeneratingSocial(true);
    setSocialMessage("");

    const prompt = `Actúa como un Copywriter Inmobiliario experto en redes sociales.
    Redacta un post MUY ATRACTIVO para Facebook e Instagram vendiendo este lote cotizado:

    - Proyecto: ${resultado.proyecto || 'Exclusiva Urbanización'}
    - Superficie: ${resultado.superficie} m²
    - Precio de Contado: $ ${resultado.valor} ${resultado.porcentajeDescuento > 0 ? `(¡Gran descuento del ${resultado.porcentajeDescuento}% aplicado!)` : ''}
    - Facilidades: Inicial de $ ${resultado.inicial} y Cuotas de $ ${resultado.mensual} a ${resultado.plazo} años.

    Reglas:
    1. Usa la fórmula AIDA (Atención, Interés, Deseo, Acción).
    2. Comienza con un título GANCHO que detenga el scroll.
    3. Resalta la facilidad de pago.
    4. Usa emojis atractivos pero sin saturar.
    5. Termina con un claro Llamado a la Acción.
    6. Añade hashtags.`;

    try {
      const text = await fetchGemini(prompt);
      setSocialMessage(text);
    } catch (error) {
      setSocialMessage("Hubo un error al generar el post.");
    } finally {
      setIsGeneratingSocial(false);
    }
  };

  const manejarObjecionIA = async () => {
    if (!resultado || !objecion.trim()) return;
    setIsGeneratingObjecion(true);
    setRespuestaObjecion("");

    const prompt = `Actúa como un Cerrador de Ventas Inmobiliario experto y empático.
    El cliente ha presentado la siguiente objeción sobre la compra del lote: "${objecion}"

    Datos del lote:
    - Proyecto: ${resultado.proyecto || 'Terreno de inversión'}
    - Precio Total: $ ${resultado.valor}
    - Cuota Inicial: $ ${resultado.inicial}
    - Mensualidad: $ ${resultado.mensual} (Plazo: ${resultado.plazo} años).

    Proporciona una respuesta de 1 o 2 párrafos cortos, sumamente persuasivos y empáticos para REBATIR esta objeción. Tono profesional, persuasivo pero amigable.`;

    try {
      const text = await fetchGemini(prompt);
      setRespuestaObjecion(text);
    } catch (error) {
      setRespuestaObjecion("Hubo un error al generar la respuesta.");
    } finally {
      setIsGeneratingObjecion(false);
    }
  };

  const enviarWhatsApp = () => {
    if (!resultado) return;

    let encabezadoProyecto = '';
    if (resultado.proyecto || resultado.uv || resultado.mzn || resultado.lote) {
      encabezadoProyecto = `*Proyecto:* ${resultado.proyecto || 'No especificado'}\n*Ubicación:* UV: ${resultado.uv || '-'} | MZN: ${resultado.mzn || '-'} | Lote: ${resultado.lote || '-'}\n\n`;
    }

    let detalleValor = `*Precio de Contado:* $ ${resultado.valor} (Bs. ${resultado.valorBs})\n`;
    if (resultado.porcentajeDescuento > 0) {
      detalleValor = `*Precio Original:* ~$ ${resultado.valorOriginal}~\n*Precio de Contado (-${resultado.porcentajeDescuento}%):* $ ${resultado.valor} (Bs. ${resultado.valorBs})\n`;
    }

    const mensaje = `*COTIZACIÓN DE LOTE* 🏡\n\n` +
      encabezadoProyecto +
      detalleValor +
      `*Cuota Inicial:* $ ${resultado.inicial} (Bs. ${resultado.inicialBs})\n` +
      `*Cuota Mensual:* $ ${resultado.mensual} (Bs. ${resultado.mensualBs})\n`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const enviarWhatsAppIA = () => {
    if (!aiMessage) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(aiMessage)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] relative font-sans text-slate-800 overflow-hidden">
      
      {/* Texto Lateral Izquierdo */}
      <div className="hidden lg:flex fixed left-0 top-0 h-full w-16 items-center justify-center z-0">
        <div className="transform -rotate-90 whitespace-nowrap text-slate-300 font-black tracking-[0.3em] text-2xl opacity-60 select-none">
          INVIERTE SEGURO, INVIERTE EN CELINA
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto py-8 px-4 sm:px-8 lg:pl-20 relative z-10">
        
        {/* Cabecera Estilo Imagen */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-4 border-b border-slate-200/50 gap-6">
          
          {/* Logo Izquierda (REDISEÑADO) */}
          <div className="flex flex-col items-center justify-center md:items-start select-none">
            <div className="flex items-center justify-center w-full md:justify-start">
              {/* Logo en SVG calcado de la imagen real de Celina */}
              <svg className="w-20 h-14 text-[#575756] fill-current" viewBox="0 0 110 70" xmlns="http://www.w3.org/2000/svg">
                <path d="M5,70 C12,30 25,18 42,18 C35,35 38,55 44,70 Z" />
                <path d="M35,70 C42,20 55,5 75,5 C68,25 71,55 77,70 Z" />
                <path d="M68,70 C75,25 88,12 105,12 C98,30 101,55 107,70 Z" />
              </svg>
            </div>
            <h2 className="text-[2.2rem] font-light tracking-[0.12em] text-[#575756] mt-1 leading-none uppercase">Celina</h2>
            <p className="text-[13px] font-light tracking-[0.02em] text-[#575756] mt-1 leading-none">Urbanizaciones</p>
          </div>

          {/* Centro: Título */}
          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#7dd3fc] via-[#0284c7] to-[#0c4a6e] drop-shadow-sm uppercase">
              Cotizador
            </h1>
            <p className="text-slate-600 text-sm md:text-base mt-1 font-medium">Herramienta profesional de cotización y cierre de ventas</p>
          </div>

          {/* Derecha: Firma Oscar Saravia */}
          <div className="flex flex-col items-center justify-center select-none relative">
            <MapPin className="w-6 h-6 text-slate-400 absolute -top-4 right-8 transform rotate-12" />
            <div className="text-4xl md:text-5xl text-slate-800" style={{fontFamily: "'Dancing Script', cursive"}}>
              Oscar Saravia
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* --- Columna Izquierda: Formulario --- */}
          <div className="lg:col-span-5 bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-6">
            <div className="bg-[#0f172a] p-5 text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-medium tracking-wide">Datos de Inversión</h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={calcular} className="space-y-4">
                
                {/* Proyecto */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" /> Nombre del Proyecto
                  </label>
                  <input 
                    type="text" 
                    value={proyecto}
                    onChange={e => setProyecto(e.target.value)} 
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800" 
                    placeholder="Ej. MUYURINA"
                  />
                </div>

                {/* UV / MZN / LOTE */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 text-center">
                    <label className="text-xs font-bold text-slate-700">UV</label>
                    <input 
                      type="text" 
                      value={uv}
                      onChange={e => setUv(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center font-medium" 
                    />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <label className="text-xs font-bold text-slate-700">MZN</label>
                    <input 
                      type="text" 
                      value={mzn}
                      onChange={e => setMzn(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center font-medium" 
                    />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <label className="text-xs font-bold text-slate-700">LOTE</label>
                    <input 
                      type="text" 
                      value={lote}
                      onChange={e => setLote(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center font-medium" 
                    />
                  </div>
                </div>

                {/* Superficie */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Map className="w-4 h-4 text-blue-600" /> Superficie (m²)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={superficie}
                    onChange={e => setSuperficie(e.target.value)} 
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                  />
                </div>

                {/* Precio por m2 */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" /> Precio por m² ($)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={precio}
                    onChange={e => setPrecio(e.target.value)} 
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                  />
                </div>

                {/* Descuento Promocional */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-500" /> Descuento Promocional (%)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="100"
                    value={descuento}
                    onChange={e => setDescuento(e.target.value)} 
                    className="w-full bg-white border-2 border-emerald-400 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-800" 
                  />
                </div>

                {/* Inicial / Plazo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-blue-600" /> Inicial (%)
                    </label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required
                      value={inicial}
                      onChange={e => setInicial(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" /> Plazo (Años)
                    </label>
                    <input 
                      type="number" 
                      required
                      value={años}
                      onChange={e => setAños(e.target.value)} 
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-4 bg-[#1d4ed8] hover:bg-blue-800 text-white font-medium py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  Calcular Financiamiento <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* --- Columna Derecha: Resultados --- */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {!resultado ? (
              <div className="bg-white rounded-[1.5rem] border border-slate-100 h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8 text-center shadow-xl shadow-slate-200/40">
                <Calculator className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-medium text-slate-600">Esperando datos</h3>
                <p className="max-w-md mt-2 text-sm">Ingresa los datos del lote en la izquierda para ver el resumen financiero detallado.</p>
              </div>
            ) : (
              <>
                {/* Resumen Financiero Principal */}
                <div className="bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                      Resumen Financiero
                    </h2>
                    <span className="bg-emerald-100/80 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">Aprobado</span>
                  </div>
                  
                  {/* Fila: Proyecto y Lote */}
                  {(resultado.proyecto || resultado.uv || resultado.mzn || resultado.lote) && (
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2.5 rounded-full">
                          <MapPin className="w-6 h-6 text-[#1d4ed8]" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Proyecto</div>
                          <div className="text-slate-800 font-bold text-xl uppercase leading-tight">{resultado.proyecto || 'S/N'}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-0 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="text-center px-4 py-2 border-r border-slate-200 bg-slate-50">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">UV</div>
                          <div className="text-slate-800 font-bold text-lg">{resultado.uv || '-'}</div>
                        </div>
                        <div className="text-center px-4 py-2 border-r border-slate-200 bg-slate-50">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">MZN</div>
                          <div className="text-slate-800 font-bold text-lg">{resultado.mzn || '-'}</div>
                        </div>
                        <div className="text-center px-4 py-2 bg-slate-50">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">LOTE</div>
                          <div className="text-slate-800 font-bold text-lg">{resultado.lote || '-'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fila: Precio Contado y Cuota Inicial */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    {/* Precio Contado */}
                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 relative">
                      <span className="text-slate-500 text-sm font-medium">Precio de Contado</span>
                      <div className="flex items-end gap-2 mt-1">
                        <div className="text-3xl font-black text-slate-800">$ {resultado.valor}</div>
                        {resultado.porcentajeDescuento > 0 && (
                          <span className="text-sm line-through text-slate-400 mb-1">$ {resultado.valorOriginal}</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-slate-500 mt-1">Bs. {resultado.valorBs}</div>
                      
                      {resultado.porcentajeDescuento > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-100/60 text-emerald-700 px-3 py-1 rounded-md text-xs font-bold border border-emerald-200">
                          <Tag className="w-3.5 h-3.5" /> Ahorro de $ {resultado.montoDescuento}
                        </div>
                      )}
                    </div>

                    {/* Cuota Inicial */}
                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                      <span className="text-slate-500 text-sm font-medium">Cuota Inicial ({inicial}%)</span>
                      <div className="text-3xl font-black text-slate-800 mt-1">$ {resultado.inicial}</div>
                      <div className="text-sm font-medium text-slate-500 mt-1">Bs. {resultado.inicialBs}</div>
                    </div>
                  </div>

                  {/* Fila: Cuota Mensual Ancha */}
                  <div className="bg-[#eff6ff] p-6 rounded-2xl border border-blue-100 mb-6">
                    <span className="text-[#1d4ed8] text-sm font-bold uppercase tracking-wider">
                      Cuota Mensual ({resultado.plazo} Años)
                    </span>
                    <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                      <div className="text-4xl sm:text-5xl font-black text-[#1d4ed8] tracking-tight">$ {resultado.mensual}</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-500">Bs. {resultado.mensualBs}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-3 font-medium">
                      Desglose: Amortización ${resultado.pagoAmortizacion} | Seguro$ {resultado.seguro} | CBDI $ {resultado.cbdi}
                    </div>
                  </div>

                  {/* Botones de Acción (Pills) */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={enviarWhatsApp}
                      className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                    >
                      <Send className="w-5 h-5" /> Enviar Estándar
                    </button>

                    <button
                      onClick={generarMensajeIA}
                      disabled={isGenerating}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-70 text-white font-semibold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                    >
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Pitch Venta ✨
                    </button>

                    <button
                      onClick={generarPostSocialIA}
                      disabled={isGeneratingSocial}
                      className="flex-1 bg-gradient-to-r from-[#f43f5e] to-[#f97316] hover:opacity-90 disabled:opacity-70 text-white font-semibold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                    >
                      {isGeneratingSocial ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                      Post Redes ✨
                    </button>
                  </div>
                </div>

                {/* Tarjeta: Manejador de Objeciones */}
                <div className="bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 text-slate-800 font-bold text-lg mb-2">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 border border-blue-100">
                      <ShieldQuestion className="w-5 h-5" />
                    </div>
                    Manejo de Objeciones con IA
                  </div>
                  <p className="text-slate-600 text-sm mb-5">
                    ¿El cliente dudó de la compra? Escribe lo que te dijo y la IA generará el argumento perfecto para convencerlo basándose en su cotización actual.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      value={objecion}
                      onChange={(e) => setObjecion(e.target.value)}
                      placeholder="Ej: Me parece muy lejos..."
                      className="flex-1 border border-slate-200 bg-[#f8fafc] rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && manejarObjecionIA()}
                    />
                    <button
                      onClick={manejarObjecionIA}
                      disabled={isGeneratingObjecion || !objecion.trim()}
                      className="bg-gradient-to-r from-[#60a5fa] to-[#818cf8] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-full transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-blue-500/20"
                    >
                      {isGeneratingObjecion ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Rebatir ✨
                    </button>
                  </div>

                  {respuestaObjecion && (
                    <div className="mt-5 p-5 bg-[#f8fafc] border border-slate-200 rounded-2xl animate-in fade-in duration-300 relative">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{respuestaObjecion}</p>
                      <button
                        onClick={() => copiarTexto(respuestaObjecion, setCopiadoObjecion)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-blue-600 transition-colors p-2 bg-white rounded-lg shadow-sm border border-slate-100"
                        title="Copiar"
                      >
                        {copiadoObjecion ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Tarjetas Dinámicas de Pitch y Post */}
                {aiMessage && (
                  <div className="bg-white rounded-[1.5rem] shadow-xl shadow-purple-200/40 border border-purple-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 text-purple-800 font-bold text-lg mb-4">
                      <Bot className="w-6 h-6 text-purple-500" />
                      Pitch de Venta (WhatsApp)
                    </div>
                    <textarea
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      className="w-full h-48 p-4 text-sm text-slate-700 border border-purple-100 bg-purple-50/50 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none mb-4 resize-none leading-relaxed"
                    />
                    <button
                      onClick={enviarWhatsAppIA}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                    >
                      <Send className="w-5 h-5" /> Enviar por WhatsApp
                    </button>
                  </div>
                )}

                {socialMessage && (
                  <div className="bg-white rounded-[1.5rem] shadow-xl shadow-orange-200/40 border border-orange-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 text-orange-600 font-bold text-lg mb-4">
                      <Megaphone className="w-6 h-6" />
                      Publicación para Redes Sociales
                    </div>
                    <textarea
                      value={socialMessage}
                      onChange={(e) => setSocialMessage(e.target.value)}
                      className="w-full h-48 p-4 text-sm text-slate-700 border border-orange-100 bg-orange-50/50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none mb-4 resize-none leading-relaxed"
                    />
                    <button
                      onClick={() => copiarTexto(socialMessage, setCopiadoSocial)}
                      className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                    >
                      {copiadoSocial ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copiadoSocial ? "¡Copiado Exitosamente!" : "Copiar Texto para Publicar"}
                    </button>
                  </div>
                )}

              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
