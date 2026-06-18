"use client";

import React, { useState, useMemo } from 'react';
import { CanvasRenderer } from '../../../components/editor/canvas-renderer';

const INITIAL_SEQUENCE = "";

export default function SandboxPage() {
  const [sequenceStr, setSequenceStr] = useState<string>(INITIAL_SEQUENCE);
  const [opacity, setOpacity] = useState<number>(0.3);
  const [width, setWidth] = useState<number>(1);
  const [totalPins, setTotalPins] = useState<number>(240);

  const sequenceArray = useMemo(() => {
    try {
      const parts = sequenceStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      return new Uint16Array(parts);
    } catch (e) {
      return null;
    }
  }, [sequenceStr]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-white p-4 gap-6">
      {/* Controls Panel */}
      <div className="w-full md:w-1/3 flex flex-col gap-6 bg-gray-800 p-6 rounded-xl border border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Renderer Sandbox</h1>
          <p className="text-sm text-gray-400">Auditoría gráfica de secuencias (FaroStringArt vs Nuestro motor)</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Opacidad del Hilo: <span className="text-white font-mono">{opacity.toFixed(2)}</span></label>
          <input
            type="range"
            min="0.01" max="1" step="0.01"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <p className="text-xs text-gray-500">Un valor más alto hace que parezca más oscuro, ocultando defectos de cruce.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Grosor del Hilo: <span className="text-white font-mono">{width.toFixed(1)}px</span></label>
          <input
            type="range"
            min="0.1" max="5" step="0.1"
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
          <p className="text-xs text-gray-500">Un hilo real de coser en un canvas de 600px debería ser ~0.5px - 1px.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Total de Pines</label>
          <input
            type="number"
            className="bg-gray-900 border border-gray-700 p-2 rounded text-white font-mono"
            value={totalPins}
            onChange={(e) => setTotalPins(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="flex flex-col gap-2 flex-grow">
          <label className="text-sm font-medium text-gray-300">Secuencia Numérica (CSV)</label>
          <textarea
            className="w-full h-48 bg-gray-900 border border-gray-700 p-3 rounded text-green-400 font-mono text-xs resize-none focus:outline-none focus:border-blue-500"
            value={sequenceStr}
            onChange={(e) => setSequenceStr(e.target.value)}
          />
        </div>
      </div>

      {/* Canvas Output Panel */}
      <div className="w-full md:w-2/3 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center p-8 relative min-h-[600px]">
        <div className="absolute top-4 left-6 text-gray-400 font-mono text-sm">
          {sequenceArray ? `Mostrando ${sequenceArray.length} líneas` : 'Secuencia vacía'}
        </div>

        <div className="bg-white rounded-full shadow-2xl overflow-hidden flex items-center justify-center relative"
          style={{ width: '600px', height: '600px' }}>
          <CanvasRenderer
            key={`${opacity}-${width}-${sequenceStr.length}`}
            sequence={sequenceArray}
            totalPins={totalPins}
            canvasSize={600}
            previewUrl={null}
            lineOpacity={opacity}
            lineWidth={width}
          />
        </div>
      </div>
    </div>
  );
}
