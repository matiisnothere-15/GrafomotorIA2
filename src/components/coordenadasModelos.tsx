// coordenadasModelos.ts

function interpolarLinea(p1: [number, number], p2: [number, number], pasos: number): [number, number][] {
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  return Array.from({ length: pasos }, (_, i) => {
    const t = i / (pasos - 1);
    // Usar interpolación suave (ease-in-out) para líneas más naturales
    const smoothT = t * t * (3 - 2 * t); // Función smoothstep
    return [
      Math.round(x1 + (x2 - x1) * smoothT),
      Math.round(y1 + (y2 - y1) * smoothT),
    ];
  });
}



function suavizarCoordenadas(
  coordenadas: [number, number][],
  ventana: number = 4,
  pasadas: number = 2,
  preservarEsquinas: boolean = true,
  cerrado: boolean = true,
  umbralAnguloGrados: number = 150,
  keepIndices?: Set<number> // <- NUEVO: índices fijos que no se suavizan
): [number, number][] {
  if (coordenadas.length < Math.max(ventana, 3) || pasadas < 1) return coordenadas.slice();

  let out = coordenadas.slice();
  const n = out.length;

  const esEsquinaEn = (arr: [number, number][], i: number): boolean => {
    if (!preservarEsquinas) return false;
    if (keepIndices && keepIndices.has(i)) return true;

    const prev = cerrado ? (i - 1 + n) % n : Math.max(0, i - 1);
    const next = cerrado ? (i + 1) % n : Math.min(n - 1, i + 1);

    // En trazo abierto, conserva extremos
    if (!cerrado && (i === 0 || i === n - 1)) return true;

    const [x0, y0] = arr[prev];
    const [x1, y1] = arr[i];
    const [x2, y2] = arr[next];

    const v1x = x0 - x1, v1y = y0 - y1;
    const v2x = x2 - x1, v2y = y2 - y1;

    const m1 = Math.hypot(v1x, v1y);
    const m2 = Math.hypot(v2x, v2y);
    if (m1 === 0 || m2 === 0) return true;

    const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (m1 * m2)));
    const ang = Math.acos(cos) * 180 / Math.PI;

    return ang < umbralAnguloGrados;
  };

  for (let p = 0; p < pasadas; p++) {
    const next: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      if (esEsquinaEn(out, i)) { next.push(out[i]); continue; }

      let sx = 0, sy = 0, peso = 0;
      const half = Math.floor(ventana / 2);

      for (let k = -half; k <= half; k++) {
        let idx = i + k;
        if (cerrado) {
          idx = (idx % n + n) % n;
        } else {
          if (idx < 0 || idx >= n) continue;
        }
        const dist = Math.abs(k);
        const w = Math.exp(-(dist * dist) / (2 * Math.pow(ventana / 3, 2)));
        sx += out[idx][0] * w;
        sy += out[idx][1] * w;
        peso += w;
      }
      next.push([sx / peso, sy / peso]);
    }
    out = next;
  }
  return out;
}

// Función específica para suavizar círculos con algoritmo especializado
function suavizarCirculo(coordenadas: [number, number][]): [number, number][] {
  if (coordenadas.length < 10) return coordenadas;
  
  const centroX = coordenadas.reduce((sum, [x]) => sum + x, 0) / coordenadas.length;
  const centroY = coordenadas.reduce((sum, [, y]) => sum + y, 0) / coordenadas.length;
  
  // Calcular radio promedio
  const radios = coordenadas.map(([x, y]) => 
    Math.sqrt((x - centroX) ** 2 + (y - centroY) ** 2)
  );
  const radioPromedio = radios.reduce((sum, r) => sum + r, 0) / radios.length;
  
  // Regenerar círculo perfecto con más puntos
  const totalPuntos = Math.max(coordenadas.length * 2, 200);
  const coordenadasSuavizadas: [number, number][] = [];
  
  for (let i = 0; i < totalPuntos; i++) {
    const angulo = (i * 2 * Math.PI) / totalPuntos;
    const x = centroX + radioPromedio * Math.cos(angulo);
    const y = centroY + radioPromedio * Math.sin(angulo);
    coordenadasSuavizadas.push([x, y]);
  }
  
  return coordenadasSuavizadas;
}

// Función para generar triángulo perfecto con puntas afiladas
function generarTrianguloPerfecto(vertices: [number, number][], puntosPorLado: number = 100): [number, number][] {
  if (vertices.length !== 3) return vertices;
  
  const [v1, v2, v3] = vertices;
  const coordenadas: [number, number][] = [];
  
  // Lado 1: v1 -> v2 (incluyendo v1 pero no v2)
  for (let i = 0; i < puntosPorLado; i++) {
    const t = i / puntosPorLado;
    const x = v1[0] + (v2[0] - v1[0]) * t;
    const y = v1[1] + (v2[1] - v1[1]) * t;
    coordenadas.push([x, y]);
  }
  
  // Lado 2: v2 -> v3 (incluyendo v2 pero no v3)
  for (let i = 0; i < puntosPorLado; i++) {
    const t = i / puntosPorLado;
    const x = v2[0] + (v3[0] - v2[0]) * t;
    const y = v2[1] + (v3[1] - v2[1]) * t;
    coordenadas.push([x, y]);
  }
  
  // Lado 3: v3 -> v1 (incluyendo v3 pero no v1)
  for (let i = 0; i < puntosPorLado; i++) {
    const t = i / puntosPorLado;
    const x = v3[0] + (v1[0] - v3[0]) * t;
    const y = v3[1] + (v1[1] - v3[1]) * t;
    coordenadas.push([x, y]);
  }
  
  return coordenadas;
}

// Función para generar estrella perfecta con puntas afiladas
function generarEstrellaPerfecta(vertices: [number, number][], puntosPorLado: number = 40): [number, number][] {
  if (vertices.length < 6) return vertices;
  
  const coordenadas: [number, number][] = [];
  
  // Generar cada lado de la estrella
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    
    // Incluir el vértice inicial
    coordenadas.push(v1);
    
    // Interpolar entre vértices
    for (let j = 1; j < puntosPorLado; j++) {
      const t = j / puntosPorLado;
      const x = v1[0] + (v2[0] - v1[0]) * t;
      const y = v1[1] + (v2[1] - v1[1]) * t;
      coordenadas.push([x, y]);
    }
  }
  
  return coordenadas;
}


function generarEspiral(
  centro: [number, number],
  radioInicial: number,
  vueltas: number,
  pasos = 160,
): [number, number][] {
  return Array.from({ length: pasos }, (_, i) => {
    const t = i / (pasos - 1);
    const ang = t * 2 * Math.PI * vueltas;  // dirección normal
    const r = radioInicial * (1 - t);       // se va cerrando
    return [
      Math.round(centro[0] - r * Math.cos(ang)),  // reflejar horizontalmente
      Math.round(centro[1] + r * Math.sin(ang)),
    ];
  });
}



export const modeloCirculo: [number, number][] = (() => {
  const totalPuntos = 300; // Muchos más puntos para máxima suavidad
  const radio = 140;
  const centroX = 490;
  const centroY = 400;

  const coordenadas = Array.from({ length: totalPuntos }, (_, i) => {
    const angulo = (i * 2 * Math.PI) / totalPuntos;
    const x = centroX + radio * Math.cos(angulo);
    const y = centroY + radio * Math.sin(angulo);
    return [x, y] as [number, number]; // Sin redondear para máxima precisión
  });
  
  // Aplicar algoritmo especializado para círculos perfectos
  return suavizarCirculo(coordenadas);
})();

export const modeloCuadrado: [number, number][] = (() => {
  // Usar muchos más puntos para líneas perfectamente suaves
  const coordenadas = [
    ...interpolarLinea([350, 260], [630, 260], 80), // Lado superior - muchos más puntos
    ...interpolarLinea([630, 260], [630, 540], 80), // Lado derecho - muchos más puntos
    ...interpolarLinea([630, 540], [350, 540], 80), // Lado inferior - muchos más puntos
    ...interpolarLinea([350, 540], [350, 260], 80), // Lado izquierdo - muchos más puntos
  ];
  
  // Aplicar suavizado múltiple para eliminar completamente las irregularidades
  return suavizarCoordenadas(coordenadas, 5, 3); // Ventana 5, 3 pasadas
})();

export const modeloTriangulo: [number, number][] = (() => {
  // Definir los 3 vértices del triángulo
  const vertices: [number, number][] = [
    [490, 240], // Vértice superior (punta)
    [630, 580], // Vértice inferior derecho
    [350, 580]  // Vértice inferior izquierdo
  ];
  
  // Generar triángulo perfecto con puntas afiladas
  return generarTrianguloPerfecto(vertices, 120); // 120 puntos por lado para máxima suavidad
})();

export const modeloEstrella: [number, number][] = (() => {
  // Definir los vértices de la estrella (puntas afiladas)
  const vertices: [number, number][] = [
    [490, 220], // Punta superior
    [520, 340], // Punto interno superior derecho
    [640, 340], // Punta derecha
    [540, 410], // Punto interno inferior derecho
    [580, 530], // Punta inferior derecha
    [490, 460], // Centro inferior
    [400, 530], // Punta inferior izquierda
    [440, 410], // Punto interno inferior izquierdo
    [340, 340], // Punta izquierda
    [460, 340]  // Punto interno superior izquierdo
  ];
  
  // Generar estrella perfecta con puntas afiladas
  return generarEstrellaPerfecta(vertices, 50); // 50 puntos por lado para máxima suavidad
})();

export const modeloFlecha: [number, number][] = (() => {
  // Definir los vértices de la flecha para esquinas perfectas
  const vertices: [number, number][] = [
    [490, 200], // Punta superior
    [630, 400], // Esquina superior derecha
    [560, 400], // Base derecha
    [560, 580], // Esquina inferior derecha
    [420, 580], // Esquina inferior izquierda
    [420, 400], // Base izquierda
    [350, 400]  // Esquina superior izquierda
  ];
  
  // Generar flecha con esquinas perfectas
  const coordenadas: [number, number][] = [];
  
  // Conectar vértices con líneas suaves pero preservando esquinas
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    
    // Incluir el vértice inicial
    coordenadas.push(v1);
    
    // Interpolar entre vértices
    const puntos = i % 2 === 0 ? 100 : 30; // Más puntos para lados largos, menos para bases
    for (let j = 1; j < puntos; j++) {
      const t = j / puntos;
      const x = v1[0] + (v2[0] - v1[0]) * t;
      const y = v1[1] + (v2[1] - v1[1]) * t;
      coordenadas.push([x, y]);
    }
  }
  
  // Aplicar suavizado que preserva esquinas
  return suavizarCoordenadas(coordenadas, 4, 2, true); // Preservar esquinas
})();

export const modeloPacman: [number, number][] = (() => {
  const cx = 490, cy = 400, r = 140;
  const mouthAngleDeg = 42;     // apertura de la boca
  const rotDeg = 0;             // 0 mira a la derecha
  const rot = rotDeg * Math.PI / 180;
  const half = (mouthAngleDeg / 2) * Math.PI / 180;

  // Extremos EXACTOS de la boca sobre el círculo
  const mouthTop: [number, number] =
    [cx + r * Math.cos(rot + half),      cy + r * Math.sin(rot + half)];
  const mouthBottom: [number, number] =
    [cx + r * Math.cos(rot - half + 2*Math.PI), cy + r * Math.sin(rot - half + 2*Math.PI)];

  // Arco visible (sin cuña). Sin suavizado posterior.
  const start = rot + half;
  const end   = rot - half + 2 * Math.PI; // wrap 0..2π
  const samplesArc = 720;                  // 0.5° por punto → muy liso
  const arco: [number, number][] = [];
  for (let i = 0; i <= samplesArc; i++) {
    const t = start + (i / samplesArc) * (end - start);
    arco.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  // anclar extremos del arco a la boca exacta
  arco[0] = mouthTop;
  arco[arco.length - 1] = mouthBottom;

  // VERSIÓN ULTRA-ESTRICTA: Bordes de la boca con MÚLTIPLES puntos colineales
  // para forzar líneas perfectamente rectas
  const puntosBordeInferior: [number, number][] = [];
  const puntosBordeSuperior: [number, number][] = [];
  
  // 20 puntos colineales para el borde inferior (bottom -> centro)
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = mouthBottom[0] + ([cx, cy][0] - mouthBottom[0]) * t;
    const y = mouthBottom[1] + ([cx, cy][1] - mouthBottom[1]) * t;
    puntosBordeInferior.push([x, y]);
  }
  
  // 20 puntos colineales para el borde superior (centro -> top)
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = [cx, cy][0] + (mouthTop[0] - [cx, cy][0]) * t;
    const y = [cx, cy][1] + (mouthTop[1] - [cx, cy][1]) * t;
    puntosBordeSuperior.push([x, y]);
  }

  // Ensamblado final (IMPORTANTE: no aplicar suavizado al resultado)
  return [
    mouthTop,
    ...arco.slice(1),                    // arco del círculo
    ...puntosBordeInferior.slice(1),     // recta bottom -> centro (20 puntos colineales)
    ...puntosBordeSuperior.slice(1),     // recta centro -> top (20 puntos colineales)
  ];
})();


export const modeloInfinito: [number, number][] = (() => {
  // Coordenadas originales del infinito
  const coordenadasOriginales: [number, number][] = [
  [490, 400], [495, 403], [501, 407], [507, 411], [513, 414], [519, 418], [525, 421],
  [530, 425], [536, 428], [541, 430], [547, 433], [552, 436], [557, 438], [562, 440],
  [567, 441], [572, 442], [577, 443], [581, 444], [586, 444], [590, 444], [594, 444],
  [598, 444], [602, 443], [605, 441], [608, 440], [611, 438], [614, 436], [617, 434],
  [619, 431], [621, 428], [623, 425], [625, 422], [626, 419], [627, 415], [628, 412],
  [629, 408], [629, 404], [629, 400], [629, 397], [629, 393], [629, 389], [628, 386],
  [627, 382], [625, 379], [624, 375], [622, 372], [620, 369], [618, 367], [615, 364],
  [613, 362], [610, 360], [607, 358], [603, 357], [600, 356], [596, 355], [592, 355],
  [588, 355], [584, 355], [579, 355], [575, 356], [570, 357], [565, 359], [560, 360],
  [555, 362], [549, 365], [544, 367], [539, 370], [533, 373], [527, 376], [522, 379],
  [516, 383], [510, 386], [504, 390], [498, 394], [492, 398], [487, 401], [481, 405],
  [475, 409], [469, 413], [463, 416], [457, 420], [452, 423], [446, 426], [440, 429],
  [435, 432], [430, 434], [424, 437], [419, 439], [414, 440], [409, 442], [404, 443],
  [400, 444], [395, 444], [391, 444], [387, 444], [383, 444], [379, 443], [376, 442],
  [372, 441], [369, 439], [366, 437], [364, 435], [361, 432], [359, 430], [357, 427],
  [355, 424], [354, 420], [352, 417], [351, 413], [350, 410], [350, 406], [350, 402],
  [350, 399], [350, 395], [350, 391], [351, 387], [352, 384], [353, 380], [354, 377],
  [356, 374], [358, 371], [360, 368], [362, 365], [365, 363], [368, 361], [371, 359],
  [374, 358], [377, 356], [381, 355], [385, 355], [389, 355], [393, 355], [398, 355],
  [402, 356], [407, 357], [412, 358], [417, 359], [422, 361], [427, 363], [432, 366],
  [438, 369], [443, 371], [449, 374], [454, 378], [460, 381], [466, 385], [472, 388],
  [478, 392], [484, 396], [489, 400]
];

  // Suavizado ligero para mantener la forma del infinito
  return suavizarCoordenadas(coordenadasOriginales, 2);
})();

export const modeloArbol: [number, number][] = (() => {
  // Coordenadas originales del árbol
  const coordenadasOriginales: [number, number][] = [
  [446, 599], [457, 599], [469, 599], [481, 599], [493, 599], [505, 599], [517, 599],
  [529, 599], [535, 593], [534, 582], [532, 570], [531, 558], [530, 546], [529, 534],
  [527, 523], [526, 511], [525, 499], [535, 498], [547, 498], [559, 498], [571, 498],
  [582, 498], [594, 498], [606, 498], [618, 494], [629, 491], [641, 488], [652, 485],
  [661, 477], [668, 468], [676, 459], [683, 450], [691, 440], [698, 431], [701, 420],
  [701, 408], [702, 396], [702, 384], [698, 373], [694, 362], [689, 352], [680, 343],
  [672, 335], [663, 327], [653, 322], [642, 317], [631, 312], [620, 307], [611, 300],
  [607, 289], [604, 278], [600, 266], [597, 255], [593, 244], [587, 234], [579, 225],
  [571, 216], [564, 207], [553, 202], [542, 197], [532, 192], [521, 187], [510, 183],
  [498, 183], [486, 183], [474, 183], [462, 183], [452, 188], [441, 193], [430, 198],
  [419, 204], [411, 212], [402, 220], [395, 229], [391, 240], [387, 251], [383, 262],
  [379, 274], [375, 285], [371, 296], [365, 306], [354, 311], [343, 316], [333, 321],
  [322, 326], [311, 331], [303, 339], [295, 348], [288, 357], [283, 368], [279, 380],
  [277, 391], [279, 403], [280, 414], [282, 426], [284, 438], [290, 447], [299, 456],
  [307, 464], [315, 473], [324, 481], [333, 488], [344, 492], [356, 495], [367, 497],
  [379, 497], [391, 496], [403, 495], [415, 494], [426, 493], [438, 493], [449, 497],
  [456, 504], [455, 516], [453, 528], [452, 539], [451, 551], [449, 563], [448, 575],
  [447, 587]
];
  
  // Suavizado ligero para mantener la forma del árbol
  return suavizarCoordenadas(coordenadasOriginales, 2);
})();



export const modeloNube: [number, number][] = (() => {
  // Coordenadas originales de la nube
  const coordenadasOriginales: [number, number][] = [
  [231, 395], [235, 385], [240, 375], [245, 364], [252, 356], [260, 348], [268, 340],
  [278, 334], [289, 331], [300, 328], [310, 325], [321, 323], [333, 325], [344, 327],
  [355, 328], [364, 326], [369, 316], [374, 305], [378, 295], [385, 286], [392, 277],
  [400, 269], [407, 260], [416, 253], [426, 248], [437, 243], [447, 238], [457, 233],
  [468, 233], [480, 232], [491, 231], [502, 230], [514, 230], [524, 235], [534, 240],
  [545, 245], [555, 249], [565, 254], [576, 259], [584, 267], [591, 275], [599, 284],
  [606, 292], [611, 303], [616, 313], [620, 323], [625, 334], [635, 335], [646, 335],
  [658, 334], [669, 334], [680, 335], [690, 340], [701, 344], [711, 349], [720, 355],
  [727, 364], [734, 374], [740, 383], [747, 392], [749, 403], [750, 414], [751, 426],
  [752, 437], [749, 448], [745, 458], [740, 468], [735, 479], [729, 488], [720, 495],
  [712, 503], [702, 508], [691, 512], [680, 516], [669, 517], [658, 517], [647, 517],
  [635, 517], [624, 518], [613, 517], [601, 517], [590, 518], [578, 518], [567, 517],
  [556, 517], [544, 517], [533, 517], [522, 517], [510, 517], [499, 517], [487, 517],
  [476, 517], [465, 517], [453, 517], [442, 517], [431, 517], [419, 517], [408, 517],
  [396, 517], [385, 517], [374, 517], [362, 517], [351, 517], [340, 517], [328, 517],
  [317, 517], [306, 517], [295, 513], [284, 509], [274, 504], [265, 497], [257, 489],
  [249, 481], [242, 473], [238, 462], [234, 451], [230, 441], [229, 430], [229, 418],
  [230, 407]
];
  
  // Suavizado ligero para mantener la forma de la nube
  return suavizarCoordenadas(coordenadasOriginales, 2);
})();



export const modelos: Record<string, [number, number][]> = {
  circulo: modeloCirculo,
  cuadrado: modeloCuadrado,
  triangulo: modeloTriangulo,
  estrella: modeloEstrella,
  flecha: modeloFlecha,
  pacman: modeloPacman,
  infinito: modeloInfinito,
  arbol: modeloArbol,
  nube: modeloNube,
};

export const modeloMontana: [number, number][] = [
  [33, 386],  [55, 364],  [79, 339],  [101, 316], [123, 293],
  [146, 270], [168, 293], [190, 316], [212, 339], [234, 362],
  [257, 385], [279, 362], [301, 339], [323, 316], [345, 293],
  [368, 270], [390, 293], [412, 316], [434, 339], [457, 362],
  [479, 385], [501, 362], [523, 339], [545, 316], [567, 293],
  [590, 270], [612, 293], [634, 316], [656, 339], [679, 362],
  [701, 385], [723, 362], [745, 339], [767, 316], [789, 293],
  [812, 270], [834, 293], [856, 316], [878, 339], [901, 362],
  [923, 385]
];


export const modeloOndas: [number, number][] = Array.from({ length: 100 }, (_, i) => {
  const x = 100 + i * 6;
  const y = 400 + Math.sin(i * 0.3) * 40;
  return [x, Math.round(y)];
});
export const modeloOla: [number, number][] = [
  // 1. Comienza en la parte inferior izquierda y sube hasta la cresta
  [37, 847],
  [194, 691],
  [373, 333],
  [511, 242],
  [648, 215],

  // 2. Conecta con el rizo y baja por su borde exterior
  [844, 291],
  [1024, 564],

  // 3. Dibuja la curva completa del rizo hasta la punta final
  [1007, 595],
  [852, 496],
  [716, 514],
  [651, 633],
  [695, 741],
  [869, 830],
  [1079, 786] // Punto final del trazo
];

export const modeloPunteagudo: [number, number][] = [
  ...interpolarLinea([100, 500], [200, 300], 10),
  ...interpolarLinea([200, 300], [300, 500], 10),
  ...interpolarLinea([300, 500], [400, 300], 10),
  ...interpolarLinea([400, 300], [500, 500], 10),
  ...interpolarLinea([500, 500], [600, 300], 10),
  ...interpolarLinea([600, 300], [700, 500], 10),
  ...interpolarLinea([700, 500], [800, 300], 10),
  ...interpolarLinea([800, 300], [900, 500], 10),
  ...interpolarLinea([900, 500], [1000, 300], 10),
  ...interpolarLinea([1000, 300], [1100, 500], 10),
];

export const modeloCaminoCurv: [number, number][] = Array.from({ length: 120 }, (_, i) => {
  const x = 100 + i * 5;
  const yOndulado = Math.sin(i * 0.25) * 60 * Math.sin(i * 0.1);
  const yInclinado = i * 0.7; // inclinación leve hacia arriba
  const y = 400 + yOndulado - yInclinado;
  return [x, Math.round(y)];
});

export const modeloEspiral: [number, number][] = (() => {
  const puntos: [number, number][] = [];
  const centroX = 400;
  const centroY = 350;
  const vueltas = 4;
  const puntosTotales = 200;
  const separacion = 3;

  for (let i = 0; i < puntosTotales; i++) {
    const angulo = i * (Math.PI * 2 * vueltas) / puntosTotales;
    const radio = i * separacion / puntosTotales * 100;
    const x = centroX + radio * Math.cos(angulo);
    const y = centroY + radio * Math.sin(angulo);
    puntos.push([Math.round(x), Math.round(y)]);
  }

  return puntos;
})();

export const modeloCurvasE: [number, number][] = [
  [0, 55], [1, 54], [1, 54], [2, 53], [3, 52], [3, 51], [4, 50], [5, 50], [5, 49], [6, 48],
  [7, 48], [7, 47], [8, 46], [9, 45], [9, 44], [10, 44], [11, 43], [11, 42], [12, 42], [13, 41],
  [13, 40], [14, 39], [15, 38], [15, 38], [16, 37], [17, 36], [17, 36], [18, 35], [19, 34], [19, 33],
  [20, 32], [21, 32], [21, 31], [22, 30], [23, 30], [23, 29], [24, 28], [25, 27], [25, 26], [26, 26],
  [27, 25], [27, 24], [28, 24], [29, 23], [29, 22], [30, 21], [31, 20], [31, 20], [32, 19], [33, 18],
  [33, 18], [34, 17], [35, 16], [35, 15], [36, 14], [37, 14], [37, 13], [38, 12], [39, 12], [39, 11],
  [40, 10], [41, 10], [42, 10], [43, 10], [44, 10], [45, 10], [46, 10], [47, 10], [48, 10], [49, 10],
  [50, 10], [51, 10], [52, 10], [53, 10], [54, 10], [55, 10], [56, 10], [57, 10], [58, 10], [59, 10],
  [60, 10], [61, 10], [62, 10], [63, 10], [64, 10], [65, 10], [66, 10], [67, 10], [68, 10], [69, 10],
  [70, 10], [71, 10], [72, 10], [73, 10], [74, 10], [75, 10], [76, 10], [77, 10], [78, 10], [79, 10],
  [80, 10], [81, 10], [82, 10], [83, 10], [84, 10], [85, 10], [86, 10], [87, 10], [88, 10], [89, 10],
  [90, 10], [91, 10], [92, 10], [93, 10], [94, 10], [95, 10], [96, 10], [97, 10], [98, 10], [99, 10],
  [100, 10], [101, 10], [102, 10], [103, 10], [104, 10], [105, 10], [106, 10], [107, 10], [108, 10], [109, 10],
  [110, 10], [111, 10], [112, 10], [113, 10], [114, 10], [115, 10], [116, 10], [117, 10], [118, 10], [119, 10],
  [120, 10], [121, 10], [122, 10], [123, 10], [124, 10], [125, 10], [126, 10], [127, 10], [128, 10], [129, 10],
  [130, 10], [131, 10], [132, 10], [133, 10], [134, 10], [135, 10], [136, 10], [137, 10], [138, 10], [139, 10],
  [140, 10], [141, 10], [142, 10], [143, 10], [144, 10], [145, 10], [146, 10], [147, 10], [148, 10], [149, 10],
  [150, 10], [151, 10], [152, 10], [153, 10], [154, 10], [155, 10], [156, 10], [157, 10], [158, 10], [159, 10],
  [160, 10], [160, 11], [161, 12], [161, 13], [162, 14], [162, 15], [162, 16], [163, 16], [163, 17], [164, 18],
  [164, 19], [164, 20], [165, 21], [165, 22], [166, 23], [166, 24], [167, 25], [167, 26], [167, 27], [168, 27],
  [168, 28], [169, 29], [169, 30], [169, 31], [170, 32], [170, 33], [171, 34], [171, 35], [171, 36], [172, 37],
  [172, 38], [173, 38], [173, 39], [173, 40], [174, 41], [174, 42], [175, 43], [175, 44], [176, 45], [176, 46],
  [176, 47], [177, 48], [177, 49], [178, 49], [178, 50], [178, 51], [179, 52], [179, 53], [180, 54], [180, 55],
  [180, 56], [181, 57], [181, 58], [182, 59], [182, 60], [182, 61], [183, 61], [183, 62], [184, 63], [184, 64],
  [184, 65], [185, 66], [185, 67], [186, 68], [186, 69], [187, 70], [187, 71], [187, 72], [188, 72], [188, 73],
  [189, 74], [189, 75], [189, 76], [190, 77], [190, 78], [191, 79], [191, 80], [191, 81], [192, 82], [192, 83],
  [193, 83], [193, 84], [193, 85], [194, 86], [194, 87], [195, 88], [195, 89], [196, 90], [196, 91], [196, 92],
  [197, 93], [197, 94], [198, 94], [198, 95], [198, 96], [199, 97], [199, 98], [200, 99], [200, 100], [200, 99],
  [201, 98], [201, 97], [202, 96], [202, 95], [202, 94], [203, 94], [203, 93], [204, 92], [204, 91], [204, 90],
  [205, 89], [205, 88], [206, 87], [206, 86], [207, 85], [207, 84], [207, 83], [208, 83], [208, 82], [209, 81],
  [209, 80], [209, 79], [210, 78], [210, 77], [211, 76], [211, 75], [211, 74], [212, 73], [212, 72], [213, 72],
  [213, 71], [213, 70], [214, 69], [214, 68], [215, 67], [215, 66], [216, 65], [216, 64], [216, 63], [217, 62],
  [217, 61], [218, 61], [218, 60], [218, 59], [219, 58], [219, 57], [220, 56], [220, 55], [220, 54], [221, 53],
  [221, 52], [222, 51], [222, 50], [222, 49], [223, 49], [223, 48], [224, 47], [224, 46], [224, 45], [225, 44],
  [225, 43], [226, 42], [226, 41], [227, 40], [227, 39], [227, 38], [228, 38], [228, 37], [229, 36], [229, 35],
  [229, 34], [230, 33], [230, 32], [231, 31], [231, 30], [231, 29], [232, 28], [232, 27], [233, 27], [233, 26],
  [233, 25], [234, 24], [234, 23], [235, 22], [235, 21], [236, 20], [236, 19], [236, 18], [237, 17], [237, 16],
  [238, 16], [238, 15], [238, 14], [239, 13], [239, 12], [240, 11], [240, 10], [241, 10], [242, 10], [243, 10],
  [244, 10], [245, 10], [246, 10], [247, 10], [248, 10], [249, 10], [250, 10], [251, 10], [252, 10], [253, 10],
  [254, 10], [255, 10], [256, 10], [257, 10], [258, 10], [259, 10], [260, 10], [261, 10], [262, 10], [263, 10],
  [264, 10], [265, 10], [266, 10], [267, 10], [268, 10], [269, 10], [270, 10], [271, 10], [272, 10], [273, 10],
  [274, 10], [275, 10], [276, 10], [277, 10], [278, 10], [279, 10], [280, 10], [281, 10], [282, 10], [283, 10],
  [284, 10], [285, 10], [286, 10], [287, 10], [288, 10], [289, 10], [290, 10], [291, 10], [292, 10], [293, 10],
  [294, 10], [295, 10], [296, 10], [297, 10], [298, 10], [299, 10], [300, 10], [301, 10], [302, 10], [303, 10],
  [304, 10], [305, 10], [306, 10], [307, 10], [308, 10], [309, 10], [310, 10], [311, 10], [312, 10], [313, 10],
  [314, 10], [315, 10], [316, 10], [317, 10], [318, 10], [319, 10], [320, 10], [321, 10], [322, 10], [323, 10],
  [324, 10], [325, 10], [326, 10], [327, 10], [328, 10], [329, 10], [330, 10], [331, 10], [332, 10], [333, 10],
  [334, 10], [335, 10], [336, 10], [337, 10], [338, 10], [339, 10], [340, 10], [341, 10], [342, 10], [343, 10],
  [344, 10], [345, 10], [346, 10], [347, 10], [348, 10], [349, 10], [350, 10], [351, 10], [352, 10], [353, 10],
  [354, 10], [355, 10], [356, 10], [357, 10], [358, 10], [359, 10], [360, 10], [360, 11], [361, 12], [361, 13],
  [362, 14], [362, 15], [362, 16], [363, 16], [363, 17], [364, 18], [364, 19], [364, 20], [365, 21], [365, 22],
  [366, 23], [366, 24], [367, 25], [367, 26], [367, 27], [368, 27], [368, 28], [369, 29], [369, 30], [369, 31],
  [370, 32], [370, 33], [371, 34], [371, 35], [371, 36], [372, 37], [372, 38], [373, 38], [373, 39], [373, 40],
  [374, 41], [374, 42], [375, 43], [375, 44], [376, 45], [376, 46], [376, 47], [377, 48], [377, 49], [378, 49],
  [378, 50], [378, 51], [379, 52], [379, 53], [380, 54], [380, 55], [380, 56], [381, 57], [381, 58], [382, 59],
  [382, 60], [382, 61], [383, 61], [383, 62], [384, 63], [384, 64], [384, 65], [385, 66], [385, 67], [386, 68],
  [386, 69], [387, 70], [387, 71], [387, 72], [388, 72], [388, 73], [389, 74], [389, 75], [389, 76], [390, 77],
  [390, 78], [391, 79], [391, 80], [391, 81], [392, 82], [392, 83], [393, 83], [393, 84], [393, 85], [394, 86],
  [394, 87], [395, 88], [395, 89], [396, 90], [396, 91], [396, 92], [397, 93], [397, 94], [398, 94], [398, 95],
  [398, 96], [399, 97], [399, 98], [400, 99], [400, 100], [400, 99], [401, 98], [401, 97], [402, 96], [402, 95],
  [402, 94], [403, 94], [403, 93], [404, 92], [404, 91], [404, 90], [405, 89], [405, 88], [406, 87], [406, 86],
  [407, 85], [407, 84], [407, 83], [408, 83], [408, 82], [409, 81], [409, 80], [409, 79], [410, 78], [410, 77],
  [411, 76], [411, 75], [411, 74], [412, 73], [412, 72], [413, 72], [413, 71], [413, 70], [414, 69], [414, 68],
  [415, 67], [415, 66], [416, 65], [416, 64], [416, 63], [417, 62], [417, 61], [418, 61], [418, 60], [418, 59],
  [419, 58], [419, 57], [420, 56], [420, 55], [420, 54], [421, 53], [421, 52], [422, 51], [422, 50], [422, 49],
  [423, 49], [423, 48], [424, 47], [424, 46], [424, 45], [425, 44], [425, 43], [426, 42], [426, 41], [427, 40],
  [427, 39], [427, 38], [428, 38], [428, 37], [429, 36], [429, 35], [429, 34], [430, 33], [430, 32], [431, 31],
  [431, 30], [431, 29], [432, 28], [432, 27], [433, 27], [433, 26], [433, 25], [434, 24], [434, 23], [435, 22],
  [435, 21], [436, 20], [436, 19], [436, 18], [437, 17], [437, 16], [438, 16], [438, 15], [438, 14], [439, 13],
  [439, 12], [440, 11], [440, 10], [441, 10], [442, 10], [443, 10], [444, 10], [445, 10], [446, 10], [447, 10],
  [448, 10], [449, 10], [450, 10], [451, 10], [452, 10], [453, 10], [454, 10], [455, 10], [456, 10], [457, 10],
  [458, 10], [459, 10], [460, 10], [461, 10], [462, 10], [463, 10], [464, 10], [465, 10], [466, 10], [467, 10],
  [468, 10], [469, 10], [470, 10], [471, 10], [472, 10], [473, 10], [474, 10], [475, 10], [476, 10], [477, 10],
  [478, 10], [479, 10], [480, 10], [481, 10], [482, 10], [483, 10], [484, 10], [485, 10], [486, 10], [487, 10],
  [488, 10], [489, 10], [490, 10], [491, 10], [492, 10], [493, 10], [494, 10], [495, 10], [496, 10], [497, 10],
  [498, 10], [499, 10], [500, 10], [501, 10], [502, 10], [503, 10], [504, 10], [505, 10], [506, 10], [507, 10],
  [508, 10], [509, 10], [510, 10], [511, 10], [512, 10], [513, 10], [514, 10], [515, 10], [516, 10], [517, 10],
  [518, 10], [519, 10], [520, 10], [521, 10], [522, 10], [523, 10], [524, 10], [525, 10], [526, 10], [527, 10],
  [528, 10], [529, 10], [530, 10], [531, 10], [532, 10], [533, 10], [534, 10], [535, 10], [536, 10], [537, 10],
  [538, 10], [539, 10], [540, 10], [541, 10], [542, 10], [543, 10], [544, 10], [545, 10], [546, 10], [547, 10],
  [548, 10], [549, 10], [550, 10], [551, 10], [552, 10], [553, 10], [554, 10], [555, 10], [556, 10], [557, 10],
  [558, 10], [559, 10], [560, 10], [560, 11], [561, 12], [561, 13], [562, 14], [562, 15], [562, 16], [563, 16],
  [563, 17], [564, 18], [564, 19], [564, 20], [565, 21], [565, 22], [566, 23], [566, 24], [567, 25], [567, 26],
  [567, 27], [568, 27], [568, 28], [569, 29], [569, 30], [569, 31], [570, 32], [570, 33], [571, 34], [571, 35],
  [571, 36], [572, 37], [572, 38], [573, 38], [573, 39], [573, 40], [574, 41], [574, 42], [575, 43], [575, 44],
  [576, 45], [576, 46], [576, 47], [577, 48], [577, 49], [578, 49], [578, 50], [578, 51], [579, 52], [579, 53],
  [580, 54], [580, 55], [580, 56], [581, 57], [581, 58], [582, 59], [582, 60], [582, 61], [583, 61], [583, 62],
  [584, 63], [584, 64], [584, 65], [585, 66], [585, 67], [586, 68], [586, 69], [587, 70], [587, 71], [587, 72],
  [588, 72], [588, 73], [589, 74], [589, 75], [589, 76], [590, 77], [590, 78], [591, 79], [591, 80], [591, 81],
  [592, 82], [592, 83], [593, 83], [593, 84], [593, 85], [594, 86], [594, 87], [595, 88], [595, 89], [596, 90],
  [596, 91], [596, 92], [597, 93], [597, 94], [598, 94], [598, 95], [598, 96], [599, 97], [599, 98], [600, 99],
  [600, 100], [600, 99], [601, 98], [601, 97], [602, 96], [602, 95], [602, 94], [603, 94], [603, 93], [604, 92],
  [604, 91], [604, 90], [605, 89], [605, 88], [606, 87], [606, 86], [607, 85], [607, 84], [607, 83], [608, 83],
  [608, 82], [609, 81], [609, 80], [609, 79], [610, 78], [610, 77], [611, 76], [611, 75], [611, 74], [612, 73],
  [612, 72], [613, 72], [613, 71], [613, 70], [614, 69], [614, 68], [615, 67], [615, 66], [616, 65], [616, 64],
  [616, 63], [617, 62], [617, 61], [618, 61], [618, 60], [618, 59], [619, 58], [619, 57], [620, 56], [620, 55],
  [620, 54], [621, 53], [621, 52], [622, 51], [622, 50], [622, 49], [623, 49], [623, 48], [624, 47], [624, 46],
  [624, 45], [625, 44], [625, 43], [626, 42], [626, 41], [627, 40], [627, 39], [627, 38], [628, 38], [628, 37],
  [629, 36], [629, 35], [629, 34], [630, 33], [630, 32], [631, 31], [631, 30], [631, 29], [632, 28], [632, 27],
  [633, 27], [633, 26], [633, 25], [634, 24], [634, 23], [635, 22], [635, 21], [636, 20], [636, 19], [636, 18],
  [637, 17], [637, 16], [638, 16], [638, 15], [638, 14], [639, 13], [639, 12], [640, 11], [640, 10], [641, 10],
  [642, 10], [643, 10], [644, 10], [645, 10], [646, 10], [647, 10], [648, 10], [649, 10], [650, 10], [651, 10],
  [652, 10], [653, 10], [654, 10], [655, 10], [656, 10], [657, 10], [658, 10], [659, 10], [660, 10], [661, 10],
  [662, 10], [663, 10], [664, 10], [665, 10], [666, 10], [667, 10], [668, 10], [669, 10], [670, 10], [671, 10],
  [672, 10], [673, 10], [674, 10], [675, 10], [676, 10], [677, 10], [678, 10], [679, 10], [680, 10], [681, 10],
  [682, 10], [683, 10], [684, 10], [685, 10], [686, 10], [687, 10], [688, 10], [689, 10], [690, 10], [691, 10],
  [692, 10], [693, 10], [694, 10], [695, 10], [696, 10], [697, 10], [698, 10], [699, 10], [700, 10], [701, 10],
  [702, 10], [703, 10], [704, 10], [705, 10], [706, 10], [707, 10], [708, 10], [709, 10], [710, 10], [711, 10],
  [712, 10], [713, 10], [714, 10], [715, 10], [716, 10], [717, 10], [718, 10], [719, 10], [720, 10], [721, 10],
  [722, 10], [723, 10], [724, 10], [725, 10], [726, 10], [727, 10], [728, 10], [729, 10], [730, 10], [731, 10],
  [732, 10], [733, 10], [734, 10], [735, 10], [736, 10], [737, 10], [738, 10], [739, 10], [740, 10], [741, 10],
  [742, 10], [743, 10], [744, 10], [745, 10], [746, 10], [747, 10], [748, 10], [749, 10], [750, 10], [751, 10],
  [752, 10], [753, 10], [754, 10], [755, 10], [756, 10], [757, 10], [758, 10], [759, 10], [760, 10], [760, 11],
  [761, 12], [761, 13], [762, 14], [762, 15], [762, 16], [763, 16], [763, 17], [764, 18], [764, 19], [764, 20],
  [765, 21], [765, 22], [766, 23], [766, 24], [767, 25], [767, 26], [767, 27], [768, 27], [768, 28], [769, 29],
  [769, 30], [769, 31], [770, 32], [770, 33], [771, 34], [771, 35], [771, 36], [772, 37], [772, 38], [773, 38],
  [773, 39], [773, 40], [774, 41], [774, 42], [775, 43], [775, 44], [776, 45], [776, 46], [776, 47], [777, 48],
  [777, 49], [778, 49], [778, 50], [778, 51], [779, 52], [779, 53], [780, 54], [780, 55], [780, 56], [781, 57],
  [781, 58], [782, 59], [782, 60], [782, 61], [783, 61], [783, 62], [784, 63], [784, 64], [784, 65], [785, 66],
  [785, 67], [786, 68], [786, 69], [787, 70], [787, 71], [787, 72], [788, 72], [788, 73], [789, 74], [789, 75],
  [789, 76], [790, 77], [790, 78], [791, 79], [791, 80], [791, 81], [792, 82], [792, 83], [793, 83], [793, 84],
  [793, 85], [794, 86], [794, 87], [795, 88], [795, 89], [796, 90], [796, 91], [796, 92], [797, 93], [797, 94],
  [798, 94], [798, 95], [798, 96], [799, 97], [799, 98], [800, 99], [800, 100], [800, 99], [801, 98], [801, 97],
  [802, 96], [802, 95], [802, 94], [803, 94], [803, 93], [804, 92], [804, 91], [804, 90], [805, 89], [805, 88],
  [806, 87], [806, 86], [807, 85], [807, 84], [807, 83], [808, 83], [808, 82], [809, 81], [809, 80], [809, 79],
  [810, 78], [810, 77], [811, 76], [811, 75], [811, 74], [812, 73], [812, 72], [813, 72], [813, 71], [813, 70],
  [814, 69], [814, 68], [815, 67], [815, 66], [816, 65], [816, 64], [816, 63], [817, 62], [817, 61], [818, 61],
  [818, 60], [818, 59], [819, 58], [819, 57], [820, 56], [820, 55], [820, 54], [821, 53], [821, 52], [822, 51],
  [822, 50], [822, 49], [823, 49], [823, 48], [824, 47], [824, 46], [824, 45], [825, 44], [825, 43], [826, 42],
  [826, 41], [827, 40], [827, 39], [827, 38], [828, 38], [828, 37], [829, 36], [829, 35], [829, 34], [830, 33],
  [830, 32], [831, 31], [831, 30], [831, 29], [832, 28], [832, 27], [833, 27], [833, 26], [833, 25], [834, 24],
  [834, 23], [835, 22], [835, 21], [836, 20], [836, 19], [836, 18], [837, 17], [837, 16], [838, 16], [838, 15],
  [838, 14], [839, 13], [839, 12], [840, 11], [840, 10], [841, 10], [842, 10], [843, 10], [844, 10], [845, 10],
  [846, 10], [847, 10], [848, 10], [849, 10], [850, 10], [851, 10], [852, 10], [853, 10], [854, 10], [855, 10],
  [856, 10], [857, 10], [858, 10], [859, 10], [860, 10], [861, 10], [862, 10], [863, 10], [864, 10], [865, 10],
  [866, 10], [867, 10], [868, 10], [869, 10], [870, 10], [871, 10], [872, 10], [873, 10], [874, 10], [875, 10],
  [876, 10], [877, 10], [878, 10], [879, 10], [880, 10], [881, 10], [882, 10], [883, 10], [884, 10], [885, 10],
  [886, 10], [887, 10], [888, 10], [889, 10], [890, 10], [891, 10], [892, 10], [893, 10], [894, 10], [895, 10],
  [896, 10], [897, 10], [898, 10], [899, 10], [900, 10], [901, 10], [902, 10], [903, 10], [904, 10], [905, 10],
  [906, 10], [907, 10], [908, 10], [909, 10], [910, 10], [911, 10], [912, 10], [913, 10], [914, 10], [915, 10],
  [916, 10], [917, 10], [918, 10], [919, 10], [920, 10], [921, 10], [922, 10], [923, 10], [924, 10], [925, 10],
  [926, 10], [927, 10], [928, 10], [929, 10], [930, 10], [931, 10], [932, 10], [933, 10], [934, 10], [935, 10],
  [936, 10], [937, 10], [938, 10], [939, 10], [940, 10], [941, 10], [942, 10], [943, 10], [944, 10], [945, 10],
  [946, 10], [947, 10], [948, 10], [949, 10], [950, 10], [951, 10], [952, 10], [953, 10], [954, 10], [955, 10],
  [956, 10], [957, 10], [958, 10], [959, 10], [960, 10], [961, 11], [961, 12], [962, 12], [963, 13], [963, 14],
  [964, 14], [965, 15], [965, 16], [966, 17], [967, 18], [967, 18], [968, 19], [969, 20], [969, 20], [970, 21],
  [971, 22], [971, 23], [972, 24], [973, 24], [973, 25], [974, 26], [975, 26], [975, 27], [976, 28], [977, 29],
  [977, 30], [978, 30], [979, 31], [979, 32], [980, 32], [981, 33], [981, 34], [982, 35], [983, 36], [983, 36],
  [984, 37], [985, 38], [985, 38], [986, 39], [987, 40], [987, 41], [988, 42], [989, 42], [989, 43], [990, 44],
  [991, 44], [991, 45], [992, 46], [993, 47], [993, 48], [994, 48], [995, 49], [995, 50], [996, 50], [997, 51],
  [997, 52], [998, 53], [999, 54], [999, 54], [1000, 55],
];

export const modeloDobleEspiral: [number, number][] = (() => {
  const puntos: [number, number][] = [];

  const vueltas = 3;
  const puntosPorEspiral = 180;
  const separacion = 3;

  const centroIzqX = 250;
  const centroDerX = 850;
  const centroY = 350;

  const espiralDerecha: [number, number][] = [];

  // Espiral izquierda (centro hacia afuera)
  for (let i = 0; i < puntosPorEspiral; i++) {
    const angulo = i * (Math.PI * 2 * vueltas) / puntosPorEspiral;
    const radio = (i * separacion / puntosPorEspiral) * 100;
    const x = centroIzqX + radio * Math.cos(angulo);
    const y = centroY + radio * Math.sin(angulo);
    puntos.push([Math.round(x), Math.round(y)]);
  }

  // Generar espiral derecha por separado para conocer el primer punto
  for (let i = puntosPorEspiral - 1; i >= 0; i--) {
    const angulo = i * (Math.PI * 2 * vueltas) / puntosPorEspiral + Math.PI;
    const radio = (i * separacion / puntosPorEspiral) * 100;
    const x = centroDerX + radio * Math.cos(angulo);
    const y = centroY + radio * Math.sin(angulo);
    espiralDerecha.push([Math.round(x), Math.round(y)]);
  }

  // Línea de conexión directa entre el final del espiral izquierdo y el inicio del derecho
  const puntoFinalIzq = puntos[puntos.length - 1];
  const puntoInicioDer = espiralDerecha[0];
  const pasosConexion = 20;
  for (let i = 1; i <= pasosConexion; i++) {
    const t = i / pasosConexion;
    const x = Math.round(puntoFinalIzq[0] + (puntoInicioDer[0] - puntoFinalIzq[0]) * t);
    const y = Math.round(puntoFinalIzq[1] + (puntoInicioDer[1] - puntoFinalIzq[1]) * t);
    puntos.push([x, y]);
  }

  // Añadir espiral derecha
  puntos.push(...espiralDerecha);

  return puntos;
})();



// Escala multiplicada (1.5x por ejemplo)
export const modeloZigzagEspiral: [number, number][] = [
  // 1) Zig-zag (3 picos) más grandes
  ...interpolarLinea([150, 825], [300, 645], 10),  // ➚
  ...interpolarLinea([300, 645], [450, 825], 10),  // ➘
  ...interpolarLinea([450, 825], [600, 645], 10),  // ➚
  ...interpolarLinea([600, 645], [750, 825], 10),  // ➘

  // 2) Subida más larga hasta la “meseta”
  ...interpolarLinea([750, 825], [750, 480], 12),

  // 3) Tramo oblicuo más largo hacia la base del espiral
  ...interpolarLinea([750, 480], [975, 630], 14),

  // 4) Espiral exterior → interior (giro horizontal a la izquierda, más grande)
  ...generarEspiral([1200, 630], 210, 2.75),
];



// Mapa de modelos exportado
export const modelosTrazado: Record<string, [number, number][]> = {
  montaña: modeloMontana,
  ondas: modeloOndas,
  ola: modeloOla,
  punteagudo: modeloPunteagudo,
  caminocurva: modeloCaminoCurv,
  espiral: modeloEspiral,
  curvasE: modeloCurvasE,
  doble_espiral: modeloDobleEspiral,
  zigzag_espiral: modeloZigzagEspiral,
};

// ===== MODELOS PARA COORDINACIÓN MOTRIZ =====

// Nivel 1: Ejercicios básicos de coordinación
export const modeloLineasHorizontales: [number, number][] = (() => {
  const puntos: [number, number][] = [];
  const centroY = 200;
  const inicioX = 150;
  const finX = 450;
  
  // Solo una línea horizontal simple
  const lineaPuntos = interpolarLinea([inicioX, centroY], [finX, centroY], 30);
  puntos.push(...lineaPuntos);
  
  return puntos;
})();

export const modeloLineasVerticales: [number, number][] = (() => {
  const puntos: [number, number][] = [];
  const centroX = 300;
  const inicioY = 150;
  const finY = 450;
  
  // Solo una línea vertical simple
  const lineaPuntos = interpolarLinea([centroX, inicioY], [centroX, finY], 30);
  puntos.push(...lineaPuntos);
  
  return puntos;
})();

export const modeloLineasDiagonales: [number, number][] = (() => {
  const puntos: [number, number][] = [];
  const inicioX = 150;
  const inicioY = 150;
  const finX = 450;
  const finY = 350;
  
  // Solo una línea diagonal simple
  const lineaPuntos = interpolarLinea([inicioX, inicioY], [finX, finY], 30);
  puntos.push(...lineaPuntos);
  
  return puntos;
})();



// Modelos para los nuevos ejercicios de coordinación motriz
export const modeloLineaX: [number, number][] = (() => {
  const puntos: [number, number][] = [];
  const centroX = 490;
  const centroY = 400;
  const radio = 140; // Mismo radio que el círculo para consistencia
  
  // Primera diagonal: de arriba-izquierda a abajo-derecha
  const diagonal1 = interpolarLinea(
    [centroX - radio, centroY - radio], 
    [centroX + radio, centroY + radio], 
    80 // Más puntos para mayor suavidad, igual que otras figuras
  );
  puntos.push(...diagonal1);
  
  // Segunda diagonal: de abajo-izquierda a arriba-derecha
  const diagonal2 = interpolarLinea(
    [centroX - radio, centroY + radio], 
    [centroX + radio, centroY - radio], 
    80 // Más puntos para mayor suavidad, igual que otras figuras
  );
  puntos.push(...diagonal2);
  
  return puntos;
})();

export const modeloCruz: [number, number][] = (() => {
  const puntos: [number, number][] = [];
  const centroX = 490;
  const centroY = 400;
  const longitud = 150;
  
  // Brazo horizontal: de izquierda a derecha
  const brazoHorizontal = interpolarLinea(
    [centroX - longitud, centroY],
    [centroX + longitud, centroY],
    80
  );
  puntos.push(...brazoHorizontal);
  
  // Brazo vertical: de arriba a abajo
  const brazoVertical = interpolarLinea(
    [centroX, centroY - longitud],
    [centroX, centroY + longitud],
    80
  );
  puntos.push(...brazoVertical);
  
  return puntos;
})();

// Mapa de modelos para coordinación motriz
export const modelosCoordinacion: Record<string, [number, number][]> = {
  lineas_horizontales: modeloLineasHorizontales,
  lineas_verticales: modeloLineasVerticales,
  lineas_diagonales: modeloLineasDiagonales,
  circulo: modeloCirculo,
  cuadrado: modeloCuadrado,
  linea_x: modeloLineaX,
  triangulo: modeloTriangulo,
  cruz: modeloCruz,
};