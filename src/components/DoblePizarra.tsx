import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import './DoblePizarra.css';
import { usePointerStrokes } from '../hooks/usePointerStrokes';
import { dibujosService } from '../services/dibujosService.ts';
import type { EvaluarMetricasPayload, Stroke } from '../models/Dibujo';
import ModalEvaluacionMetricas from './ModalEvaluacionMetricas';
import { computeExtras } from '../utils/geometryMetrics';

interface DoblePizarraProps {
  color?: string;
  lineWidth?: number;
  background?: string;
  onFinishDraw?: (coords: { x: number; y: number }[]) => void;
  // Backward compatible: flattened model path
  onModeloTransformado?: (coords: { x: number; y: number }[]) => void;
  coordsModelo?: [number, number][];
  // New: multi-stroke support
  onModeloTransformadoMulti?: (strokes: { x: number; y: number }[][]) => void;
  coordsModeloMulti?: [number, number][][];
  colorModelo?: string;
  grosorModelo?: number;
  rellenarModelo?: boolean;
  cerrarTrazo?: boolean;
  suavizarModelo?: boolean;
  posicionFigura?: 'izquierda' | 'derecha';
  cambiarPosicionFigura?: (nuevaPosicion: 'izquierda' | 'derecha') => void;
  figuraObjetivo?: EvaluarMetricasPayload['figura_objetivo'];
  puntosRemuestreo?: number;
  showEvaluateButton?: boolean;
  onEvaluacionResultado?: (resultado: any) => void;
}

const DoblePizarra = forwardRef(({
  color = 'black',
  lineWidth = 2,
  background = '#fff',
  onFinishDraw,
  onModeloTransformado,
  coordsModelo = [],
  onModeloTransformadoMulti,
  coordsModeloMulti,
  colorModelo = '#aaaaaa',
  grosorModelo = 6,
  rellenarModelo = false,
  cerrarTrazo = true,
  suavizarModelo = true,
  posicionFigura = 'izquierda',
  cambiarPosicionFigura,
  figuraObjetivo,
  puntosRemuestreo,
  showEvaluateButton,
  onEvaluacionResultado
}: DoblePizarraProps, ref) => {
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  // Dos capas: modelo (fondo) y dibujo del usuario (superior)
  const modelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  // Captura multi-trazo con t global y pressure
  // Reducir minDeltaPx para capturar más puntos y hacer la línea más fluida
  const { strokes, currentStroke, reset, onPointerDown, onPointerMove, onPointerUp } = usePointerStrokes({ sampleMs: 8, minDeltaPx: 1 });
  const lastModeloSigRef = useRef<string>("");
  const lastPointerIdRef = useRef<number | null>(null);
  // Guardar última versión transformada del modelo para formar payload
  const modeloTransformadoMultiRef = useRef<{ x: number; y: number }[][]>([]);
  // Modo "lápiz" para tabletas: si detectamos un stylus, restringimos a pen
  const [penModeActive, setPenModeActive] = useState(false);

  useImperativeHandle(ref, () => ({
    limpiar: () => {
      const dctx = drawCtxRef.current;
      if (!dctx) return;
      // Limpiar estado y canvas de usuario
      reset();
      dctx.clearRect(0, 0, dctx.canvas.width, dctx.canvas.height);
      // Redibujar modelo en caso de que sea necesario
      const mctx = modelCtxRef.current;
      if (mctx) drawModeloCentrado(mctx);
    },
    getStrokes: (): Stroke[] => strokes as Stroke[],
    enviarEvaluarMetricas: async (opts?: { figura_objetivo?: EvaluarMetricasPayload['figura_objetivo']; puntos_remuestreo?: number }) => {
      const modelo = modeloTransformadoMultiRef.current && modeloTransformadoMultiRef.current.length
        ? modeloTransformadoMultiRef.current.map((trazo, i) => trazo.map(p => ({ x: p.x, y: p.y, stroke: i })))
        : [];
      const paciente = ((strokes as Stroke[]) || []).map((trazo, i) => trazo.map(p => ({ ...p, stroke: i })));
      // Extras de orientación/curvatura que el backend puede usar
      const modeloFlat = modeloTransformadoMultiRef.current.flat();
      const pacienteFlat = (strokes as any[])?.flat?.() || [];
      const extras = computeExtras(modeloFlat, pacienteFlat);
      // Orientación esperada derivada de figura_objetivo
      const fig = (opts?.figura_objetivo || '').toString().toLowerCase();
      let orientation_expected: string | undefined;
      let orientation_target_deg: number | undefined;
      if (fig.includes('linea_vertical') || fig.includes('línea_vertical')) { orientation_expected = 'vertical'; orientation_target_deg = 90; }
      else if (fig.includes('linea_horizontal') || fig.includes('línea_horizontal')) { orientation_expected = 'horizontal'; orientation_target_deg = 0; }
      else if (fig.includes('circulo') || fig.includes('círculo')) { orientation_expected = 'circle'; }
      const payload: EvaluarMetricasPayload = {
        coordenadas_modelo: modelo,
        coordenadas_paciente: paciente,
        puntos_remuestreo: opts?.puntos_remuestreo ?? 300,
        figura_objetivo: opts?.figura_objetivo,
        debug: true,
        client_metrics: extras,
        orientation_expected,
        orientation_target_deg,
        procrustes_align: true,
        dtw: {
          enabled: true,
          backend: 'tslearn',
          window: 'sakoe-chiba',
          window_param: 0.1,
          normalize: 'path-length',
          multi_stroke_mode: 'per_stroke_match',
          stroke_resample_points: 60,
          unmatched_stroke_penalty: 5.0
        }
      };
      return await dibujosService.evaluarMetricas(payload);
    }
  }));

  // Inicialización y resize: configurar tamaños
  useEffect(() => {
    const setup = () => {
      const mCanvas = modelCanvasRef.current;
      const dCanvas = drawCanvasRef.current;
      if (!mCanvas || !dCanvas) return;

      const dpr = window.devicePixelRatio || 1;
      // Config modelo
      mCanvas.width = window.innerWidth * dpr;
      mCanvas.height = window.innerHeight * dpr;
      mCanvas.style.width = '100vw';
      mCanvas.style.height = '100vh';
      const mctx = mCanvas.getContext('2d');
      if (!mctx) return;
      mctx.setTransform(1, 0, 0, 1, 0, 0);
      mctx.scale(dpr, dpr);
      modelCtxRef.current = mctx;

      // Config dibujo usuario
      dCanvas.width = window.innerWidth * dpr;
      dCanvas.height = window.innerHeight * dpr;
      dCanvas.style.width = '100vw';
      dCanvas.style.height = '100vh';
      const dctx = dCanvas.getContext('2d');
      if (!dctx) return;
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      dctx.scale(dpr, dpr);
      drawCtxRef.current = dctx;

      // Redibujar modelo
      drawModeloCentrado(mctx);
      // Redibujar los trazos del usuario vigentes en el nuevo contexto
      redrawUserCanvas();
    };

    setup();
    const onResize = () => setup();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Redibujar el modelo cuando cambian sus props/estilos, sin tocar el canvas de usuario
  useEffect(() => {
    const mctx = modelCtxRef.current;
    if (mctx) drawModeloCentrado(mctx);
  }, [coordsModelo, coordsModeloMulti, cerrarTrazo, grosorModelo, colorModelo, rellenarModelo, suavizarModelo, posicionFigura, background]);

  const getBoundingBox = (coords: [number, number][]) => {
    const xs = coords.map(c => c[0]);
    const ys = coords.map(c => c[1]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  };

  const drawModeloCentrado = (ctx: CanvasRenderingContext2D) => {
    // Solo limpia y pinta el canvas del modelo
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Determinar fuente de modelo: multi-stroke o simple
    const strokesRaw: [number, number][][] = coordsModeloMulti && coordsModeloMulti.length
      ? coordsModeloMulti
      : (coordsModelo.length ? [coordsModelo] : []);
    if (strokesRaw.length === 0) return;

    // Bounding box sobre todos los puntos
    const allPoints: [number, number][] = strokesRaw.flat();
    const bbox = getBoundingBox(allPoints);
    const modelWidth = bbox.maxX - bbox.minX;
    const modelHeight = bbox.maxY - bbox.minY;

    // Para doble pizarra, cada pizarra ocupa la mitad del ancho
    const pizarraWidth = window.innerWidth / 2;
    const pizarraHeight = window.innerHeight;

    const scaleX = pizarraWidth * 0.8 / modelWidth;
    const scaleY = pizarraHeight * 0.6 / modelHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calcular offset basado en la posición de la figura
    const offsetX = posicionFigura === 'izquierda' 
      ? (pizarraWidth - modelWidth * scale) / 2
      : pizarraWidth + (pizarraWidth - modelWidth * scale) / 2;
    
    const offsetY = (pizarraHeight - modelHeight * scale) / 2;

    const transformX = (x: number) => (x - bbox.minX) * scale + offsetX;
    const transformY = (y: number) => (y - bbox.minY) * scale + offsetY;

    // Transformar cada trazo
    const strokesTransformadas = strokesRaw.map(stroke =>
      stroke.map(([x, y]) => ({ x: transformX(x), y: transformY(y) }))
    );

    // Dibujar cada trazo de forma independiente
    ctx.strokeStyle = colorModelo;
    ctx.lineWidth = grosorModelo * (window.devicePixelRatio || 1);
    for (const trazo of strokesTransformadas) {
      if (trazo.length < 2) continue;
      ctx.beginPath();
      // Asegurar esquinas y extremos rectos para el modelo
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
      ctx.moveTo(trazo[0].x, trazo[0].y);

      if (suavizarModelo) {
        for (let i = 1; i < trazo.length - 1; i++) {
          const p1 = trazo[i];
          const p2 = trazo[i + 1];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        const last = trazo[trazo.length - 1];
        ctx.lineTo(last.x, last.y);
      } else {
        for (let i = 1; i < trazo.length; i++) {
          const p = trazo[i];
          ctx.lineTo(p.x, p.y);
        }
      }

      if (cerrarTrazo) ctx.closePath();
      if (rellenarModelo) {
        ctx.fillStyle = 'rgba(200, 200, 200, 0.2)';
        ctx.fill();
      }
      ctx.stroke();
    }

    // Emitir transformado (flatten + multi)
    const flatten = strokesTransformadas.flat();
    if (onModeloTransformado) {
      const sig = JSON.stringify(flatten.map(p => [Math.round(p.x), Math.round(p.y)]));
      if (sig !== lastModeloSigRef.current) {
        lastModeloSigRef.current = sig;
        console.log('🔍 DoblePizarra - Enviando modelo transformado:', flatten.length, 'puntos');
        onModeloTransformado(flatten);
      }
    }
    if (onModeloTransformadoMulti) {
      onModeloTransformadoMulti(strokesTransformadas);
    }
    // Guardar para payload de evaluación
    modeloTransformadoMultiRef.current = strokesTransformadas;
    // No tocar el path del canvas de dibujo aquí
  };

  // Redibujar trazo(s) del usuario desde el hook en su propio canvas
  const redrawUserCanvas = () => {
    const dctx = drawCtxRef.current;
    const dCanvas = drawCanvasRef.current;
    if (!dctx || !dCanvas) return;
    dctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
    dctx.strokeStyle = color;
    dctx.lineWidth = lineWidth * (window.devicePixelRatio || 1) / (window.devicePixelRatio || 1); // lineWidth en unidades CSS
    // Usar 'round' para esquinas y extremos suaves y fluidos
    dctx.lineJoin = 'round';
    dctx.lineCap = 'round';

    const drawStrokes = [...(strokes as { x: number; y: number }[][]), (currentStroke as { x: number; y: number }[] || [])];
    for (const stroke of drawStrokes) {
      if (stroke.length === 0) continue;
      
      // Si solo hay un punto, dibujar un pequeño círculo
      if (stroke.length === 1) {
        dctx.beginPath();
        dctx.arc(stroke[0].x, stroke[0].y, lineWidth / 2, 0, Math.PI * 2);
        dctx.fill();
        continue;
      }
      
      dctx.beginPath();
      dctx.moveTo(stroke[0].x, stroke[0].y);
      
      // Suavizado fluido: conectar todos los puntos con curvas cuadráticas continuas
      if (stroke.length === 2) {
        // Si solo hay 2 puntos, línea directa
        dctx.lineTo(stroke[1].x, stroke[1].y);
      } else if (stroke.length >= 3) {
        // Para 3 o más puntos, usar curvas cuadráticas continuas
        for (let i = 1; i < stroke.length - 1; i++) {
          const curr = stroke[i];
          const next = stroke[i + 1];
          // Punto medio entre el actual y el siguiente como punto final de la curva
          const midX = (curr.x + next.x) / 2;
          const midY = (curr.y + next.y) / 2;
          // Usar el punto actual como punto de control
          dctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
        }
        // Conectar al último punto
        const last = stroke[stroke.length - 1];
        dctx.lineTo(last.x, last.y);
      }
      
      if (cerrarTrazo) dctx.closePath();
      dctx.stroke();
    }
  };

  // Redibuja el canvas de usuario cuando cambian los trazos o el estilo
  useEffect(() => {
    redrawUserCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, currentStroke, color, lineWidth, cerrarTrazo]);

  const stopDrawing = () => {
    // El cierre del path lo maneja el hook en onPointerUp; aquí solo liberamos capture y notificamos legacy
    try {
      if (lastPointerIdRef.current != null) {
        drawCanvasRef.current?.releasePointerCapture?.(lastPointerIdRef.current);
        lastPointerIdRef.current = null;
      }
    } catch {}
    
    // Enviar las coordenadas del último trazo finalizado
    if (onFinishDraw) {
      const lastStroke = (strokes[strokes.length - 1] as { x: number; y: number }[]) || [];
      onFinishDraw(lastStroke);
    }
  };

  return (
    <div 
      className="doble-pizarra-container" 
      data-posicion-figura={posicionFigura}
    >
      <div className="etiqueta-dibujo">Área de dibujo</div>
      
      {/* Botón para cambiar posición de la figura */}
      {cambiarPosicionFigura && (
        <button
          className="cambiar-posicion-btn"
          onClick={() => cambiarPosicionFigura(posicionFigura === 'izquierda' ? 'derecha' : 'izquierda')}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'linear-gradient(135deg, #e30613, #c5050f)',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s'
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {posicionFigura === 'izquierda' ? 'Figura →' : '← Figura'}
        </button>
      )}

      {/* Botón Evaluar (opcional) */}
      {(
        // Mostrar solo si se pide y hay trazos para evaluar
        (typeof showEvaluateButton !== 'undefined' ? showEvaluateButton : true)
      ) && (
        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 1000, display: 'flex', gap: 8 }}>
          <button
            onClick={async () => {
              setEvalError(null);
              setEvalLoading(true);
              try {
                const modelo = modeloTransformadoMultiRef.current && modeloTransformadoMultiRef.current.length
                  ? modeloTransformadoMultiRef.current.map((trazo, i) => trazo.map(p => ({ x: p.x, y: p.y, stroke: i })))
                  : [];
                const paciente = ((strokes as any[]) || []).map((trazo: any[], i: number) => trazo.map((p: any) => ({ ...p, stroke: i })));
                // Extras hacia backend
                const modeloFlat = modeloTransformadoMultiRef.current.flat();
                const pacienteFlat = (strokes as any[])?.flat?.() || [];
                const extras = computeExtras(modeloFlat, pacienteFlat);
                // Orientación esperada desde props
                let orientation_expected: string | undefined;
                let orientation_target_deg: number | undefined;
                const fgoal = (figuraObjetivo || '').toString().toLowerCase();
                if (fgoal.includes('linea_vertical') || fgoal.includes('línea_vertical')) { orientation_expected = 'vertical'; orientation_target_deg = 90; }
                else if (fgoal.includes('linea_horizontal') || fgoal.includes('línea_horizontal')) { orientation_expected = 'horizontal'; orientation_target_deg = 0; }
                else if (fgoal.includes('circulo') || fgoal.includes('círculo')) { orientation_expected = 'circle'; }
                const payload: EvaluarMetricasPayload = {
                  coordenadas_modelo: modelo,
                  coordenadas_paciente: paciente,
                  puntos_remuestreo: typeof puntosRemuestreo === 'number' ? puntosRemuestreo : 300,
                  figura_objetivo: figuraObjetivo,
                  debug: true,
                  client_metrics: extras,
                  orientation_expected,
                  orientation_target_deg,
                  procrustes_align: true,
                  dtw: {
                    enabled: true,
                    backend: 'tslearn',
                    window: 'sakoe-chiba',
                    window_param: 0.1,
                    normalize: 'path-length',
                    multi_stroke_mode: 'per_stroke_match',
                    stroke_resample_points: 60,
                    unmatched_stroke_penalty: 5.0
                  }
                };
                const res = await dibujosService.evaluarMetricas(payload);
                // Calcular métricas extra (ángulo, curvatura, ajuste a círculo)
                const enriched = { ...res, cliente_extra: extras };
                setEvalResult(enriched);
                onEvaluacionResultado?.(res);
                // Feedback mínimo si no hay callback
                if (!onEvaluacionResultado) {
                  // eslint-disable-next-line no-console
                  console.log('Evaluación métricas:', enriched);
                }
              } catch (e: any) {
                const msg = e?.message || 'Error en evaluación';
                setEvalError(msg);
              } finally {
                setEvalLoading(false);
              }
            }}
            disabled={evalLoading || !(strokes && (strokes as any[])?.length > 0)}
            style={{
              background: '#E30613', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8,
              fontWeight: 600, cursor: evalLoading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {evalLoading ? 'Evaluando…' : 'Evaluar métricas'}
          </button>

          <button
            onClick={() => { setEvalError(null); reset(); redrawUserCanvas(); }}
            disabled={evalLoading}
            style={{
              background: '#6b7280', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8,
              fontWeight: 600, cursor: evalLoading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            Limpiar
          </button>
        </div>
      )}

      {evalError && (
        <div style={{ position: 'absolute', bottom: 70, right: 20, background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 8, zIndex: 1000 }}>
          {evalError}
        </div>
      )}

      <ModalEvaluacionMetricas
        open={!!evalResult}
        onClose={() => setEvalResult(null)}
        resultado={evalResult}
      />
      
      {/* Capa modelo */}
      <canvas
        ref={modelCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background,
          display: 'block'
        }}
        aria-hidden
      />
      {/* Capa dibujo usuario */}
      <canvas
        ref={drawCanvasRef}
        onPointerDown={(e) => {
          e.preventDefault();
          // Activar modo lápiz al detectar pen; bloquear otros punteros si está activo
          if (e.pointerType === 'pen' && !penModeActive) setPenModeActive(true);
          if (penModeActive && e.pointerType !== 'pen') return;
          onPointerDown(e);
          try { (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId); lastPointerIdRef.current = e.pointerId; } catch {}
        }}
        onPointerMove={(e) => {
          e.preventDefault();
          if (penModeActive && e.pointerType !== 'pen') return;
          onPointerMove(e);
        }}
        onPointerUp={(e) => { onPointerUp(e); stopDrawing(); }}
        onPointerLeave={stopDrawing}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          touchAction: 'none',
          display: 'block'
        }}
      />
    </div>
  );
});

export default DoblePizarra;
