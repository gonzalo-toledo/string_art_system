/**
 * Generador de Guía de Secuencias en formato PDF/Imprimible.
 * 
 * Genera un documento HTML optimizado para impresión (A4, escala de grises,
 * distribución en múltiples columnas compactas) que se abre en una nueva pestaña
 * y activa automáticamente el diálogo de impresión nativo del navegador.
 */

interface ExportPDFParams {
  sequence: Uint16Array | number[];
  totalPins: number;
  maxIterations: number;
  totalMeters: number;
  locale: 'es' | 'en' | 'pt';
}

const TEXTS = {
  es: {
    title: "Guía de Hilado — HáceloArt",
    subtitle: "Instrucciones de armado físico paso a paso",
    instructionsTitle: "Cómo empezar a tejer:",
    instruction1: "Ate el hilo inicial en el <strong>pin 0</strong> (marcado como origen).",
    instruction2: "Siga la secuencia de izquierda a derecha, fila por fila. Cada número indica el <strong>pin destino</strong> al cual enganchar el hilo.",
    instruction3: "Use el casillero [ ] al lado de cada número para tachar el progreso a mano.",
    specifications: "Especificaciones Técnicas:",
    pins: "Pines en el bastidor",
    steps: "Líneas de hilo (pasos)",
    meters: "Largo estimado de hilo",
    page: "Página",
    stepAbbr: "Paso"
  },
  en: {
    title: "Threading Guide — HáceloArt",
    subtitle: "Step-by-step physical assembly instructions",
    instructionsTitle: "How to start weaving:",
    instruction1: "Tie the initial thread to <strong>pin 0</strong> (marked as origin).",
    instruction2: "Follow the sequence from left to right, row by row. Each number indicates the <strong>target pin</strong> to hook the thread next.",
    instruction3: "Use the checkbox [ ] next to each number to cross off your progress manually.",
    specifications: "Technical Specifications:",
    pins: "Total pins on board",
    steps: "Thread lines (steps)",
    meters: "Estimated thread length",
    page: "Page",
    stepAbbr: "Step"
  },
  pt: {
    title: "Guia de Tecelagem — HáceloArt",
    subtitle: "Instruções passo a passo para montagem física",
    instructionsTitle: "Como começar a tecer:",
    instruction1: "Amarre o fio inicial no <strong>pino 0</strong> (marcado como origem).",
    instruction2: "Siga a sequência da esquerda para a direita, linha por linha. Cada número indica o <strong>pino destino</strong> para prender o fio a seguir.",
    instruction3: "Use a caixa [ ] ao lado de cada número para marcar o progresso à mão.",
    specifications: "Especificações Técnicas:",
    pins: "Pinos no bastidor",
    steps: "Linhas de fio (passos)",
    meters: "Comprimento estimado do fio",
    page: "Página",
    stepAbbr: "Passo"
  }
};

export function exportPDFGuide({ sequence, totalPins, maxIterations, totalMeters, locale }: ExportPDFParams) {
  const t = TEXTS[locale] || TEXTS.es;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes (popups) para exportar el PDF.');
    return;
  }

  // Estructuramos la grilla en columnas compactas para la hoja A4.
  // Ignoramos el primer pin (índice 0) ya que es el origen '0'. La secuencia empieza a tejerse desde el paso 1.
  let stepsHtml = '';
  for (let i = 1; i < sequence.length; i++) {
    const pin = sequence[i];
    stepsHtml += `
      <div class="step-cell">
        <span class="checkbox"></span>
        <span class="step-num">${i}.</span>
        <span class="pin-value">${pin}</span>
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${locale}">
    <head>
      <meta charset="UTF-8">
      <title>${t.title}</title>
      <style>
        /* Estilos base y resets */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #111111;
          background-color: #ffffff;
          line-height: 1.4;
          font-size: 10pt;
          padding: 20mm 15mm;
        }

        /* Cabecera y branding minimalista */
        header {
          border-bottom: 2px solid #111111;
          padding-bottom: 5mm;
          margin-bottom: 6mm;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .title-area h1 {
          font-size: 20pt;
          font-weight: 800;
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }
        .title-area p {
          font-size: 10pt;
          color: #555555;
          margin-top: 1mm;
        }
        
        /* Información técnica */
        .info-block {
          text-align: right;
          font-size: 9pt;
          color: #333333;
        }
        .info-block strong {
          color: #111111;
        }

        /* Sección de Instrucciones */
        .instructions-box {
          background-color: #f7f7f7;
          border: 1px solid #e3e3e3;
          border-radius: 4px;
          padding: 4mm 5mm;
          margin-bottom: 8mm;
        }
        .instructions-box h2 {
          font-size: 11pt;
          font-weight: 700;
          margin-bottom: 2mm;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .instructions-box ul {
          list-style: none;
        }
        .instructions-box li {
          font-size: 9pt;
          margin-bottom: 1.5mm;
          color: #444444;
          position: relative;
          padding-left: 5mm;
        }
        .instructions-box li::before {
          content: "•";
          position: absolute;
          left: 1.5mm;
          color: #111111;
          font-weight: bold;
        }

        /* Tabla compacta de pasos con CSS Grid */
        .sequence-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 2mm 3mm;
        }
        .step-cell {
          display: flex;
          align-items: center;
          border-bottom: 1px solid #e8e8e8;
          padding-bottom: 1mm;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .checkbox {
          width: 3.5mm;
          height: 3.5mm;
          border: 1px solid #888888;
          border-radius: 2px;
          margin-right: 2mm;
          display: inline-block;
          flex-shrink: 0;
        }
        .step-num {
          font-size: 7.5pt;
          color: #888888;
          font-family: monospace;
          width: 8mm;
          text-align: right;
          margin-right: 2mm;
        }
        .pin-value {
          font-size: 11pt;
          font-weight: 700;
          font-family: monospace;
          color: #111111;
        }

        /* Estilos especiales optimizados para impresión física */
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            padding: 0;
            color: #000000;
          }
          .instructions-box {
            background-color: transparent !important;
            border: 1px solid #cccccc;
          }
          .sequence-grid {
            grid-template-columns: repeat(8, 1fr);
          }
          .step-cell {
            border-bottom: 1px solid #dddddd;
          }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="title-area">
          <h1>${t.title}</h1>
          <p>${t.subtitle}</p>
        </div>
        <div class="info-block">
          <div><strong>${t.pins}:</strong> ${totalPins}</div>
          <div><strong>${t.steps}:</strong> ${maxIterations}</div>
          <div><strong>${t.meters}:</strong> ~${Math.round(totalMeters)} m</div>
        </div>
      </header>

      <div class="instructions-box">
        <h2>${t.instructionsTitle}</h2>
        <ul>
          <li>${t.instruction1}</li>
          <li>${t.instruction2}</li>
          <li>${t.instruction3}</li>
        </ul>
      </div>

      <main class="sequence-grid">
        ${stepsHtml}
      </main>

      <script>
        // Gatillar diálogo de impresión automáticamente cuando todo esté cargado
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
