import React from 'react';
import { convertirPuntuacionAEstrellas } from '../utils/evaluacionSimple';

interface AnalisisChatGPTProps {
  puntuacion: number;
  analisis: string;
  formaDetectada: string;
  precision: number;
  cobertura: number;
  sugerencias: string[];
  errores: string[];
  fortalezas: string[];
}

/**
 * Componente para mostrar el análisis detallado de ChatGPT
 * Diseñado para ser motivacional y comprensivo para niños
 */
const AnalisisChatGPT: React.FC<AnalisisChatGPTProps> = ({
  puntuacion,
  analisis,
  formaDetectada,
  precision,
  cobertura,
  sugerencias,
  errores,
  fortalezas
}) => {
  
  // Calcular estrellas basado en la nueva escala comprensiva
  const estrellas = convertirPuntuacionAEstrellas(puntuacion);
  
  // Generar mensaje motivacional basado en la puntuación
  const getMensajeMotivacional = (puntuacion: number): string => {
    if (puntuacion >= 90) return "¡Increíble! 🎉 ¡Eres un artista!";
    if (puntuacion >= 80) return "¡Excelente trabajo! 🌟 ¡Muy bien hecho!";
    if (puntuacion >= 70) return "¡Muy bien! 👏 ¡Sigue así!";
    if (puntuacion >= 60) return "¡Buen trabajo! 👍 ¡Estás mejorando!";
    if (puntuacion >= 40) return "¡Bien hecho! 😊 ¡Sigue practicando!";
    return "¡Sigue intentando! 💪 ¡Tú puedes!";
  };

  const mensajeMotivacional = getMensajeMotivacional(puntuacion);

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      border: '2px solid #28a745',
      borderRadius: '15px',
      padding: '20px',
      margin: '20px 0',
      fontFamily: 'Arial, sans-serif',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header con estrellas */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ 
          color: '#28a745', 
          margin: '0 0 10px 0',
          fontSize: '24px'
        }}>
          {mensajeMotivacional}
        </h3>
        
        {/* Estrellas */}
        <div style={{ fontSize: '30px', marginBottom: '10px' }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              style={{
                color: i < estrellas ? '#ffc107' : '#e9ecef',
                margin: '0 2px'
              }}
            >
              ⭐
            </span>
          ))}
        </div>
        
        <div style={{ 
          fontSize: '18px', 
          color: '#6c757d',
          fontWeight: 'bold'
        }}>
          {estrellas} de 5 estrellas
        </div>
      </div>

      {/* Análisis principal */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '15px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ color: '#495057', margin: '0 0 10px 0' }}>
          📝 Análisis de tu dibujo:
        </h4>
        <p style={{ 
          margin: 0, 
          lineHeight: '1.6',
          color: '#495057'
        }}>
          {analisis}
        </p>
      </div>

      {/* Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '10px',
        marginBottom: '15px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '10px',
          textAlign: 'center',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Forma detectada</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#495057' }}>
            {formaDetectada}
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '10px',
          textAlign: 'center',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Precisión</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
            {Math.round(precision * 100)}%
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '10px',
          textAlign: 'center',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Cobertura</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#17a2b8' }}>
            {Math.round(cobertura * 100)}%
          </div>
        </div>
      </div>

      {/* Fortalezas */}
      {fortalezas.length > 0 && (
        <div style={{
          backgroundColor: '#d4edda',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '15px',
          border: '1px solid #c3e6cb'
        }}>
          <h4 style={{ color: '#155724', margin: '0 0 10px 0' }}>
            ✅ ¡Lo que hiciste muy bien!
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#155724' }}>
            {fortalezas.map((fortaleza, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                {fortaleza}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Áreas de mejora (solo si hay errores menores) */}
      {errores.length > 0 && errores.length <= 2 && (
        <div style={{
          backgroundColor: '#fff3cd',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '15px',
          border: '1px solid #ffeaa7'
        }}>
          <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>
            💡 Para mejorar aún más:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
            {errores.map((error, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sugerencias */}
      {sugerencias.length > 0 && (
        <div style={{
          backgroundColor: '#e7f3ff',
          borderRadius: '10px',
          padding: '15px',
          border: '1px solid #b3d9ff'
        }}>
          <h4 style={{ color: '#004085', margin: '0 0 10px 0' }}>
            🎯 Sugerencias para seguir practicando:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#004085' }}>
            {sugerencias.map((sugerencia, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                {sugerencia}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer motivacional */}
      <div style={{
        textAlign: 'center',
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <p style={{ 
          margin: 0, 
          color: '#6c757d',
          fontSize: '14px',
          fontStyle: 'italic'
        }}>
          🤖 Análisis realizado con inteligencia artificial para ayudarte a mejorar
        </p>
      </div>
    </div>
  );
};

export default AnalisisChatGPT;
