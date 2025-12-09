// Sistema de evaluación mejorado para ejercicios de grafomotricidad
// Resuelve los problemas de las coordenadas hardcodeadas y evalúa de forma más inteligente

export interface Punto {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface ResultadoEvaluacion {
  puntuacion: number;
  cobertura: number;
  precision: number;
  proporcion: number;
  complejidad: number;
  detalles: {
    toleranciaUsada: number;
    puntosEvaluados: number;
    factorForma: number;
    factorProporcion: number;
  };
}

/**
 * Calcula los límites (bounds) de un conjunto de puntos
 */
export const calcularBounds = (puntos: Punto[]): Bounds => {
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
 * Calcula la distancia euclidiana entre dos puntos
 */
export const calcularDistancia = (p1: Punto, p2: Punto): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calcula la longitud total de un trazo
 */
export const calcularLongitud = (puntos: Punto[]): number => {
  if (puntos.length < 2) return 0;
  
  let longitud = 0;
  for (let i = 1; i < puntos.length; i++) {
    longitud += calcularDistancia(puntos[i], puntos[i - 1]);
  }
  return longitud;
};

/**
 * Calcula el área aproximada de un polígono usando la fórmula shoelace
 */
export const calcularArea = (puntos: Punto[]): number => {
  if (puntos.length < 3) return 0;
  
  let area = 0;
  const n = puntos.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += puntos[i].x * puntos[j].y;
    area -= puntos[j].x * puntos[i].y;
  }
  
  return Math.abs(area) / 2;
};

/**
 * Normaliza coordenadas del modelo para que se ajusten al área de dibujo del usuario
 */
export const normalizarModelo = (modelo: Punto[], areaUsuario: Bounds): Punto[] => {
  const modeloBounds = calcularBounds(modelo);
  
  // Si el modelo está vacío o el área del usuario es muy pequeña, devolver modelo original
  if (modeloBounds.width === 0 || modeloBounds.height === 0 || 
      areaUsuario.width < 50 || areaUsuario.height < 50) {
    return modelo;
  }
  
  // Calcular factores de escala
  const scaleX = areaUsuario.width / modeloBounds.width;
  const scaleY = areaUsuario.height / modeloBounds.height;
  const scale = Math.min(scaleX, scaleY) * 0.8; // 80% del tamaño máximo para dejar margen
  
  // Centrar el modelo en el área del usuario
  const offsetX = areaUsuario.centerX - modeloBounds.centerX * scale;
  const offsetY = areaUsuario.centerY - modeloBounds.centerY * scale;
  
  return modelo.map(punto => ({
    x: punto.x * scale + offsetX,
    y: punto.y * scale + offsetY
  }));
};

/**
 * Calcula qué porcentaje del modelo está cubierto por el trazo del usuario
 */
export const calcularCobertura = (
  usuario: Punto[], 
  modelo: Punto[], 
  tolerancia: number
): number => {
  if (modelo.length === 0) return 0;
  
  let puntosCubiertos = 0;
  // Muestrear el modelo para eficiencia (máximo 50 puntos)
  const pasoModelo = Math.max(1, Math.floor(modelo.length / 50));
  
  for (let i = 0; i < modelo.length; i += pasoModelo) {
    const puntoModelo = modelo[i];
    const cubierto = usuario.some(puntoUsuario => 
      calcularDistancia(puntoUsuario, puntoModelo) < tolerancia
    );
    if (cubierto) puntosCubiertos++;
  }
  
  return (puntosCubiertos / Math.ceil(modelo.length / pasoModelo)) * 100;
};

/**
 * Valida si las proporciones del trazo del usuario son razonables comparadas con el modelo
 */
export const validarProporcion = (usuario: Punto[], modelo: Punto[]): number => {
  const boundsUsuario = calcularBounds(usuario);
  const boundsModelo = calcularBounds(modelo);
  
  // Evitar división por cero
  if (boundsModelo.width === 0 || boundsModelo.height === 0) return 1.0;
  
  const ratioWidth = boundsUsuario.width / boundsModelo.width;
  const ratioHeight = boundsUsuario.height / boundsModelo.height;
  const ratioPromedio = (ratioWidth + ratioHeight) / 2;
  
  // Más flexible con las proporciones para niños
  if (ratioPromedio < 0.15) return 0.4; // Muy pequeño
  if (ratioPromedio < 0.3) return 0.7;  // Pequeño
  if (ratioPromedio < 0.5) return 0.9;  // Pequeño-mediano
  if (ratioPromedio > 4.0) return 0.5;  // Muy grande
  if (ratioPromedio > 2.5) return 0.8;  // Grande
  
  // Rango óptimo: 0.5 a 2.5
  return 1.0;
};

/**
 * Valida la complejidad del trazo comparada con el modelo
 */
export const validarComplejidad = (usuario: Punto[], modelo: Punto[]): number => {
  const longitudUsuario = calcularLongitud(usuario);
  const longitudModelo = calcularLongitud(modelo);
  
  if (longitudModelo === 0) return 1.0;
  
  const ratioLongitud = longitudUsuario / longitudModelo;
  
  // Más flexible con la longitud para niños
  if (ratioLongitud < 0.2) return 0.6; // Muy corto
  if (ratioLongitud < 0.4) return 0.8; // Corto
  if (ratioLongitud > 5.0) return 0.7; // Muy largo
  if (ratioLongitud > 3.0) return 0.85; // Largo
  
  return 1.0; // Longitud apropiada
};

/**
 * Detecta la forma geométrica de un conjunto de puntos - VERSIÓN MEJORADA
 */
export const detectarFormaGeometrica = (puntos: Punto[]): {
  tipo: 'circulo' | 'cuadrado' | 'triangulo' | 'linea' | 'estrella' | 'otro';
  confianza: number;
  detalles: any;
} => {
  if (puntos.length < 8) {
    return { tipo: 'otro', confianza: 0, detalles: { razon: 'Muy pocos puntos' } };
  }

  console.log('🔍 Detectando forma geométrica:', { puntos: puntos.length });

  const bounds = calcularBounds(puntos);
  const area = calcularArea(puntos);
  const longitud = calcularLongitud(puntos);
  
  // 1. Detectar si es una línea (MEJORADO)
  const ratioAspecto = Math.max(bounds.width, bounds.height) / Math.min(bounds.width, bounds.height);
  const esLinea = ratioAspecto > 4 && longitud > bounds.width * 0.8;
  
  if (esLinea) {
    console.log('📏 Detectado como línea:', { ratioAspecto, longitud, bounds });
    return { tipo: 'linea', confianza: 0.9, detalles: { ratioAspecto, longitud } };
  }

  // 2. Detectar círculo (MEJORADO)
  const resultadoCirculo = detectarCirculoMejorado(puntos, bounds);
  if (resultadoCirculo.esCirculo) {
    console.log('🔵 Detectado como círculo:', resultadoCirculo.detalles);
    return { tipo: 'circulo', confianza: resultadoCirculo.confianza, detalles: resultadoCirculo.detalles };
  }

  // 3. Detectar cuadrado (MEJORADO)
  const resultadoCuadrado = detectarCuadradoMejorado(puntos, bounds);
  if (resultadoCuadrado.esCuadrado) {
    console.log('⬜ Detectado como cuadrado:', resultadoCuadrado.detalles);
    return { tipo: 'cuadrado', confianza: resultadoCuadrado.confianza, detalles: resultadoCuadrado.detalles };
  }

  // 4. Detectar triángulo (MEJORADO)
  const resultadoTriangulo = detectarTrianguloMejorado(puntos, bounds);
  if (resultadoTriangulo.esTriangulo) {
    console.log('🔺 Detectado como triángulo:', resultadoTriangulo.detalles);
    return { tipo: 'triangulo', confianza: resultadoTriangulo.confianza, detalles: resultadoTriangulo.detalles };
  }

  // 5. Detectar estrella (MEJORADO)
  const resultadoEstrella = detectarEstrellaMejorado(puntos, bounds);
  if (resultadoEstrella.esEstrella) {
    console.log('⭐ Detectado como estrella:', resultadoEstrella.detalles);
    return { tipo: 'estrella', confianza: resultadoEstrella.confianza, detalles: resultadoEstrella.detalles };
  }

  console.log('❓ Forma no reconocida');
  return { tipo: 'otro', confianza: 0.2, detalles: { razon: 'Forma no reconocida', bounds, area, longitud } };
};

/**
 * Detecta círculo mejorado - Análisis de curvatura y distancia al centro
 */
const detectarCirculoMejorado = (puntos: Punto[], bounds: Bounds): {
  esCirculo: boolean;
  confianza: number;
  detalles: any;
} => {
  const centroX = bounds.centerX;
  const centroY = bounds.centerY;
  
  // 1. Análisis de distancia al centro
  const distanciasAlCentro = puntos.map(p => 
    Math.sqrt(Math.pow(p.x - centroX, 2) + Math.pow(p.y - centroY, 2))
  );
  
  const promedioDistancia = distanciasAlCentro.reduce((a, b) => a + b, 0) / distanciasAlCentro.length;
  const variacionDistancia = Math.sqrt(
    distanciasAlCentro.reduce((sum, dist) => sum + Math.pow(dist - promedioDistancia, 2), 0) / distanciasAlCentro.length
  );
  const coeficienteVariacion = variacionDistancia / promedioDistancia;
  
  // 2. Análisis de curvatura (cambios de dirección suaves)
  let cambiosDireccionSuaves = 0;
  let cambiosDireccionBruscos = 0;
  
  for (let i = 2; i < puntos.length - 2; i++) {
    const p1 = puntos[i - 2];
    const p2 = puntos[i - 1];
    const p3 = puntos[i];
    const p4 = puntos[i + 1];
    const p5 = puntos[i + 2];
    
    const angulo1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angulo2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    const angulo3 = Math.atan2(p4.y - p3.y, p4.x - p3.x);
    const angulo4 = Math.atan2(p5.y - p4.y, p5.x - p4.x);
    
    const cambio1 = Math.abs(angulo2 - angulo1);
    const cambio2 = Math.abs(angulo3 - angulo2);
    const cambio3 = Math.abs(angulo4 - angulo3);
    
    if (cambio2 < 0.2) { // Cambio suave
      cambiosDireccionSuaves++;
    } else if (cambio2 > 0.5) { // Cambio brusco
      cambiosDireccionBruscos++;
    }
  }
  
  // 3. Análisis de proporción (debe ser aproximadamente circular)
  const ratioProporcion = Math.min(bounds.width, bounds.height) / Math.max(bounds.width, bounds.height);
  
  // 4. Criterios para círculo - AJUSTADOS PARA MAYOR COMPRENSIÓN
  const esVariacionBaja = coeficienteVariacion < 0.25; // Más comprensivo
  const esCurvaturaSuave = cambiosDireccionSuaves > cambiosDireccionBruscos * 1.2; // Más flexible
  const esProporcionCircular = ratioProporcion > 0.6; // Más comprensivo
  
  const esCirculo = esVariacionBaja && esCurvaturaSuave && esProporcionCircular;
  
  let confianza = 0;
  if (esCirculo) {
    confianza = 0.8 + (0.2 * (1 - coeficienteVariacion)) + (0.1 * ratioProporcion);
    confianza = Math.min(0.95, confianza);
  }
  
  return {
    esCirculo,
    confianza,
    detalles: {
      coeficienteVariacion,
      promedioDistancia,
      cambiosSuaves: cambiosDireccionSuaves,
      cambiosBruscos: cambiosDireccionBruscos,
      ratioProporcion,
      criterios: { esVariacionBaja, esCurvaturaSuave, esProporcionCircular }
    }
  };
};

/**
 * Detecta cuadrado mejorado - Análisis de esquinas y ángulos rectos
 */
const detectarCuadradoMejorado = (puntos: Punto[], bounds: Bounds): {
  esCuadrado: boolean;
  confianza: number;
  detalles: any;
} => {
  // 1. Detectar esquinas principales
  const esquinas = detectarEsquinasMejorado(puntos);
  
  // 2. Análisis de proporción (debe ser aproximadamente cuadrada)
  const ratioProporcion = Math.min(bounds.width, bounds.height) / Math.max(bounds.width, bounds.height);
  
  // 3. Análisis de ángulos rectos
  const angulosRectos = contarAngulosRectosMejorado(esquinas);
  
  // 4. Análisis de lados paralelos
  const ladosParalelos = detectarLadosParalelos(esquinas);
  
  // 5. Criterios para cuadrado - AJUSTADOS PARA MAYOR COMPRENSIÓN
  const tieneEsquinasAdecuadas = esquinas.length >= 3 && esquinas.length <= 8; // Más comprensivo
  const tieneAngulosRectos = angulosRectos >= 1; // Más comprensivo
  const esProporcionCuadrada = ratioProporcion > 0.5; // Más comprensivo
  const tieneLadosParalelos = ladosParalelos >= 1; // Al menos un par de lados paralelos
  
  const esCuadrado = tieneEsquinasAdecuadas && (tieneAngulosRectos || tieneLadosParalelos) && esProporcionCuadrada;
  
  let confianza = 0;
  if (esCuadrado) {
    confianza = 0.6 + (0.2 * (angulosRectos / 4)) + (0.1 * ratioProporcion) + (0.1 * (ladosParalelos / 2));
    confianza = Math.min(0.9, confianza);
  }
  
  return {
    esCuadrado,
    confianza,
    detalles: {
      esquinas: esquinas.length,
      angulosRectos,
      ladosParalelos,
      ratioProporcion,
      criterios: { tieneEsquinasAdecuadas, tieneAngulosRectos, esProporcionCuadrada, tieneLadosParalelos }
    }
  };
};

/**
 * Detecta triángulo mejorado - Análisis de 3 esquinas principales
 */
const detectarTrianguloMejorado = (puntos: Punto[], bounds: Bounds): {
  esTriangulo: boolean;
  confianza: number;
  detalles: any;
} => {
  // 1. Detectar esquinas principales
  const esquinas = detectarEsquinasMejorado(puntos);
  
  // 2. Si hay muchas esquinas, encontrar las 3 más prominentes
  let esquinasPrincipales = esquinas;
  if (esquinas.length > 3) {
    esquinasPrincipales = encontrarEsquinasPrincipales(esquinas, 3);
  }
  
  // 3. Verificar que formen un triángulo válido
  const esTrianguloValido = esquinasPrincipales.length === 3 && 
    verificarTrianguloValido(esquinasPrincipales);
  
  // 4. Análisis de ángulos internos - AJUSTADO PARA MAYOR COMPRENSIÓN
  const angulosInternos = calcularAngulosInternos(esquinasPrincipales);
  const sumaAngulos = angulosInternos.reduce((sum, angulo) => sum + angulo, 0);
  const esSumaAngulosCorrecta = Math.abs(sumaAngulos - Math.PI) < 0.5; // Más comprensivo
  
  const esTriangulo = esTrianguloValido && esSumaAngulosCorrecta;
  
  let confianza = 0;
  if (esTriangulo) {
    confianza = 0.7 + (0.2 * (1 - Math.abs(sumaAngulos - Math.PI) / Math.PI));
    confianza = Math.min(0.9, confianza);
  }
  
  return {
    esTriangulo,
    confianza,
    detalles: {
      esquinasTotales: esquinas.length,
      esquinasPrincipales: esquinasPrincipales.length,
      angulosInternos: angulosInternos.map(a => Math.round(a * 180 / Math.PI)),
      sumaAngulos: Math.round(sumaAngulos * 180 / Math.PI),
      esSumaAngulosCorrecta
    }
  };
};

/**
 * Detecta estrella mejorada - Análisis de múltiples esquinas y simetría
 */
const detectarEstrellaMejorado = (puntos: Punto[], bounds: Bounds): {
  esEstrella: boolean;
  confianza: number;
  detalles: any;
} => {
  // 1. Detectar esquinas
  const esquinas = detectarEsquinasMejorado(puntos);
  
  // 2. Análisis de simetría radial
  const simetriaRadial = analizarSimetriaRadial(puntos, bounds);
  
  // 3. Criterios para estrella
  const tieneMuchasEsquinas = esquinas.length >= 5;
  const tieneSimetriaRadial = simetriaRadial > 0.6;
  
  const esEstrella = tieneMuchasEsquinas && tieneSimetriaRadial;
  
  let confianza = 0;
  if (esEstrella) {
    confianza = 0.5 + (0.3 * (esquinas.length / 10)) + (0.2 * simetriaRadial);
    confianza = Math.min(0.8, confianza);
  }
  
  return {
    esEstrella,
    confianza,
    detalles: {
      esquinas: esquinas.length,
      simetriaRadial,
      criterios: { tieneMuchasEsquinas, tieneSimetriaRadial }
    }
  };
};

/**
 * Detecta esquinas mejorado - Algoritmo más robusto
 */
const detectarEsquinasMejorado = (puntos: Punto[]): Punto[] => {
  const esquinas: Punto[] = [];
  const umbralEsquina = 0.15; // Más sensible
  
  for (let i = 3; i < puntos.length - 3; i++) {
    const p1 = puntos[i - 3];
    const p2 = puntos[i - 1];
    const p3 = puntos[i];
    const p4 = puntos[i + 1];
    const p5 = puntos[i + 3];
    
    // Calcular cambios de dirección más suaves
    const angulo1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angulo2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    const angulo3 = Math.atan2(p4.y - p3.y, p4.x - p3.x);
    const angulo4 = Math.atan2(p5.y - p4.y, p5.x - p4.x);
    
    const cambio1 = Math.abs(angulo2 - angulo1);
    const cambio2 = Math.abs(angulo3 - angulo2);
    const cambio3 = Math.abs(angulo4 - angulo3);
    
    // Detectar cambios bruscos de dirección
    if (cambio2 > umbralEsquina && cambio2 > cambio1 && cambio2 > cambio3) {
      esquinas.push(p3);
    }
  }
  
  return esquinas;
};

/**
 * Cuenta ángulos rectos mejorado
 */
const contarAngulosRectosMejorado = (esquinas: Punto[]): number => {
  let angulosRectos = 0;
  const toleranciaAngulo = Math.PI / 4; // 45 grados - más flexible
  
  for (let i = 0; i < esquinas.length; i++) {
    const prev = esquinas[(i - 1 + esquinas.length) % esquinas.length];
    const curr = esquinas[i];
    const next = esquinas[(i + 1) % esquinas.length];
    
    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    
    const magnitud1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const magnitud2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (magnitud1 > 0 && magnitud2 > 0) {
      const angulo = Math.acos(
        (v1.x * v2.x + v1.y * v2.y) / (magnitud1 * magnitud2)
      );
      
      if (Math.abs(angulo - Math.PI / 2) < toleranciaAngulo) {
        angulosRectos++;
      }
    }
  }
  
  return angulosRectos;
};

/**
 * Detecta lados paralelos en un conjunto de esquinas
 */
const detectarLadosParalelos = (esquinas: Punto[]): number => {
  let ladosParalelos = 0;
  const toleranciaParalelo = 0.2; // Más flexible
  
  for (let i = 0; i < esquinas.length; i++) {
    const p1 = esquinas[i];
    const p2 = esquinas[(i + 1) % esquinas.length];
    
    for (let j = i + 2; j < esquinas.length; j++) {
      const p3 = esquinas[j];
      const p4 = esquinas[(j + 1) % esquinas.length];
      
      const angulo1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const angulo2 = Math.atan2(p4.y - p3.y, p4.x - p3.x);
      
      const diferenciaAngulo = Math.abs(angulo1 - angulo2);
      const diferenciaAnguloComplementario = Math.abs(diferenciaAngulo - Math.PI);
      
      if (Math.min(diferenciaAngulo, diferenciaAnguloComplementario) < toleranciaParalelo) {
        ladosParalelos++;
      }
    }
  }
  
  return ladosParalelos;
};

/**
 * Encuentra las esquinas más prominentes
 */
const encontrarEsquinasPrincipales = (esquinas: Punto[], cantidad: number): Punto[] => {
  // Ordenar por prominencia (distancia al centro del bounding box)
  const centroX = esquinas.reduce((sum, p) => sum + p.x, 0) / esquinas.length;
  const centroY = esquinas.reduce((sum, p) => sum + p.y, 0) / esquinas.length;
  
  const esquinasConProminencia = esquinas.map(p => ({
    punto: p,
    prominencia: Math.sqrt(Math.pow(p.x - centroX, 2) + Math.pow(p.y - centroY, 2))
  }));
  
  esquinasConProminencia.sort((a, b) => b.prominencia - a.prominencia);
  
  return esquinasConProminencia.slice(0, cantidad).map(item => item.punto);
};

/**
 * Verifica si tres puntos forman un triángulo válido
 */
const verificarTrianguloValido = (puntos: Punto[]): boolean => {
  if (puntos.length !== 3) return false;
  
  // Verificar que no sean colineales
  const [p1, p2, p3] = puntos;
  const area = Math.abs(
    (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2
  );
  
  return area > 100; // Área mínima para considerar válido
};

/**
 * Calcula ángulos internos de un triángulo
 */
const calcularAngulosInternos = (puntos: Punto[]): number[] => {
  if (puntos.length !== 3) return [];
  
  const [p1, p2, p3] = puntos;
  
  const angulo1 = calcularAnguloEntrePuntos(p2, p1, p3);
  const angulo2 = calcularAnguloEntrePuntos(p1, p2, p3);
  const angulo3 = calcularAnguloEntrePuntos(p1, p3, p2);
  
  return [angulo1, angulo2, angulo3];
};

/**
 * Calcula el ángulo entre tres puntos
 */
const calcularAnguloEntrePuntos = (p1: Punto, p2: Punto, p3: Punto): number => {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  
  const magnitud1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const magnitud2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  if (magnitud1 === 0 || magnitud2 === 0) return 0;
  
  const productoPunto = v1.x * v2.x + v1.y * v2.y;
  const coseno = productoPunto / (magnitud1 * magnitud2);
  
  return Math.acos(Math.max(-1, Math.min(1, coseno)));
};

/**
 * Analiza simetría radial de una forma
 */
const analizarSimetriaRadial = (puntos: Punto[], bounds: Bounds): number => {
  const centroX = bounds.centerX;
  const centroY = bounds.centerY;
  
  // Dividir en sectores radiales
  const sectores = 8;
  const anguloPorSector = (2 * Math.PI) / sectores;
  const puntosPorSector = new Array(sectores).fill(0);
  
  puntos.forEach(p => {
    const angulo = Math.atan2(p.y - centroY, p.x - centroX);
    const sector = Math.floor((angulo + Math.PI) / anguloPorSector) % sectores;
    puntosPorSector[sector]++;
  });
  
  // Calcular variación entre sectores
  const promedio = puntosPorSector.reduce((sum, count) => sum + count, 0) / sectores;
  const variacion = puntosPorSector.reduce((sum, count) => sum + Math.pow(count - promedio, 2), 0) / sectores;
  
  // Simetría alta = baja variación
  return Math.max(0, 1 - (variacion / promedio));
};

/**
 * Valida que la forma del usuario coincida con la forma esperada
 */
export const validarFormaCorrecta = (
  coordenadasUsuario: Punto[],
  figuraEsperada: string
): { esCorrecta: boolean; confianza: number; razon: string } => {
  const formaDetectada = detectarFormaGeometrica(coordenadasUsuario);
  
  console.log('🔍 Validación de forma:', {
    figuraEsperada,
    formaDetectada: formaDetectada.tipo,
    confianza: formaDetectada.confianza,
    detalles: formaDetectada.detalles
  });

  // Mapeo de figuras esperadas a formas detectadas
  const mapeoFormas: Record<string, string[]> = {
    'circulo': ['circulo'],
    'cuadrado': ['cuadrado'],
    'triangulo': ['triangulo'],
    'estrella': ['estrella'],
    'flecha': ['linea', 'cuadrado'], // Las flechas pueden ser líneas o formas rectangulares
    'pacman': ['circulo'], // Pacman es básicamente un círculo
    'infinito': ['circulo'], // El infinito tiene forma circular
    'arbol': ['linea', 'triangulo'], // Los árboles pueden ser líneas o triángulos
    'nube': ['circulo'] // Las nubes son formas redondeadas
  };

  const formasAceptables = mapeoFormas[figuraEsperada] || ['otro'];
  const esFormaCorrecta = formasAceptables.includes(formaDetectada.tipo);
  
  let razon = '';
  if (esFormaCorrecta) {
    razon = `✅ Forma correcta: ${formaDetectada.tipo} (confianza: ${Math.round(formaDetectada.confianza * 100)}%)`;
  } else {
    razon = `❌ Forma incorrecta: esperaba ${figuraEsperada}, detecté ${formaDetectada.tipo}`;
  }

  return {
    esCorrecta: esFormaCorrecta,
    confianza: formaDetectada.confianza,
    razon
  };
};

/**
 * Algoritmo principal de evaluación mejorado CON VALIDACIÓN DE FORMA
 */
export const evaluarTrazado = (
  coordenadasUsuario: Punto[],
  coordenadasModelo: Punto[],
  tipoEvaluacion: 'amigable' | 'medica' = 'amigable',
  figuraEsperada?: string // 👈 NUEVO PARÁMETRO
): ResultadoEvaluacion => {
  
  console.log('🎯 Iniciando evaluación mejorada CON VALIDACIÓN DE FORMA:', {
    tipo: tipoEvaluacion,
    usuarioLength: coordenadasUsuario.length,
    modeloLength: coordenadasModelo.length,
    figuraEsperada
  });

  // Validaciones básicas
  if (coordenadasUsuario.length < 5) {
    console.log('❌ Muy pocos puntos del usuario');
    return {
      puntuacion: 0,
      cobertura: 0,
      precision: 0,
      proporcion: 0,
      complejidad: 0,
      detalles: { toleranciaUsada: 0, puntosEvaluados: 0, factorForma: 0, factorProporcion: 0 }
    };
  }

  if (coordenadasModelo.length === 0) {
    console.log('❌ No hay modelo de referencia');
    return {
      puntuacion: 0,
      cobertura: 0,
      precision: 0,
      proporcion: 0,
      complejidad: 0,
      detalles: { toleranciaUsada: 0, puntosEvaluados: 0, factorForma: 0, factorProporcion: 0 }
    };
  }

  // 👇 VALIDACIÓN DE FORMA GEOMÉTRICA MÁS COMPRENSIVA
  let factorForma = 1.0; // Factor de bonificación/penalización por forma
  if (figuraEsperada) {
    const validacionForma = validarFormaCorrecta(coordenadasUsuario, figuraEsperada);
    
    if (validacionForma.esCorrecta) {
      console.log('✅ Forma correcta detectada:', validacionForma.razon);
      factorForma = 1.2; // Bonificación del 20% por forma correcta
    } else {
      console.log('❌ Forma incorrecta detectada:', validacionForma.razon);
      // Penalización severa: forma incorrecta = puntuación muy baja
      factorForma = 0.2; // Penalización del 80% por forma incorrecta
    }
  }

  // 1. Calcular áreas de trabajo
  const boundsUsuario = calcularBounds(coordenadasUsuario);
  const boundsModelo = calcularBounds(coordenadasModelo);
  
  // 2. Normalizar modelo al área del usuario
  const modeloNormalizado = normalizarModelo(coordenadasModelo, boundsUsuario);
  
  // 3. Calcular tolerancias dinámicas
  const tamañoModelo = Math.max(boundsModelo.width, boundsModelo.height);
  const tamañoUsuario = Math.max(boundsUsuario.width, boundsUsuario.height);
  
  // Tolerancia base: 8% del tamaño del modelo (más estricto para precisión)
  const toleranciaBase = Math.max(tamañoModelo * 0.08, 20); // Más estricto
  const toleranciaCercania = toleranciaBase * 1.5; // Para detectar proximidad general
  
  console.log('📏 Análisis de tamaño:', {
    tamañoUsuario: tamañoUsuario.toFixed(1),
    tamañoModelo: tamañoModelo.toFixed(1),
    toleranciaBase: toleranciaBase.toFixed(1),
    toleranciaCercania: toleranciaCercania.toFixed(1)
  });

  // 4. Verificar proximidad general
  const estaEnArea = coordenadasUsuario.some(puntoUsuario => 
    modeloNormalizado.some(puntoModelo => 
      calcularDistancia(puntoUsuario, puntoModelo) < toleranciaCercania
    )
  );

  if (!estaEnArea) {
    console.log('❌ El trazo no está en el área general de la figura');
    return {
      puntuacion: 0,
      cobertura: 0,
      precision: 0,
      proporcion: 0,
      complejidad: 0,
      detalles: { toleranciaUsada: toleranciaBase, puntosEvaluados: 0, factorForma: 0, factorProporcion: 0 }
    };
  }

  // 5. Evaluación de precisión
  let sumaDistancias = 0;
  let puntosEvaluados = 0;
  
  // Muestrear puntos del usuario para eficiencia
  const pasoUsuario = Math.max(1, Math.floor(coordenadasUsuario.length / 40));
  
  for (let i = 0; i < coordenadasUsuario.length; i += pasoUsuario) {
    const puntoUsuario = coordenadasUsuario[i];
    let menorDistancia = Infinity;
    
    modeloNormalizado.forEach(puntoModelo => {
      const distancia = calcularDistancia(puntoUsuario, puntoModelo);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
      }
    });
    
    sumaDistancias += menorDistancia;
    puntosEvaluados++;
  }

  const precision = sumaDistancias / puntosEvaluados;
  
  // 6. Puntuación base
  const maxDistanciaPermitida = toleranciaBase * 1.5;
  let puntuacion = Math.max(0, 100 - (precision / maxDistanciaPermitida) * 100);
  
  console.log('📊 Puntuación base:', {
    precision: precision.toFixed(1),
    maxDistanciaPermitida: maxDistanciaPermitida.toFixed(1),
    puntuacion: puntuacion.toFixed(1)
  });

  // 7. Bonificaciones
  if (coordenadasUsuario.length > 30) puntuacion += 2; // Bonus por detalle
  if (puntuacion > 0 && puntuacion < 40) puntuacion += 10; // Bonus generoso por intentar
  if (puntuacion >= 40 && puntuacion < 70) puntuacion += 5; // Bonus por progreso

  // 8. Análisis de cobertura
  const cobertura = calcularCobertura(coordenadasUsuario, modeloNormalizado, toleranciaBase);
  console.log('📈 Cobertura:', cobertura.toFixed(1) + '%');

  // 9. Factor de cobertura (ya tenemos factorForma definido arriba)
  let factorCobertura = 1.0;
  if (cobertura > 70) factorCobertura = 1.2;
  else if (cobertura > 50) factorCobertura = 1.1;
  else if (cobertura > 30) factorCobertura = 1.05;
  else if (cobertura < 15) factorCobertura = 0.8;

  puntuacion *= factorCobertura;

  // 10. Validación de proporción
  const factorProporcion = validarProporcion(coordenadasUsuario, modeloNormalizado);
  puntuacion *= factorProporcion;

  // 11. Validación de complejidad
  const factorComplejidad = validarComplejidad(coordenadasUsuario, modeloNormalizado);
  puntuacion *= factorComplejidad;

  // 12. Aplicar factor de forma (bonificación/penalización por forma geométrica)
  puntuacion *= factorForma;

  const puntuacionFinal = Math.min(100, Math.round(puntuacion));

  const resultado: ResultadoEvaluacion = {
    puntuacion: puntuacionFinal,
    cobertura,
    precision,
    proporcion: factorProporcion * 100,
    complejidad: factorComplejidad * 100,
    detalles: {
      toleranciaUsada: toleranciaBase,
      puntosEvaluados,
      factorForma,
      factorProporcion
    }
  };

  console.log('🌟 Resultado evaluación mejorada:', resultado);

  return resultado;
};

/**
 * Función de conveniencia para evaluación amigable (para niños)
 */
export const evaluarTrazadoAmigable = (usuario: Punto[], modelo: Punto[], figuraEsperada?: string): number => {
  const resultado = evaluarTrazado(usuario, modelo, 'amigable', figuraEsperada);
  
  // 👇 **EVALUACIÓN COMPRENSIVA: MÍNIMO 2 ESTRELLAS SI HAY ESFUERZO**
  if (resultado.puntuacion < 40 && usuario.length > 10) {
    // Si hay esfuerzo (más de 10 puntos) pero puntuación baja, dar mínimo 40 puntos (2 estrellas)
    console.log('🌟 Aplicando evaluación comprensiva: mínimo 2 estrellas por esfuerzo');
    return Math.max(resultado.puntuacion, 40);
  }
  
  return resultado.puntuacion;
};

/**
 * Función de conveniencia para evaluación médica (para terapeutas)
 */
export const evaluarTrazadoMedico = (usuario: Punto[], modelo: Punto[], figuraEsperada?: string): number => {
  // Para evaluación médica, podemos ser más estrictos
  const resultado = evaluarTrazado(usuario, modelo, 'medica', figuraEsperada);
  
  // Aplicar factor de corrección para ser más estricto
  const factorEstricto = 0.85; // 15% más estricto
  return Math.round(resultado.puntuacion * factorEstricto);
};


