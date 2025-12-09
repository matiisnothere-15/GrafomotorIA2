import React from 'react';

interface ModalEvaluacionMetricasProps {
  open: boolean;
  onClose: () => void;
  resultado: any; // backend result: flexible shape
}

const boxStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 2000,
  background: 'white',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  width: 'min(92vw, 560px)',
  maxHeight: '80vh',
  overflow: 'auto',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid #f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const bodyStyle: React.CSSProperties = {
  padding: 20,
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 1990,
};

function extractScore(res: any): number | null {
  const candidates: any[] = [
    res?.puntaje,
    res?.score,
    res?.geometria_clinica?.summary?.score,
    res?.metricas_geometricas?.score,
  ].filter((v) => typeof v === 'number');
  if (candidates.length) return candidates[0];
  return null;
}

function extractProcrustesMSE(res: any): number | null {
  const v = res?.alineacion_procrustes?.mse;
  return typeof v === 'number' ? v : null;
}

function extractFrechet(res: any): number | null {
  const mg = res?.metricas_geometricas || {};
  // Busca una propiedad con nombre tipo 'frechet' o 'fréchet'
  for (const k of Object.keys(mg)) {
    if (k.toLowerCase().includes('frechet') || k.toLowerCase().includes('fréchet')) {
      const val = mg[k];
      if (typeof val === 'number') return val;
    }
  }
  return null;
}

function extractExtras(res: any) {
  const ex = res?.cliente_extra || {};
  return {
    angModel: typeof ex.orientation_deg_model === 'number' ? ex.orientation_deg_model as number : null,
    angPatient: typeof ex.orientation_deg_patient === 'number' ? ex.orientation_deg_patient as number : null,
    angDelta: typeof ex.orientation_delta_deg === 'number' ? ex.orientation_delta_deg as number : null,
    curvM: ex.curvature_model || null,
    curvP: ex.curvature_patient || null,
    circleFit: ex.circle_fit_patient || null,
  };
}

function extractDTW(res: any) {
  const dtw = res?.dtw || null;
  if (!dtw) return null;
  const norm = dtw?.normalized_cost ?? dtw?.aggregate_normalized_cost ?? dtw?.concat_normalized_cost;
  return {
    normalized: (typeof norm === 'number') ? norm as number : null,
    cost: (typeof dtw?.cost === 'number') ? dtw.cost as number : null,
    mode: dtw?.multi_stroke?.mode || dtw?.mode || null,
  };
}

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  borderRadius: 999,
  background: '#f1f5f9',
  color: '#0f172a',
  fontSize: 13,
  border: '1px solid #e2e8f0',
};

export default function ModalEvaluacionMetricas({ open, onClose, resultado }: ModalEvaluacionMetricasProps) {
  if (!open) return null;

  const score = extractScore(resultado);
  const mse = extractProcrustesMSE(resultado);
  const frechet = extractFrechet(resultado);
  const rulesSummary = resultado?.geometria_clinica?.summary;
  const extras = extractExtras(resultado);
  const dtw = extractDTW(resultado);

  // Heurística de puntuación (0..1) si no hay score explícito
  const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const normalize = (val: number | null, goodZero = true, scale = 0.01) => {
    if (typeof val !== 'number' || isNaN(val)) return null;
    // Si goodZero=true, 0 es perfecto; mapear 0 -> 1, scale -> 0
    const s = goodZero ? clamp(1 - val / scale) : clamp(val / scale);
    return s;
  };

  const rectitud = typeof resultado?.metricas_geometricas_detalladas?.rectitud === 'number'
    ? resultado.metricas_geometricas_detalladas.rectitud as number
    : null;
  const lenModelo = typeof resultado?.metricas_geometricas?.longitud_modelo === 'number'
    ? resultado.metricas_geometricas.longitud_modelo as number
    : null;
  const lenPaciente = typeof resultado?.metricas_geometricas?.longitud_paciente === 'number'
    ? resultado.metricas_geometricas.longitud_paciente as number
    : null;
  const lenDiff = (lenModelo != null && lenPaciente != null)
    ? Math.abs(lenPaciente - lenModelo) / Math.max(1e-6, lenModelo)
    : null;

  // Normalizaciones conservadoras (ajustables según datos reales)
  const s_mse = normalize(mse, true, 0.01); // 0.01 como umbral "malo" genérico
  const s_frechet = normalize(frechet, true, 0.02); // 0.02 genérico
  const s_rectitud = (typeof rectitud === 'number') ? clamp(rectitud) : null; // ya 0..1
  const s_len = (typeof lenDiff === 'number') ? clamp(1 - lenDiff / 0.2) : null; // 20% tolerancia

  const scores = [s_mse, s_frechet, s_rectitud, s_len].filter((v): v is number => typeof v === 'number');
  const heuristic01 = (!score && scores.length)
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;
  const showHeuristic = !score && typeof heuristic01 === 'number';
  const stars = typeof score === 'number'
    ? Math.round(clamp(score, 0, 5))
    : (showHeuristic ? Math.max(1, Math.round(heuristic01 * 5)) : null);

  // Extraer rotación de alineación para advertencia
  const rotationDeg = resultado?.alignment?.rotation_deg;
  const showRotationWarning = typeof rotationDeg === 'number' && Math.abs(rotationDeg) > 25;

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={boxStyle}>
        <div style={headerStyle}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Evaluación del dibujo</div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div style={bodyStyle}>
          {/* Score o heurística */}
          <div style={{ marginBottom: 16 }}>
            {typeof score === 'number' ? (
              <div>
                <div style={{ fontSize: 14, color: '#64748b' }}>Puntuación</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a' }}>{score}</div>
              </div>
            ) : showHeuristic ? (
              <div>
                <div style={{ fontSize: 14, color: '#64748b' }}>Puntuación heurística</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{Math.round(heuristic01! * 100)}%</div>
                  {typeof stars === 'number' && (
                    <div style={{ fontSize: 22, color: '#f59e0b', lineHeight: 1 }} aria-label={`Puntuación ${stars} estrellas`}>
                      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#64748b' }}>No se recibió una puntuación numérica, mostrando métricas clave:</div>
            )}
          </div>

          {/* Advertencia de rotación */}
          {showRotationWarning && (
            <div style={{ 
              marginBottom: 16, 
              padding: '10px 14px', 
              background: '#fff7ed', 
              border: '1px solid #fed7aa', 
              borderRadius: 8, 
              color: '#9a3412',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span>
                <strong>Atención:</strong> La forma es correcta, pero la orientación está rotada ({rotationDeg.toFixed(1)}°).
              </span>
            </div>
          )}

          {/* Key chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {typeof mse === 'number' && (
              <div style={chip}>
                <span role="img" aria-label="procrustes">📐</span>
                <span>Procrustes MSE: {mse.toFixed(3)}</span>
              </div>
            )}
            {typeof frechet === 'number' && (
              <div style={chip}>
                <span role="img" aria-label="frechet">🧭</span>
                <span>Fréchet: {frechet.toFixed(3)}</span>
              </div>
            )}
            {typeof rectitud === 'number' && (
              <div style={chip}>
                <span role="img" aria-label="rectitud">📏</span>
                <span>Rectitud: {rectitud.toFixed(3)}</span>
              </div>
            )}
            {typeof extras.angDelta === 'number' && (
              <div style={chip}>
                <span role="img" aria-label="orientacion">🧭</span>
                <span>Δ orientación: {extras.angDelta.toFixed(1)}°</span>
              </div>
            )}
            {extras.curvP && (
              <div style={chip}>
                <span role="img" aria-label="curvatura">➰</span>
                <span>Curv. paciente μ={Number(extras.curvP.mean).toFixed(3)} σ={Number(extras.curvP.std).toFixed(3)}</span>
              </div>
            )}
            {extras.circleFit && (
              <div style={chip}>
                <span role="img" aria-label="circle-fit">🎯</span>
                <span>Ajuste círculo RMS: {Number(extras.circleFit.rms).toFixed(2)}</span>
              </div>
            )}
            {dtw?.normalized != null && (
              <div style={chip}>
                <span role="img" aria-label="dtw">⏱️</span>
                <span>DTW norm: {dtw.normalized.toFixed(3)}</span>
              </div>
            )}
          </div>

          {/* Rules/summary */}
          {rulesSummary && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Validación clínica</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12, color: '#0f172a' }}>
                {typeof rulesSummary === 'string' ? rulesSummary : JSON.stringify(rulesSummary, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
