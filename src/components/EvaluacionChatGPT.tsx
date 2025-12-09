import React, { useState } from 'react';
import { evaluarConChatGPT, verificarDisponibilidadChatGPT, obtenerEstadisticasChatGPT } from '../services/chatgptEvaluationService';
import { crearResumenEvaluacion } from '../utils/evaluacionChatGPT';

/**
 * Componente para probar la evaluación con ChatGPT
 * Permite enviar coordenadas y recibir análisis inteligente
 */
const EvaluacionChatGPT: React.FC = () => {
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [coordenadasUsuario, setCoordenadasUsuario] = useState<string>('');
  const [coordenadasModelo, setCoordenadasModelo] = useState<string>('');
  const [figuraEsperada, setFiguraEsperada] = useState<string>('cuadrado');
  const [disponible, setDisponible] = useState<boolean | null>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);

  // Ejemplos de coordenadas para probar
  const ejemplosCoordenadas = {
    cuadrado_bien: {
      usuario: '[{"x": 50, "y": 50}, {"x": 150, "y": 50}, {"x": 150, "y": 150}, {"x": 50, "y": 150}, {"x": 50, "y": 50}]',
      modelo: '[{"x": 50, "y": 50}, {"x": 150, "y": 50}, {"x": 150, "y": 150}, {"x": 50, "y": 150}, {"x": 50, "y": 50}]',
      descripcion: 'Cuadrado bien dibujado'
    },
    cuadrado_malo: {
      usuario: '[{"x": 100, "y": 100}, {"x": 120, "y": 80}, {"x": 140, "y": 100}, {"x": 120, "y": 120}, {"x": 100, "y": 100}]',
      modelo: '[{"x": 50, "y": 50}, {"x": 150, "y": 50}, {"x": 150, "y": 150}, {"x": 50, "y": 150}, {"x": 50, "y": 50}]',
      descripcion: 'Círculo cuando se espera cuadrado'
    },
    triangulo_bien: {
      usuario: '[{"x": 100, "y": 50}, {"x": 50, "y": 150}, {"x": 150, "y": 150}, {"x": 100, "y": 50}]',
      modelo: '[{"x": 100, "y": 50}, {"x": 50, "y": 150}, {"x": 150, "y": 150}, {"x": 100, "y": 50}]',
      descripcion: 'Triángulo bien dibujado'
    },
    circulo_bien: {
      usuario: '[{"x": 100, "y": 100}, {"x": 120, "y": 80}, {"x": 140, "y": 100}, {"x": 120, "y": 120}, {"x": 100, "y": 100}, {"x": 80, "y": 120}, {"x": 60, "y": 100}, {"x": 80, "y": 80}, {"x": 100, "y": 100}]',
      modelo: '[{"x": 100, "y": 100}, {"x": 120, "y": 80}, {"x": 140, "y": 100}, {"x": 120, "y": 120}, {"x": 100, "y": 100}, {"x": 80, "y": 120}, {"x": 60, "y": 100}, {"x": 80, "y": 80}, {"x": 100, "y": 100}]',
      descripcion: 'Círculo bien dibujado'
    }
  };

  const verificarDisponibilidad = async () => {
    setCargando(true);
    try {
      const disponible = await verificarDisponibilidadChatGPT();
      setDisponible(disponible);
      
      if (disponible) {
        const stats = await obtenerEstadisticasChatGPT();
        setEstadisticas(stats);
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      setDisponible(false);
    } finally {
      setCargando(false);
    }
  };

  const ejecutarEvaluacion = async () => {
    setCargando(true);
    setResultado(null);
    
    try {
      // Parsear coordenadas
      const usuario = JSON.parse(coordenadasUsuario);
      const modelo = JSON.parse(coordenadasModelo);
      
      // Ejecutar evaluación con ChatGPT
      const respuesta = await evaluarConChatGPT({
        coordenadasUsuario: usuario,
        coordenadasModelo: modelo,
        figuraEsperada: figuraEsperada,
        contexto: {
          paciente: 'Paciente de prueba',
          sesion: 'Sesión de prueba',
          nivel: 'básico'
        }
      });
      
      if (respuesta.success && respuesta.data) {
        setResultado({
          ...respuesta.data,
          metadata: respuesta.metadata,
          resumen: crearResumenEvaluacion(respuesta.data)
        });
      } else {
        setResultado({
          error: respuesta.error,
          metadata: respuesta.metadata
        });
      }
      
    } catch (error) {
      console.error('Error en evaluación:', error);
      setResultado({
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarEjemplo = (ejemplo: keyof typeof ejemplosCoordenadas) => {
    const ej = ejemplosCoordenadas[ejemplo];
    setCoordenadasUsuario(ej.usuario);
    setCoordenadasModelo(ej.modelo);
    setFiguraEsperada(ejemplo.includes('cuadrado') ? 'cuadrado' : 
                     ejemplo.includes('triangulo') ? 'triangulo' : 
                     ejemplo.includes('circulo') ? 'circulo' : 'cuadrado');
  };

  const limpiar = () => {
    setResultado(null);
    setCoordenadasUsuario('');
    setCoordenadasModelo('');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px' }}>
      <h2>🤖 Evaluación con ChatGPT - Análisis Inteligente</h2>
      
      <div style={{ 
        backgroundColor: '#e7f3ff', 
        border: '1px solid #b3d9ff', 
        borderRadius: '10px', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3>💡 ¿Cómo funciona la evaluación con ChatGPT?</h3>
        <ul>
          <li><strong>Análisis inteligente:</strong> ChatGPT analiza las coordenadas como un experto</li>
          <li><strong>Comparación precisa:</strong> Compara el trazo del usuario con el modelo</li>
          <li><strong>Detección de formas:</strong> Identifica automáticamente la forma dibujada</li>
          <li><strong>Análisis detallado:</strong> Proporciona análisis profesional y sugerencias</li>
          <li><strong>Métricas precisas:</strong> Calcula precisión, cobertura y similitud</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={verificarDisponibilidad}
          disabled={cargando}
          style={{
            padding: '10px 20px',
            backgroundColor: cargando ? '#6c757d' : '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: cargando ? 'not-allowed' : 'pointer'
          }}
        >
          {cargando ? '🔄 Verificando...' : '🔍 Verificar Disponibilidad'}
        </button>
        
        {disponible !== null && (
          <div style={{ 
            padding: '10px 15px', 
            borderRadius: '5px',
            backgroundColor: disponible ? '#d4edda' : '#f8d7da',
            color: disponible ? '#155724' : '#721c24',
            border: `1px solid ${disponible ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {disponible ? '✅ ChatGPT Disponible' : '❌ ChatGPT No Disponible'}
          </div>
        )}
        
        <button
          onClick={limpiar}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🗑️ Limpiar
        </button>
      </div>

      {estadisticas && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '5px', 
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h4>📊 Estadísticas de ChatGPT</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div><strong>Total evaluaciones:</strong> {estadisticas.totalEvaluaciones}</div>
            <div><strong>Tiempo promedio:</strong> {estadisticas.promedioTiempo}ms</div>
            <div><strong>Tokens usados:</strong> {estadisticas.tokensUsados}</div>
            <div><strong>Última evaluación:</strong> {new Date(estadisticas.ultimaEvaluacion).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Ejemplos para Probar:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          {Object.entries(ejemplosCoordenadas).map(([key, ejemplo]) => (
            <button
              key={key}
              onClick={() => cargarEjemplo(key as keyof typeof ejemplosCoordenadas)}
              style={{
                padding: '10px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left'
              }}
            >
              ✅ {ejemplo.descripcion}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label>Figura esperada: </label>
          <select 
            value={figuraEsperada} 
            onChange={(e) => setFiguraEsperada(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="cuadrado">Cuadrado</option>
            <option value="circulo">Círculo</option>
            <option value="triangulo">Triángulo</option>
            <option value="estrella">Estrella</option>
            <option value="linea">Línea</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h3>Coordenadas del Usuario (JSON):</h3>
          <textarea
            value={coordenadasUsuario}
            onChange={(e) => setCoordenadasUsuario(e.target.value)}
            style={{
              width: '100%',
              height: '200px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
            placeholder='[{"x": 100, "y": 100}, {"x": 120, "y": 100}, ...]'
          />
        </div>
        
        <div>
          <h3>Coordenadas del Modelo (JSON):</h3>
          <textarea
            value={coordenadasModelo}
            onChange={(e) => setCoordenadasModelo(e.target.value)}
            style={{
              width: '100%',
              height: '200px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
            placeholder='[{"x": 50, "y": 50}, {"x": 150, "y": 50}, ...]'
          />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={ejecutarEvaluacion}
          disabled={cargando || !coordenadasUsuario || !coordenadasModelo || !disponible}
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
          {cargando ? '🤖 Analizando con ChatGPT...' : '🤖 Evaluar con ChatGPT'}
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
          {resultado.error ? (
            <div style={{ color: '#dc3545' }}>
              <h3>❌ Error en la Evaluación</h3>
              <p>{resultado.error}</p>
              {resultado.metadata && (
                <p><strong>Tiempo de procesamiento:</strong> {resultado.metadata.processingTime}ms</p>
              )}
            </div>
          ) : (
            <>
              <h3>🤖 Evaluación con ChatGPT</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                  <strong>Puntuación</strong><br/>
                  <span style={{ fontSize: '24px', color: '#28a745' }}>{resultado.puntuacion}/100</span>
                </div>
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                  <strong>Forma Detectada</strong><br/>
                  <span style={{ fontSize: '24px', color: '#007bff' }}>{resultado.formaDetectada}</span>
                </div>
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                  <strong>Precisión</strong><br/>
                  <span style={{ fontSize: '24px', color: '#ffc107' }}>{Math.round(resultado.precision * 100)}%</span>
                </div>
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                  <strong>Cobertura</strong><br/>
                  <span style={{ fontSize: '24px', color: '#17a2b8' }}>{Math.round(resultado.cobertura * 100)}%</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4>📝 Análisis Detallado:</h4>
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                  {resultado.analisis}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <h4>✅ Fortalezas:</h4>
                  <ul style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                    {resultado.detalles.fortalezas.map((fortaleza: string, index: number) => (
                      <li key={index}>{fortaleza}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4>⚠️ Áreas de Mejora:</h4>
                  <ul style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                    {resultado.detalles.errores.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4>💡 Sugerencias:</h4>
                <ul style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                  {resultado.sugerencias.map((sugerencia: string, index: number) => (
                    <li key={index}>{sugerencia}</li>
                  ))}
                </ul>
              </div>

              {resultado.metadata && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>📊 Metadatos:</h4>
                  <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', fontSize: '14px' }}>
                    <div><strong>Tiempo de procesamiento:</strong> {resultado.metadata.processingTime}ms</div>
                    <div><strong>Timestamp:</strong> {new Date(resultado.metadata.timestamp).toLocaleString()}</div>
                    {resultado.metadata.tokensUsed && (
                      <div><strong>Tokens usados:</strong> {resultado.metadata.tokensUsed}</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4>📄 Resumen Completo:</h4>
                <textarea
                  value={resultado.resumen}
                  readOnly
                  style={{
                    width: '100%',
                    height: '300px',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    backgroundColor: '#f8f9fa'
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '10px' }}>
        <h4>⚠️ Importante:</h4>
        <ul>
          <li><strong>Requiere conexión:</strong> Necesita acceso a ChatGPT a través del backend</li>
          <li><strong>Análisis inteligente:</strong> ChatGPT actúa como un experto en terapia ocupacional</li>
          <li><strong>Métricas precisas:</strong> Proporciona análisis detallado y sugerencias</li>
          <li><strong>Costo de tokens:</strong> Cada evaluación consume tokens de ChatGPT</li>
          <li><strong>Tiempo de respuesta:</strong> Puede tomar varios segundos</li>
        </ul>
      </div>
    </div>
  );
};

export default EvaluacionChatGPT;
