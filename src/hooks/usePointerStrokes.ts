import { useCallback, useMemo, useRef, useState } from "react";
import type { Stroke, StrokePoint } from "../models/Dibujo";

export interface PointerStrokesOptions {
  sampleMs?: number; // 10–16ms recomendado
  minDeltaPx?: number; // 2–3px recomendado
}

export interface UsePointerStrokes {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  reset: () => void;
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e?: React.PointerEvent<HTMLElement>) => void;
}

/**
 * Captura multi-trazo con t global (ms) y pressure (si disponible).
 * Usa heurísticas de muestreo por tiempo y distancia para limitar payload.
 */
export function usePointerStrokes(opts: PointerStrokesOptions = {}): UsePointerStrokes {
  const { sampleMs = 12, minDeltaPx = 2 } = opts;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // t global: monotónico. Preferimos performance.now() para mejor resolución
  const t0Ref = useRef<number | null>(null);
  const lastPointRef = useRef<StrokePoint | null>(null);
  const lastSampleTimeRef = useRef<number>(0);
  const drawingRef = useRef<boolean>(false);
  const penModeActiveRef = useRef<boolean>(false);

  const nowMs = () => {
    // Mapear performance.now() a época ms para facilidad (opcional)
    // Retornamos Date.now() para simpleza de integración backend
    return Date.now();
  };

  const getPos = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  }, []);

  const shouldSample = (p: StrokePoint) => {
    const last = lastPointRef.current;
    const tNow = p.t ?? nowMs();

    if (!last) return true;

    const dt = Math.abs(tNow - (last.t ?? tNow));
    if (dt >= sampleMs) return true;

    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (dx * dx + dy * dy >= minDeltaPx * minDeltaPx) return true;

    return false;
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    // Activar modo lápiz si es pen; si está activo, filtra mouse/touch
    if (e.pointerType === "pen" && !penModeActiveRef.current) {
      penModeActiveRef.current = true;
    }
    if (penModeActiveRef.current && e.pointerType !== "pen") return;

    drawingRef.current = true;
    if (t0Ref.current == null) t0Ref.current = nowMs();

    const { x, y } = getPos(e);
    const p: StrokePoint = {
      x,
      y,
      t: nowMs(),
      pressure: typeof e.pressure === "number" ? e.pressure : undefined,
    };

    lastPointRef.current = p;
    lastSampleTimeRef.current = p.t ?? 0;
    setCurrentStroke([p]);
  }, [getPos]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!drawingRef.current) return;
    if (penModeActiveRef.current && e.pointerType !== "pen") return;

    const { x, y } = getPos(e);
    const p: StrokePoint = {
      x,
      y,
      t: nowMs(),
      pressure: typeof e.pressure === "number" ? e.pressure : undefined,
    };

    if (!shouldSample(p)) return;

    lastPointRef.current = p;
    lastSampleTimeRef.current = p.t ?? 0;

    setCurrentStroke((prev) => (prev ? [...prev, p] : [p]));
  }, [getPos]);

  const onPointerUp = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    setStrokes((prev) => (currentStroke ? [...prev, currentStroke] : prev));
    setCurrentStroke(null);
    lastPointRef.current = null;
  }, [currentStroke]);

  const reset = useCallback(() => {
    setStrokes([]);
    setCurrentStroke(null);
    drawingRef.current = false;
    lastPointRef.current = null;
    t0Ref.current = null;
  }, []);

  return useMemo(
    () => ({ strokes, currentStroke, reset, onPointerDown, onPointerMove, onPointerUp }),
    [strokes, currentStroke, reset, onPointerDown, onPointerMove, onPointerUp]
  );
}
