// Servicio para evaluar métricas de dibujos desde el backend
import { BASE_URL, getHeaders } from './api';
import type { EvaluarMetricasPayload, EvaluarMetricasResponse } from '../models/Dibujo';

class DibujosService {
  // Evalúa métricas entre el modelo y el trazo del paciente
  async evaluarMetricas(payload: EvaluarMetricasPayload): Promise<EvaluarMetricasResponse> {
    try {
      const res = await fetch(`${BASE_URL}/dibujos/evaluar-metricas`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMsg = `Error ${res.status}: ${res.statusText}`;
        try {
          const err = await res.json();
          errMsg = (err?.msg || err?.message || errMsg);
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json().catch(() => null);
      // Algunos servicios devuelven { data: ... }
      return (data?.data ?? data ?? {}) as EvaluarMetricasResponse;
    } catch (error) {
      // Re-lanza para ser manejado en la UI
      throw error;
    }
  }
}

export const dibujosService = new DibujosService();
