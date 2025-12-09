import React, { useState } from 'react';
import { detectarFormaGeometrica, validarFormaCorrecta } from '../utils/evaluacionMejorada';

/**
 * Componente de demostración MEJORADO para probar la validación de forma geométrica
 * Este componente permite probar casos reales y ajustar el algoritmo
 */
const ValidacionFormaDemo: React.FC = () => {
  const [resultado, setResultado] = useState<any>(null);
  const [figuraEsperada, setFiguraEsperada] = useState<string>('cuadrado');
  const [casosPrueba, setCasosPrueba] = useState<any[]>([]);

  // Coordenadas de ejemplo MEJORADAS para diferentes formas
  const ejemplosFormas = {
    circulo: [
      { x: 100, y: 100 }, { x: 120, y: 80 }, { x: 140, y: 100 }, { x: 120, y: 120 },
      { x: 100, y: 100 }, { x: 80, y: 120 }, { x: 60, y: 100 }, { x: 80, y: 80 },
      { x: 100, y: 100 }, { x: 110, y: 90 }, { x: 120, y: 100 }, { x: 110, y: 110 }
    ],
    cuadrado: [
      { x: 50, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 150 }, { x: 50, y: 150 },
      { x: 50, y: 50 }, { x: 70, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 70 },
      { x: 150, y: 150 }, { x: 130, y: 150 }, { x: 50, y: 150 }, { x: 50, y: 130 }
    ],
    triangulo: [
      { x: 100, y: 50 }, { x: 50, y: 150 }, { x: 150, y: 150 }, { x: 100, y: 50 },
      { x: 80, y: 100 }, { x: 120, y: 100 }, { x: 100, y: 50 }
    ],
    estrella: [
      { x: 100, y: 20 }, { x: 120, y: 80 }, { x: 180, y: 80 }, { x: 130, y: 120 },
      { x: 150, y: 180 }, { x: 100, y: 140 }, { x: 50, y: 180 }, { x: 70, y: 120 },
      { x: 20, y: 80 }, { x: 80, y: 80 }, { x: 100, y: 20 }, { x: 110, y: 50 },
      { x: 140, y: 60 }, { x: 160, y: 100 }
    ],
    linea: [
      { x: 50, y: 100 }, { x: 100, y: 100 }, { x: 150, y: 100 }, { x: 200, y: 100 },
      { x: 250, y: 100 }, { x: 300, y: 100 }
    ],
    // Casos problemáticos para probar
    circulo_malo: [
      { x: 100, y: 100 }, { x: 120, y: 100 }, { x: 140, y: 100 }, { x: 160, y: 100 },
      { x: 180, y: 100 }, { x: 200, y: 100 }
    ],
    cuadrado_malo: [
      { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 }, { x: 100, y: 200 },
      { x: 100, y: 100 }, { x: 150, y: 150 }, { x: 200, y: 200 }
    ],
    triangulo_malo: [
      { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 150, y: 200 }, { x: 100, y: 100 },
      { x: 120, y: 120 }, { x: 180, y: 120 }, { x: 150, y: 180 }
    ]
  };

  const probarForma = (tipoForma: string) => {
    const puntos = ejemplosFormas[tipoForma as keyof typeof ejemplosFormas];
    const deteccion = detectarFormaGeometrica(puntos);
    const validacion = validarFormaCorrecta(deteccion.tipo, figuraEsperada);
    
    const resultadoPrueba = {
      tipoForma,
      puntos: puntos.length,
      deteccion,
      validacion,
      esCorrecto: validacion.esCorrecto,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setResultado(resultadoPrueba);
    setCasosPrueba(prev => [resultadoPrueba, ...prev.slice(0, 9)]); // Mantener últimos 10
  };

  const probarTodosLosCasos = () => {
    const resultados: any[] = [];
    
    Object.keys(ejemplosFormas).forEach(tipoForma => {
      const puntos = ejemplosFormas[tipoForma as keyof typeof ejemplosFormas];
      const deteccion = detectarFormaGeometrica(puntos);
      const validacion = validarFormaCorrecta(deteccion.tipo, figuraEsperada);
      
      resultados.push({
        tipoForma,
        puntos: puntos.length,
        deteccion,
        validacion,
        esCorrecto: validacion.esCorrecto
      });
    });
    
    setCasosPrueba(resultados);
  };

  const limpiarResultados = () => {
    setResultado(null);
    setCasosPrueba([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px' }}>
      <h2>🧪 Prueba MEJORADA de Validación de Formas Geométricas</h2>
      
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
          onClick={probarTodosLosCasos}
          style={{
            padding: '8px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Probar Todos los Casos
        </button>
        
        <button
          onClick={limpiarResultados}
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
        <h3>Probar formas individuales:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {Object.keys(ejemplosFormas).map(tipo => (
            <button
              key={tipo}
              onClick={() => probarForma(tipo)}
              style={{
                padding: '10px',
                backgroundColor: tipo.includes('malo') ? '#ffc107' : '#E30613',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {tipo.includes('malo') ? '⚠️ ' : '✅ '}
              {tipo.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Resultado individual */}
      {resultado && (
        <div style={{ 
          backgroundColor: resultado.esCorrecto ? '#d4edda' : '#f8d7da',
          border: `1px solid ${resultado.esCorrecto ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3>Resultado Individual:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <p><strong>Forma probada:</strong> {resultado.tipoForma}</p>
            <p><strong>Puntos:</strong> {resultado.puntos}</p>
            <p><strong>Forma detectada:</strong> {resultado.deteccion.tipo}</p>
            <p><strong>Confianza:</strong> {Math.round(resultado.deteccion.confianza * 100)}%</p>
            <p><strong>¿Es correcto?</strong> {resultado.esCorrecto ? '✅ Sí' : '❌ No'}</p>
            <p><strong>Hora:</strong> {resultado.timestamp}</p>
          </div>
          
          <details style={{ marginTop: '10px' }}>
            <summary>Detalles técnicos</summary>
            <pre style={{ fontSize: '12px', marginTop: '10px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '3px' }}>
              {JSON.stringify(resultado.deteccion.detalles, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Tabla de resultados múltiples */}
      {casosPrueba.length > 0 && (
        <div>
          <h3>Resultados de Pruebas ({casosPrueba.length} casos):</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Forma</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Puntos</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Detectada</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Confianza</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Correcto</th>
                  <th style={{ border: '1px solid #dee2e6', padding: '8px' }}>Hora</th>
                </tr>
              </thead>
              <tbody>
                {casosPrueba.map((caso, index) => (
                  <tr key={index} style={{ backgroundColor: caso.esCorrecto ? '#d4edda' : '#f8d7da' }}>
                    <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{caso.tipoForma}</td>
                    <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{caso.puntos}</td>
                    <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{caso.deteccion.tipo}</td>
                    <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{Math.round(caso.deteccion.confianza * 100)}%</td>
                    <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>
                      {caso.esCorrecto ? '✅' : '❌'}
                    </td>
                    <td style={{ border: '1px solid #dee2e6', padding: '8px' }}>{caso.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <strong>Resumen:</strong> 
            {casosPrueba.filter(c => c.esCorrecto).length} correctos de {casosPrueba.length} casos
            ({Math.round(casosPrueba.filter(c => c.esCorrecto).length / casosPrueba.length * 100)}%)
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '10px' }}>
        <h4>💡 Mejoras Implementadas:</h4>
        <ul>
          <li><strong>🔵 Círculo mejorado:</strong> Análisis de curvatura y variación de distancia al centro</li>
          <li><strong>⬜ Cuadrado mejorado:</strong> Detección de esquinas, ángulos rectos y lados paralelos</li>
          <li><strong>🔺 Triángulo mejorado:</strong> Validación de 3 esquinas principales y suma de ángulos</li>
          <li><strong>⭐ Estrella mejorada:</strong> Análisis de simetría radial y múltiples esquinas</li>
          <li><strong>📏 Línea mejorada:</strong> Relación de aspecto y longitud del trazo</li>
        </ul>
        
        <h4>🎯 Criterios de Validación:</h4>
        <ul>
          <li><strong>Flexibilidad:</strong> Tolerancias ajustadas para casos reales</li>
          <li><strong>Robustez:</strong> Múltiples algoritmos de detección</li>
          <li><strong>Precisión:</strong> Validación geométrica real</li>
          <li><strong>Confianza:</strong> Puntuación basada en múltiples factores</li>
        </ul>
      </div>
    </div>
  );
};

export default ValidacionFormaDemo;