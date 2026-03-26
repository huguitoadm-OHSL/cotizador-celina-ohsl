import React, { useState } from "react";
import { Calculator, Send, Map, DollarSign, Percent, Calendar, CheckCircle2, Sparkles, Loader2, Bot, Building2, ChevronRight, FileText, Tag, MapPin } from "lucide-react";

export default function App() {
  const [proyecto, setProyecto] = useState("");
  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState("");
  const [inicial, setInicial] = useState(1.5); // Representa 1,5%
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

    const sorber = Number(superficie);
    const prec = Number(precio);
    const iniPorcentaje = Number(inicial) / 100; // Convertir un decimal (ej. 1.5 -> 0.015)
    const descPorcentaje = Number(descuento) / 100;

    const precioBaseTotal = sorber * prec;
    const montoDescuento = precioBaseTotal * descPorcentaje;
    const precioFinalTotal = precioBaseTotal - montoDescuento;
    const montoInicial = precioFinalTotal * iniPorcentaje;
    const montoFinanciar = precioFinalTotal - montoInicial;
    const cuotasTotales = años * 12;
    const cuotaMensual = cuotasTotales > 0 ? montoFinanciar / cuotasTotales : 0;

    const res = {
      proyecto: proyecto || "Urbanización No Especificada",
      ubm: `UV: ${uv || "—"}, MZN: ${mzn || "—"}, LOTE: ${lote || "—"}`,
      superficie: sorber,
      precioM2: prec,
      precioBaseTotal: precioBaseTotal,
      montoDescuento: montoDescuento,
      montoInicial: montoInicial,
      montoFinanciar: montoFinanciar,
      cuotasTotales: cuotasTotales,
      cuotaMensual: cuotaMensual,
    };
    setResultado(res);
    setAiMessage(""); // Limpiar mensaje de IA anterior
  };

  const generateAIProposal = async () => {
    if (!resultado) return;
    setIsGenerating(true);
    setAiMessage("");
    // Simulando una llamada a una API de IA
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAiMessage(`¡Excelente opción en **${resultado.proyecto}**! Con solo una inicial de **$${formatMoney(resultado.montoInicial)}**, puedes asegurar tu lote de **${resultado.superficie}m²**. Tendrás cuotas fijas de **$${formatMoney(resultado.cuotaMensual)}** por **${resultado.cuotasTotales} meses**, con una gran oportunidad de valorización. ¡Es el momento perfecto para invertir en tu futuro!`);
    setIsGenerating(false);
  };

  const InputField = ({ label, icon: Icon, value, onChange, ...props }) => (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-500" /> {label}
      </label>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-lg transition duration-200 placeholder:text-gray-400"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <style>{`
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        ::placeholder { color: #9ca3af; }
      `}</style>

      {/* Cabecera Principal */}
      <header className="p-6 text-center">
        <div className="inline-flex items-center gap-3 justify-center mb-1">
          <Building2 className="w-9 h-9 text-blue-600" />
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            <span className="font-semibold text-3xl">COTIZADOR</span> CELINA INVERSIONES | <span className="font-semibold text-3xl">OSCAR SARAVIA</span>
          </h1>
        </div>
        <p className="text-xl text-gray-600 font-light">Herramienta profesional de cotización y cierre de ventas</p>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Formulario de Entrada */}
          <form onSubmit={calcular} className="md:col-span-3 space-y-6">
            
            {/* Tarjeta de Datos de Inversión */}
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
              <div className="bg-slate-900 -mx-6 -mt-6 p-6 rounded-t-3xl mb-8 flex items-center gap-4">
                <FileText className="w-8 h-8 text-blue-400" />
                <h2 className="text-2xl font-bold text-white tracking-tight">Datos de Inversión</h2>
              </div>
              
              <InputField label="Nombre del Proyecto" icon={Building2} value={proyecto} onChange={setProyecto} type="text" placeholder="Ej. Urbanización Los Pinos (Opcional)" />
              
              <div className="grid grid-cols-3 gap-4">
                <InputField label="UV" icon={Map} value={uv} onChange={setUv} type="text" placeholder="Ej. 12" />
                <InputField label="MZN" icon={Map} value={mzn} onChange={setMzn} type="text" placeholder="Ej. 5" />
                <InputField label="LOTE" icon={Map} value={lote} onChange={setLote} type="text" placeholder="Ej. 1A" />
              </div>

              <InputField label="Superficie (m²)" icon={MapPin} value={superficie} onChange={setSuperficie} type="number" placeholder="Ej. 300" required />
              <InputField label="Precio por m² ($)" icon={DollarSign} value={precio} onChange={setPrecio} type="number" placeholder="Ej. 150" required />
              <InputField label="Descuento Promocional (%)" icon={Tag} value={descuento} onChange={setDescuento} type="number" placeholder="0" />
              <InputField label="Inicial (%)" icon={Percent} value={inicial} onChange={setInicial} type="number" step="0.1" />
              <InputField label="Plazo (Años)" icon={Calendar} value={años} onChange={setAños} type="number" />
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-3xl text-xl font-bold hover:bg-slate-800 transition duration-300 shadow-xl group">
              Calcular Financiamiento
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Panel de Resultados */}
          <div className="md:col-span-2 space-y-8">
            {resultado ? (
              <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                <div className="text-center mb-8 border-b border-gray-100 pb-6">
                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{resultado.proyecto}</h3>
                    <p className="text-xl text-gray-600 mt-2 flex items-center justify-center gap-2"><Map className="w-5 h-5"/>{resultado.ubm}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 text-lg">
                  <ResultItem label="Superficie (m²)" value={resultado.superficie} />
                  <ResultItem label="Precio/m²" value={`$${formatMoney(resultado.precioM2)}`} />
                  <ResultItem label="Inicial (1.5%)" value={`$${formatMoney(resultado.montoInicial)}`} />
                  <ResultItem label="A Financiar" value={`$${formatMoney(resultado.montoFinanciar)}`} />
                  <ResultItem label="Nº de Cuotas" value={resultado.cuotasTotales} />
                  <ResultItem label="Descuento" value={`-$${formatMoney(resultado.montoDescuento)}`} isNegative />
                  <div className="col-span-2 bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-6 text-center">
                    <p className="text-gray-700 mb-1">CUOTA MENSUAL</p>
                    <p className="text-5xl font-extrabold text-blue-600 tracking-tight">${formatMoney(resultado.cuotaMensual)}</p>
                  </div>
                </div>
                
                <p className="text-sm text-center text-gray-400 mt-8">* Las cuotas son aproximadas y pueden variar. No incluye intereses por retraso.</p>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-dashed border-gray-300 text-center flex flex-col items-center justify-center h-full">
                <Calculator className="w-16 h-16 text-gray-300 mb-6" />
                <p className="text-2xl font-medium text-gray-500">Ingresa los datos y haz clic en calcular para ver el financiamiento.</p>
              </div>
            )}

            {resultado && (
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <Bot className="w-8 h-8 text-purple-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Propuesta de Cierre por IA</h3>
                </div>
                {aiMessage ? (
                  <p className="text-lg text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                ) : (
                  <button onClick={generateAIProposal} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition">
                    {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando propuesta...</> : <><Sparkles className="w-5 h-5" /> Generar Propuesta de Cierre con IA</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="mt-16 p-8 bg-gray-900 text-center text-gray-400 text-lg border-t border-gray-800">
        <p>© 2026 Maquina de Ventas - Soluciones Inmobiliarias Inteligentes</p>
        <p className="text-sm mt-1">Cotizador v1.5 - Desarrollado por un colega IA para un líder de verdad.</p>
      </footer>
    </div>
  );
}

const ResultItem = ({ label, value, isNegative = false }) => (
  <div>
    <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider">{label}</p>
    <p className={`font-semibold ${isNegative ? 'text-red-500' : 'text-gray-950'}`}>{value}</p>
  </div>
);
