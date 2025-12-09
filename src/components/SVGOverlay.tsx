import React, { useEffect, useState } from 'react';

interface SVGOverlayProps {
  coordsModelo: [number, number][];
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}

const SVGOverlay: React.FC<SVGOverlayProps> = ({
  coordsModelo,
  color = '#E30613',
  strokeWidth = 4,
  opacity = 0.8
}) => {
  const [svgElements, setSvgElements] = useState<{
    barra: { x: number; y: number; width: number; height: number; rx: number };
    linea: { x1: number; y1: number; x2: number; y2: number };
    circuloInicio: { cx: number; cy: number; r: number };
    circuloFin: { cx: number; cy: number; r: number };
  } | null>(null);

  useEffect(() => {
    if (coordsModelo.length < 2) return;

    // Calcular el bounding box del modelo
    const xs = coordsModelo.map(c => c[0]);
    const ys = coordsModelo.map(c => c[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const modelWidth = maxX - minX;
    const modelHeight = maxY - minY;

    // Calcular la escala y offset para que coincida con el canvas
    const scaleX = window.innerWidth * 0.6 / modelWidth;
    const scaleY = window.innerHeight * 0.6 / modelHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (window.innerWidth - modelWidth * scale) / 2;
    const offsetY = (window.innerHeight - modelHeight * scale) / 2;

    // Transformar coordenadas del modelo
    const coordsTransformadas = coordsModelo.map(([x, y]) => ({
      x: (x - minX) * scale + offsetX,
      y: (y - minY) * scale + offsetY
    }));

    // Crear elementos SVG basados en la imagen descrita
    const startPoint = coordsTransformadas[0];
    const endPoint = coordsTransformadas[coordsTransformadas.length - 1];
    
    // Barra gris con esquinas redondeadas
    const barraWidth = Math.abs(endPoint.x - startPoint.x) + 40; // Margen extra
    const barraHeight = 40; // Más gruesa
    const barraX = Math.min(startPoint.x, endPoint.x) - 20;
    const barraY = startPoint.y - barraHeight / 2;
    
    // Línea roja punteada en el centro (separada 2px de los círculos)
    const lineaY = startPoint.y;
    const separacionCirculos = 2;
    
    // Círculos en los extremos
    const radioCirculo = 12; // Más grandes para que sean proporcionales
    
    setSvgElements({
      barra: {
        x: barraX,
        y: barraY,
        width: barraWidth,
        height: barraHeight,
        rx: barraHeight / 2 // Esquinas completamente redondeadas
      },
      linea: {
        x1: startPoint.x + radioCirculo + separacionCirculos,
        y1: lineaY,
        x2: endPoint.x - radioCirculo - separacionCirculos,
        y2: lineaY
      },
      circuloInicio: {
        cx: startPoint.x,
        cy: startPoint.y,
        r: radioCirculo
      },
      circuloFin: {
        cx: endPoint.x,
        cy: endPoint.y,
        r: radioCirculo
      }
    });

  }, [coordsModelo]);

  if (!svgElements) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {/* Barra gris con esquinas redondeadas */}
        <rect
          x={svgElements.barra.x}
          y={svgElements.barra.y}
          width={svgElements.barra.width}
          height={svgElements.barra.height}
          rx={svgElements.barra.rx}
          fill="#cccccc"
          opacity={0.8}
        />
        
        {/* Línea roja punteada en el centro */}
        <line
          x1={svgElements.linea.x1}
          y1={svgElements.linea.y1}
          x2={svgElements.linea.x2}
          y2={svgElements.linea.y2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="12,8"
          opacity={opacity}
          strokeLinecap="round"
        />
        
        {/* Círculo de inicio (negro) */}
        <circle
          cx={svgElements.circuloInicio.cx}
          cy={svgElements.circuloInicio.cy}
          r={svgElements.circuloInicio.r}
          fill="#000000"
          opacity={0.9}
        />
        
        {/* Círculo de fin (gris claro) */}
        <circle
          cx={svgElements.circuloFin.cx}
          cy={svgElements.circuloFin.cy}
          r={svgElements.circuloFin.r}
          fill="#e0e0e0"
          opacity={0.9}
        />
      </svg>
    </div>
  );
};

export default SVGOverlay;
