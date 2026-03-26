import React, { useState } from "react";
import { Calculator, Send, Map, DollarSign, Percent, Calendar, CheckCircle2, Sparkles, Loader2, Bot, Building2, ChevronRight, FileText, Tag, MapPin } from "lucide-react";

export default function App() {
  const [proyecto, setProyecto] = useState("");
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState("");
  const [inicial, setInicial] = useState(1.5); // Representa 1.5%
  const [años, setAños] = useState(10);
  const [descuento, setDescuento] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [aiMessage, setAiMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calcular = (e) => {
    e.preventDefault();
    
    const sup = Number(superficie);
    const prec = Number(precio);
    const iniPorcentaje = Number(inicial) / 100; // Convertir a decimal (ej. 1.5 -> 0.015)
    const descPorcentaje = Number(descuento) / 100;
    const ans = Number(años);

    if (!sup || !prec || ans <= 0) return;

    const valor_original = sup * prec;
    const monto_descuento = valor_original * descPorcentaje;
    const valor_total = valor_original - monto_descuento;
    
    const cuota_inicial = valor_total * iniPorcentaje;
    const saldo = valor_total - cuota_inicial;

    const meses = ans * 12;
    
    // Tasa corregida al 12.1733% anual según el nuevo Excel
    const tasa_anual = 0.121733; 
    const tasa = tasa_anual / 12;

    // Fórmula de amortización (Cuota Mensual Pura)
    let pago = 0;
    if (tasa === 0) {
      pago = saldo / meses;
    } else {
      pago = saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1);
    }

    // Factores exactos de Seguro y CBDI extraídos del NUEVO Excel (referenciados al Saldo base de 42,847.5)
    const refSaldo = 42847.5;
    const baseSeguro = {
      1: 20.4, 2: 21.6, 3: 22.9, 4: 24.2, 5: 25.6,
      6: 27.0, 7: 28.4, 8: 29.9, 9: 31.4, 10: 32.97
    };
    // El CBDI en el nuevo Excel actúa como un valor negativo para cuadrar la cuota final
    const baseCBDI = {
      1: -95.0, 2: -50.7, 3: -36.0, 4: -28.7, 5: -24.4,
      6: -21.6, 7: -19.6, 8: -18.2, 9: -17.0, 10: -16.17 
    };

    // Si el año está en la tabla, usamos el factor exacto, sino calculamos una extrapolación aproximada
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
  };

  const generarMensajeIA = async () => {
    if (!resultado) return;
    setIsGenerating(true);
    setAiMessage("");

    const apiKey = "";
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
    2. Estructura visualmente impecable (usa listas o viñetas cortas para los números).
    3. Emojis sobrios y estratégicos (ej. 📍, 💎, 📊, ✔️, 🤝). Nada excesivo ni infantil.
    4. Súper resumido: Un saludo cordial breve, los datos financieros claros y un llamado a la acción puntual (invitación a agendar visita al terreno o llamada).
    5. NO inventes datos adicionales ni escribas párrafos largos de introducción.
    6. MUY IMPORTANTE: Para resaltar en negrita usa UN SOLO asterisco (*texto*). NO uses doble asterisco (**texto**) ya que el formato es estrictamente para WhatsApp.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    const attemptFetch = async (retries = 5, delay = 1000) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el mensaje.";
      } catch (error) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, delay));
          return attemptFetch(retries - 1, delay * 2);
        }
        throw error;
      }
    };

    try {
      const text = await attemptFetch();
      // Reemplazar automáticamente cualquier doble asterisco por uno simple para WhatsApp
      const textoFormateado = text.replace(/\*\*/g, '*');
      setAiMessage(textoFormateado);
    } catch (error) {
      setAiMessage("Hubo un error al generar el mensaje. Por favor, intenta de nuevo.");
    } finally {
      setIsGenerating(false);
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
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3 tracking-tight flex-wrap">
            <Building2 className="w-10 h-10 text-blue-700" />
            Cotizador Celina Inversiones | Oscar Saravia
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Herramienta profesional de cotización y cierre de ventas</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Formulario (5 columnas) */}
          <div className="lg:col-span-5 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 p-6 text-white">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Datos de Inversión
              </h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={calcular} className="space-y-5">
                
                {/* Datos de Ubicación y Proyecto */}
                <div className="space-y-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" /> Nombre del Proyecto
                    </label>
                    <input 
                      type="text" 
                      value={proyecto}
                      onChange={e => setProyecto(e.target.value)} 
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all" 
                      placeholder="Ej. Urbanización Los Pinos (Opcional)"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 flex justify-center">UV</label>
                      <input 
                        type="text" 
                        value={uv}
                        onChange={e => setUv(e.target.value)} 
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-center" 
                        placeholder="Ej. 12"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 flex justify-center">MZN</label>
                      <input 
                        type="text" 
                        value={mzn}
                        onChange={e => setMzn(e.target.value)} 
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-center" 
                        placeholder="Ej. 5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 flex justify-center">LOTE</label>
                      <input 
                        type="text" 
                        value={lote}
                        onChange={e => setLote(e.target.value)} 
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-center" 
                        placeholder="Ej. 1A"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos Financieros */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Map className="w-4 h-4 text-blue-600" /> Superficie (m²)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={superficie}
                    onChange={e => setSuperficie(e.target.value)} 
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all" 
                    placeholder="Ej. 300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" /> Precio por m² ($)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={precio}
                    onChange={e => setPrecio(e.target.value)} 
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all" 
                    placeholder="Ej. 150"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" /> Descuento Promocional (%)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="100"
                    value={descuento}
                    onChange={e => setDescuento(e.target.value)} 
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all" 
                    placeholder="Ej. 5 (Opcional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
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
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all" 
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
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  Calcular Financiamiento <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* Columna Derecha: Resultados (7 columnas) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {!resultado ? (
              <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Calculator className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-medium text-slate-600">Panel de Resultados</h3>
                <p className="max-w-md mt-2 text-sm">Completa los datos de inversión en el formulario de la izquierda para visualizar el plan de pagos y generar propuestas comerciales automatizadas.</p>
              </div>
            ) : (
              <>
                {/* Tarjeta de Resumen Financiero */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                      Resumen Financiero
                    </h2>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Aprobado</span>
                  </div>
                  
                  {(resultado.proyecto || resultado.uv || resultado.mzn || resultado.lote) && (
                    <div className="mb-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg mt-0.5">
                          <MapPin className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Proyecto</div>
                          <div className="text-slate-800 font-semibold text-lg leading-tight">{resultado.proyecto || 'No especificado'}</div>
                        </div>
                      </div>
                      <div className="flex gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto justify-around">
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">UV</div>
                          <div className="text-slate-800 font-bold">{resultado.uv || '-'}</div>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">MZN</div>
                          <div className="text-slate-800 font-bold">{resultado.mzn || '-'}</div>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">LOTE</div>
                          <div className="text-slate-800 font-bold">{resultado.lote || '-'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 text-sm font-medium">Precio de Contado</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <div className="text-2xl font-bold text-slate-900">$ {resultado.valor}</div>
                        {resultado.porcentajeDescuento > 0 && (
                          <span className="text-sm line-through text-slate-400">$ {resultado.valorOriginal}</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-slate-500 mt-1">Bs. {resultado.valorBs}</div>
                      {resultado.porcentajeDescuento > 0 && (
                        <div className="text-xs font-semibold text-emerald-700 mt-2 bg-emerald-100/60 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <Tag className="w-3 h-3" /> Ahorro de $ {resultado.montoDescuento}
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 text-sm font-medium">Cuota Inicial ({inicial}%)</span>
                      <div className="text-2xl font-bold text-slate-900 mt-1">$ {resultado.inicial}</div>
                      <div className="text-sm font-medium text-slate-500 mt-1">Bs. {resultado.inicialBs}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                      <div>
                        <span className="text-blue-800 text-sm font-bold uppercase tracking-wider">Cuota Mensual ({resultado.plazo} años)</span>
                        <div className="flex items-end gap-3 mt-1">
                          <div className="text-4xl font-extrabold text-blue-600">$ {resultado.mensual}</div>
                          <div className="text-xl font-bold text-blue-800/60 mb-1">Bs. {resultado.mensualBs}</div>
                        </div>
                        <div className="text-xs text-blue-700/80 mt-2 font-medium">
                          Desglose: Amortización $ {resultado.pagoAmortizacion} | Seguro $ {resultado.seguro} | CBDI $ {resultado.cbdi}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={enviarWhatsApp}
                      className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/30"
                    >
                      <Send className="w-5 h-5" />
                      Enviar Estándar
                    </button>

                    <button
                      onClick={generarMensajeIA}
                      disabled={isGenerating}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                    >
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Generar Pitch IA ✨
                    </button>
                  </div>
                </div>

                {/* Tarjeta de Asistente IA */}
                {aiMessage && (
                  <div className="bg-white rounded-3xl shadow-xl shadow-purple-200/40 border border-purple-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 text-purple-800 font-bold text-lg">
                        <div className="bg-purple-100 p-2 rounded-xl">
                          <Bot className="w-6 h-6 text-purple-600" />
                        </div>
                        Propuesta del Asistente IA
                      </div>
                    </div>
                    
                    <textarea
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      className="w-full h-64 p-4 text-base text-slate-700 border border-purple-100 bg-purple-50/50 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none mb-4 resize-none leading-relaxed"
                    />
                    
                    <button
                      onClick={enviarWhatsAppIA}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                    >
                      <Send className="w-5 h-5" />
                      Enviar Propuesta Persuasiva
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
