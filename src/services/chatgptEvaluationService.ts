// Servicio para comunicarse con ChatGPT a través del backend
// Envía coordenadas y recibe evaluación inteligente

import { CoordenadasParaChatGPT, RespuestaChatGPT, crearPromptParaChatGPT, procesarRespuestaChatGPT } from '../utils/evaluacionChatGPT';

export interface EvaluacionChatGPTRequest {
  coordenadasUsuario: Array<{ x: number; y: number }>;
  coordenadasModelo: Array<{ x: number; y: number }>;
  figuraEsperada: string;
  contexto?: {
    paciente?: string;
    sesion?: string;
    nivel?: string;
  };
}

export interface EvaluacionChatGPTResponse {
  success: boolean;
  data?: RespuestaChatGPT;
  error?: string;
  metadata?: {
    timestamp: string;
    processingTime: number;
    tokensUsed?: number;
  };
}

/**
 * Envía coordenadas a ChatGPT para evaluación a través del backend
 */
export const evaluarConChatGPT = async (
  request: EvaluacionChatGPTRequest
): Promise<EvaluacionChatGPTResponse> => {
  try {
    console.log('🤖 Enviando evaluación a ChatGPT...', {
      puntosUsuario: request.coordenadasUsuario.length,
      puntosModelo: request.coordenadasModelo.length,
      figuraEsperada: request.figuraEsperada
    });

    const startTime = Date.now();

    // Formatear datos para ChatGPT
    const datosParaChatGPT = {
      usuario: {
        puntos: request.coordenadasUsuario,
        descripcion: `Trazo del usuario con ${request.coordenadasUsuario.length} puntos`
      },
      modelo: {
        puntos: request.coordenadasModelo,
        descripcion: `Modelo de referencia con ${request.coordenadasModelo.length} puntos`
      },
      ejercicio: {
        tipo: "grafomotricidad",
        figuraEsperada: request.figuraEsperada,
        nivel: request.contexto?.nivel || "básico"
      },
      contexto: {
        paciente: request.contexto?.paciente || "Paciente",
        sesion: request.contexto?.sesion || "Sesión actual",
        fecha: new Date().toISOString()
      }
    };

    // Crear prompt para ChatGPT
    const prompt = crearPromptParaChatGPT(datosParaChatGPT);

    // Enviar al backend
    const response = await fetch('/api/evaluaciones/chatgpt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        prompt: prompt,
        coordenadas: datosParaChatGPT,
        configuracion: {
          modelo: 'gpt-4',
          temperatura: 0.3,
          maxTokens: 1000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;

    console.log('✅ Respuesta recibida de ChatGPT:', {
      processingTime: `${processingTime}ms`,
      success: result.success
    });

    if (result.success && result.data) {
      // Procesar respuesta de ChatGPT
      const respuestaProcesada = procesarRespuestaChatGPT(result.data);
      
      if (respuestaProcesada) {
        return {
          success: true,
          data: respuestaProcesada,
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime,
            tokensUsed: result.metadata?.tokensUsed
          }
        };
      } else {
        return {
          success: false,
          error: 'Error procesando respuesta de ChatGPT',
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime
          }
        };
      }
    } else {
      return {
        success: false,
        error: result.error || 'Error desconocido del servidor',
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime
        }
      };
    }

  } catch (error) {
    console.error('❌ Error en evaluación con ChatGPT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 0
      }
    };
  }
};

/**
 * Envía múltiples evaluaciones en lote
 */
export const evaluarLoteConChatGPT = async (
  requests: EvaluacionChatGPTRequest[]
): Promise<EvaluacionChatGPTResponse[]> => {
  console.log(`🤖 Enviando ${requests.length} evaluaciones a ChatGPT...`);
  
  const resultados: EvaluacionChatGPTResponse[] = [];
  
  // Procesar en lotes de 5 para evitar sobrecarga
  const loteSize = 5;
  for (let i = 0; i < requests.length; i += loteSize) {
    const lote = requests.slice(i, i + loteSize);
    
    const promesas = lote.map(request => evaluarConChatGPT(request));
    const resultadosLote = await Promise.all(promesas);
    
    resultados.push(...resultadosLote);
    
    // Pausa entre lotes para evitar rate limiting
    if (i + loteSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`✅ Procesadas ${resultados.length} evaluaciones`);
  return resultados;
};

/**
 * Valida si el servicio está disponible
 */
export const verificarDisponibilidadChatGPT = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/evaluaciones/chatgpt/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error verificando disponibilidad de ChatGPT:', error);
    return false;
  }
};

/**
 * Obtiene estadísticas de uso de ChatGPT
 */
export const obtenerEstadisticasChatGPT = async (): Promise<{
  totalEvaluaciones: number;
  promedioTiempo: number;
  tokensUsados: number;
  ultimaEvaluacion: string;
} | null> => {
  try {
    const response = await fetch('/api/evaluaciones/chatgpt/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo estadísticas de ChatGPT:', error);
    return null;
  }
};
