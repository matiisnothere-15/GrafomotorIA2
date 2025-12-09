// Sistema de diagnóstico para identificar problemas en la evaluación
// Ayuda a entender por qué la evaluación no es precisa

import { Punto, detectarFormaGeometrica, evaluarTrazado } from './evaluacionMejorada';

export interface DiagnosticoEvaluacion {
  problema: string;
  severidad: 'baja' | 'media' | 'alta' | 'critica';
  descripcion: string;
  solucion: string;
  datos: any;
}

export interface AnalisisCompleto {
  coordenadasUsuario: Punto[];
  coordenadasModelo: Punto[];
  figuraEsperada: string;
  problemas: DiagnosticoEvaluacion[];
  puntuacionActual: number;
  puntuacionCorregida: number;
  recomendaciones: string[];
}

/**
 * Analiza una evaluación y identifica problemas específicos
 */
export const diagnosticarEvaluacion = (
  coordenadasUsuario: Punto[],
  coordenadasModelo: Punto[],
  figuraEsperada: string
): AnalisisCompleto => {
  const problemas: DiagnosticoEvaluacion[] = [];
  const recomendaciones: string[] = [];
  
  console.log('🔍 Iniciando diagnóstico de evaluación...');
  
  // 1. Análisis básico de coordenadas
  const analisisBasico = analizarCoordenadasBasicas(coordenadasUsuario, coordenadasModelo);
  problemas.push(...analisisBasico.problemas);
  recomendaciones.push(...analisisBasico.recomendaciones);
  
  // 2. Análisis de forma geométrica
  const analisisForma = analizarFormaGeometrica(coordenadasUsuario, figuraEsperada);
  problemas.push(...analisisForma.problemas);
  recomendaciones.push(...analisisForma.recomendaciones);
  
  // 3. Análisis de precisión del algoritmo
  const analisisPrecision = analizarPrecisionAlgoritmo(coordenadasUsuario, coordenadasModelo);
  problemas.push(...analisisPrecision.problemas);
  recomendaciones.push(...analisisPrecision.recomendaciones);
  
  // 4. Análisis de umbrales y tolerancias
  const analisisUmbrales = analizarUmbrales(coordenadasUsuario, coordenadasModelo);
  problemas.push(...analisisUmbrales.problemas);
  recomendaciones.push(...analisisUmbrales.recomendaciones);
  
  // 5. Calcular puntuaciones
  const puntuacionActual = evaluarTrazado(coordenadasUsuario, coordenadasModelo, 'amigable').puntuacion;
  const puntuacionCorregida = calcularPuntuacionCorregida(coordenadasUsuario, coordenadasModelo, problemas);
  
  return {
    coordenadasUsuario,
    coordenadasModelo,
    figuraEsperada,
    problemas,
    puntuacionActual,
    puntuacionCorregida,
    recomendaciones
  };
};

/**
 * Analiza problemas básicos en las coordenadas
 */
const analizarCoordenadasBasicas = (
  usuario: Punto[],
  modelo: Punto[]
): { problemas: DiagnosticoEvaluacion[]; recomendaciones: string[] } => {
  const problemas: DiagnosticoEvaluacion[] = [];
  const recomendaciones: string[] = [];
  
  // Problema 1: Muy pocos puntos
  if (usuario.length < 5) {
    problemas.push({
      problema: 'Muy pocos puntos',
      severidad: 'critica',
      descripcion: `Solo ${usuario.length} puntos, mínimo recomendado: 5`,
      solucion: 'Aumentar sensibilidad del lápiz o reducir velocidad de dibujo',
      datos: { puntosUsuario: usuario.length, puntosMinimos: 5 }
    });
    recomendaciones.push('Configurar mayor sensibilidad en la pizarra');
  }
  
  // Problema 2: Demasiados puntos
  if (usuario.length > 200) {
    problemas.push({
      problema: 'Demasiados puntos',
      severidad: 'media',
      descripcion: `${usuario.length} puntos, puede causar ruido`,
      solucion: 'Reducir frecuencia de muestreo o filtrar puntos',
      datos: { puntosUsuario: usuario.length, puntosMaximos: 200 }
    });
    recomendaciones.push('Implementar filtrado de puntos redundantes');
  }
  
  // Problema 3: Coordenadas fuera de rango
  const boundsUsuario = calcularBounds(usuario);
  const boundsModelo = calcularBounds(modelo);
  
  if (boundsUsuario.width < 10 || boundsUsuario.height < 10) {
    problemas.push({
      problema: 'Trazo muy pequeño',
      severidad: 'alta',
      descripcion: `Dimensiones: ${boundsUsuario.width}x${boundsUsuario.height}`,
      solucion: 'Ampliar el área de dibujo o ajustar escala',
      datos: { width: boundsUsuario.width, height: boundsUsuario.height }
    });
    recomendaciones.push('Ajustar escala de la pizarra');
  }
  
  return { problemas, recomendaciones };
};

/**
 * Analiza problemas en la detección de forma geométrica
 */
const analizarFormaGeometrica = (
  usuario: Punto[],
  figuraEsperada: string
): { problemas: DiagnosticoEvaluacion[]; recomendaciones: string[] } => {
  const problemas: DiagnosticoEvaluacion[] = [];
  const recomendaciones: string[] = [];
  
  const formaDetectada = detectarFormaGeometrica(usuario);
  
  // Problema: Forma detectada incorrecta
  if (formaDetectada.tipo !== figuraEsperada) {
    problemas.push({
      problema: 'Forma detectada incorrecta',
      severidad: 'critica',
      descripcion: `Esperada: ${figuraEsperada}, Detectada: ${formaDetectada.tipo}`,
      solucion: 'Ajustar algoritmos de detección o mejorar umbrales',
      datos: { 
        esperada: figuraEsperada, 
        detectada: formaDetectada.tipo, 
        confianza: formaDetectada.confianza,
        detalles: formaDetectada.detalles
      }
    });
    recomendaciones.push(`Mejorar algoritmo de detección de ${figuraEsperada}`);
  }
  
  // Problema: Confianza baja
  if (formaDetectada.confianza < 0.5) {
    problemas.push({
      problema: 'Confianza baja en detección',
      severidad: 'alta',
      descripcion: `Confianza: ${Math.round(formaDetectada.confianza * 100)}%`,
      solucion: 'Ajustar umbrales de detección',
      datos: { confianza: formaDetectada.confianza, umbralMinimo: 0.5 }
    });
    recomendaciones.push('Ajustar umbrales de confianza');
  }
  
  return { problemas, recomendaciones };
};

/**
 * Analiza problemas en la precisión del algoritmo
 */
const analizarPrecisionAlgoritmo = (
  usuario: Punto[],
  modelo: Punto[]
): { problemas: DiagnosticoEvaluacion[]; recomendaciones: string[] } => {
  const problemas: DiagnosticoEvaluacion[] = [];
  const recomendaciones: string[] = [];
  
  // Calcular métricas de precisión
  const boundsUsuario = calcularBounds(usuario);
  const boundsModelo = calcularBounds(modelo);
  
  // Problema: Diferencia de tamaño significativa
  const ratioTamaño = Math.min(boundsUsuario.width, boundsUsuario.height) / 
                     Math.min(boundsModelo.width, boundsModelo.height);
  
  if (ratioTamaño < 0.5 || ratioTamaño > 2.0) {
    problemas.push({
      problema: 'Diferencia de tamaño significativa',
      severidad: 'alta',
      descripcion: `Ratio de tamaño: ${ratioTamaño.toFixed(2)}`,
      solucion: 'Normalizar tamaños antes de comparar',
      datos: { ratioTamaño, boundsUsuario, boundsModelo }
    });
    recomendaciones.push('Implementar normalización de tamaños');
  }
  
  // Problema: Diferencia de posición
  const distanciaCentros = Math.sqrt(
    Math.pow(boundsUsuario.centerX - boundsModelo.centerX, 2) +
    Math.pow(boundsUsuario.centerY - boundsModelo.centerY, 2)
  );
  
  const distanciaMaxima = Math.max(boundsModelo.width, boundsModelo.height);
  
  if (distanciaCentros > distanciaMaxima * 0.5) {
    problemas.push({
      problema: 'Posición muy diferente',
      severidad: 'media',
      descripcion: `Distancia entre centros: ${distanciaCentros.toFixed(2)}`,
      solucion: 'Alinear centros antes de evaluar',
      datos: { distanciaCentros, distanciaMaxima }
    });
    recomendaciones.push('Implementar alineación de centros');
  }
  
  return { problemas, recomendaciones };
};

/**
 * Analiza problemas con umbrales y tolerancias
 */
const analizarUmbrales = (
  usuario: Punto[],
  modelo: Punto[]
): { problemas: DiagnosticoEvaluacion[]; recomendaciones: string[] } => {
  const problemas: DiagnosticoEvaluacion[] = [];
  const recomendaciones: string[] = [];
  
  // Calcular tolerancia actual
  const boundsModelo = calcularBounds(modelo);
  const toleranciaActual = Math.max(boundsModelo.width, boundsModelo.height) * 0.1;
  
  // Problema: Tolerancia muy estricta
  if (toleranciaActual < 5) {
    problemas.push({
      problema: 'Tolerancia muy estricta',
      severidad: 'alta',
      descripcion: `Tolerancia: ${toleranciaActual.toFixed(2)}px`,
      solucion: 'Aumentar tolerancia mínima',
      datos: { toleranciaActual, toleranciaMinima: 5 }
    });
    recomendaciones.push('Aumentar tolerancia mínima a 5px');
  }
  
  // Problema: Tolerancia muy permisiva
  if (toleranciaActual > 50) {
    problemas.push({
      problema: 'Tolerancia muy permisiva',
      severidad: 'media',
      descripcion: `Tolerancia: ${toleranciaActual.toFixed(2)}px`,
      solucion: 'Reducir tolerancia máxima',
      datos: { toleranciaActual, toleranciaMaxima: 50 }
    });
    recomendaciones.push('Reducir tolerancia máxima a 50px');
  }
  
  return { problemas, recomendaciones };
};

/**
 * Calcula una puntuación corregida basada en los problemas identificados
 */
const calcularPuntuacionCorregida = (
  usuario: Punto[],
  modelo: Punto[],
  problemas: DiagnosticoEvaluacion[]
): number => {
  let puntuacion = evaluarTrazado(usuario, modelo, 'amigable').puntuacion;
  
  // Aplicar correcciones basadas en problemas
  problemas.forEach(problema => {
    switch (problema.severidad) {
      case 'critica':
        puntuacion *= 0.3; // Reducir 70%
        break;
      case 'alta':
        puntuacion *= 0.6; // Reducir 40%
        break;
      case 'media':
        puntuacion *= 0.8; // Reducir 20%
        break;
      case 'baja':
        puntuacion *= 0.9; // Reducir 10%
        break;
    }
  });
  
  return Math.max(0, Math.min(100, puntuacion));
};

/**
 * Calcula los límites de un conjunto de puntos
 */
const calcularBounds = (puntos: Punto[]) => {
  if (puntos.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }
  
  const xs = puntos.map(p => p.x);
  const ys = puntos.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
};

/**
 * Genera un reporte de diagnóstico en formato legible
 */
export const generarReporteDiagnostico = (analisis: AnalisisCompleto): string => {
  let reporte = `# 🔍 Reporte de Diagnóstico de Evaluación\n\n`;
  
  reporte += `## 📊 Resumen\n`;
  reporte += `- **Figura esperada:** ${analisis.figuraEsperada}\n`;
  reporte += `- **Puntos del usuario:** ${analisis.coordenadasUsuario.length}\n`;
  reporte += `- **Puntos del modelo:** ${analisis.coordenadasModelo.length}\n`;
  reporte += `- **Puntuación actual:** ${analisis.puntuacionActual}\n`;
  reporte += `- **Puntuación corregida:** ${analisis.puntuacionCorregida}\n`;
  reporte += `- **Problemas identificados:** ${analisis.problemas.length}\n\n`;
  
  if (analisis.problemas.length > 0) {
    reporte += `## 🚨 Problemas Identificados\n\n`;
    
    analisis.problemas.forEach((problema, index) => {
      const emoji = problema.severidad === 'critica' ? '🔴' : 
                   problema.severidad === 'alta' ? '🟠' : 
                   problema.severidad === 'media' ? '🟡' : '🟢';
      
      reporte += `### ${emoji} ${index + 1}. ${problema.problema}\n`;
      reporte += `- **Severidad:** ${problema.severidad}\n`;
      reporte += `- **Descripción:** ${problema.descripcion}\n`;
      reporte += `- **Solución:** ${problema.solucion}\n\n`;
    });
  }
  
  if (analisis.recomendaciones.length > 0) {
    reporte += `## 💡 Recomendaciones\n\n`;
    analisis.recomendaciones.forEach((rec, index) => {
      reporte += `${index + 1}. ${rec}\n`;
    });
  }
  
  return reporte;
};
