import React, { useState } from 'react';
import { diagnosticarEvaluacion, generarReporteDiagnostico, AnalisisCompleto } from '../utils/diagnosticoEvaluacion';

/**
 * Componente para diagnosticar problemas en la evaluación
 * Ayuda a identificar por qué la evaluación no es precisa
 */
const DiagnosticoEvaluacion: React.FC = () => {
  const [analisis, setAnalisis] = useState<AnalisisCompleto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [coordenadasUsuario, setCoordenadasUsuario] = useState<string>('');
  const [coordenadasModelo, setCoordenadasModelo] = useState<string>('');
  const [figuraEsperada, setFiguraEsperada] = useState<string>('cuadrado');

  // Ejemplos de coordenadas problemáticas
  const ejemplosProblematicos = {
    cuadrado_muy_pequeno: {
      usuario: '[{"x": 100, "y": 100}, {"x": 102, "y": 100}, {"x": 102, "y": 102}, {"x": 100, "y": 102}, {"x": 100, "y": 100}]',
      modelo: '[{"x": 50, "y": 50}, {"x": 150, "y": 50}, {"x": 150, "y": 150}, {"x": 50, "y": 150}, {"x": 50, "y": 50}]',
      descripcion: 'Cuadrado muy pequeño (2x2px)'
    },
    triangulo_mal_dibujado: {
      usuario: '[{"x": 100, "y": 100}, {"x": 200, "y": 100}, {"x": 150, "y": 200}, {"x": 100, "y": 100}, {"x": 120, "y": 120}, {"x": 180, "y": 120}, {"x": 150, "y": 180}]',
      modelo: '[{"x": 100, "y": 50}, {"x": 50, "y": 150}, {"x": 150, "y": 150}, {"x": 100, "y": 50}]',
      descripcion: 'Triángulo con líneas curvas'
    },
    circulo_muy_pocos_puntos: {
      usuario: '[{"x": 100, "y": 100}, {"x": 120, "y": 100}, {"x": 100, "y": 100}]',
      modelo: '[{"x": 100, "y": 100}, {"x": 120, "y": 80}, {"x": 140, "y": 100}, {"x": 120, "y": 120}, {"x": 100, "y": 100}, {"x": 80, "y": 120}, {"x": 60, "y": 100}, {"x": 80, "y": 80}, {"x": 100, "y": 100}]',
      descripcion: 'Círculo con muy pocos puntos'
    },
    forma_incorrecta: {
      usuario: '[{"x": 100, "y": 100}, {"x": 200, "y": 100}, {"x": 200, "y": 200}, {"x": 100, "y": 200}, {"x": 100, "y": 100}]',
      modelo: '[{"x": 100, "y": 50}, {"x": 50, "y": 150}, {"x": 150, "y": 150}, {"x": 100, "y": 50}]',
      descripcion: 'Cuadrado cuando se espera triángulo'
    }
  };

  const ejecutarDiagnostico = async () => {
    setCargando(true);
    
    try {
      // Parsear coordenadas
      const usuario = JSON.parse(coordenadasUsuario);
      const modelo = JSON.parse(coordenadasModelo);
      
      // Ejecutar diagnóstico
      const resultado = diagnosticarEvaluacion(usuario, modelo, figuraEsperada);
      setAnalisis(resultado);
      
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      alert('Error al procesar las coordenadas. Verifica el formato JSON.');
    } finally {
      setCargando(false);
    }
  };

  const cargarEjemplo = (ejemplo: keyof typeof ejemplosProblematicos) => {
    const ej = ejemplosProblematicos[ejemplo];
    setCoordenadasUsuario(ej.usuario);
    setCoordenadasModelo(ej.modelo);
    setFiguraEsperada(ejemplo.includes('cuadrado') ? 'cuadrado' : 
                     ejemplo.includes('triangulo') ? 'triangulo' : 
                     ejemplo.includes('circulo') ? 'circulo' : 'cuadrado');
  };

  const limpiar = () => {
    setAnalisis(null);
    setCoordenadasUsuario('');
    setCoordenadasModelo('');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px' }}>
      <h2>🔍 Diagnóstico de Evaluación - Identificar Problemas</h2>
      
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
        
        <button
          onClick={limpiar}
          style={{
            padding: '8px 15px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Limpiar
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Casos Problemáticos para Probar:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
          {Object.entries(ejemplosProblematicos).map(([key, ejemplo]) => (
            <button
              key={key}
              onClick={() => cargarEjemplo(key as keyof typeof ejemplosProblematicos)}
              style={{
                padding: '10px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left'
              }}
            >
              ⚠️ {ejemplo.descripcion}
            </button>
          ))}
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
          onClick={ejecutarDiagnostico}
          disabled={cargando || !coordenadasUsuario || !coordenadasModelo}
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
          {cargando ? '🔍 Analizando...' : '🔍 Ejecutar Diagnóstico'}
        </button>
      </div>

      {analisis && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '10px', 
          padding: '20px',
          marginTop: '20px'
        }}>
          <h3>📊 Resultado del Diagnóstico</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
              <strong>Puntuación Actual:</strong><br/>
              <span style={{ fontSize: '24px', color: '#dc3545' }}>{analisis.puntuacionActual}</span>
            </div>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
              <strong>Puntuación Corregida:</strong><br/>
              <span style={{ fontSize: '24px', color: '#28a745' }}>{analisis.puntuacionCorregida}</span>
            </div>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
              <strong>Problemas:</strong><br/>
              <span style={{ fontSize: '24px', color: '#ffc107' }}>{analisis.problemas.length}</span>
            </div>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
              <strong>Puntos Usuario:</strong><br/>
              <span style={{ fontSize: '24px', color: '#007bff' }}>{analisis.coordenadasUsuario.length}</span>
            </div>
          </div>

          {analisis.problemas.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4>🚨 Problemas Identificados:</h4>
              {analisis.problemas.map((problema, index) => {
                const colorSeveridad = problema.severidad === 'critica' ? '#dc3545' : 
                                      problema.severidad === 'alta' ? '#fd7e14' : 
                                      problema.severidad === 'media' ? '#ffc107' : '#28a745';
                
                return (
                  <div key={index} style={{ 
                    backgroundColor: 'white', 
                    border: `2px solid ${colorSeveridad}`, 
                    borderRadius: '5px', 
                    padding: '15px', 
                    marginBottom: '10px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ 
                        backgroundColor: colorSeveridad, 
                        color: 'white', 
                        padding: '5px 10px', 
                        borderRadius: '3px', 
                        fontSize: '12px',
                        marginRight: '10px'
                      }}>
                        {problema.severidad.toUpperCase()}
                      </span>
                      <strong>{problema.problema}</strong>
                    </div>
                    <p><strong>Descripción:</strong> {problema.descripcion}</p>
                    <p><strong>Solución:</strong> {problema.solucion}</p>
                    <details style={{ marginTop: '10px' }}>
                      <summary>Detalles técnicos</summary>
                      <pre style={{ fontSize: '12px', marginTop: '10px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '3px' }}>
                        {JSON.stringify(problema.datos, null, 2)}
                      </pre>
                    </details>
                  </div>
                );
              })}
            </div>
          )}

          {analisis.recomendaciones.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4>💡 Recomendaciones:</h4>
              <ul style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
                {analisis.recomendaciones.map((rec, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <h4>📄 Reporte Completo:</h4>
            <textarea
              value={generarReporteDiagnostico(analisis)}
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
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '10px' }}>
        <h4>💡 Cómo usar este diagnóstico:</h4>
        <ol>
          <li><strong>Cargar un ejemplo problemático</strong> para ver qué problemas se detectan</li>
          <li><strong>Pegar coordenadas reales</strong> de una evaluación que no funcionó bien</li>
          <li><strong>Revisar los problemas identificados</strong> y sus soluciones</li>
          <li><strong>Aplicar las recomendaciones</strong> para mejorar la evaluación</li>
          <li><strong>Comparar puntuaciones</strong> actual vs corregida</li>
        </ol>
      </div>
    </div>
  );
};

export default DiagnosticoEvaluacion;
