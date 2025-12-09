export interface StrokePoint {
  x: number;
  y: number;
  t?: number; // tiempo en ms, global y monotónico
  pressure?: number; // 0.0 – 1.0, si el dispositivo lo provee
  stroke?: number; // índice de trazo (para multi-trazo)
  stroke_id?: number; // alias opcional que el backend también acepta
}

export type Stroke = StrokePoint[];

export interface DtwOptions {
  enabled?: boolean;
  backend?: 'auto' | 'internal' | 'tslearn';
  window?: 'sakoe-chiba' | 'itakura' | 'none';
  window_param?: number; // p.ej. 0.1 = 10% para Sakoe-Chiba
  normalize?: 'path-length' | 'none';
  return_path?: boolean;
  resample_points?: number | null; // remuestreo global previo a DTW
  step_pattern?: string; // p.ej. 'symmetric2'
  multi_stroke_mode?: 'per_stroke_match' | 'concat_jump_penalty';
  stroke_resample_points?: number; // si per_stroke_match
  unmatched_stroke_penalty?: number; // si per_stroke_match
  jump_penalty?: number; // si concat_jump_penalty
}

// Payload preferido: lista de trazos
export interface EvaluarMetricasPayload {
  coordenadas_modelo: Array<Array<StrokePoint>> | Array<StrokePoint>;
  coordenadas_paciente: Stroke[] | StrokePoint[];
  puntos_remuestreo?: number; // default 300
  figura_objetivo?:
    | "círculo"
    | "circulo"
    | "triángulo"
    | "triangulo"
    | "cuadrado"
    | "oblicuas_cruzadas"
    | "cruce_oblicuas"
    | "línea_vertical"
    | "linea_vertical"
    | "diamante_dividido"
    | "circulo_en_cuadrado"
    | "círculo en cuadrado";
  // Extensiones opcionales para enriquecer evaluación en backend
  debug?: boolean;
  client_metrics?: any; // métricas calculadas en cliente (orientación, curvatura, circle fit, etc.)
  orientation_expected?: 'vertical' | 'horizontal' | 'circle' | 'triangle' | 'square' | string;
  orientation_target_deg?: number; // por ejemplo 0 para horizontal, 90 para vertical
  // DTW y alineación avanzada
  procrustes_align?: boolean;
  dtw?: DtwOptions;
}

export interface EvaluarMetricasResponse {
  alineacion_procrustes?: { mse?: number } | null;
  metricas_geometricas?: any;
  metricas_geometricas_detalladas?: any;
  metricas_cinematicas?: any;
  geometria_clinica?: {
    rules?: any;
    summary?: any;
    angles?: any;
  } | null;
  // Permite campos adicionales del backend
  [k: string]: any;
}

export interface VMIEvaluarResponse {
  puntaje?: number;
  heuristicas?: any;
  [k: string]: any;
}
