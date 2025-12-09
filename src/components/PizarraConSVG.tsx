import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface PizarraConSVGProps {
  onFinishDraw: (coords: { x: number; y: number }[]) => void;
  coordsModelo: [number, number][];
  onModeloTransformado?: (coords: { x: number; y: number }[]) => void;
  background?: string;
  color?: string;
  lineWidth?: number;
  colorModelo?: string;
  grosorModelo?: number;
  grosorLineaCoordenadas?: number;
  rellenarModelo?: boolean;
  cerrarTrazo?: boolean;
  suavizarModelo?: boolean;
  ejercicioId?: string; // Para detectar si es cuadrado o círculo
}

const PizarraConSVG = forwardRef<any, PizarraConSVGProps>(({
  onFinishDraw,
  coordsModelo,
  onModeloTransformado,
  background = '#fff',
  color = 'black',
  lineWidth = 2,
  colorModelo = '#aaaaaa',
  grosorModelo = 2,
  grosorLineaCoordenadas,
  rellenarModelo = false,
  cerrarTrazo = false,
  suavizarModelo = false,
  ejercicioId
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasSVGRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const coordsRef = useRef<{ x: number; y: number }[]>([]);
  const strokesRef = useRef<{ x: number; y: number }[][]>([]); // Para trazos múltiples (X y cruz)
  
  // Determinar si permite trazos múltiples
  const permiteMultiTrazo = ejercicioId === 'linea_x' || ejercicioId === 'cruz';

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      if (canvasRef.current && canvasSVGRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        const ctxSVG = canvasSVGRef.current.getContext('2d')!;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctxSVG.clearRect(0, 0, canvasSVGRef.current.width, canvasSVGRef.current.height);
        coordsRef.current = [];
        strokesRef.current = [];
        drawModeloCentrado(ctxSVG);
      }
    }
  }));

  const getBoundingBox = (coords: [number, number][]) => {
    const xs = coords.map(([x]) => x);
    const ys = coords.map(([, y]) => y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  };

  const drawSVGEnCanvas = (ctx: CanvasRenderingContext2D, coordsTransformadas: { x: number; y: number }[]) => {
    if (coordsTransformadas.length < 2) return;

    const startPoint = coordsTransformadas[0];
    const endPoint = coordsTransformadas[coordsTransformadas.length - 1];
    
    console.log('🔍 DIBUJANDO SVG - Start:', startPoint, 'End:', endPoint);
    
    // Detectar el tipo de forma basado en el ejercicioId primero (prioridad)
    const esCuadrado = ejercicioId === 'cuadrado';
    const esCirculo = ejercicioId === 'circulo';
    const esTriangulo = ejercicioId === 'triangulo';
    const esLineaX = ejercicioId === 'linea_x';
    const esCruz = ejercicioId === 'cruz';
    
    // Detectar formas cerradas solo si no es una forma específica
    const esFormaCerrada = coordsTransformadas.length > 200 && !esTriangulo && !esCruz && !esLineaX;
    
    console.log('🔍 SVG - EjercicioId:', ejercicioId, 'Es cuadrado:', esCuadrado, 'Es triángulo:', esTriangulo, 'Es X:', esLineaX, 'Es cruz:', esCruz);
    
    const deltaX = Math.abs(endPoint.x - startPoint.x);
    const deltaY = Math.abs(endPoint.y - startPoint.y);
    const longitud = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angulo = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    
    const radioCirculo = 15;
    const separacionCirculos = 3;
    const barraWidth = 50;
    
    // Verificar formas específicas por ejercicioId (independientemente de número de puntos)
    if (esCuadrado) {
        // Para cuadrado: dibujar un cuadrado perfecto
        console.log('🔍 SVG - Dibujando cuadrado...');
        
        // Calcular el bounding box del cuadrado
        const minX = Math.min(...coordsTransformadas.map(p => p.x));
        const maxX = Math.max(...coordsTransformadas.map(p => p.x));
        const minY = Math.min(...coordsTransformadas.map(p => p.y));
        const maxY = Math.max(...coordsTransformadas.map(p => p.y));
        
        const centroX = (minX + maxX) / 2;
        const centroY = (minY + maxY) / 2;
        const lado = Math.max(maxX - minX, maxY - minY);
        const mitadLado = lado / 2;
        const offset = 30; // Espacio para las esquinas
        
        console.log('🔍 SVG Cuadrado - Centro:', centroX, centroY, 'Lado:', lado);
        
        // Dibujar fondo gris del cuadrado con esquinas redondeadas
        ctx.beginPath();
        ctx.roundRect(centroX - mitadLado - offset, centroY - mitadLado - offset, lado + offset * 2, lado + offset * 2, 10);
        ctx.fillStyle = '#e0e0e0';
        ctx.fill();
        
        // Dibujar cuadrado blanco interior para efecto 2D
        ctx.beginPath();
        ctx.roundRect(centroX - mitadLado - offset + 40, centroY - mitadLado - offset + 40, lado + offset * 2 - 80, lado + offset * 2 - 80, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Dibujar línea roja punteada siguiendo el contorno del cuadrado
        ctx.beginPath();
        ctx.setLineDash([15, 6]);
        ctx.roundRect(centroX - mitadLado - offset + 20, centroY - mitadLado - offset + 20, lado + offset * 2 - 40, lado + offset * 2 - 40, 8);
        ctx.strokeStyle = '#E30613';
        ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Dibujar marcadores en las esquinas
        const esquinaOffset = 20; // Offset desde el borde
        
        // Esquina superior izquierda: CÍRCULO NEGRO
        ctx.beginPath();
        ctx.arc(
          centroX - mitadLado - offset + esquinaOffset,
          centroY - mitadLado - offset + esquinaOffset,
          radioCirculo,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = '#000000';
        ctx.fill();
        
        // Esquina superior derecha: CÍRCULO BLANCO
        ctx.beginPath();
        ctx.arc(
          centroX + mitadLado + offset - esquinaOffset,
          centroY - mitadLado - offset + esquinaOffset,
          radioCirculo,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = '#f5f5f5';
        ctx.fill();
        
        // Esquina inferior derecha: CÍRCULO BLANCO
        ctx.beginPath();
        ctx.arc(
          centroX + mitadLado + offset - esquinaOffset,
          centroY + mitadLado + offset - esquinaOffset,
          radioCirculo,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = '#f5f5f5';
        ctx.fill();
        
        // Esquina inferior izquierda: CÍRCULO BLANCO
        ctx.beginPath();
        ctx.arc(
          centroX - mitadLado - offset + esquinaOffset,
          centroY + mitadLado + offset - esquinaOffset,
          radioCirculo,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = '#f5f5f5';
        ctx.fill();
        
    } else if (esCirculo) {
        // Para círculo: crear una forma que siga el contorno
        console.log('🔍 SVG - Dibujando círculo...');
      
      // Calcular el centro y dimensiones de la forma
      const centroX = coordsTransformadas.reduce((sum, p) => sum + p.x, 0) / coordsTransformadas.length;
      const centroY = coordsTransformadas.reduce((sum, p) => sum + p.y, 0) / coordsTransformadas.length;
      
      // Calcular el radio promedio de la forma
      const radios = coordsTransformadas.map(p => 
        Math.sqrt((p.x - centroX) ** 2 + (p.y - centroY) ** 2)
      );
      const radioPromedio = radios.reduce((sum, r) => sum + r, 0) / radios.length;
      const radioExpandido = radioPromedio + 30; // Expandir un poco
      
      console.log('🔍 SVG - Centro:', centroX, centroY, 'Radio:', radioPromedio, 'Expandido:', radioExpandido);
      
      // Dibujar forma de fondo (círculo exterior)
      ctx.beginPath();
      ctx.arc(centroX, centroY, radioExpandido, 0, 2 * Math.PI);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      
      // Dibujar círculo blanco en el medio para efecto 2D
      ctx.beginPath();
      ctx.arc(centroX, centroY, radioExpandido - 40, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      // Dibujar línea roja punteada siguiendo el contorno
      ctx.beginPath();
      ctx.setLineDash([15, 6]);
      ctx.arc(centroX, centroY, radioExpandido - 20, 0, 2 * Math.PI);
      ctx.strokeStyle = '#E30613';
      ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Dibujar círculos en posiciones estratégicas (arriba, abajo, izquierda y derecha)
      // Círculo negro arriba
      ctx.beginPath();
      ctx.arc(centroX, centroY - radioExpandido + 20, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#000000';
      ctx.fill();
      
      // Círculo blanco abajo
      ctx.beginPath();
      ctx.arc(centroX, centroY + radioExpandido - 20, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      
      // Círculo blanco izquierda
      ctx.beginPath();
      ctx.arc(centroX - radioExpandido + 20, centroY, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      
      // Círculo blanco derecha
      ctx.beginPath();
      ctx.arc(centroX + radioExpandido - 20, centroY, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
        
    } else if (esFormaCerrada) {
        // Para otras formas cerradas (fallback al comportamiento original)
        console.log('🔍 SVG - Dibujando forma cerrada genérica...');
        
        // Calcular el centro y dimensiones de la forma
        const centroX = coordsTransformadas.reduce((sum, p) => sum + p.x, 0) / coordsTransformadas.length;
        const centroY = coordsTransformadas.reduce((sum, p) => sum + p.y, 0) / coordsTransformadas.length;
        
        // Calcular el radio promedio de la forma
        const radios = coordsTransformadas.map(p => 
          Math.sqrt((p.x - centroX) ** 2 + (p.y - centroY) ** 2)
        );
        const radioPromedio = radios.reduce((sum, r) => sum + r, 0) / radios.length;
        const radioExpandido = radioPromedio + 30; // Expandir un poco
        
        // Dibujar forma de fondo (círculo exterior)
        ctx.beginPath();
        ctx.arc(centroX, centroY, radioExpandido, 0, 2 * Math.PI);
        ctx.fillStyle = '#e0e0e0';
        ctx.fill();
        
        // Dibujar círculo blanco en el medio para efecto 2D
        ctx.beginPath();
        ctx.arc(centroX, centroY, radioExpandido - 40, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Dibujar línea roja punteada siguiendo el contorno
        ctx.beginPath();
        ctx.setLineDash([15, 6]);
        ctx.arc(centroX, centroY, radioExpandido - 20, 0, 2 * Math.PI);
        ctx.strokeStyle = '#E30613';
        ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
        ctx.stroke();
        ctx.setLineDash([]);
        
    } else if (esLineaX) {
      // Para línea X: dibujar forma completa usando las coordenadas reales transformadas
      console.log('🔍 SVG - Dibujando forma X...');
      
      // Encontrar el centro real usando las coordenadas transformadas
      const centroX = coordsTransformadas.reduce((sum, p) => sum + p.x, 0) / coordsTransformadas.length;
      const centroY = coordsTransformadas.reduce((sum, p) => sum + p.y, 0) / coordsTransformadas.length;
      
      // Calcular la distancia real desde el centro a los puntos más lejanos de las coordenadas
      const distanciasDesdeCentro = coordsTransformadas.map(p => 
        Math.sqrt((p.x - centroX) ** 2 + (p.y - centroY) ** 2)
      );
      const distanciaMaxima = Math.max(...distanciasDesdeCentro);
      
      // El barraLength debe cubrir exactamente desde el centro hasta los extremos más lejanos
      // Agregamos aproximadamente 1cm (40-50px) más de longitud para que cubra las líneas rojas que sobresalen
      const offsetExtra = 50; // Aproximadamente 1cm en píxeles
      const barraLength = (distanciaMaxima * 2) + offsetExtra;
      
      console.log('🔍 SVG X - Centro:', centroX, centroY, 'Distancia máxima:', distanciaMaxima, 'Barra length:', barraLength);
      
      // Primera diagonal (arriba-izquierda a abajo-derecha)
      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.roundRect(-barraLength/2, -barraWidth/2, barraLength, barraWidth, barraWidth / 2);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      ctx.restore();
      
      // Segunda diagonal (arriba-derecha a abajo-izquierda)
      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.rotate(-Math.PI / 4);
      ctx.beginPath();
      ctx.roundRect(-barraLength/2, -barraWidth/2, barraLength, barraWidth, barraWidth / 2);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      ctx.restore();
      
      // Dibujar líneas rojas punteadas siguiendo las diagonales
      // Primera diagonal
      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.setLineDash([15, 6]);
      const pxPorMM = 96 / 25.4; // conversión CSS px por mm
      const offsetBordeMM = 6 * pxPorMM; // 6mm desde el borde
      ctx.moveTo(-barraLength/2 + offsetBordeMM, 0);
      ctx.lineTo(barraLength/2 - offsetBordeMM, 0);
      ctx.strokeStyle = '#E30613';
      ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      
      // Segunda diagonal
      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.rotate(-Math.PI / 4);
      ctx.beginPath();
      ctx.setLineDash([15, 6]);
      ctx.moveTo(-barraLength/2 + offsetBordeMM, 0);
      ctx.lineTo(barraLength/2 - offsetBordeMM, 0);
      ctx.strokeStyle = '#E30613';
      ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      
      // Círculos en las 4 esquinas de la X - a 6mm del borde
      const mitadBarraLength = barraLength / 2;
      const offsetCirculo = offsetBordeMM;
      
      // Calcular las posiciones exactas a 6mm del borde
      const angulo45 = Math.PI / 4;
      const cos45 = Math.cos(angulo45);
      const sin45 = Math.sin(angulo45);
      
      // Primera diagonal: extremos izquierda (arriba-izquierda) y derecha (abajo-derecha)
      const extremoIzqDiag1X = centroX - (mitadBarraLength - offsetCirculo) * cos45;
      const extremoIzqDiag1Y = centroY - (mitadBarraLength - offsetCirculo) * sin45;
      const extremoDerDiag1X = centroX + (mitadBarraLength - offsetCirculo) * cos45;
      const extremoDerDiag1Y = centroY + (mitadBarraLength - offsetCirculo) * sin45;
      
      // Segunda diagonal: extremos izquierda (abajo-izquierda) y derecha (arriba-derecha)
      const extremoIzqDiag2X = centroX - (mitadBarraLength - offsetCirculo) * cos45;
      const extremoIzqDiag2Y = centroY + (mitadBarraLength - offsetCirculo) * sin45;
      const extremoDerDiag2X = centroX + (mitadBarraLength - offsetCirculo) * cos45;
      const extremoDerDiag2Y = centroY - (mitadBarraLength - offsetCirculo) * sin45;
      
      // Esquina arriba-izquierda: CÍRCULO NEGRO
      ctx.beginPath();
      ctx.arc(extremoIzqDiag1X, extremoIzqDiag1Y, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#000000';
      ctx.fill();
      
      // Esquina arriba-derecha: CÍRCULO NEGRO
      ctx.beginPath();
      ctx.arc(extremoDerDiag2X, extremoDerDiag2Y, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#000000';
      ctx.fill();
      
      // Esquina abajo-izquierda: CÍRCULO BLANCO
      ctx.beginPath();
      ctx.arc(extremoIzqDiag2X, extremoIzqDiag2Y, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      
      // Esquina abajo-derecha: CÍRCULO BLANCO
      ctx.beginPath();
      ctx.arc(extremoDerDiag1X, extremoDerDiag1Y, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      
    } else if (esTriangulo) {
      // Para triángulo: dibujar forma completa usando las coordenadas reales transformadas
      console.log('🔍 SVG - Dibujando triángulo...');
      
      // Encontrar los vértices reales del triángulo usando las coordenadas transformadas
      const maxY = Math.max(...coordsTransformadas.map(p => p.y));
      
      // Encontrar el vértice superior (el punto más alto)
      const verticeSuperior = coordsTransformadas.reduce((min, p) => p.y < min.y ? p : min, coordsTransformadas[0]);
      
      // Encontrar los dos vértices inferiores (los puntos más bajos, uno izquierdo y uno derecho)
      const puntosInferiores = coordsTransformadas.filter(p => Math.abs(p.y - maxY) < 10);
      const verticeInferiorDerecho = puntosInferiores.reduce((max, p) => p.x > max.x ? p : max, puntosInferiores[0] || coordsTransformadas[coordsTransformadas.length - 1]);
      const verticeInferiorIzquierdo = puntosInferiores.reduce((min, p) => p.x < min.x ? p : min, puntosInferiores[0] || coordsTransformadas[Math.floor(coordsTransformadas.length / 2)]);
      
      console.log('🔍 SVG Triángulo - Vértices:', verticeSuperior, verticeInferiorDerecho, verticeInferiorIzquierdo);
      
      // Dibujar las tres barras con bordes circulares (esquinas redondeadas)
      const pxPorMM_local = 96 / 25.4;
      const barraExtraPx = 2 * pxPorMM_local; // +2mm para el triángulo (menos grueso)
      const barraWidthTri = barraWidth + barraExtraPx;
      const radioEsquina = barraWidthTri / 2; // Radio para bordes circulares
      const offsetExtra = 60; // Offset adicional para cubrir las coordenadas (punto medio)
      
      // Función para dibujar una barra redondeada entre dos vértices
      const dibujarBarraRedondeada = (vertice1: { x: number; y: number }, vertice2: { x: number; y: number }) => {
        const angulo = Math.atan2(vertice2.y - vertice1.y, vertice2.x - vertice1.x);
        const distancia = Math.sqrt(
          (vertice2.x - vertice1.x) ** 2 + (vertice2.y - vertice1.y) ** 2
        );
        // Agregar offset extra para cubrir completamente las coordenadas
        const distanciaExtendida = distancia + offsetExtra;
        const centroX = (vertice1.x + vertice2.x) / 2;
        const centroY = (vertice1.y + vertice2.y) / 2;
        
        ctx.save();
        ctx.translate(centroX, centroY);
        ctx.rotate(angulo);
        ctx.beginPath();
        // Usar roundRect con radio para bordes circulares, extendida para cubrir coordenadas
        ctx.roundRect(-distanciaExtendida / 2, -barraWidthTri / 2, distanciaExtendida, barraWidthTri, radioEsquina);
        ctx.fillStyle = '#e0e0e0';
        ctx.fill();
        ctx.restore();
      };
      
      // Lado superior-izquierdo: desde vértice superior hasta vértice inferior izquierdo
      dibujarBarraRedondeada(verticeSuperior, verticeInferiorIzquierdo);
      
      // Lado superior-derecho: desde vértice superior hasta vértice inferior derecho
      dibujarBarraRedondeada(verticeSuperior, verticeInferiorDerecho);
      
      // Lado inferior: desde vértice inferior izquierdo hasta vértice inferior derecho
      dibujarBarraRedondeada(verticeInferiorIzquierdo, verticeInferiorDerecho);
      
      // Añadir tapas circulares en los vértices para perfeccionar las esquinas
      const radioTapa = barraWidthTri / 2; // mismo radio que las barras para uniones perfectas
      ctx.beginPath();
      ctx.arc(verticeSuperior.x, verticeSuperior.y, radioTapa, 0, 2 * Math.PI);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(verticeInferiorIzquierdo.x, verticeInferiorIzquierdo.y, radioTapa, 0, 2 * Math.PI);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(verticeInferiorDerecho.x, verticeInferiorDerecho.y, radioTapa, 0, 2 * Math.PI);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      
      // Dibujar líneas rojas punteadas siguiendo los lados, desde vértice a vértice exactamente
      // Lado superior-izquierdo: desde vértice superior hasta vértice inferior izquierdo
      ctx.save();
      ctx.setLineDash([15, 6]);
      ctx.beginPath();
      ctx.moveTo(verticeSuperior.x, verticeSuperior.y);
      ctx.lineTo(verticeInferiorIzquierdo.x, verticeInferiorIzquierdo.y);
      ctx.strokeStyle = '#E30613';
      ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      
      // Lado superior-derecho: desde vértice superior hasta vértice inferior derecho
      ctx.save();
      ctx.setLineDash([15, 6]);
      ctx.beginPath();
      ctx.moveTo(verticeSuperior.x, verticeSuperior.y);
      ctx.lineTo(verticeInferiorDerecho.x, verticeInferiorDerecho.y);
      ctx.strokeStyle = '#E30613';
      ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      
      // Lado inferior: desde vértice inferior izquierdo hasta vértice inferior derecho
      ctx.save();
      ctx.setLineDash([15, 6]);
      ctx.beginPath();
      ctx.moveTo(verticeInferiorIzquierdo.x, verticeInferiorIzquierdo.y);
      ctx.lineTo(verticeInferiorDerecho.x, verticeInferiorDerecho.y);
      ctx.strokeStyle = '#E30613';
      ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      
      // Círculos en los 3 vértices del triángulo - exactamente en los vértices
      // Vértice superior: CÍRCULO NEGRO
      ctx.beginPath();
      ctx.arc(verticeSuperior.x, verticeSuperior.y, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#000000';
      ctx.fill();
      
      // Vértice inferior derecho: CÍRCULO BLANCO
      ctx.beginPath();
      ctx.arc(verticeInferiorDerecho.x, verticeInferiorDerecho.y, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      
      // Vértice inferior izquierdo: CÍRCULO BLANCO
      ctx.beginPath();
      ctx.arc(verticeInferiorIzquierdo.x, verticeInferiorIzquierdo.y, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      
    } else if (esCruz) {
      // Para cruz: dibujar forma completa similar a círculo y cuadrado
      console.log('🔍 SVG - Dibujando cruz...');
      
      // Calcular el centro de la cruz
      const centroX = coordsTransformadas.reduce((sum, p) => sum + p.x, 0) / coordsTransformadas.length;
      const centroY = coordsTransformadas.reduce((sum, p) => sum + p.y, 0) / coordsTransformadas.length;
      
      // Calcular la longitud de los brazos
      const minX = Math.min(...coordsTransformadas.map(p => p.x));
      const maxX = Math.max(...coordsTransformadas.map(p => p.x));
      const minY = Math.min(...coordsTransformadas.map(p => p.y));
      const maxY = Math.max(...coordsTransformadas.map(p => p.y));
      
      const longitudHorizontal = maxX - minX;
      const longitudVertical = maxY - minY;
      
      console.log('🔍 SVG Cruz - Centro:', centroX, centroY, 'Longitud H:', longitudHorizontal, 'V:', longitudVertical);
      
      // NO dibujar fondo circular - la cruz solo necesita las barras grises
      // Dibujar barras grises de la cruz
      const offsetExtraCruz = 60; // alargar un poco ambos brazos
      const barraLengthH = longitudHorizontal + offsetExtraCruz;
      const barraLengthV = longitudVertical + offsetExtraCruz;
      
      // Brazo horizontal
      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.beginPath();
      ctx.roundRect(-barraLengthH / 2, -barraWidth / 2, barraLengthH, barraWidth, barraWidth / 2);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      ctx.restore();

      // Brazo vertical
      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.beginPath();
      ctx.roundRect(-barraWidth / 2, -barraLengthV / 2, barraWidth, barraLengthV, barraWidth / 2);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      ctx.restore();

      // Dibujar líneas rojas punteadas siguiendo los brazos
      // Brazo horizontal
      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.beginPath();
      ctx.setLineDash([15, 6]);
      ctx.moveTo(-barraLengthH / 2 + radioCirculo + separacionCirculos, 0);
      ctx.lineTo(barraLengthH / 2 - radioCirculo - separacionCirculos, 0);
      ctx.strokeStyle = '#E30613';
      ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Brazo vertical
      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.beginPath();
      ctx.setLineDash([15, 6]);
      ctx.moveTo(0, -barraLengthV / 2 + radioCirculo + separacionCirculos);
      ctx.lineTo(0, barraLengthV / 2 - radioCirculo - separacionCirculos);
      ctx.strokeStyle = '#E30613';
      ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Círculos en los extremos de la cruz - exactamente en los extremos de las líneas rojas
      const pxPorMM_cruz = 96 / 25.4;
      const offsetCirculo = radioCirculo + separacionCirculos + (1 * pxPorMM_cruz); // +1mm desde el borde

      // Extremo izquierdo (brazo horizontal): CÍRCULO NEGRO
      const extremoIzqX = centroX - (barraLengthH / 2 - offsetCirculo);
      ctx.beginPath();
      ctx.arc(extremoIzqX, centroY, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Extremo derecho (brazo horizontal): CÍRCULO BLANCO
      const extremoDerX = centroX + (barraLengthH / 2 - offsetCirculo);
      ctx.beginPath();
      ctx.arc(extremoDerX, centroY, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();

      // Extremo superior (brazo vertical): CÍRCULO BLANCO
      const extremoSuperiorY = centroY - (barraLengthV / 2 - offsetCirculo);
      ctx.beginPath();
      ctx.arc(centroX, extremoSuperiorY, radioCirculo, 0, 2 * Math.PI);
  // Cambiado a negro según solicitud: el punto superior debe ser negro
  ctx.fillStyle = '#000000';
      ctx.fill();

      // Extremo inferior (brazo vertical): CÍRCULO BLANCO
      const extremoInferiorY = centroY + (barraLengthV / 2 - offsetCirculo);
      ctx.beginPath();
      ctx.arc(centroX, extremoInferiorY, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
      
    } else {
      // Para líneas simples: comportamiento original (SIN CAMBIOS)
      console.log('🔍 SVG - Dibujando línea simple (comportamiento original)...');
      
      const barraLength = longitud + 60;
      const centroX = (startPoint.x + endPoint.x) / 2;
      const centroY = (startPoint.y + endPoint.y) / 2;
      
      // Guardar el estado del canvas
      ctx.save();
      
      // Rotar el canvas para la barra diagonal
      ctx.translate(centroX, centroY);
      ctx.rotate(angulo);
      
      // Dibujar sombra de la barra diagonal
      ctx.beginPath();
      ctx.roundRect(-barraLength/2 + 2, -barraWidth/2 + 2, barraLength, barraWidth, barraWidth / 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fill();
      
      // Dibujar barra gris diagonal con esquinas redondeadas
      ctx.beginPath();
      ctx.roundRect(-barraLength/2, -barraWidth/2, barraLength, barraWidth, barraWidth / 2);
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      
      // Dibujar línea roja punteada diagonal
      ctx.beginPath();
      ctx.setLineDash([15, 6]);
      ctx.moveTo(-longitud/2 + radioCirculo + separacionCirculos, 0);
      ctx.lineTo(longitud/2 - radioCirculo - separacionCirculos, 0);
      ctx.strokeStyle = '#E30613';
      ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Restaurar el estado del canvas
      ctx.restore();
      
      // Dibujar círculos en las posiciones originales (POR ENCIMA de la barra)
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#000000';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(endPoint.x, endPoint.y, radioCirculo, 0, 2 * Math.PI);
      ctx.fillStyle = '#f5f5f5';
      ctx.fill();
    }
  };

  const drawModeloCentrado = (ctx: CanvasRenderingContext2D) => {
    console.log('🔍 drawModeloCentrado llamada');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (coordsModelo.length < 2) {
      console.log('❌ coordsModelo insuficientes:', coordsModelo.length);
      return;
    }
    
    console.log('🔍 coordsModelo:', coordsModelo.length, 'puntos');

    const bbox = getBoundingBox(coordsModelo);
    const modelWidth = bbox.maxX - bbox.minX;
    const modelHeight = bbox.maxY - bbox.minY;

    const scaleX = window.innerWidth * 0.6 / modelWidth;
    const scaleY = window.innerHeight * 0.6 / modelHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (window.innerWidth - modelWidth * scale) / 2;
    const offsetY = (window.innerHeight - modelHeight * scale) / 2;

    const transformX = (x: number) => (x - bbox.minX) * scale + offsetX;
    const transformY = (y: number) => (y - bbox.minY) * scale + offsetY;

    const coordsTransformadas = coordsModelo.map(([x, y]) => ({
      x: transformX(x),
      y: transformY(y)
    }));

    // Dibujar línea de coordenadas original PRIMERO (por debajo)
    // Triángulo, X y cruz siempre deben dibujarse con líneas rectas para preservar las esquinas y líneas
    const esTriangulo = ejercicioId === 'triangulo';
    const esLineaX = ejercicioId === 'linea_x';
    const esCruz = ejercicioId === 'cruz';
    const debeSuavizar = suavizarModelo && !esTriangulo && !esLineaX && !esCruz;
    
    // Para X y cruz, dibujar cada línea por separado para evitar líneas diagonales extra
    if (esLineaX || esCruz) {
      // Encontrar dónde cambia la dirección significativamente (separación entre líneas)
      // Para X: hay 2 líneas diagonales
      // Para cruz: hay 2 líneas (horizontal y vertical)
      
      if (esLineaX) {
        // Dividir en 2 líneas: primera diagonal y segunda diagonal
        const mitad = Math.floor(coordsTransformadas.length / 2);
        const primeraLinea = coordsTransformadas.slice(0, mitad);
        const segundaLinea = coordsTransformadas.slice(mitad);
        
        // Dibujar primera línea
        ctx.beginPath();
        ctx.moveTo(primeraLinea[0].x, primeraLinea[0].y);
        for (let i = 1; i < primeraLinea.length; i++) {
          ctx.lineTo(primeraLinea[i].x, primeraLinea[i].y);
        }
        ctx.strokeStyle = colorModelo;
        ctx.lineWidth = (grosorLineaCoordenadas || grosorModelo) * (window.devicePixelRatio || 1);
        ctx.stroke();
        
        // Dibujar segunda línea (sin conectar con la primera)
        ctx.beginPath();
        ctx.moveTo(segundaLinea[0].x, segundaLinea[0].y);
        for (let i = 1; i < segundaLinea.length; i++) {
          ctx.lineTo(segundaLinea[i].x, segundaLinea[i].y);
        }
        ctx.stroke();
      } else if (esCruz) {
        // Dividir en 2 líneas: brazo horizontal y brazo vertical
        const mitad = Math.floor(coordsTransformadas.length / 2);
        const primeraLinea = coordsTransformadas.slice(0, mitad);
        const segundaLinea = coordsTransformadas.slice(mitad);
        
        // Dibujar primera línea (brazo horizontal)
        ctx.beginPath();
        ctx.moveTo(primeraLinea[0].x, primeraLinea[0].y);
        for (let i = 1; i < primeraLinea.length; i++) {
          ctx.lineTo(primeraLinea[i].x, primeraLinea[i].y);
        }
        ctx.strokeStyle = colorModelo;
        ctx.lineWidth = (grosorLineaCoordenadas || grosorModelo) * (window.devicePixelRatio || 1);
        ctx.stroke();
        
        // Dibujar segunda línea (brazo vertical) - sin conectar con la primera
        ctx.beginPath();
        ctx.moveTo(segundaLinea[0].x, segundaLinea[0].y);
        for (let i = 1; i < segundaLinea.length; i++) {
          ctx.lineTo(segundaLinea[i].x, segundaLinea[i].y);
        }
        ctx.stroke();
      }
    } else {
      // Para otras formas, dibujar normalmente
    ctx.beginPath();
    ctx.moveTo(coordsTransformadas[0].x, coordsTransformadas[0].y);

      if (debeSuavizar) {
      for (let i = 1; i < coordsTransformadas.length - 1; i++) {
        const p1 = coordsTransformadas[i];
        const p2 = coordsTransformadas[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      const last = coordsTransformadas[coordsTransformadas.length - 1];
      ctx.lineTo(last.x, last.y);
    } else {
        // Para triángulo y otras formas, usar líneas rectas
      for (let i = 1; i < coordsTransformadas.length; i++) {
        const p = coordsTransformadas[i];
        ctx.lineTo(p.x, p.y);
      }
    }

    if (cerrarTrazo) ctx.closePath();

    if (rellenarModelo) {
      ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
      ctx.fill();
    }

    ctx.strokeStyle = colorModelo;
    ctx.lineWidth = (grosorLineaCoordenadas || grosorModelo) * (window.devicePixelRatio || 1);
    ctx.stroke();
    }
    
    // El stroke y fill ya se aplicaron arriba para X y cruz
    // Para otras formas, ya se aplicó en el bloque else

    // Dibujar SVG DESPUÉS (por encima de la línea de coordenadas)
    console.log('🔍 Llamando drawSVGEnCanvas con:', coordsTransformadas.length, 'puntos');
    drawSVGEnCanvas(ctx, coordsTransformadas);

    if (onModeloTransformado) onModeloTransformado(coordsTransformadas);
  };

  const getExactPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    
    // No escalamos porque el contexto del canvas ya está escalado con ctx.scale(dpr, dpr)
    // Las coordenadas deben estar en el espacio CSS del canvas
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getExactPos(e);
    
    // Si permite multi-trazo, empezar nuevo stroke sin limpiar el canvas
    // Si no, limpiar el canvas para empezar desde cero
    if (!permiteMultiTrazo) {
      const ctx = canvasRef.current!.getContext('2d')!;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    
    coordsRef.current = [pos];
    
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    // Si permite multi-trazo, redibujar todos los strokes anteriores
    if (permiteMultiTrazo && strokesRef.current.length > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * (window.devicePixelRatio || 1);
      for (const stroke of strokesRef.current) {
        if (stroke.length === 0) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
      // Volver a empezar el path para el nuevo stroke
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    
    // Capturar el pointer para dispositivos táctiles
    try {
      if (e.target instanceof HTMLElement) {
        e.target.setPointerCapture(e.pointerId);
      }
    } catch (err) {
      // Ignorar errores si setPointerCapture no está disponible
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    
    const pos = getExactPos(e);
    coordsRef.current.push(pos);
    
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * (window.devicePixelRatio || 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    
    try {
      if (e.target instanceof HTMLElement) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {
      // Ignorar errores si releasePointerCapture no está disponible
    }
    
    isDrawingRef.current = false;
    
    // Si permite multi-trazo (X o cruz), guardar el stroke pero solo evaluar cuando haya 2 strokes completos
    if (permiteMultiTrazo) {
      if (coordsRef.current.length > 0) {
        strokesRef.current.push([...coordsRef.current]);
        coordsRef.current = []; // Limpiar para el próximo trazo, pero mantener strokesRef
      }
      
      // Solo evaluar cuando haya exactamente 2 strokes completos (para X y cruz)
      if (strokesRef.current.length >= 2) {
        const todasLasCoords = strokesRef.current.flat();
        if (todasLasCoords.length > 0) {
          onFinishDraw(todasLasCoords);
        }
      }
      // Si hay menos de 2 strokes, NO llamar a onFinishDraw (no evaluar todavía)
    } else {
      // Para formas normales, limpiar y enviar inmediatamente
      onFinishDraw([...coordsRef.current]);
      coordsRef.current = [];
    }
  };

  const handlePointerLeave = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      
      // Si permite multi-trazo, guardar el stroke pero solo evaluar cuando haya 2 strokes
      if (permiteMultiTrazo) {
        if (coordsRef.current.length > 0) {
          strokesRef.current.push([...coordsRef.current]);
        }
        
        // Solo evaluar cuando haya exactamente 2 strokes completos (para X y cruz)
        if (strokesRef.current.length >= 2) {
          const todasLasCoords = strokesRef.current.flat();
          if (todasLasCoords.length > 0) {
            onFinishDraw(todasLasCoords);
          }
        }
        // Si hay menos de 2 strokes, NO llamar a onFinishDraw (no evaluar todavía)
      } else {
    onFinishDraw([...coordsRef.current]);
        coordsRef.current = [];
      }
    }
  };

  // Limpiar strokes cuando cambia el ejercicio (especialmente importante para X y cruz)
  useEffect(() => {
    strokesRef.current = [];
    coordsRef.current = [];
  }, [ejercicioId]);

  useEffect(() => {
    console.log('🔍 PizarraConSVG useEffect ejecutándose');
    const canvas = canvasRef.current;
    const canvasSVG = canvasSVGRef.current;
    
    if (!canvas || !canvasSVG) {
      console.log('❌ Canvas no encontrado');
      return;
    }
    
    console.log('✅ Canvas encontrado, configurando...');

    const dpr = window.devicePixelRatio || 1;
    
    // Usar dimensiones fijas en lugar de getBoundingClientRect
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Configurar canvas de dibujo (transparente, encima)
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.globalCompositeOperation = 'source-over';
    
    // Configurar canvas SVG (fondo, debajo)
    canvasSVG.width = width * dpr;
    canvasSVG.height = height * dpr;
    canvasSVG.style.width = `${width}px`;
    canvasSVG.style.height = `${height}px`;
    
    const ctxSVG = canvasSVG.getContext('2d')!;
    ctxSVG.scale(dpr, dpr);
    
    
    // Dibujar modelo y SVG en el canvas de fondo
    drawModeloCentrado(ctxSVG);
  }, [coordsModelo, background, colorModelo, grosorModelo, rellenarModelo, cerrarTrazo, suavizarModelo, ejercicioId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Canvas de fondo para SVG y modelo */}
      <canvas
        ref={canvasSVGRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
      
      {/* Canvas de dibujo (transparente, encima) */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          background: 'transparent',
          cursor: 'default',
          touchAction: 'none'
        }}
      />
    </div>
  );
});

PizarraConSVG.displayName = 'PizarraConSVG';

export default PizarraConSVG;
