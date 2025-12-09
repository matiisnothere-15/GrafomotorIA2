// Sistema de evaluación usando ChatGPT para comparar coordenadas
// Envía las coordenadas del usuario y modelo a ChatGPT para análisis inteligente

export interface CoordenadasParaChatGPT {
  usuario: {
    puntos: Array<{ x: number; y: number }>;
    descripcion: string;
  };
  modelo: {
    puntos: Array<{ x: number; y: number }>;
    descripcion: string;
  };
  ejercicio: {
    tipo: string;
    figuraEsperada: string;
    nivel: string;
  };
  contexto: {
    paciente: string;
    sesion: string;
    fecha: string;
  };
}

export interface RespuestaChatGPT {
  puntuacion: number; // 0-100
  analisis: string;
  formaDetectada: string;
  precision: number; // 0-1
  cobertura: number; // 0-1
  sugerencias: string[];
  detalles: {
    similitud: number;
    errores: string[];
    fortalezas: string[];
  };
}

/**
 * Formatea las coordenadas para enviar a ChatGPT
 */
export const formatearCoordenadasParaChatGPT = (
  coordenadasUsuario: Array<{ x: number; y: number }>,
  coordenadasModelo: Array<{ x: number; y: number }>,
  figuraEsperada: string,
  contextoAdicional?: any
): CoordenadasParaChatGPT => {
  
  // Normalizar coordenadas para mejor análisis
  const usuarioNormalizado = normalizarCoordenadas(coordenadasUsuario);
  const modeloNormalizado = normalizarCoordenadas(coordenadasModelo);
  
  return {
    usuario: {
      puntos: usuarioNormalizado,
      descripcion: `Trazo del usuario con ${usuarioNormalizado.length} puntos`
    },
    modelo: {
      puntos: modeloNormalizado,
      descripcion: `Modelo de referencia con ${modeloNormalizado.length} puntos`
    },
    ejercicio: {
      tipo: "grafomotricidad",
      figuraEsperada: figuraEsperada,
      nivel: contextoAdicional?.nivel || "básico"
    },
    contexto: {
      paciente: contextoAdicional?.paciente || "Paciente",
      sesion: contextoAdicional?.sesion || "Sesión actual",
      fecha: new Date().toISOString()
    }
  };
};

/**
 * Crea el prompt para ChatGPT
 */
export const crearPromptParaChatGPT = (datos: CoordenadasParaChatGPT): string => {
  return `
Eres un experto en terapia ocupacional y análisis de grafomotricidad pediátrica. 

**TAREA:** Analiza las coordenadas de un ejercicio de grafomotricidad y evalúa la precisión del trazo del usuario comparándolo con el modelo de referencia.

**DATOS DEL EJERCICIO:**
- Tipo: ${datos.ejercicio.tipo}
- Figura esperada: ${datos.ejercicio.figuraEsperada}
- Nivel: ${datos.ejercicio.nivel}
- Paciente: ${datos.contexto.paciente}
- Fecha: ${datos.contexto.fecha}

**COORDENADAS DEL USUARIO (${datos.usuario.puntos.length} puntos):**
${JSON.stringify(datos.usuario.puntos, null, 2)}

**COORDENADAS DEL MODELO (${datos.modelo.puntos.length} puntos):**
${JSON.stringify(datos.modelo.puntos, null, 2)}

**INSTRUCCIONES DE EVALUACIÓN:**

1. **DETECTA LA FORMA:** Analiza las coordenadas del usuario y determina qué forma geométrica dibujó.

2. **COMPARA CON EL MODELO:** Evalúa qué tan similar es el trazo del usuario al modelo de referencia.

3. **CALCULA MÉTRICAS:**
   - Precisión (0-1): Qué tan exacto es el trazo
   - Cobertura (0-1): Qué porcentaje del modelo está cubierto
   - Similitud (0-1): Qué tan similar es la forma general

4. **IDENTIFICA PROBLEMAS:**
   - Errores en la forma geométrica
   - Problemas de proporción
   - Desviaciones del modelo
   - Fortalezas del trazo

5. **GENERA SUGERENCIAS:** Recomendaciones específicas para mejorar.

**FORMATO DE RESPUESTA (JSON):**
{
  "puntuacion": 85,
  "analisis": "El paciente demostró buena precisión en el trazado del cuadrado. Las esquinas están bien definidas y las proporciones son adecuadas. Se observa una ligera desviación en la esquina superior derecha.",
  "formaDetectada": "cuadrado",
  "precision": 0.85,
  "cobertura": 0.92,
  "sugerencias": [
    "Trabajar en la precisión de las esquinas",
    "Practicar el control del lápiz en líneas rectas",
    "Continuar con ejercicios de formas geométricas básicas"
  ],
  "detalles": {
    "similitud": 0.88,
    "errores": ["Esquina superior derecha ligeramente redondeada"],
    "fortalezas": ["Buenas proporciones", "Esquinas bien definidas", "Trazo continuo"]
  }
}

**IMPORTANTE:**
- Responde SOLO en formato JSON válido
- La puntuación debe ser un número entero entre 0-100
- Las métricas deben ser números entre 0-1
- Sé específico y constructivo en el análisis
- Considera que es un ejercicio pediátrico, sé comprensivo pero preciso
`;
};

/**
 * Procesa la respuesta de ChatGPT
 */
export const procesarRespuestaChatGPT = (respuesta: string): RespuestaChatGPT | null => {
  try {
    // Limpiar la respuesta (remover markdown si existe)
    const respuestaLimpia = respuesta
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const datos = JSON.parse(respuestaLimpia);
    
    // Validar estructura
    if (!datos.puntuacion || !datos.analisis || !datos.formaDetectada) {
      throw new Error('Estructura de respuesta inválida');
    }
    
    return {
      puntuacion: Math.max(0, Math.min(100, datos.puntuacion)),
      analisis: datos.analisis,
      formaDetectada: datos.formaDetectada,
      precision: Math.max(0, Math.min(1, datos.precision || 0)),
      cobertura: Math.max(0, Math.min(1, datos.cobertura || 0)),
      sugerencias: Array.isArray(datos.sugerencias) ? datos.sugerencias : [],
      detalles: {
        similitud: Math.max(0, Math.min(1, datos.detalles?.similitud || 0)),
        errores: Array.isArray(datos.detalles?.errores) ? datos.detalles.errores : [],
        fortalezas: Array.isArray(datos.detalles?.fortalezas) ? datos.detalles.fortalezas : []
      }
    };
  } catch (error) {
    console.error('Error procesando respuesta de ChatGPT:', error);
    return null;
  }
};

/**
 * Normaliza coordenadas para mejor análisis
 */
const normalizarCoordenadas = (coordenadas: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> => {
  if (coordenadas.length === 0) return [];
  
  // Calcular bounds
  const xs = coordenadas.map(p => p.x);
  const ys = coordenadas.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  // Normalizar a escala 0-100
  const width = maxX - minX;
  const height = maxY - minY;
  const scale = Math.max(width, height) / 100;
  
  if (scale === 0) return coordenadas;
  
  return coordenadas.map(p => ({
    x: Math.round((p.x - minX) / scale),
    y: Math.round((p.y - minY) / scale)
  }));
};

/**
 * Crea un resumen de la evaluación para mostrar al usuario
 */
export const crearResumenEvaluacion = (respuesta: RespuestaChatGPT): string => {
  return `
# 🎯 Evaluación con ChatGPT

## 📊 Resultado General
- **Puntuación:** ${respuesta.puntuacion}/100
- **Forma detectada:** ${respuesta.formaDetectada}
- **Precisión:** ${Math.round(respuesta.precision * 100)}%
- **Cobertura:** ${Math.round(respuesta.cobertura * 100)}%

## 📝 Análisis
${respuesta.analisis}

## ✅ Fortalezas
${respuesta.detalles.fortalezas.map(f => `- ${f}`).join('\n')}

## ⚠️ Áreas de Mejora
${respuesta.detalles.errores.map(e => `- ${e}`).join('\n')}

## 💡 Sugerencias
${respuesta.sugerencias.map(s => `- ${s}`).join('\n')}
`;
};

/**
 * Valida si las coordenadas son adecuadas para enviar a ChatGPT
 */
export const validarCoordenadasParaChatGPT = (
  coordenadasUsuario: Array<{ x: number; y: number }>,
  coordenadasModelo: Array<{ x: number; y: number }>
): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];
  
  if (coordenadasUsuario.length < 3) {
    errores.push('Muy pocos puntos del usuario (mínimo 3)');
  }
  
  if (coordenadasModelo.length < 3) {
    errores.push('Muy pocos puntos del modelo (mínimo 3)');
  }
  
  if (coordenadasUsuario.length > 500) {
    errores.push('Demasiados puntos del usuario (máximo 500)');
  }
  
  if (coordenadasModelo.length > 500) {
    errores.push('Demasiados puntos del modelo (máximo 500)');
  }
  
  return {
    valido: errores.length === 0,
    errores
  };
};
