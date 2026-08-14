import React, { useState, useEffect, useRef, useMemo } from "react";
import MapGL, { Source, Layer, GeolocateControl, NavigationControl, Popup } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import { Maximize, Minimize, MapPin, Filter, ChevronDown, Info, Ruler } from "lucide-react";
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE_SATELLITE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 17, 
      attribution: '&copy; Esri'
    }
  },
  layers: [{ id: 'satellite-layer', type: 'raster', source: 'esri-satellite', minzoom: 0, maxzoom: 22 }]
};

// Fórmula matemática para calcular las medidas de los lados del polígono
const calcularDistanciaYAngulo = (coord1, coord2) => {
  const R = 6371e3;
  const toRad = (x) => (x * Math.PI) / 180;
  const toDeg = (x) => (x * 180) / Math.PI;
  const lat1 = coord1[1], lon1 = coord1[0], lat2 = coord2[1], lon2 = coord2[0];
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  let bearing = toDeg(Math.atan2(y, x));
  let textAngle = bearing - 90;
  if (textAngle < -90 || textAngle > 90) textAngle += 180;
  return { distancia, textAngle, midLng: (lon1 + lon2) / 2, midLat: (lat1 + lat2) / 2 };
};

export default function MapaEspacial({ loteActivo, proyectoActivo, baseDeDatosLotes, isAdmin, onLoteSeleccionado }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapFilter, setMapFilter] = useState('TODOS'); 
  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoverEdges, setHoverEdges] = useState(null);
  const [uvLabels, setUvLabels] = useState(null);
  const mapRef = useRef(null);
  
  const geojsonPath = `/${proyectoActivo.toLowerCase().replace(/\s+/g, '_')}.geojson`;

  // CÁLCULO DE UVs CENTRALES
  useEffect(() => {
    fetch(geojsonPath)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        const uvMap = new globalThis.Map();
        data.features.forEach(f => {
          let uvRaw = f.properties.UV || f.properties.uv || f.properties.Layer || "";
          let uvLimpia = String(uvRaw).replace(/[^0-9]/g, '');
          if (!uvLimpia || uvLimpia === "0") return;

          let coords = [];
          if (f.geometry.type === 'Polygon') coords = f.geometry.coordinates[0];
          else if (f.geometry.type === 'MultiPolygon') coords = f.geometry.coordinates[0][0];
          
          if (coords && coords.length > 0) {
            if (!uvMap.has(uvLimpia)) uvMap.set(uvLimpia, { sumLng: 0, sumLat: 0, count: 0 });
            const d = uvMap.get(uvLimpia);
            coords.forEach(c => { d.sumLng += c[0]; d.sumLat += c[1]; d.count++; });
          }
        });

        if (uvMap.size > 1) {
          const labelFeatures = Array.from(uvMap.entries()).map(([uv, d]) => ({
            type: 'Feature',
            properties: { label: `UV ${uv}` },
            geometry: { type: 'Point', coordinates: [d.sumLng / d.count, d.sumLat / d.count] }
          }));
          setUvLabels({ type: 'FeatureCollection', features: labelFeatures });
        } else {
          setUvLabels(null);
        }
        
        if (data.features[0] && mapRef.current) {
           let coords = data.features[0].geometry.coordinates;
           while (Array.isArray(coords[0])) coords = coords[0];
           mapRef.current.getMap().flyTo({ center: [coords[0], coords[1]], zoom: 14.5, speed: 1.5 });
        }
      }).catch(() => {});
  }, [geojsonPath]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      setTimeout(() => map.resize(), 50);
      setTimeout(() => map.resize(), 300);
    }
  }, [isFullscreen]);

  // NÚCLEO WEBGL: CRUCE CON EXCEL Y FILTRADO RBAC
  const { verdes, rojos, azules, visibles } = useMemo(() => {
    let v = []; let r = []; let a = [];
    const lotesFiltrados = baseDeDatosLotes.filter(l => l.proyecto.includes(proyectoActivo));
    lotesFiltrados.forEach(l => {
      const numLote = String(parseInt(l.lote, 10) || l.lote);
      const est = String(l.estado).toUpperCase();
      if (est === 'LIBRE' || est === 'DISPONIBLE' || est === '') v.push(numLote);
      else if (est === 'BLOQUEADO' || est === 'RESERVADO') r.push(numLote);
      else if (est === 'VENDIDO') a.push(numLote);
    });

    let finalV = [...v], finalR = [...r], finalA = [...a];

    if (!isAdmin) {
       finalR = ['__NONE__']; finalA = ['__NONE__']; // Asesores solo ven verde
    } else {
       if (mapFilter === 'DISPONIBLE') { finalR = ['__NONE__']; finalA = ['__NONE__']; }
       if (mapFilter === 'VENDIDO') { finalV = ['__NONE__']; finalR = ['__NONE__']; }
       if (mapFilter === 'BLOQUEADO') { finalV = ['__NONE__']; finalA = ['__NONE__']; }
    }

    const vis = [...(finalV[0]!=='__NONE__'?finalV:[]), ...(finalR[0]!=='__NONE__'?finalR:[]), ...(finalA[0]!=='__NONE__'?finalA:[])];

    return { 
      verdes: finalV.length > 0 ? finalV : ['__NONE__'], 
      rojos: finalR.length > 0 ? finalR : ['__NONE__'],
      azules: finalA.length > 0 ? finalA : ['__NONE__'],
      visibles: vis.length > 0 ? vis : ['__NONE__']
    };
  }, [baseDeDatosLotes, proyectoActivo, isAdmin, mapFilter]);

  const textProperty = ['coalesce', ['get', 'name'], ['get', 'Name'], ['get', 'TextString'], ['get', 'Text'], ['get', 'text'], ['get', 'LOTE'], ['get', 'Lote'], ''];
  const isLoteVisible = ['in', ['to-string', textProperty], ['literal', visibles]];
  const isShort = ['<=', ['length', ['to-string', textProperty]], 5]; 

  const fillLayer = useMemo(() => ({
    id: 'lotes-fill',
    type: 'fill',
    paint: {
      'fill-color': [
        'match', ['to-string', textProperty],
        verdes, 'rgba(34, 197, 94, 0.40)', // Verde
        rojos, 'rgba(239, 68, 68, 0.50)',  // Rojo
        azules, 'rgba(59, 130, 246, 0.50)', // Azul
        'transparent'
      ],
      'fill-opacity': 1
    },
    filter: ['all', ['!=', ['geometry-type'], 'Point'], isShort, isLoteVisible]
  }), [verdes, rojos, azules, visibles]);

  const lineLayer = useMemo(() => ({
    id: 'lotes-line',
    type: 'line',
    paint: { 'line-color': '#0ea5e9', 'line-width': 1.5, 'line-opacity': 0.8 },
    filter: ['all', ['!=', ['geometry-type'], 'Point'], isShort, isLoteVisible]
  }), [visibles]);

  const labelLayer = useMemo(() => ({
    id: 'lotes-labels',
    type: 'symbol',
    layout: {
      'text-field': textProperty,
      'text-size': 12,
      'text-anchor': 'center',
      'text-allow-overlap': false 
    },
    paint: {
      'text-color': '#ffffff', 
      'text-halo-color': '#020617',
      'text-halo-width': 1.5 
    },
    filter: ['all', ['!=', ['geometry-type'], 'Point'], isShort, isLoteVisible]
  }), [visibles]);

  const highlightLayer = useMemo(() => ({
    id: 'lotes-highlight',
    type: 'line',
    paint: { 'line-color': '#fcd34d', 'line-width': 5, 'line-opacity': 1 },
    filter: ['==', ['to-string', textProperty], String(parseInt(loteActivo, 10) || '')] 
  }), [loteActivo]);

  const edgeDimensionsLayer = useMemo(() => ({
    id: 'edge-dimensions',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 10.5,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'symbol-placement': 'point',
      'text-rotation-alignment': 'map',
      'text-rotate': ['get', 'angle'],
      'text-offset': [0, -0.6],
      'text-allow-overlap': true
    },
    paint: {
      'text-color': '#fcd34d',
      'text-halo-color': '#020617',
      'text-halo-width': 1.5
    }
  }), []);

  const macroUvLayer = useMemo(() => ({
    id: 'uv-macro-labels',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 42,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-anchor': 'center'
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#020617',
      'text-halo-width': 3,
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 14, 1, 16.5, 0] 
    }
  }), []);

  // TOOLTIPS Y MEDIDAS DINÁMICAS (HAVERSINE)
  const handleMouseMove = (e) => {
    const features = e.features;
    if (features && features.length > 0 && features[0].layer.id === 'lotes-fill') {
      const activeFeature = features[0];
      const p = activeFeature.properties;
      const nombreRaw = p.name || p.Name || p.TextString || p.Text || p.text || p.LOTE || p.Lote || "";
      const numLote = parseInt(String(nombreRaw).replace(/[^0-9]/g, ''), 10);
      
      let uvExtraida = p.UV || p.uv || p.Layer || p.layer || "";
      let mznExtraido = p.MZN || p.mzn || p.Layer || p.layer || "";
      const uvLimpia = String(uvExtraida).replace(/[^0-9]/g, '');
      const mznLimpia = String(mznExtraido).replace(/[^0-9]/g, '');

      const loteDB = baseDeDatosLotes.find(l => 
        l.proyecto.includes(proyectoActivo) && 
        parseInt(l.lote, 10) === numLote &&
        (uvLimpia ? String(l.uv).replace(/[^0-9]/g, '') === uvLimpia : true)
      );

      let estadoReal = "DISPONIBLE";
      if (loteDB && loteDB.estado) {
         const est = loteDB.estado.toUpperCase();
         if (est === "VENDIDO") estadoReal = "VENDIDO";
         else if (est === "BLOQUEADO" || est === "RESERVADO") estadoReal = "BLOQUEADO";
      }
      
      const supFinal = loteDB && loteDB.superficie > 0 ? loteDB.superficie : "Sin datos";
      
      setHoverInfo({
        lngLat: e.lngLat,
        lote: isNaN(numLote) ? "-" : numLote,
        mzn: loteDB ? loteDB.mzn : (mznLimpia || "-"),
        uv: loteDB ? loteDB.uv : (uvLimpia || "-"),
        estado: estadoReal,
        superficie: supFinal
      });

      if (activeFeature.geometry && (activeFeature.geometry.type === 'Polygon' || activeFeature.geometry.type === 'MultiPolygon')) {
        let coordinates = activeFeature.geometry.type === 'Polygon' ? activeFeature.geometry.coordinates[0] : activeFeature.geometry.coordinates[0][0];
        const edgeFeatures = [];
        for (let i = 0; i < coordinates.length - 1; i++) {
          try {
            const { distancia, textAngle, midLng, midLat } = calcularDistanciaYAngulo(coordinates[i], coordinates[i + 1]);
            if (distancia > 3) {
              edgeFeatures.push({
                type: 'Feature', geometry: { type: 'Point', coordinates: [midLng, midLat] },
                properties: { label: `${distancia.toFixed(2)}m`, angle: textAngle }
              });
            }
          } catch(err) {}
        }
        setHoverEdges({ type: 'FeatureCollection', features: edgeFeatures });
      }
    } else {
      setHoverInfo(null);
      setHoverEdges(null);
    }
  };

  const handleMapClick = () => {
    if (hoverInfo && hoverInfo.lote !== "-") {
      const loteDB = baseDeDatosLotes.find(l => 
        l.proyecto.includes(proyectoActivo) && 
        parseInt(l.lote, 10) === hoverInfo.lote &&
        (hoverInfo.uv !== "-" ? String(l.uv).replace(/[^0-9]/g, '') === hoverInfo.uv : true)
      );

      if (loteDB) {
        setIsFullscreen(false);
        onLoteSeleccionado({ isError: false, data: loteDB });
      } else {
        onLoteSeleccionado({ 
          isError: true, 
          data: { lote: hoverInfo.lote, mzn: hoverInfo.mzn, uv: hoverInfo.uv, superficie: hoverInfo.superficie, precio: 0, categoria: 'ESTÁNDAR', estado: hoverInfo.estado } 
        });
      }
    }
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-[150] bg-[#020617] w-screen h-screen flex flex-col m-0 p-0" 
    : "relative w-full h-[450px] sm:h-[550px] lg:h-[600px] rounded-[2.5rem] overflow-hidden shadow-[0_0_30px_rgba(14,165,233,0.15)] border border-cyan-500/30 bg-[#060b13] flex flex-col";

  return (
    <div className={containerClasses}>
      <div className="bg-slate-900/90 backdrop-blur-md p-4 sm:p-5 z-10 border-b border-cyan-500/30 flex flex-wrap justify-between items-center shadow-lg shrink-0 gap-4">
         <div className="flex items-center gap-3">
           <div className="bg-cyan-500/20 p-2 rounded-xl border border-cyan-500/30">
             <MapPin className="w-5 h-5 text-cyan-400" />
           </div>
           <div>
             <h3 className="text-white font-black tracking-widest uppercase text-xs sm:text-sm">Navegador Espacial <span className="text-cyan-500">{proyectoActivo}</span></h3>
             <p className="text-slate-400 text-[9px] uppercase tracking-widest mt-0.5 flex items-center gap-2 font-bold">
               <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> Disponible</span>
               {isAdmin && (
                 <>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> Vendido</span>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> Bloqueado</span>
                 </>
               )}
             </p>
           </div>
         </div>
         
         <div className="flex items-center gap-3">
           {isAdmin && (
             <div className="relative hidden sm:block">
               <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                 <Filter className="w-4 h-4 text-cyan-400" />
               </div>
               <select 
                 value={mapFilter}
                 onChange={(e) => setMapFilter(e.target.value)}
                 className="bg-[#020617] border border-cyan-500/50 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-xl py-2.5 pl-9 pr-8 outline-none focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] appearance-none cursor-pointer transition-all"
               >
                 <option value="TODOS">TODOS LOS ESTADOS</option>
                 <option value="DISPONIBLE">SOLO DISPONIBLES (Verde)</option>
                 <option value="VENDIDO">SOLO VENDIDOS (Azul)</option>
                 <option value="BLOQUEADO">SOLO BLOQUEADOS (Rojo)</option>
               </select>
               <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                 <ChevronDown className="w-4 h-4 text-cyan-400" />
               </div>
             </div>
           )}

           <button 
             type="button"
             onClick={() => setIsFullscreen(!isFullscreen)} 
             className="bg-slate-800 hover:bg-slate-700 text-cyan-400 p-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer z-50 shadow-sm"
           >
             {isFullscreen ? <Minimize className="w-5 h-5"/> : <Maximize className="w-5 h-5"/>}
           </button>
         </div>
      </div>

      <div className="flex-1 relative bg-[#060b13] w-full h-full min-h-[400px]">
        <MapGL
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={{ longitude: -63.2435, latitude: -17.3635, zoom: 14.3, pitch: 0 }}
          maxZoom={20} 
          mapStyle={MAP_STYLE_SATELLITE as any} 
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          interactiveLayerIds={['lotes-fill']}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHoverInfo(null); setHoverEdges(null); }}
          onClick={handleMapClick}
          cursor={hoverInfo ? "pointer" : "crosshair"}
        >
          <GeolocateControl position="bottom-right" trackUserLocation={true} showUserHeading={true} />
          <NavigationControl position="bottom-right" visualizePitch={true} />
          
          <Source id="dynamic-data" type="geojson" data={geojsonPath}>
            <Layer {...fillLayer as any} />
            <Layer {...lineLayer as any} />
            <Layer {...highlightLayer as any} />
            <Layer {...labelLayer as any} />
          </Source>

          {uvLabels && (
            <Source id="macro-uv-labels" type="geojson" data={uvLabels}>
              <Layer {...macroUvLayer as any} />
            </Source>
          )}

          {hoverEdges && (
            <Source id="hover-edges-data" type="geojson" data={hoverEdges}>
              <Layer {...edgeDimensionsLayer as any} />
            </Source>
          )}

          {/* TOOLTIP CYBERTECH ESTILO INMOBILIARIO */}
          {hoverInfo && hoverInfo.lote !== "-" && (
            <Popup
              longitude={hoverInfo.lngLat.lng}
              latitude={hoverInfo.lngLat.lat}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              className="custom-tooltip"
              maxWidth="300px"
              offset={15}
            >
              <div className="bg-[#0f172a] border border-cyan-500/50 p-4 rounded-2xl shadow-[0_10px_30px_rgba(6,182,212,0.3)] text-white font-['Plus_Jakarta_Sans'] w-48">
                <div className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Datos del Terreno
                </div>
                <div className="text-2xl font-black tracking-tight leading-none mb-3 text-white">
                  LOTE {hoverInfo.lote}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-3">
                  <span>MZN: <span className="text-slate-200">{hoverInfo.mzn}</span></span>
                  <span>UV: <span className="text-slate-200">{hoverInfo.uv}</span></span>
                </div>
                <div className="flex items-center justify-between text-[11px] mb-3 border-t border-slate-700/50 pt-2">
                  <span className="font-bold">Área: <span className="text-amber-400">{hoverInfo.superficie} {hoverInfo.superficie !== 'Sin datos' && 'm²'}</span></span>
                </div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    hoverInfo.estado === 'LIBRE' || hoverInfo.estado === 'DISPONIBLE' ? 'bg-green-500 text-[#020617]' :
                    hoverInfo.estado === 'VENDIDO' ? 'bg-blue-500 text-white' :
                    hoverInfo.estado === 'BLOQUEADO' ? 'bg-red-500 text-white' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {hoverInfo.estado}
                  </span>
                </div>
              </div>
            </Popup>
          )}
        </MapGL>
      </div>
    </div>
  );
}
