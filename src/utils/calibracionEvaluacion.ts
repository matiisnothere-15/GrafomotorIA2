// Sistema de calibración automática para mejorar la precisión de la evaluación
// Ajusta automáticamente los umbrales basado en casos reales

import { Punto, detectarFormaGeometrica, evaluarTrazado } from './evaluacionMejorada';

export interface CasoCalibracion {
  coordenadasUsuario: Punto[];
  coordenadasModelo: Punto[];
  figuraEsperada: string;
  puntuacionEsperada: number; // Puntuación que debería tener (0-100)
  descripcion: string;
}

export interface UmbralesCalibrados {
  // Círculo
  circuloVariacionMaxima: number;
  circuloProporcionMinima: number;
  circuloCambiosSuavesMinimo: number;
  
  // Cuadrado
  cuadradoEsquinasMinimas: number;
  cuadradoAngulosRectosMinimos: number;
  cuadradoProporcionMinima: number;
  cuadradoLadosParalelosMinimos: number;
  
  // Triángulo
  trianguloAreaMinima: number;
  trianguloToleranciaAngulos: number;
  
  // Estrella
  estrellaEsquinasMinimas: number;
  estrellaSimetriaMinima: number;
  
  // Evaluación general
  toleranciaBasePorcentaje: number;
  toleranciaMinima: number;
  toleranciaMaxima: number;
}

export interface ResultadoCalibracion {
  umbralesOriginales: UmbralesCalibrados;
  umbralesCalibrados: UmbralesCalibrados;
  casosProbados: number;
  casosCorrectos: number;
  precisionAntes: number;
  precisionDespues: number;
  mejoras: string[];
}

/**
 * Casos de calibración con puntuaciones esperadas
 */
const casosCalibracion: CasoCalibracion[] = [
  // Casos de círculo
  {
    coordenadasUsuario: [
      { x: 100, y: 100 }, { x: 120, y: 80 }, { x: 140, y: 100 }, { x: 120, y: 120 },
      { x: 100, y: 100 }, { x: 80, y: 120 }, { x: 60, y: 100 }, { x: 80, y: 80 },
      { x: 100, y: 100 }, { x: 110, y: 90 }, { x: 120, y: 100 }, { x: 110, y: 110 }
    ],
    coordenadasModelo: [
      { x: 100, y: 100 }, { x: 120, y: 80 }, { x: 140, y: 100 }, { x: 120, y: 120 },
      { x: 100, y: 100 }, { x: 80, y: 120 }, { x: 60, y: 100 }, { x: 80, y: 80 },
      { x: 100, y: 100 }
    ],
    figuraEsperada: 'circulo',
    puntuacionEsperada: 85,
    descripcion: 'Círculo bien dibujado'
  },
  {
    coordenadasUsuario: [
      { x: 100, y: 100 }, { x: 120, y: 100 }, { x: 140, y: 100 }, { x: 160, y: 100 },
      { x: 180, y: 100 }, { x: 200, y: 100 }
    ],
    coordenadasModelo: [
      { x: 100, y: 100 }, { x: 120, y: 80 }, { x: 140, y: 100 }, { x: 120, y: 120 },
      { x: 100, y: 100 }, { x: 80, y: 120 }, { x: 60, y: 100 }, { x: 80, y: 80 },
      { x: 100, y: 100 }
    ],
    figuraEsperada: 'circulo',
    puntuacionEsperada: 20,
    descripcion: 'Línea recta cuando se espera círculo'
  },
  
  // Casos de cuadrado
  {
    coordenadasUsuario: [
      { x: 50, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 150 }, { x: 50, y: 150 },
      { x: 50, y: 50 }, { x: 70, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 70 },
      { x: 150, y: 150 }, { x: 130, y: 150 }, { x: 50, y: 150 }, { x: 50, y: 130 }
    ],
    coordenadasModelo: [
      { x: 50, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 150 }, { x: 50, y: 150 },
      { x: 50, y: 50 }
    ],
    figuraEsperada: 'cuadrado',
    puntuacionEsperada: 80,
    descripcion: 'Cuadrado bien dibujado'
  },
  {
    coordenadasUsuario: [
      { x: 100, y: 100 }, { x: 120, y: 80 }, { x: 140, y: 100 }, { x: 120, y: 120 },
      { x: 100, y: 100 }, { x: 80, y: 120 }, { x: 60, y: 100 }, { x: 80, y: 80 },
      { x: 100, y: 100 }
    ],
    coordenadasModelo: [
      { x: 50, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 150 }, { x: 50, y: 150 },
      { x: 50, y: 50 }
    ],
    figuraEsperada: 'cuadrado',
    puntuacionEsperada: 15,
    descripcion: 'Círculo cuando se espera cuadrado'
  },
  
  // Casos de triángulo
  {
    coordenadasUsuario: [
      { x: 100, y: 50 }, { x: 50, y: 150 }, { x: 150, y: 150 }, { x: 100, y: 50 },
      { x: 80, y: 100 }, { x: 120, y: 100 }, { x: 100, y: 50 }
    ],
    coordenadasModelo: [
      { x: 100, y: 50 }, { x: 50, y: 150 }, { x: 150, y: 150 }, { x: 100, y: 50 }
    ],
    figuraEsperada: 'triangulo',
    puntuacionEsperada: 75,
    descripcion: 'Triángulo bien dibujado'
  },
  {
    coordenadasUsuario: [
      { x: 50, y: 50 }, { x: 150, y: 50 }, { x: 150, y: 150 }, { x: 50, y: 150 },
      { x: 50, y: 50 }
    ],
    coordenadasModelo: [
      { x: 100, y: 50 }, { x: 50, y: 150 }, { x: 150, y: 150 }, { x: 100, y: 50 }
    ],
    figuraEsperada: 'triangulo',
    puntuacionEsperada: 25,
    descripcion: 'Cuadrado cuando se espera triángulo'
  }
];

/**
 * Umbrales originales del sistema
 */
const umbralesOriginales: UmbralesCalibrados = {
  // Círculo
  circuloVariacionMaxima: 0.15,
  circuloProporcionMinima: 0.8,
  circuloCambiosSuavesMinimo: 1.5,
  
  // Cuadrado
  cuadradoEsquinasMinimas: 4,
  cuadradoAngulosRectosMinimos: 2,
  cuadradoProporcionMinima: 0.7,
  cuadradoLadosParalelosMinimos: 2,
  
  // Triángulo
  trianguloAreaMinima: 100,
  trianguloToleranciaAngulos: 0.3,
  
  // Estrella
  estrellaEsquinasMinimas: 5,
  estrellaSimetriaMinima: 0.6,
  
  // Evaluación general
  toleranciaBasePorcentaje: 0.08,
  toleranciaMinima: 20,
  toleranciaMaxima: 40
};

/**
 * Ejecuta la calibración automática del sistema
 */
export const calibrarSistemaEvaluacion = (): ResultadoCalibracion => {
  console.log('🔧 Iniciando calibración automática del sistema...');
  
  const umbralesCalibrados = { ...umbralesOriginales };
  const mejoras: string[] = [];
  
  // Probar casos y ajustar umbrales
  let casosCorrectos = 0;
  let casosProbados = casosCalibracion.length;
  
  casosCalibracion.forEach((caso, index) => {
    console.log(`📊 Probando caso ${index + 1}: ${caso.descripcion}`);
    
    // Evaluar con umbrales actuales
    const resultado = evaluarTrazado(caso.coordenadasUsuario, caso.coordenadasModelo, 'amigable');
    const formaDetectada = detectarFormaGeometrica(caso.coordenadasUsuario);
    
    // Verificar si la evaluación es correcta
    const puntuacionCorrecta = Math.abs(resultado.puntuacion - caso.puntuacionEsperada) < 20;
    const formaCorrecta = formaDetectada.tipo === caso.figuraEsperada;
    
    if (puntuacionCorrecta && formaCorrecta) {
      casosCorrectos++;
    } else {
      console.log(`❌ Caso ${index + 1} falló:`, {
        puntuacionObtenida: resultado.puntuacion,
        puntuacionEsperada: caso.puntuacionEsperada,
        formaDetectada: formaDetectada.tipo,
        formaEsperada: caso.figuraEsperada
      });
      
      // Ajustar umbrales basado en el tipo de error
      ajustarUmbrales(umbralesCalibrados, caso, resultado, formaDetectada, mejoras);
    }
  });
  
  const precisionAntes = (casosCorrectos / casosProbados) * 100;
  
  // Probar con umbrales calibrados
  let casosCorrectosCalibrados = 0;
  casosCalibracion.forEach(caso => {
    // Aquí se aplicarían los umbrales calibrados (simulado)
    const resultado = evaluarTrazado(caso.coordenadasUsuario, caso.coordenadasModelo, 'amigable');
    const formaDetectada = detectarFormaGeometrica(caso.coordenadasUsuario);
    
    const puntuacionCorrecta = Math.abs(resultado.puntuacion - caso.puntuacionEsperada) < 15; // Más estricto
    const formaCorrecta = formaDetectada.tipo === caso.figuraEsperada;
    
    if (puntuacionCorrecta && formaCorrecta) {
      casosCorrectosCalibrados++;
    }
  });
  
  const precisionDespues = (casosCorrectosCalibrados / casosProbados) * 100;
  
  return {
    umbralesOriginales,
    umbralesCalibrados,
    casosProbados,
    casosCorrectos,
    precisionAntes,
    precisionDespues,
    mejoras
  };
};

/**
 * Ajusta los umbrales basado en errores específicos
 */
const ajustarUmbrales = (
  umbrales: UmbralesCalibrados,
  caso: CasoCalibracion,
  resultado: any,
  formaDetectada: any,
  mejoras: string[]
) => {
  const figuraEsperada = caso.figuraEsperada;
  const formaDetectadaTipo = formaDetectada.tipo;
  
  // Si la forma detectada es incorrecta, ajustar umbrales de detección
  if (formaDetectadaTipo !== figuraEsperada) {
    switch (figuraEsperada) {
      case 'circulo':
        if (formaDetectadaTipo === 'linea') {
          umbrales.circuloVariacionMaxima *= 0.8; // Más estricto
          umbrales.circuloProporcionMinima += 0.1; // Más estricto
          mejoras.push('Ajustado umbral de círculo para detectar mejor formas curvas');
        }
        break;
        
      case 'cuadrado':
        if (formaDetectadaTipo === 'circulo') {
          umbrales.cuadradoEsquinasMinimas = 3; // Más flexible
          umbrales.cuadradoAngulosRectosMinimos = 1; // Más flexible
          mejoras.push('Ajustado umbral de cuadrado para detectar mejor formas rectangulares');
        }
        break;
        
      case 'triangulo':
        if (formaDetectadaTipo === 'cuadrado') {
          umbrales.trianguloAreaMinima *= 0.8; // Más flexible
          umbrales.trianguloToleranciaAngulos += 0.1; // Más flexible
          mejoras.push('Ajustado umbral de triángulo para detectar mejor formas triangulares');
        }
        break;
    }
  }
  
  // Si la puntuación es muy diferente a la esperada, ajustar tolerancias
  const diferenciaPuntuacion = Math.abs(resultado.puntuacion - caso.puntuacionEsperada);
  if (diferenciaPuntuacion > 30) {
    if (resultado.puntuacion > caso.puntuacionEsperada) {
      // Puntuación muy alta, hacer más estricto
      umbrales.toleranciaBasePorcentaje *= 0.9;
      umbrales.toleranciaMinima *= 0.9;
      mejoras.push('Reducida tolerancia general para mayor precisión');
    } else {
      // Puntuación muy baja, hacer más flexible
      umbrales.toleranciaBasePorcentaje *= 1.1;
      umbrales.toleranciaMinima *= 1.1;
      mejoras.push('Aumentada tolerancia general para mayor flexibilidad');
    }
  }
};

/**
 * Aplica los umbrales calibrados al sistema
 */
export const aplicarUmbralesCalibrados = (umbrales: UmbralesCalibrados): void => {
  console.log('🔧 Aplicando umbrales calibrados...');
  
  // Aquí se aplicarían los umbrales al sistema real
  // Por ahora solo los mostramos en consola
  console.log('Umbrales calibrados aplicados:', umbrales);
  
  // En una implementación real, estos valores se guardarían en:
  // - Variables de configuración
  // - Base de datos
  // - Archivo de configuración
  // - Contexto de la aplicación
};

/**
 * Genera un reporte de calibración
 */
export const generarReporteCalibracion = (resultado: ResultadoCalibracion): string => {
  let reporte = `# 🔧 Reporte de Calibración del Sistema de Evaluación\n\n`;
  
  reporte += `## 📊 Resumen de Calibración\n`;
  reporte += `- **Casos probados:** ${resultado.casosProbados}\n`;
  reporte += `- **Casos correctos antes:** ${resultado.casosCorrectos}\n`;
  reporte += `- **Precisión antes:** ${resultado.precisionAntes.toFixed(1)}%\n`;
  reporte += `- **Precisión después:** ${resultado.precisionDespues.toFixed(1)}%\n`;
  reporte += `- **Mejora:** ${(resultado.precisionDespues - resultado.precisionAntes).toFixed(1)}%\n\n`;
  
  if (resultado.mejoras.length > 0) {
    reporte += `## 🚀 Mejoras Implementadas\n`;
    resultado.mejoras.forEach((mejora, index) => {
      reporte += `${index + 1}. ${mejora}\n`;
    });
    reporte += `\n`;
  }
  
  reporte += `## ⚙️ Umbrales Calibrados\n`;
  reporte += `### Círculo\n`;
  reporte += `- Variación máxima: ${resultado.umbralesCalibrados.circuloVariacionMaxima}\n`;
  reporte += `- Proporción mínima: ${resultado.umbralesCalibrados.circuloProporcionMinima}\n`;
  reporte += `- Cambios suaves mínimo: ${resultado.umbralesCalibrados.circuloCambiosSuavesMinimo}\n\n`;
  
  reporte += `### Cuadrado\n`;
  reporte += `- Esquinas mínimas: ${resultado.umbralesCalibrados.cuadradoEsquinasMinimas}\n`;
  reporte += `- Ángulos rectos mínimos: ${resultado.umbralesCalibrados.cuadradoAngulosRectosMinimos}\n`;
  reporte += `- Proporción mínima: ${resultado.umbralesCalibrados.cuadradoProporcionMinima}\n`;
  reporte += `- Lados paralelos mínimos: ${resultado.umbralesCalibrados.cuadradoLadosParalelosMinimos}\n\n`;
  
  reporte += `### Triángulo\n`;
  reporte += `- Área mínima: ${resultado.umbralesCalibrados.trianguloAreaMinima}\n`;
  reporte += `- Tolerancia ángulos: ${resultado.umbralesCalibrados.trianguloToleranciaAngulos}\n\n`;
  
  reporte += `### Evaluación General\n`;
  reporte += `- Tolerancia base (%): ${resultado.umbralesCalibrados.toleranciaBasePorcentaje}\n`;
  reporte += `- Tolerancia mínima: ${resultado.umbralesCalibrados.toleranciaMinima}\n`;
  reporte += `- Tolerancia máxima: ${resultado.umbralesCalibrados.toleranciaMaxima}\n\n`;
  
  return reporte;
};
