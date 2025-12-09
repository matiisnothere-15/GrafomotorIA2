import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { useGlobalPaciente } from '../../context/PacienteContext';
import { getPacienteById, actualizarPaciente } from '../../services/pacienteService';
import { convertirPuntaje } from '../../services/escalaService';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import Header from '../../components/Header';
import './ResumenSesionVMI.css';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const ResumenSesionVMI: React.FC = () => {
  const { results, clearResults } = useSession();
  const { id: pacienteId } = useGlobalPaciente();
  const navigate = useNavigate();
  const location = useLocation();
  const [puntajeEstandar, setPuntajeEstandar] = useState<number | string | null>(null);
  const [backendRawScore, setBackendRawScore] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    rut: '',
    diagnostico: ''
  });

  // 1. Puntuación Global y Natural (con Reglas VMI)
  const { globalScore, rawScore, detallesPuntaje } = useMemo(() => {
    if (results.length === 0) return { globalScore: 0, rawScore: 0, detallesPuntaje: null };
    
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    
    // Regla: 1 punto si score >= 3 estrellas (Pass), 0 si < 3 (Fail)
    // Corrección: VMIParte1 ahora guarda score binario (0/1).
    // Si encontramos scores > 1, asumimos que son estrellas (legacy). Si no, sumamos directo.
    const itemsAprobados = results.reduce((acc, r) => {
      if (r.score > 1) return acc + (r.score >= 3 ? 1 : 0);
      return acc + r.score;
    }, 0);
    
    // Bonificación por edad: Desactivada según requerimiento.
    // Solo se cuentan los ítems efectivamente realizados y aprobados.
    const bonusEdad = 0;
    
    const totalNatural = itemsAprobados + bonusEdad;

    return {
      globalScore: (sum / results.length).toFixed(1),
      rawScore: totalNatural,
      detallesPuntaje: {
        aprobados: itemsAprobados,
        bonus: bonusEdad
      }
    };
  }, [results]);

  // Cargar datos del paciente y calcular puntaje estándar
  const cargarDatosPaciente = async () => {
    if (!pacienteId) return;
    try {
      const p = await getPacienteById(Number(pacienteId));
      setEditForm({
        nombre: p.nombre,
        apellido: p.apellido,
        fecha_nacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.split('T')[0] : '',
        rut: p.rut || '',
        diagnostico: p.diagnostico || ''
      });

      if (p?.fecha_nacimiento) {
        // Llamamos al backend con el ID del paciente para cálculo automático
        try {
          let resultado;
          const stateResult = (location.state as any)?.resultadoEvaluacion;

          if (stateResult) {
            resultado = stateResult;
          } else {
            // Enviamos el rawScore calculado localmente y pasamos el pacienteId
            resultado = await convertirPuntaje('vmi', rawScore.toString(), undefined, pacienteId);
          }
          
          // Lógica de asignación corregida según reporte de usuario:
          // El backend puede estar devolviendo el puntaje estándar en 'puntaje_raw_calculado' 
          // o el usuario prefiere ver ese valor en la casilla de Estándar.
          
          const stdScore = resultado.puntaje || resultado.puntaje_estandar;
          const calcRaw = resultado.puntaje_raw_calculado;

          if (stdScore) {
            // Caso ideal: Backend devuelve puntaje estándar explícito
            setPuntajeEstandar(stdScore);
            if (calcRaw !== undefined) setBackendRawScore(calcRaw);
          } else {
            // Caso fallback: No hay puntaje estándar (quizás por raw fuera de rango),
            // pero tenemos un valor calculado. El usuario indica que este valor (ej. 76)
            // debe ir en Puntaje Estándar.
            if (calcRaw !== undefined) {
              setPuntajeEstandar(calcRaw);
              // Mantenemos el rawScore local para "Aciertos" si el backend no dio uno coherente
              setBackendRawScore(rawScore); 
            } else {
              setPuntajeEstandar(0);
            }
          }

        } catch (err) {
          console.error("Error convirtiendo puntaje:", err);
          setPuntajeEstandar(0);
        }
      }
    } catch (e) {
      console.error("Error cargando paciente para baremo VMI:", e);
    }
  };

  useEffect(() => {
    cargarDatosPaciente();
  }, [pacienteId, rawScore]);

  const handleUpdatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;
    try {
      await actualizarPaciente(pacienteId, editForm);
      setShowEditModal(false);
      cargarDatosPaciente(); // Recargar para actualizar edad y puntaje
    } catch (error) {
      console.error("Error actualizando paciente:", error);
      alert("Error al actualizar paciente");
    }
  };

  // 2. Datos para el Radar Chart
  const radarData = useMemo(() => {
    if (results.length === 0) return null;

    // Promedios de métricas normalizadas (0-100 para el gráfico)
    let totalPrecision = 0;
    let totalControl = 0;
    let totalCierre = 0;
    let totalVelocidad = 0; // Placeholder si no hay métrica directa normalizada

    results.forEach(r => {
      // Precisión: basada en MSE (menor es mejor). Asumimos MSE < 0.05 es bueno.
      const mse = r.metrics?.alignment?.procrustes_mse || 0.1;
      const precisionScore = Math.max(0, 100 - (mse * 1000)); // Ajuste heurístico
      totalPrecision += precisionScore;

      // Control: Rectitud (0-1)
      const rectitud = r.metrics?.geometric?.straightness || r.metrics?.metricas_geometricas_detalladas?.rectitud || 0;
      totalControl += (rectitud * 100);

      // Cierre: Gap (menor es mejor)
      const gap = r.metrics?.geometric?.closure_gap || r.metrics?.metricas_geometricas_detalladas?.gap_cierre || 0.1;
      const cierreScore = Math.max(0, 100 - (gap * 500));
      totalCierre += cierreScore;

      // Velocidad: Usamos una heurística simple o 50 si no hay datos
      // Si hay 'kinematic.avg_speed', asumimos rango 0.1 - 1.0 px/ms?
      // Ajustar según datos reales.
      totalVelocidad += 70; // Valor base por ahora
    });

    const count = results.length;
    return {
      labels: ['Precisión (Forma)', 'Control (Rectitud)', 'Cierre de Figuras', 'Fluidez'],
      datasets: [
        {
          label: 'Desempeño Promedio',
          data: [
            totalPrecision / count,
            totalControl / count,
            totalCierre / count,
            totalVelocidad / count,
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
      ],
    };
  }, [results]);

  // 3. Análisis de Patrones (Semáforo)
  const patterns = useMemo(() => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const alerts: string[] = [];

    // Lógica simple de ejemplo
    const avgStars = Number(globalScore);
    if (avgStars >= 4) strengths.push("Excelente consistencia general.");
    
    // Detectar rotación frecuente
    const rotationIssues = results.filter(r => {
      const deg = r.metrics?.alignment?.rotation_deg;
      return typeof deg === 'number' && Math.abs(deg) > 20;
    });
    if (rotationIssues.length >= 2) {
      weaknesses.push("Tendencia a rotar las figuras (>20°).");
    }

    // Detectar problemas de cierre
    const closureIssues = results.filter(r => {
      const gap = r.metrics?.geometric?.closure_gap || r.metrics?.metricas_geometricas_detalladas?.gap_cierre;
      return typeof gap === 'number' && gap > 0.05;
    });
    if (closureIssues.length >= 2) {
      alerts.push("Dificultad consistente para cerrar figuras.");
    }

    // Si no hay alertas específicas pero score bajo
    if (avgStars < 3 && weaknesses.length === 0 && alerts.length === 0) {
      weaknesses.push("Se recomienda practicar trazos básicos.");
    }

    return { strengths, weaknesses, alerts };
  }, [results, globalScore]);

  // 4. Recomendaciones Consolidadas
  const recommendations = useMemo(() => {
    const allRecs: string[] = [];
    results.forEach(r => {
      if (r.ai_feedback?.recomendaciones) {
        allRecs.push(...r.ai_feedback.recomendaciones);
      }
      // Fallback si no hay AI feedback pero hay reglas fallidas
      const rules = r.metrics?.rules_summary?.messages || [];
      if (rules.length > 0) {
        allRecs.push(...rules);
      }
    });
    // Devolver únicas, max 5
    return Array.from(new Set(allRecs)).slice(0, 5);
  }, [results]);

  const handleFinish = () => {
    clearResults();
    navigate('/actividades');
  };

  if (results.length === 0) {
    return (
      <div className="resumen-container">
        <Header />
        <div className="resumen-content empty">
          <h2>No hay resultados de sesión recientes</h2>
          <button onClick={() => navigate('/actividades')} className="btn-primary">Volver a Actividades</button>
        </div>
      </div>
    );
  }

  return (
    <div className="resumen-wrapper">
      <Header />
      <div className="resumen-content">
        <h1 className="resumen-title">Resumen de Rendimiento</h1>
        
        <div className="resumen-grid">
          {/* Columna Izquierda: Métricas y Gráfico */}
          <div className="resumen-left">
            <div className="score-card">
              <h3>Puntaje Estándar</h3>
              <div className="big-score">
                <span className="number" style={{ color: (puntajeEstandar && puntajeEstandar != 0 && puntajeEstandar != '0') ? '#27ae60' : '#e74c3c' }}>
                  {puntajeEstandar || "0"}
                </span>
              </div>
              
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#666' }}>Puntaje Natural Total</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>{backendRawScore ?? rawScore}</span>
                  <span style={{ fontSize: '0.9rem', color: '#888' }}>puntos</span>
                </div>
                {detallesPuntaje && (
                  <div style={{ fontSize: '0.75rem', color: '#999', margin: '0.2rem 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{detallesPuntaje.aprobados} Aciertos (Ejercicios aprobados)</span>
                    <span>+ {detallesPuntaje.bonus} Puntos de Bonificación por edad</span>
                  </div>
                )}
                <p style={{ fontSize: '0.8rem', color: '#999', margin: '0.5rem 0 0 0' }}>
                  (Suma total para consultar en tabla)
                </p>
              </div>
            </div>

            <div className="chart-card">
              <h3>Perfil de Habilidades</h3>
              {radarData && (
                <div className="chart-container">
                  <Radar data={radarData} options={{
                    scales: {
                      r: {
                        angleLines: { display: true },
                        suggestedMin: 0,
                        suggestedMax: 100,
                      }
                    }
                  }} />
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Análisis y Recomendaciones */}
          <div className="resumen-right">
            <div className="analysis-card">
              <h3>Análisis de Patrones</h3>
              <div className="traffic-light">
                {patterns.strengths.length > 0 && (
                  <div className="light-item green">
                    <span className="icon">🟢</span>
                    <div>
                      <strong>Fortalezas</strong>
                      <ul>{patterns.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  </div>
                )}
                {patterns.weaknesses.length > 0 && (
                  <div className="light-item yellow">
                    <span className="icon">🟡</span>
                    <div>
                      <strong>A mejorar</strong>
                      <ul>{patterns.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  </div>
                )}
                {patterns.alerts.length > 0 && (
                  <div className="light-item red">
                    <span className="icon">🔴</span>
                    <div>
                      <strong>Atención</strong>
                      <ul>{patterns.alerts.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="recs-card">
              <h3>Recomendaciones Sugeridas</h3>
              {recommendations.length > 0 ? (
                <ul className="recs-list">
                  {recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              ) : (
                <p className="no-recs">¡Excelente trabajo! Sigue practicando así.</p>
              )}
            </div>
          </div>
        </div>

        {/* Detalle por Ejercicio */}
        <div className="detalles-tabla-card" style={{ marginTop: '2rem', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Detalle por Ejercicio</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                      <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', background: '#f8f9fa' }}>
                          <th style={{ padding: '1rem', color: '#666', fontWeight: '600' }}>Ejercicio</th>
                          <th style={{ padding: '1rem', textAlign: 'center', color: '#666', fontWeight: '600' }}>Puntaje VMI</th>
                          <th style={{ padding: '1rem', textAlign: 'center', color: '#666', fontWeight: '600' }}>Precisión Geométrica</th>
                      </tr>
                  </thead>
                  <tbody>
                      {results.map((r, i) => {
                          // Priorizar el cálculo local si existe, sino buscar en métricas del backend
                          const procrustes = r.metrics?.local_procrustes ?? 
                                             r.metrics?.alignment?.procrustes_score ?? 
                                             r.metrics?.metricas_geometricas_detalladas?.similitud_procrustes ?? 
                                             0;
                          return (
                              <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                  <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500' }}>{r.nombre}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#999' }}>{r.figura}</div>
                                  </td>
                                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      {r.score === 1 ? 
                                        <span style={{color:'#27ae60', fontWeight: 'bold', background: '#eafaf1', padding: '4px 8px', borderRadius: '4px'}}>✔ Aprobado (1)</span> : 
                                        <span style={{color:'#e74c3c', fontWeight: 'bold', background: '#fdedec', padding: '4px 8px', borderRadius: '4px'}}>✘ Fallo (0)</span>
                                      }
                                  </td>
                                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <div style={{ width: '60px', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                          <div style={{ width: `${Math.min(100, Math.max(0, Number(procrustes)))}%`, height: '100%', background: Number(procrustes) > 80 ? '#27ae60' : Number(procrustes) > 50 ? '#f1c40f' : '#e74c3c' }}></div>
                                        </div>
                                        <span style={{ fontWeight: '500' }}>{Number(procrustes).toFixed(1)}%</span>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
            </div>
        </div>

        <div className="resumen-actions">
          <button onClick={handleFinish} className="btn-finish">Finalizar Sesión</button>
        </div>
      </div>

      {/* Modal de Edición de Paciente */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Corregir Datos del Paciente</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdatePaciente}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre</label>
                  <input 
                    type="text" 
                    value={editForm.nombre} 
                    onChange={e => setEditForm({...editForm, nombre: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Apellido</label>
                  <input 
                    type="text" 
                    value={editForm.apellido} 
                    onChange={e => setEditForm({...editForm, apellido: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Fecha de Nacimiento</label>
                  <input 
                    type="date" 
                    value={editForm.fecha_nacimiento} 
                    onChange={e => setEditForm({...editForm, fecha_nacimiento: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    required
                  />
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                    Importante: La edad se recalculará automáticamente para el baremo VMI.
                  </p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>RUT</label>
                  <input 
                    type="text" 
                    value={editForm.rut} 
                    onChange={e => setEditForm({...editForm, rut: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Diagnóstico</label>
                  <input 
                    type="text" 
                    value={editForm.diagnostico} 
                    onChange={e => setEditForm({...editForm, diagnostico: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-cancel" onClick={() => setShowEditModal(false)} style={{ marginRight: '1rem', padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" className="modal-accept" style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumenSesionVMI;
