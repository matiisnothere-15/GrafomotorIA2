// Servicio para evaluación VMI específica con modo debug
import { BASE_URL, getHeaders } from './api';

export interface VMIEvaluarPayload {
  coordenadas_modelo: Array<{ x: number; y: number; stroke?: number; stroke_id?: number }> | Array<Array<{ x: number; y: number; stroke?: number; stroke_id?: number }>>;
  coordenadas_paciente: Array<{ x: number; y: number; t?: number; pressure?: number; stroke?: number; stroke_id?: number }> | Array<Array<{ x: number; y: number; t?: number; pressure?: number; stroke?: number; stroke_id?: number }>>;
  puntos_remuestreo?: number;
  figura_objetivo?: string;
  debug?: boolean;
  client_metrics?: any;
  orientation_expected?: string;
  orientation_target_deg?: number;
  procrustes_align?: boolean;
  dtw?: {
    enabled?: boolean;
    backend?: 'auto' | 'internal' | 'tslearn';
    window?: 'sakoe-chiba' | 'itakura' | 'none';
    window_param?: number;
    normalize?: 'path-length' | 'none';
    return_path?: boolean;
    resample_points?: number | null;
    step_pattern?: string;
    multi_stroke_mode?: 'per_stroke_match' | 'concat_jump_penalty';
    stroke_resample_points?: number;
    unmatched_stroke_penalty?: number;
    jump_penalty?: number;
  };
}

export interface VMICLosedShape {
  procrustes_rms?: number;
  area_diff_pct?: number;
  perim_ratio?: number;
  hausdorff_norm?: number;
  [k: string]: any;
}

export interface VMICircleMetrics {
  patient_circle?: { radius?: number; [k: string]: any };
  circularity_error?: number;
  center_offset?: number;
  radius_rel_err?: number;
  [k: string]: any;
}

export interface VMIEvaluarResult {
  score?: any;
  alignment?: { rotation_deg?: number; [k: string]: any };
  geometria_clinica?: any;
  kinematic?: {
    avg_speed?: number;
    pause_count?: number;
    total_time_ms?: number;
    [k: string]: any;
  };
  rules_summary?: {
    passed?: boolean;
    summary?: string;
    messages?: string[];
    [k: string]: any;
  };
  closed_shape?: VMICLosedShape;
  circle_metrics?: VMICircleMetrics;
  debug?: { aligned_patient_preview?: any; aligned_model_preview?: any; [k: string]: any };
  [k: string]: any;
}

class VMIService {
  async evaluar(payload: VMIEvaluarPayload): Promise<VMIEvaluarResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout para dar tiempo a GPT

    try {
      // Usar el nuevo endpoint simplificado
      const res = await fetch(`${BASE_URL}/dibujos/vmi-evaluar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMsg = `Error ${res.status}: ${res.statusText}`;
        try {
          const err = await res.json();
          errMsg = err?.msg || err?.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json().catch(() => null);
      // Adaptar respuesta del nuevo endpoint: si viene { success: true, data: {...} } devolver data
      if (data && data.success && data.data) {
        return data.data as VMIEvaluarResult;
      }
      return (data?.data ?? data ?? {}) as VMIEvaluarResult;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('⚠️ Timeout en evaluación VMI, usando fallback local');
        throw new Error('El servidor tardó demasiado en responder.');
      }
      throw error;
    }
  }
}

export const vmiService = new VMIService();
