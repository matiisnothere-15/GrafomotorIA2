import React, { useState } from 'react';
import { calibrarSistemaEvaluacion, aplicarUmbralesCalibrados, generarReporteCalibracion, ResultadoCalibracion } from '../utils/calibracionEvaluacion';

/**
 * Componente para calibrar automáticamente el sistema de evaluación
 * Mejora la precisión ajustando umbrales basado en casos reales
 */
const CalibracionSistema: React.FC = () => {
  const [resultado, setResultado] = useState<ResultadoCalibracion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [umbralesAplicados, setUmbralesAplicados] = useState(false);

  const ejecutarCalibracion = async () => {
    setCargando(true);
    
    try {
      // Ejecutar calibración
      const resultadoCalibracion = calibrarSistemaEvaluacion();
      setResultado(resultadoCalibracion);
      
      console.log('🔧 Calibración completada:', resultadoCalibracion);
      
    } catch (error) {
      console.error('Error en calibración:', error);
      alert('Error durante la calibración. Revisa la consola para más detalles.');
    } finally {
      setCargando(false);
    }
  };

  const aplicarCalibracion = () => {
    if (resultado) {
      aplicarUmbralesCalibrados(resultado.umbralesCalibrados);
      setUmbralesAplicados(true);
      alert('✅ Umbrales calibrados aplicados al sistema');
    }
  };

  const limpiar = () => {
    setResultado(null);
    setUmbralesAplicados(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px' }}>
      <h2>🔧 Calibración Automática del Sistema de Evaluación</h2>
      
      <div style={{ 
        backgroundColor: '#e7f3ff', 
        border: '1px solid #b3d9ff', 
        borderRadius: '10px', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3>💡 ¿Qué hace la calibración?</h3>
        <ul>
          <li><strong>Analiza casos problemáticos:</strong> Prueba el sistema con casos conocidos</li>
          <li><strong>Identifica errores:</strong> Detecta dónde falla la evaluación</li>
          <li><strong>Ajusta umbrales:</strong> Modifica automáticamente los parámetros</li>
          <li><strong>Mejora precisión:</strong> Optimiza la detección de formas geométricas</li>
          <li><strong>Valida mejoras:</strong> Confirma que los ajustes funcionan</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <button
          onClick={ejecutarCalibracion}
          disabled={cargando}
          style={{
            padding: '15px 30px',
            backgroundColor: cargando ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: cargando ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {cargando ? '🔧 Calibrando...' : '🔧 Ejecutar Calibración'}
        </button>
        
        {resultado && (
          <button
            onClick={aplicarCalibracion}
            disabled={umbralesAplicados}
            style={{
              padding: '15px 30px',
              backgroundColor: umbralesAplicados ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: umbralesAplicados ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {umbralesAplicados ? '✅ Aplicado' : '⚙️ Aplicar Umbrales'}
          </button>
        )}
        
        <button
          onClick={limpiar}
          style={{
            padding: '15px 30px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🗑️ Limpiar
        </button>
      </div>

      {resultado && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '10px', 
          padding: '20px',
          marginTop: '20px'
        }}>
          <h3>📊 Resultado de la Calibración</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
              <strong>Casos Probados</strong><br/>
              <span style={{ fontSize: '24px', color: '#007bff' }}>{resultado.casosProbados}</span>
            </div>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
              <strong>Precisión Antes</strong><br/>
              <span style={{ fontSize: '24px', color: '#dc3545' }}>{resultado.precisionAntes.toFixed(1)}%</span>
            </div>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
              <strong>Precisión Después</strong><br/>
              <span style={{ fontSize: '24px', color: '#28a745' }}>{resultado.precisionDespues.toFixed(1)}%</span>
            </div>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
              <strong>Mejora</strong><br/>
              <span style={{ fontSize: '24px', color: '#ffc107' }}>+{(resultado.precisionDespues - resultado.precisionAntes).toFixed(1)}%</span>
            </div>
          </div>

          {resultado.mejoras.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4>🚀 Mejoras Implementadas:</h4>
              <ul style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                {resultado.mejoras.map((mejora, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>✅ {mejora}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <h4>⚙️ Umbrales Calibrados:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              
              <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                <h5>🔵 Círculo</h5>
                <ul style={{ fontSize: '14px' }}>
                  <li>Variación máxima: <strong>{resultado.umbralesCalibrados.circuloVariacionMaxima}</strong></li>
                  <li>Proporción mínima: <strong>{resultado.umbralesCalibrados.circuloProporcionMinima}</strong></li>
                  <li>Cambios suaves: <strong>{resultado.umbralesCalibrados.circuloCambiosSuavesMinimo}</strong></li>
                </ul>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                <h5>⬜ Cuadrado</h5>
                <ul style={{ fontSize: '14px' }}>
                  <li>Esquinas mínimas: <strong>{resultado.umbralesCalibrados.cuadradoEsquinasMinimas}</strong></li>
                  <li>Ángulos rectos: <strong>{resultado.umbralesCalibrados.cuadradoAngulosRectosMinimos}</strong></li>
                  <li>Proporción mínima: <strong>{resultado.umbralesCalibrados.cuadradoProporcionMinima}</strong></li>
                  <li>Lados paralelos: <strong>{resultado.umbralesCalibrados.cuadradoLadosParalelosMinimos}</strong></li>
                </ul>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                <h5>🔺 Triángulo</h5>
                <ul style={{ fontSize: '14px' }}>
                  <li>Área mínima: <strong>{resultado.umbralesCalibrados.trianguloAreaMinima}</strong></li>
                  <li>Tolerancia ángulos: <strong>{resultado.umbralesCalibrados.trianguloToleranciaAngulos}</strong></li>
                </ul>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                <h5>📏 Evaluación General</h5>
                <ul style={{ fontSize: '14px' }}>
                  <li>Tolerancia base (%): <strong>{resultado.umbralesCalibrados.toleranciaBasePorcentaje}</strong></li>
                  <li>Tolerancia mínima: <strong>{resultado.umbralesCalibrados.toleranciaMinima}</strong></li>
                  <li>Tolerancia máxima: <strong>{resultado.umbralesCalibrados.toleranciaMaxima}</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4>📄 Reporte Completo:</h4>
            <textarea
              value={generarReporteCalibracion(resultado)}
              readOnly
              style={{
                width: '100%',
                height: '400px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                fontFamily: 'monospace',
                fontSize: '12px',
                backgroundColor: '#f8f9fa'
              }}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '10px' }}>
        <h4>⚠️ Importante:</h4>
        <ul>
          <li><strong>La calibración es automática:</strong> No requiere intervención manual</li>
          <li><strong>Basada en casos reales:</strong> Usa ejemplos conocidos de problemas</li>
          <li><strong>Mejora progresiva:</strong> Los ajustes se basan en errores detectados</li>
          <li><strong>Validación incluida:</strong> Confirma que las mejoras funcionan</li>
          <li><strong>Aplicación manual:</strong> Debes aplicar los umbrales calibrados</li>
        </ul>
      </div>
    </div>
  );
};

export default CalibracionSistema;
