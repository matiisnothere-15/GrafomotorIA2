// Sistema de evaluación simple y efectivo para grafomotricidad
// Enfoque: Simplicidad y comprensión para niños

export interface Punto {
  x: number;
  y: number;
}

// Opciones para evaluación de trazado guiado
export interface OpcionesTrazadoGuiado {
  // Semiancho del carril en píxeles (distancia desde la línea central del modelo)
  anchoCarrilPx?: number;
  // Activar/desactivar la penalización por salir del carril
  activarReglaCarril?: boolean;
}

/**
 * Calcula la distancia entre dos puntos
 */
const calcularDistancia = (p1: Punto, p2: Punto): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Calcula el centro de un conjunto de puntos
 */
const calcularCentro = (puntos: Punto[]): Punto => {
  if (puntos.length === 0) return { x: 0, y: 0 };
  
  const sumaX = puntos.reduce((sum, p) => sum + p.x, 0);
  const sumaY = puntos.reduce((sum, p) => sum + p.y, 0);
  
  return {
    x: sumaX / puntos.length,
    y: sumaY / puntos.length
  };
};

/**
 * Calcula el área aproximada de un conjunto de puntos
 */
const calcularAreaAproximada = (puntos: Punto[]): number => {
  if (puntos.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < puntos.length - 1; i++) {
    area += puntos[i].x * puntos[i + 1].y - puntos[i + 1].x * puntos[i].y;
  }
  return Math.abs(area) / 2;
};

/**
 * Distancia mínima entre un punto y un segmento AB
 */
const distanciaPuntoASegmento = (p: Punto, a: Punto, b: Punto): number => {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const abLen2 = abx * abx + aby * aby;
  if (abLen2 === 0) return calcularDistancia(p, a);
  let t = (apx * abx + apy * aby) / abLen2;
  t = Math.max(0, Math.min(1, t));
  const qx = a.x + t * abx;
  const qy = a.y + t * aby;
  const dx = p.x - qx;
  const dy = p.y - qy;
  return Math.hypot(dx, dy);
};

/**
 * Distancia mínima entre un punto y una polilínea (modelo)
 */
const distanciaPuntoAPolilinea = (p: Punto, polilinea: Punto[]): number => {
  if (polilinea.length === 0) return Infinity;
  if (polilinea.length === 1) return calcularDistancia(p, polilinea[0]);
  let dmin = Infinity;
  for (let i = 0; i < polilinea.length - 1; i++) {
    const d = distanciaPuntoASegmento(p, polilinea[i], polilinea[i + 1]);
    if (d < dmin) dmin = d;
  }
  return dmin;
};

/**
 * Calcula la proporción de puntos del usuario que quedan fuera del carril
 */
const proporcionFueraDeCarril = (usuario: Punto[], modelo: Punto[], umbralPx: number): number => {
  if (usuario.length === 0 || modelo.length < 2 || umbralPx <= 0) return 0;
  let fuera = 0;
  for (const pu of usuario) {
    const d = distanciaPuntoAPolilinea(pu, modelo);
    if (d > umbralPx) fuera++;
  }
  return fuera / usuario.length;
};

/**
 * Evalúa qué tan cerca están los puntos del usuario del modelo
 */
const evaluarProximidad = (usuario: Punto[], modelo: Punto[]): number => {
  if (usuario.length === 0 || modelo.length === 0) return 0;
  
  let puntosCercanos = 0;
  const tolerancia = 80; // Píxeles de tolerancia - MÁS ESTRICTO (era 50)
  
  for (const puntoUsuario of usuario) {
    let distanciaMinima = Infinity;
    
    for (const puntoModelo of modelo) {
      const distancia = calcularDistancia(puntoUsuario, puntoModelo);
      distanciaMinima = Math.min(distanciaMinima, distancia);
    }
    
    if (distanciaMinima < tolerancia) {
      puntosCercanos++;
    }
  }
  
  return (puntosCercanos / usuario.length) * 100;
};

/**
 * Remuestrea un camino a N puntos equidistantes
 */
const resamplePath = (points: Punto[], n: number): Punto[] => {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(n).fill(points[0]);
  
  // Calcular longitud total
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalLength += calcularDistancia(points[i], points[i+1]);
  }
  
  const interval = totalLength / (n - 1);
  const newPoints: Punto[] = [points[0]];
  
  let currentDist = 0;
  let i = 0;
  
  // Copia de puntos para no mutar original
  const pts = [...points];

  while (newPoints.length < n) {
    if (i >= pts.length - 1) break;
    
    const p1 = pts[i];
    const p2 = pts[i+1];
    const d = calcularDistancia(p1, p2);
    
    if (currentDist + d >= interval) {
      const t = (interval - currentDist) / d;
      const newX = p1.x + t * (p2.x - p1.x);
      const newY = p1.y + t * (p2.y - p1.y);
      const newP = { x: newX, y: newY };
      newPoints.push(newP);
      // Insertar virtualmente para continuar
      pts.splice(i + 1, 0, newP);
      currentDist = 0;
      i++; 
    } else {
      currentDist += d;
      i++;
    }
  }
  
  while (newPoints.length < n) {
    newPoints.push(pts[pts.length - 1]);
  }
  
  return newPoints;
};

/**
 * Normaliza una forma (centrar y escalar)
 */
const normalizeShape = (points: Punto[]): Punto[] => {
  const centro = calcularCentro(points);
  // Centrar
  const centered = points.map(p => ({ x: p.x - centro.x, y: p.y - centro.y }));
  
  // Escalar (RMS distance from center = 1)
  let sumSq = 0;
  centered.forEach(p => sumSq += p.x*p.x + p.y*p.y);
  const scale = Math.sqrt(sumSq / points.length);
  
  if (scale === 0) return centered;
  
  return centered.map(p => ({ x: p.x / scale, y: p.y / scale }));
};

/**
 * Calcula la distancia Procrustes (suma de distancias cuadradas)
 */
const procrustesDistance = (shape1: Punto[], shape2: Punto[]): number => {
  let sumDist = 0;
  const n = Math.min(shape1.length, shape2.length);
  for (let i = 0; i < n; i++) {
    const dx = shape1[i].x - shape2[i].x;
    const dy = shape1[i].y - shape2[i].y;
    sumDist += dx*dx + dy*dy;
  }
  return sumDist; 
};

/**
 * Evalúa similitud geométrica usando Procrustes
 */
export const evaluarSimilitudGeometrica = (usuario: Punto[], modelo: Punto[]): number => {
  const N = 60;
  const usuarioResampled = resamplePath(usuario, N);
  const modeloResampled = resamplePath(modelo, N);
  
  const usuarioNorm = normalizeShape(usuarioResampled);
  const modeloNorm = normalizeShape(modeloResampled);
  
  // Función interna para calcular distancia con shift (para corregir punto de inicio)
  const calcDist = (s1: Punto[], s2: Punto[], offset: number) => {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const j = (i + offset) % N;
      const dx = s1[i].x - s2[j].x;
      const dy = s1[i].y - s2[j].y;
      sum += dx*dx + dy*dy;
    }
    return sum;
  };

  let minDist = Infinity;

  // 1. Probar dirección normal con todos los shifts
  // Esto alinea el dibujo sin importar dónde empezó el usuario
  for (let offset = 0; offset < N; offset++) {
    const d = calcDist(usuarioNorm, modeloNorm, offset);
    if (d < minDist) minDist = d;
  }

  // 2. Probar dirección inversa con todos los shifts
  // Esto maneja si el usuario dibujó en sentido contrario (horario vs antihorario)
  const usuarioRev = [...usuarioNorm].reverse();
  for (let offset = 0; offset < N; offset++) {
    const d = calcDist(usuarioRev, modeloNorm, offset);
    if (d < minDist) minDist = d;
  }
  
  // Normalizar por número de puntos para obtener el Error Cuadrático Medio (MSE)
  const mse = minDist / N;
  
  // Distancia MSE > 0.5 indica forma diferente. > 1.0 es muy diferente.
  // Mapear: 0 -> 100, 1.0 -> 0
  const score = Math.max(0, 100 - (mse * 100)); 
  
  console.log('📐 Similitud Procrustes (Optimized):', { 
    minDist: minDist.toFixed(4), 
    mse: mse.toFixed(4), 
    score: score.toFixed(1) 
  });
  return score;
};


/**
 * Evalúa si el trazo tiene la forma básica correcta - VERSIÓN ESTRICTA
 */
export const evaluarFormaBasica = (usuario: Punto[], figuraEsperada: string): number => {
  if (usuario.length < 5) return 0;
  
  const centro = calcularCentro(usuario);
  const area = calcularAreaAproximada(usuario);
  
  // Detectar forma real del usuario
  const formaDetectada = detectarFormaReal(usuario);
  
  console.log('🔍 Validación de forma estricta:', {
    figuraEsperada,
    formaDetectada,
    area,
    puntos: usuario.length
  });
  
  // VALIDACIÓN ESTRICTA: Si la forma es incorrecta, 0 puntos.
  if (!esFormaCorrecta(formaDetectada, figuraEsperada)) {
    console.log('⚠️ Forma no detectada correctamente:', {
      esperada: figuraEsperada,
      detectada: formaDetectada
    });
    // Penalización TOTAL para VMI: si la forma es incorrecta (ej. cuadrado en vez de X), falla.
    return 0; 
  }
  
  // Si la forma es correcta, evaluar calidad
  let puntuacionForma = 80; // Base muy alta para forma correcta
  
  switch (figuraEsperada.toLowerCase()) {
    // CopiaFigura - Nivel 1
    case 'circulo':
      // Para círculo, verificar distribución circular (MUY PERMISIVO)
      const distanciasAlCentro = usuario.map(p => calcularDistancia(p, centro));
      const variacionDistancia = Math.max(...distanciasAlCentro) - Math.min(...distanciasAlCentro);
      if (variacionDistancia < 200) puntuacionForma += 20; // Círculo bien formado (muy permisivo)
      else puntuacionForma += 15; // Círculo aceptable (muy permisivo)
      break;
      
    case 'cuadrado':
      // Para cuadrado, verificar esquinas y área (MUY PERMISIVO)
      if (area > 300) puntuacionForma += 20; // Área suficiente (muy permisivo)
      else puntuacionForma += 15; // Área aceptable (muy permisivo)
      break;
      
    case 'triangulo':
      // Para triángulo, verificar área y forma (MUY PERMISIVO)
      if (area > 100) puntuacionForma += 20; // Área suficiente (muy permisivo)
      else puntuacionForma += 15; // Área aceptable (muy permisivo)
      break;
    
    // CopiaFigura - Nivel 2
    case 'estrella':
      // Para estrella, verificar esquinas múltiples (MUY PERMISIVO)
      const esquinasEstrella = detectarEsquinas(usuario);
      if (esquinasEstrella.length >= 2) puntuacionForma += 20; // Estrella bien formada (muy permisivo)
      else puntuacionForma += 15; // Estrella aceptable (muy permisivo)
      break;
      
    case 'flecha':
      // Para flecha, verificar forma alargada (MUY PERMISIVO)
      if (area > 50) puntuacionForma += 20; // Flecha bien formada (muy permisivo)
      else puntuacionForma += 15; // Flecha aceptable (muy permisivo)
      break;
      
    case 'pacman':
      // Para pacman, verificar círculo incompleto (MUY PERMISIVO)
      const distanciasPacman = usuario.map(p => calcularDistancia(p, centro));
      const variacionPacman = Math.max(...distanciasPacman) - Math.min(...distanciasPacman);
      if (variacionPacman < 300) puntuacionForma += 20; // Pacman bien formado (muy permisivo)
      else puntuacionForma += 15; // Pacman aceptable (muy permisivo)
      break;
    
    // CopiaFigura - Nivel 3
    case 'infinito':
      // Para infinito, verificar forma de 8 (MUY PERMISIVO)
      if (area > 100) puntuacionForma += 20; // Infinito bien formado (muy permisivo)
      else puntuacionForma += 15; // Infinito aceptable (muy permisivo)
      break;
      
    case 'arbol':
      // Para árbol, verificar forma triangular o lineal (MUY PERMISIVO)
      if (area > 30) puntuacionForma += 20; // Árbol bien formado (muy permisivo)
      else puntuacionForma += 15; // Árbol aceptable (muy permisivo)
      break;
      
    case 'nube':
      // Para nube, verificar forma redondeada (MUY PERMISIVO)
      if (area > 50) puntuacionForma += 20; // Nube bien formada (muy permisivo)
      else puntuacionForma += 15; // Nube aceptable (muy permisivo)
      break;
    
    // TrazadoGuiado - Todos los niveles (MUY PERMISIVO)
    case 'montaña':
    case 'punteagudo':
      // Para formas puntiagudas, verificar área triangular
      if (area > 50) puntuacionForma += 20; // Forma bien formada (muy permisivo)
      else puntuacionForma += 15; // Forma aceptable (muy permisivo)
      break;
      
    case 'ondas':
    case 'ola':
    case 'caminocurva':
    case 'curvasE':
      // Para formas curvas, verificar continuidad
      const continuidadCurva = evaluarContinuidad(usuario);
      if (continuidadCurva > 40) puntuacionForma += 20; // Curva bien formada (muy permisivo)
      else puntuacionForma += 15; // Curva aceptable (muy permisivo)
      break;
      
    case 'espiral':
    case 'doble_espiral':
    case 'zigzag_espiral':
      // Para espirales, verificar forma circular o lineal
      if (area > 50) puntuacionForma += 20; // Espiral bien formada (muy permisivo)
      else puntuacionForma += 15; // Espiral aceptable (muy permisivo)
      break;
      
    default:
      // Para otras formas, dar puntuación base (MUY PERMISIVO)
      puntuacionForma += 20; // Siempre dar puntos altos
  }
  
  return Math.min(100, puntuacionForma);
};

/**
 * Detecta la forma real del trazo del usuario - VERSIÓN COMPLETA
 */
export const detectarFormaReal = (puntos: Punto[]): string => {
  if (puntos.length < 8) return 'otro';
  
  const centro = calcularCentro(puntos);
  const area = calcularAreaAproximada(puntos);
  
  // Calcular bounds
  const xs = puntos.map(p => p.x);
  const ys = puntos.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;
  const ratioProporcion = Math.min(width, height) / Math.max(width, height);
  
  // Detectar esquinas (fundamental para distinguir cuadrado de círculo)
  const esquinas = detectarEsquinas(puntos);
  const numEsquinas = esquinas.length;

  // Detectar círculo: variación baja de distancia al centro (MÁS PERMISIVO)
  const distanciasAlCentro = puntos.map(p => calcularDistancia(p, centro));
  const promedioDistancia = distanciasAlCentro.reduce((a, b) => a + b, 0) / distanciasAlCentro.length;
  const variacionDistancia = Math.max(...distanciasAlCentro) - Math.min(...distanciasAlCentro);
  // Círculo: pocas esquinas y radio constante
  const esCircular = (variacionDistancia < promedioDistancia * 0.6 && ratioProporcion > 0.4 && numEsquinas < 3); 
  
  // Detectar cuadrado: proporción cuadrada, área suficiente Y ESQUINAS
  // Un cuadrado debe tener aprox 4 esquinas (aceptamos 3-5 por imperfección)
  const esCuadrado = ratioProporcion > 0.6 && area > 300 && !esCircular && (numEsquinas >= 3 && numEsquinas <= 5);
  
  // Detectar triángulo: área triangular y proporción Y ESQUINAS
  const esTriangulo = area > 100 && ratioProporcion > 0.3 && !esCircular && !esCuadrado && (numEsquinas === 3);
  
  // Detectar estrella: múltiples esquinas y simetría radial (PERMISIVO)
  const esEstrella = numEsquinas >= 5 && area > 200; 
  
  // Detectar línea: relación de aspecto muy alta (PERMISIVO)
  const esLinea = ratioProporcion < 0.3 && area < 1500; 
  
  // Detectar flecha: forma alargada con dirección (PERMISIVO)
  const esFlecha = ratioProporcion < 0.6 && area > 100 && area < 1000 && numEsquinas >= 3; 
  
  // Detectar pacman: círculo incompleto (como círculo pero con menos puntos) (PERMISIVO)
  const esPacman = esCircular && puntos.length < 200; 
  
  // Detectar infinito: forma de 8 o doble círculo (PERMISIVO)
  const esInfinito = area > 200 && ratioProporcion > 0.3 && ratioProporcion < 0.9; 
  
  // Detectar árbol: forma triangular o lineal (PERMISIVO)
  const esArbol = (esTriangulo || esLinea) && area > 50; 
  
  // Detectar nube: forma redondeada irregular (PERMISIVO)
  const esNube = !esCircular && !esCuadrado && !esTriangulo && ratioProporcion > 0.3 && area > 100; 
  
  // Priorizar detección por confianza
  if (esEstrella) return 'estrella';
  if (esCircular && !esPacman) return 'circulo';
  if (esPacman) return 'pacman';
  if (esCuadrado) return 'cuadrado';
  if (esTriangulo) return 'triangulo';
  if (esFlecha) return 'flecha';
  if (esInfinito) return 'infinito';
  if (esArbol) return 'arbol';
  if (esNube) return 'nube';
  if (esLinea) return 'linea';
  
  return 'otro';
};

/**
 * Detecta esquinas en un conjunto de puntos
 */
const detectarEsquinas = (puntos: Punto[]): Punto[] => {
  const esquinas: Punto[] = [];
  const umbralEsquina = 0.1; // Más permisivo
  
  for (let i = 2; i < puntos.length - 2; i++) { // Ventana más pequeña
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
    
    if (cambio2 > umbralEsquina && cambio2 > cambio1 && cambio2 > cambio3) {
      esquinas.push(p3);
    }
  }
  
  return esquinas;
};

/**
 * Evalúa la continuidad de un trazo (para formas curvas)
 */
const evaluarContinuidad = (puntos: Punto[]): number => {
  if (puntos.length < 3) return 0;
  
  let continuidadTotal = 0;
  let segmentosEvaluados = 0;
  
  for (let i = 1; i < puntos.length - 1; i++) {
    const p1 = puntos[i - 1];
    const p2 = puntos[i];
    const p3 = puntos[i + 1];
    
    // Calcular suavidad del cambio de dirección
    const angulo1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angulo2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    
    const cambioAngulo = Math.abs(angulo2 - angulo1);
    const suavidad = Math.max(0, 100 - (cambioAngulo * 25)); // Fórmula mejorada - menos cambio = más suave
    
    continuidadTotal += suavidad;
    segmentosEvaluados++;
  }
  
  return segmentosEvaluados > 0 ? continuidadTotal / segmentosEvaluados : 0;
};

/**
 * Valida si la forma detectada coincide con la esperada - VERSIÓN COMPLETA
 */
export const esFormaCorrecta = (formaDetectada: string, figuraEsperada: string): boolean => {
  const mapeoFormas: Record<string, string[]> = {
    // CopiaFigura - Nivel 1
    'circulo': ['circulo'],
    'cuadrado': ['cuadrado'],
    'triangulo': ['triangulo'],
    
    // CopiaFigura - Nivel 2
    'estrella': ['estrella'],
    'flecha': ['flecha', 'linea'], // Las flechas pueden ser líneas o formas de flecha
    'pacman': ['pacman', 'circulo'], // Pacman es básicamente un círculo incompleto
    
    // CopiaFigura - Nivel 3
    'infinito': ['infinito', 'circulo'], // El infinito tiene forma de 8 o circular
    'arbol': ['arbol', 'triangulo', 'linea'], // Los árboles pueden ser triángulos o líneas
    'nube': ['nube', 'circulo'], // Las nubes son formas redondeadas
    
    // TrazadoGuiado - Nivel 1
    'montaña': ['montaña', 'triangulo', 'linea'], // Las montañas son triangulares o lineales
    'ondas': ['ondas', 'linea'], // Las ondas son líneas curvas
    'ola': ['ola', 'linea'], // Las olas son líneas curvas
    
    // TrazadoGuiado - Nivel 2
    'punteagudo': ['punteagudo', 'triangulo', 'linea'], // Formas puntiagudas
    'caminocurva': ['caminocurva', 'linea'], // Caminos curvos son líneas
    'espiral': ['espiral', 'circulo', 'linea'], // Las espirales pueden ser circulares o lineales
    
    // TrazadoGuiado - Nivel 3
    'curvasE': ['curvasE', 'linea'], // Curvas enfrentadas son líneas
    'doble_espiral': ['doble_espiral', 'espiral', 'circulo'], // Doble espiral
    'zigzag_espiral': ['zigzag_espiral', 'espiral', 'linea'], // Zigzag en espiral

    // VMI Adicionales
    'linea': ['linea', 'otro'], // Líneas pueden ser detectadas como otro si son muy cortas o irregulares
    'cruz': ['cruz', 'estrella', 'otro', 'linea'], // Cruz puede ser detectada como estrella u otro
    'x': ['x', 'estrella', 'cruz', 'otro', 'linea'], // X similar a cruz
    'abierta_circulo': ['otro', 'circulo', 'linea'],
    'estrella_simple': ['estrella', 'cruz', 'x', 'otro'],
    'cruz_flechas': ['otro', 'cruz', 'estrella'],
    '3_circulos': ['otro', 'circulo'],
    'puntos_triangulo': ['otro', 'triangulo', 'circulo'],
    'circulo_rombo': ['otro', 'circulo', 'cuadrado'], // Rombo a veces es cuadrado rotado
    'rombo_vertical': ['otro', 'cuadrado', 'linea'],
    'figura compuesta de triangulos': ['otro', 'triangulo'],
    'patron circular de puntos': ['otro', 'circulo'],
    'poligonos entrelazados': ['otro', 'cuadrado'],
    'rombo_horizontal': ['otro', 'cuadrado'],
    'tres circulos entrelazados dobles': ['otro', 'circulo'],
    'cubo isometrico': ['otro', 'cuadrado'],
    'figura tipo tunel': ['otro', 'cuadrado'],
    'estrella entrelazada de seis puntas': ['otro', 'triangulo', 'estrella'],
    'triangulos_compuestos': ['otro', 'triangulo'],
    'puntos_circular': ['otro', 'circulo'],
    '3_anillos': ['otro', 'circulo'],
    'estrella_seis': ['otro', 'triangulo', 'estrella'],
    'tunel': ['otro', 'cuadrado'],
  };
  
  // Normalizar clave
  const key = figuraEsperada.toLowerCase();
  // Buscar coincidencia exacta o parcial
  let formasAceptables = mapeoFormas[key];
  
  if (!formasAceptables) {
      // Intentar buscar si alguna clave está contenida
      const foundKey = Object.keys(mapeoFormas).find(k => key.includes(k));
      if (foundKey) formasAceptables = mapeoFormas[foundKey];
      else formasAceptables = ['otro', 'linea', 'circulo', 'cuadrado', 'triangulo']; // Fallback permisivo
  }

  return formasAceptables.includes(formaDetectada);
};

/**
 * EVALUACIÓN PRINCIPAL - SIMPLE Y EFECTIVA
 */
export const evaluarTrazadoSimple = (
  coordenadasUsuario: Punto[],
  coordenadasModelo: Punto[],
  figuraEsperada: string = 'figura'
): number => {
  
  console.log('🎯 Evaluación Simple:', {
    usuario: coordenadasUsuario.length,
    modelo: coordenadasModelo.length,
    figura: figuraEsperada
  });
  
  // Validaciones básicas
  if (coordenadasUsuario.length < 5) {
    console.log('❌ Muy pocos puntos del usuario');
    return 0;
  }
  
  if (coordenadasModelo.length === 0) {
    console.log('❌ No hay modelo de referencia');
    return 0;
  }
  
  // 1. Evaluar proximidad (40% del peso)
  const proximidad = evaluarProximidad(coordenadasUsuario, coordenadasModelo);
  console.log('📍 Proximidad:', proximidad.toFixed(1) + '%');
  
  // 2. Evaluar continuidad (30% del peso)
  const continuidad = evaluarContinuidad(coordenadasUsuario);
  console.log('🔄 Continuidad:', continuidad.toFixed(1) + '%');
  
  // 3. Evaluar forma básica (20% del peso)
  const formaBasica = evaluarFormaBasica(coordenadasUsuario, figuraEsperada);
  console.log('🔷 Forma básica:', formaBasica.toFixed(1) + '%');

  // 4. Evaluar similitud geométrica (Procrustes) (30% del peso)
  const similitud = evaluarSimilitudGeometrica(coordenadasUsuario, coordenadasModelo);
  
  // Calcular puntuación final con pesos ajustados
  // Proximidad: 30%, Continuidad: 20%, Forma: 20%, Similitud: 30%
  let puntuacionFinal = (proximidad * 0.3) + (continuidad * 0.2) + (formaBasica * 0.2) + (similitud * 0.3);
  
  // VETO: Si la similitud geométrica es muy baja (< 40), la forma es incorrecta.
  /*
  if (similitud < 40) {
    console.warn('⛔ VETO: Similitud geométrica insuficiente. Forzando puntuación baja.');
    puntuacionFinal = Math.min(puntuacionFinal, 40);
  }
  */

  // 👇 **EVALUACIÓN COMPRENSIVA: SIN MÍNIMO GARANTIZADO**
  const puntuacionComprensiva = puntuacionFinal;
  
  // Calcular estrellas con escala estándar
  let estrellas = 1;
  if (puntuacionComprensiva >= 89) estrellas = 5;      // 100-89 = 5 estrellas
  else if (puntuacionComprensiva >= 70) estrellas = 4; // 88-70 = 4 estrellas  
  else if (puntuacionComprensiva >= 50) estrellas = 3;  // 69-50 = 3 estrellas
  else if (puntuacionComprensiva >= 15) estrellas = 2;  // 49-15 = 2 estrellas
  else estrellas = 1;                                   // 14-1 = 1 estrella

  console.log('🌟 Puntuación final:', {
    original: puntuacionFinal.toFixed(1),
    comprensiva: puntuacionComprensiva.toFixed(1),
    estrellas: estrellas
  });
  
  return Math.round(puntuacionComprensiva);
};

/**
 * Convierte una puntuación (0-100) a estrellas usando escala estándar
 */
export const convertirPuntuacionAEstrellas = (puntuacion: number): number => {
  if (puntuacion >= 89) return 5;      // 100-89 = 5 estrellas
  if (puntuacion >= 70) return 4;     // 88-70 = 4 estrellas  
  if (puntuacion >= 50) return 3;     // 69-50 = 3 estrellas
  if (puntuacion >= 15) return 2;    // 49-15 = 2 estrellas
  return 1;                           // 14-1 = 1 estrella
};

/**
 * Calcula la dirección promedio de un conjunto de puntos
 */
const calcularDireccionPromedio = (puntos: Punto[]): number => {
  if (puntos.length < 2) return 0;
  
  let sumaAngulos = 0;
  let angulosValidos = 0;
  
  for (let i = 1; i < puntos.length; i++) {
    const dx = puntos[i].x - puntos[i - 1].x;
    const dy = puntos[i].y - puntos[i - 1].y;
    
    if (dx !== 0 || dy !== 0) {
      const angulo = Math.atan2(dy, dx) * (180 / Math.PI);
      sumaAngulos += angulo < 0 ? angulo + 360 : angulo;
      angulosValidos++;
    }
  }
  
  return angulosValidos > 0 ? sumaAngulos / angulosValidos : 0;
};

/**
 * Evalúa superposición imaginaria entre coordenadas del usuario y modelo
 * Para trazado guiado - NO penaliza por dibujar "encima" del modelo
 */
export const evaluarSuperposicionImaginaria = (
  coordenadasUsuario: Punto[],
  coordenadasModelo: Punto[],
  toleranciaSuperposicion: number = 60 // MÁS ESTRICTO para trazado guiado
): number => {
  if (coordenadasUsuario.length === 0 || coordenadasModelo.length === 0) return 0;
  
  let puntosSuperpuestos = 0;
  let distanciasMinimas: number[] = [];
  
  coordenadasModelo.forEach(puntoModelo => {
    let distanciaMinima = Infinity;
    
    coordenadasUsuario.forEach(puntoUsuario => {
      const distancia = calcularDistancia(puntoUsuario, puntoModelo);
      distanciaMinima = Math.min(distanciaMinima, distancia);
    });
    
    distanciasMinimas.push(distanciaMinima);
    
    if (distanciaMinima <= toleranciaSuperposicion) {
      puntosSuperpuestos++;
    }
  });
  
  const porcentaje = (puntosSuperpuestos / coordenadasModelo.length) * 100;
  const distanciaPromedio = distanciasMinimas.reduce((sum, dist) => sum + dist, 0) / distanciasMinimas.length;
  
  console.log('🔍 Superposición imaginaria detallada:', {
    puntosSuperpuestos,
    totalModelo: coordenadasModelo.length,
    porcentaje: porcentaje.toFixed(1) + '%',
    distanciaPromedio: distanciaPromedio.toFixed(1) + 'px',
    tolerancia: toleranciaSuperposicion + 'px'
  });
  
  return Math.min(100, porcentaje);
};

/**
 * Evalúa la dirección del trazado comparado con el modelo
 */
export const evaluarDireccionTrazado = (
  coordenadasUsuario: Punto[],
  coordenadasModelo: Punto[]
): number => {
  if (coordenadasUsuario.length < 2 || coordenadasModelo.length < 2) return 50;
  
  // Calcular dirección promedio del usuario
  const direccionUsuario = calcularDireccionPromedio(coordenadasUsuario);
  
  // Calcular dirección promedio del modelo
  const direccionModelo = calcularDireccionPromedio(coordenadasModelo);
  
  // Calcular diferencia angular
  const diferencia = Math.abs(direccionUsuario - direccionModelo);
  const diferenciaNormalizada = Math.min(diferencia, 360 - diferencia);
  
  // Convertir a porcentaje (más estricto: factor 150)
  const porcentaje = Math.max(0, 100 - (diferenciaNormalizada * 150));
  
  return Math.min(100, porcentaje);
};

/**
 * EVALUACIÓN ESPECÍFICA PARA TRAZADO GUIADO
 * Usa superposición imaginaria y criterios más estrictos
 */
export const evaluarTrazadoGuiado = (
  coordenadasUsuario: Punto[],
  coordenadasModelo: Punto[],
  figuraEsperada: string = 'trazado',
  opciones?: OpcionesTrazadoGuiado
): number => {
  
  console.log('🎯 Evaluación Trazado Guiado:', {
    usuario: coordenadasUsuario.length,
    modelo: coordenadasModelo.length,
    figura: figuraEsperada
  });
  
  // Validaciones básicas
  if (coordenadasUsuario.length < 5) {
    console.log('❌ Muy pocos puntos del usuario');
    return 0;
  }
  
  if (coordenadasModelo.length === 0) {
    console.log('❌ No hay modelo de referencia');
    return 0;
  }
  
  // 1. Superposición imaginaria (60% del peso) - MÁS ESTRICTO
  const superposicion = evaluarSuperposicionImaginaria(coordenadasUsuario, coordenadasModelo);
  console.log('📍 Superposición imaginaria:', superposicion.toFixed(1) + '%');
  
  // 2. Continuidad del trazo (25% del peso)
  const continuidad = evaluarContinuidad(coordenadasUsuario);
  console.log('🔄 Continuidad:', continuidad.toFixed(1) + '%');
  
  // 3. Dirección y forma general (15% del peso)
  const direccion = evaluarDireccionTrazado(coordenadasUsuario, coordenadasModelo);
  console.log('🧭 Dirección:', direccion.toFixed(1) + '%');
  
  // Puntuación final con pesos específicos
  let puntuacionFinal = (superposicion * 0.6) + (continuidad * 0.25) + (direccion * 0.15);

  // Regla de carril: penalizar si puntos del usuario salen fuera del carril
  const activarCarril = opciones?.activarReglaCarril ?? true;
  const anchoCarrilPx = opciones?.anchoCarrilPx ?? 25; // Semiancho por defecto ~ mitad de la barra visual (50px)
  if (activarCarril) {
    const fueraRatio = proporcionFueraDeCarril(coordenadasUsuario, coordenadasModelo, anchoCarrilPx);
    // Penalización multiplicativa: a mayor salida, menor puntaje (curva suave pero estricta)
    const penalizador = 1 - Math.pow(Math.min(1, fueraRatio), 0.75);
    const antes = puntuacionFinal;
    puntuacionFinal = puntuacionFinal * penalizador;
    console.log('🚧 Regla de carril aplicada:', {
      anchoCarrilPx,
      fueraRatio: (fueraRatio * 100).toFixed(1) + '%',
      penalizador: penalizador.toFixed(3),
      antes: antes.toFixed(1),
      despues: puntuacionFinal.toFixed(1)
    });
  }
  
  console.log('🌟 Resultado Trazado Guiado:', {
    superposicion: superposicion.toFixed(1),
    continuidad: continuidad.toFixed(1),
    direccion: direccion.toFixed(1),
    puntuacionFinal: puntuacionFinal.toFixed(1)
  });
  
  return Math.round(puntuacionFinal);
};

/**
 * Evaluación amigable para niños (siempre comprensiva)
 */
export const evaluarTrazadoAmigableSimple = (
  usuario: Punto[], 
  modelo: Punto[], 
  figuraEsperada?: string
): number => {
  return evaluarTrazadoSimple(usuario, modelo, figuraEsperada || 'figura');
};

/**
 * Evaluación médica para terapeutas (más estricta)
 */
export const evaluarTrazadoMedicoSimple = (
  usuario: Punto[], 
  modelo: Punto[], 
  figuraEsperada?: string
): number => {
  const puntuacion = evaluarTrazadoSimple(usuario, modelo, figuraEsperada || 'figura');
  // Aplicar factor de corrección para ser más estricto (10% menos)
  return Math.round(puntuacion * 0.9);
};

/**
 * Evalúa la fluidez del movimiento en coordinación motriz
 */
const evaluarFluidezMovimiento = (puntos: Punto[]): number => {
  if (puntos.length < 3) return 0;
  
  let cambiosDireccion = 0;
  let segmentosSuaves = 0;
  
  for (let i = 2; i < puntos.length - 1; i++) {
    const p1 = puntos[i - 1];
    const p2 = puntos[i];
    const p3 = puntos[i + 1];
    
    const angulo1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angulo2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    
    const cambioAngulo = Math.abs(angulo2 - angulo1);
    
    if (cambioAngulo > 0.5) { // Cambio brusco de dirección
      cambiosDireccion++;
    } else {
      segmentosSuaves++;
    }
  }
  
  const totalSegmentos = cambiosDireccion + segmentosSuaves;
  if (totalSegmentos === 0) return 0;
  
  const fluidez = (segmentosSuaves / totalSegmentos) * 100;
  return Math.min(100, fluidez);
};

/**
 * Evalúa la precisión en el seguimiento de patrones
 */
const evaluarPrecisionPatron = (usuario: Punto[], modelo: Punto[]): number => {
  if (usuario.length === 0 || modelo.length === 0) return 0;
  
  let puntosPrecisos = 0;
  const tolerancia = 100; // Más permisivo para coordinación motriz
  
  for (const puntoUsuario of usuario) {
    let distanciaMinima = Infinity;
    
    for (const puntoModelo of modelo) {
      const distancia = calcularDistancia(puntoUsuario, puntoModelo);
      distanciaMinima = Math.min(distanciaMinima, distancia);
    }
    
    if (distanciaMinima <= tolerancia) {
      puntosPrecisos++;
    }
  }
  
  return (puntosPrecisos / usuario.length) * 100;
};

/**
 * Evalúa la consistencia en el grosor del trazo
 */
const evaluarConsistenciaTrazo = (puntos: Punto[]): number => {
  if (puntos.length < 10) return 50; // Puntuación base si hay pocos puntos
  
  // Calcular distancias entre puntos consecutivos
  const distancias: number[] = [];
  for (let i = 1; i < puntos.length; i++) {
    const distancia = calcularDistancia(puntos[i - 1], puntos[i]);
    distancias.push(distancia);
  }
  
  if (distancias.length === 0) return 50;
  
  // Calcular variación en las distancias
  const promedio = distancias.reduce((sum, dist) => sum + dist, 0) / distancias.length;
  const varianza = distancias.reduce((sum, dist) => sum + Math.pow(dist - promedio, 2), 0) / distancias.length;
  const desviacionEstandar = Math.sqrt(varianza);
  
  // Menor variación = mayor consistencia
  const coeficienteVariacion = desviacionEstandar / promedio;
  const consistencia = Math.max(0, 100 - (coeficienteVariacion * 200));
  
  return Math.min(100, consistencia);
};

/**
 * EVALUACIÓN ESPECÍFICA PARA COORDINACIÓN MOTRIZ
 * Enfocada en fluidez, precisión y consistencia del movimiento
 */
export const evaluarCoordinacionMotriz = (
  coordenadasUsuario: Punto[],
  coordenadasModelo: Punto[],
  ejercicioEsperado: string = 'coordinacion'
): number => {
  
  console.log('🎯 Evaluación Coordinación Motriz:', {
    usuario: coordenadasUsuario.length,
    modelo: coordenadasModelo.length,
    ejercicio: ejercicioEsperado
  });
  
  // Validaciones básicas
  if (coordenadasUsuario.length < 5) {
    console.log('❌ Muy pocos puntos del usuario');
    return 0;
  }
  
  if (coordenadasModelo.length === 0) {
    console.log('❌ No hay modelo de referencia');
    return 0;
  }
  
  // 1. Fluidez del movimiento (40% del peso)
  const fluidez = evaluarFluidezMovimiento(coordenadasUsuario);
  console.log('🌊 Fluidez del movimiento:', fluidez.toFixed(1) + '%');
  
  // 2. Precisión en el patrón (35% del peso)
  const precision = evaluarPrecisionPatron(coordenadasUsuario, coordenadasModelo);
  console.log('🎯 Precisión del patrón:', precision.toFixed(1) + '%');
  
  // 3. Consistencia del trazo (25% del peso)
  const consistencia = evaluarConsistenciaTrazo(coordenadasUsuario);
  console.log('📏 Consistencia del trazo:', consistencia.toFixed(1) + '%');
  
  // Puntuación final con pesos específicos para coordinación motriz
  const puntuacionFinal = (fluidez * 0.4) + (precision * 0.35) + (consistencia * 0.25);
  
  console.log('🌟 Resultado Coordinación Motriz:', {
    fluidez: fluidez.toFixed(1),
    precision: precision.toFixed(1),
    consistencia: consistencia.toFixed(1),
    puntuacionFinal: puntuacionFinal.toFixed(1)
  });
  
  return Math.round(puntuacionFinal);
};