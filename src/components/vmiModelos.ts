export type Punto = { x: number; y: number };

// Utilidades para generar figuras base en un espacio (w x h)
const linea = (x1: number, y1: number, x2: number, y2: number): Punto[] => {
  const n = 40;
  const pts: Punto[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
  }
  return pts;
};

const circulo = (cx: number, cy: number, r: number): Punto[] => {
  const n = 160;
  const pts: Punto[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
};

export const poligono = (cx: number, cy: number, r: number, lados: number, rot = -Math.PI / 2): Punto[] => {
  const pts: Punto[] = [];
  for (let i = 0; i <= lados; i++) {
    const a = rot + (i / lados) * Math.PI * 2;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
};

const cuadrado = (cx: number, cy: number, lado: number): Punto[] => {
  const half = lado / 2;
  const p1 = { x: cx - half, y: cy - half };
  const p2 = { x: cx + half, y: cy - half };
  const p3 = { x: cx + half, y: cy + half };
  const p4 = { x: cx - half, y: cy + half };
  return [
    ...linea(p1.x, p1.y, p2.x, p2.y),
    ...linea(p2.x, p2.y, p3.x, p3.y),
    ...linea(p3.x, p3.y, p4.x, p4.y),
    ...linea(p4.x, p4.y, p1.x, p1.y)
  ];
};

const triangulo = (cx: number, cy: number, lado: number, invertido = false): Punto[] => {
  const altura = lado * Math.sqrt(3) / 2;
  const dir = invertido ? -1 : 1;
  const v1 = { x: cx, y: cy - (altura / 2) * dir };
  const v2 = { x: cx + lado / 2, y: cy + (altura / 2) * dir };
  const v3 = { x: cx - lado / 2, y: cy + (altura / 2) * dir };
  return [
    ...linea(v1.x, v1.y, v2.x, v2.y),
    ...linea(v2.x, v2.y, v3.x, v3.y),
    ...linea(v3.x, v3.y, v1.x, v1.y)
  ];
};

const rombo = (cx: number, cy: number, w: number, h: number): Punto[] => {
  const p1 = { x: cx, y: cy - h / 2 };
  const p2 = { x: cx + w / 2, y: cy };
  const p3 = { x: cx, y: cy + h / 2 };
  const p4 = { x: cx - w / 2, y: cy };
  return [
    ...linea(p1.x, p1.y, p2.x, p2.y),
    ...linea(p2.x, p2.y, p3.x, p3.y),
    ...linea(p3.x, p3.y, p4.x, p4.y),
    ...linea(p4.x, p4.y, p1.x, p1.y)
  ];
};

// Versiones de figuras compuestas en múltiples trazos
const cruzMulti = (w: number, h: number): Punto[][] => {
  return [
    linea(w / 2, h * 0.2, w / 2, h * 0.8),
    linea(w * 0.2, h / 2, w * 0.8, h / 2),
  ];
};

const equisMulti = (w: number, h: number): Punto[][] => [
  linea(w * 0.2, h * 0.2, w * 0.8, h * 0.8),
  linea(w * 0.8, h * 0.2, w * 0.2, h * 0.8),
];

// Versión multi-trazo de los ejercicios
export const VMI_EJERCICIOS_1 = [
  {
    id: 7,
    nombre: 'Línea vertical', figura: 'linea',
    generarMulti: (w: number, h: number): Punto[][] => [linea(w/2, h*0.2, w/2, h*0.8)]
  },
  {
    id: 8,
    nombre: 'Línea horizontal', figura: 'linea',
    generarMulti: (w: number, h: number): Punto[][] => [linea(w*0.2, h/2, w*0.8, h/2)]
  },
  {
    id: 9,
    nombre: 'Círculo', figura: 'circulo',
    generarMulti: (w: number, h: number): Punto[][] => [circulo(w/2, h/2, Math.min(w,h)*0.3)]
  },
  {
    id: 10,
    nombre: 'Cruz (+)', figura: 'cruz',
    generarMulti: (w: number, h: number): Punto[][] => cruzMulti(w, h)
  },
  {
    id: 11,
    nombre: 'Diagonal derecha (/)', figura: 'linea',
    generarMulti: (w: number, h: number): Punto[][] => [linea(w*0.2, h*0.8, w*0.8, h*0.2)]
  },
  {
    id: 12,
    nombre: 'Cuadrado', figura: 'cuadrado',
    generarMulti: (w: number, h: number): Punto[][] => [cuadrado(w/2, h/2, Math.min(w,h)*0.5)]
  },
  {
    id: 13,
    nombre: 'Diagonal izquierda (\\)', figura: 'linea',
    generarMulti: (w: number, h: number): Punto[][] => [linea(w*0.2, h*0.2, w*0.8, h*0.8)]
  },
  {
    id: 14,
    nombre: 'Equis (X)', figura: 'x',
    generarMulti: (w: number, h: number): Punto[][] => equisMulti(w, h)
  },
  {
    id: 15,
    nombre: 'Triángulo', figura: 'triangulo',
    generarMulti: (w: number, h: number): Punto[][] => [triangulo(w/2, h/2, Math.min(w,h)*0.5)]
  },
  {
    id: 16,
    nombre: 'Figura abierta con círculo adjunto',
    figura: 'abierta_circulo',
    generarMulti: (w: number, h: number): Punto[][] => {
      const r = Math.min(w, h) * 0.22;

      const cx = w * 0.4;
      const cy = h * 0.5;

      // "Cuadrado sin tapa": dos verticales + horizontal inferior
      const l1 = linea(cx - r, cy - r, cx - r, cy + r);      // vertical izquierda
      const l3 = linea(cx + r, cy - r, cx + r, cy + r);      // vertical derecha
      const l2 = linea(cx - r, cy + r, cx + r, cy + r);      // horizontal inferior

      // Círculo que sale de la esquina inferior derecha
      const rc = r * 0.6;                                    // radio del círculo
      const cornerX = cx + r;                                // x esquina inferior derecha
      const cornerY = cy + r;                                // y esquina inferior derecha

      // Centro del círculo en diagonal abajo-derecha, para que la esquina toque el borde
      const c = circulo(
        cornerX + rc / Math.SQRT2,
        cornerY + rc / Math.SQRT2,
        rc
      );

      return [l1, l3, l2, c];
    }
  },
  {
    id: 17,
    nombre: 'Estrella simple', figura: 'estrella_simple',
    generarMulti: (w: number, h: number): Punto[][] => {
        const c = cruzMulti(w, h);
        const x = equisMulti(w, h);
        return [...c, ...x];
    }
  },
  {
    id: 18,
    nombre: 'Cruz direccional con flechas', figura: 'cruz_flechas',
    generarMulti: (w: number, h: number): Punto[][] => {
        const base = cruzMulti(w, h);
        const s = Math.min(w,h)*0.05;
        // Top
        const t = {x: w/2, y: h*0.2};
        const at1 = linea(t.x - s, t.y + s, t.x, t.y);
        const at2 = linea(t.x + s, t.y + s, t.x, t.y);
        // Bottom
        const b = {x: w/2, y: h*0.8};
        const ab1 = linea(b.x - s, b.y - s, b.x, b.y);
        const ab2 = linea(b.x + s, b.y - s, b.x, b.y);
        // Left
        const l = {x: w*0.2, y: h/2};
        const al1 = linea(l.x + s, l.y - s, l.x, l.y);
        const al2 = linea(l.x + s, l.y + s, l.x, l.y);
        // Right
        const r = {x: w*0.8, y: h/2};
        const ar1 = linea(r.x - s, r.y - s, r.x, r.y);
        const ar2 = linea(r.x - s, r.y + s, r.x, r.y);
        return [...base, at1, at2, ab1, ab2, al1, al2, ar1, ar2];
    }
  },
  {
    id: 19,
    nombre: 'Tres círculos superpuestos', figura: '3_circulos',
    generarMulti: (w: number, h: number): Punto[][] => {
      const R = Math.min(w,h)*0.18;
      const cx = w*0.45, cy = h*0.5;
      const c1 = circulo(cx, cy - R*0.6, R);
      const c2 = circulo(cx - R*0.6, cy + R*0.3, R);
      const c3 = circulo(cx + R*0.6, cy + R*0.3, R);
      return [c1, c2, c3];
    }
  },
  {
    id: 20,
    nombre: 'Patrón de puntos en triángulo',
    figura: 'puntos_triangulo',
    generarMulti: (w: number, h: number): Punto[][] => {
      const lado = Math.min(w, h) * 0.45;
      const altura = lado * Math.sqrt(3) / 2;
      const cx = w / 2, cy = h / 2;

      const v1 = { x: cx, y: cy - altura / 2 };
      const v2 = { x: cx + lado / 2, y: cy + altura / 2 };
      const v3 = { x: cx - lado / 2, y: cy + altura / 2 };

      const m1 = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
      const m2 = { x: (v2.x + v3.x) / 2, y: (v2.y + v3.y) / 2 };
      const m3 = { x: (v3.x + v1.x) / 2, y: (v3.y + v1.y) / 2 };

      // Aumentar tamaño del punto (círculo)
      const dotRadius = 12;
      const dot = (p: Punto) => circulo(p.x, p.y, dotRadius);

      return [dot(v1), dot(v2), dot(v3), dot(m1), dot(m2), dot(m3)];
    }
  },
  {
    id: 21,
    nombre: 'Círculo + Rombo',
    figura: 'circulo_rombo',
    generarMulti: (w: number, h: number): Punto[][] => {
      const r = Math.min(w, h) * 0.15;
      const cx = w / 2, cy = h / 2;

      // Centros separados solo por r → se tocan en x = cx
      const c = circulo(cx - r, cy, r);          // círculo a la izquierda
      const rm = rombo(cx + r, cy, r * 2, r * 3); // rombo a la derecha

      return [c, rm];
    }
  },
  {
    id: 22,
    nombre: 'Rombo vertical', figura: 'rombo_vertical',
    generarMulti: (w: number, h: number): Punto[][] => {
        const r = Math.min(w,h)*0.25;
        return [rombo(w/2, h/2, r*2, r*3)];
    }
  },
  {
    id: 23,
    nombre: 'Figura compuesta de triángulos',
    figura: 'triangulos_compuestos',
    generarMulti: (w: number, h: number): Punto[][] => {
      const s = Math.min(w, h) * 0.75;          // tamaño global
      const hTri = s * Math.sqrt(3) / 2;
      const cx = w / 2;
      const cy = h / 2;

      // --- TRIÁNGULO GRANDE ---
      const A = { x: cx - s * 0.45, y: cy + hTri * 0.35 };
      const B = { x: cx + s * 0.50, y: cy + hTri * 0.05 };
      const C = { x: cx + s * 0.05, y: cy - hTri * 0.55 };

      const ladoAB = linea(A.x, A.y, B.x, B.y);
      const ladoBC = linea(B.x, B.y, C.x, C.y);
      const ladoCA = linea(C.x, C.y, A.x, A.y);

      // --- TRIÁNGULO PEQUEÑO INTERNO ---
      const A2 = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };       // punto en AC
      const B2 = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };       // punto en BC
      const C2 = { x: (A.x + B.x) / 2 - s * 0.05, y: (A.y + B.y) / 2 }; // punto interno ajustado

      const t1 = linea(A2.x, A2.y, B2.x, B2.y);
      const t2 = linea(B2.x, B2.y, C2.x, C2.y);
      const t3 = linea(C2.x, C2.y, A2.x, A2.y);

      return [
        ladoAB, ladoBC, ladoCA,  // triángulo grande
        t1, t2, t3               // triángulo pequeño
      ];
    }
  },
  {
    id: 24,
    nombre: 'Patrón circular de puntos', figura: 'puntos_circular',
    generarMulti: (w: number, h: number): Punto[][] => {
        const r = Math.min(w,h)*0.25;
        const cx = w/2, cy = h/2;
        const dots: Punto[][] = [];
        for(let i=0; i<8; i++) {
            const a = (i/8)*Math.PI*2;
            dots.push(circulo(cx + r*Math.cos(a), cy + r*Math.sin(a), 3));
        }
        return dots;
    }
  },
  {
    id: 25,
    nombre: 'Polígonos entrelazados',
    figura: 'poligonos_entrelazados',
    generarMulti: (w: number, h: number): Punto[][] => {
      const cx = w / 2;
      const cy = h / 2;
      const s  = Math.min(w, h) * 0.40; // escala global

      // Helper para aplicar transformación a cualquier polígono
      const transform = (
        points: {x:number,y:number}[],
        offsetX: number,
        offsetY: number,
        angle: number
      ): Punto[] => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const pts = points.map(p => {
          const x0 = p.x * s;
          const y0 = p.y * s;

          // rotación
          const xr = x0 * cos - y0 * sin;
          const yr = x0 * sin + y0 * cos;

          return {
            x: cx + xr + offsetX * s,
            y: cy + yr + offsetY * s
          };
        });

        const segs: Punto[] = [];
        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % pts.length];
          segs.push(...linea(p1.x, p1.y, p2.x, p2.y));
        }
        return segs;
      };

      // Polígono BASE (misma forma para ambos)
      const base = [
        { x: -0.30, y:  0.50 },
        { x: -0.22, y:  0.02 },
        { x:  0.00, y: -0.50 },
        { x:  0.24, y: -0.05 },
        { x:  0.16, y:  0.45 },
        { x: -0.07, y:  0.65 }, // Punta pequeña opuesta
      ];

      //-------------------------
      // 🔹 Polígono IZQUIERDO (Apunta hacia abajo)
      //-------------------------
      // Invertimos Y para que apunte hacia abajo (y mantenemos X original o invertido según simetría)
      // Probamos con X original y Y invertido
      const baseLeft = base.map(p => ({ x: p.x, y: -p.y }));

      const left = transform(
        baseLeft,
        -0.08,     // centrado un poco a la izquierda
        0.15,      // bajado más
        0.35       // inclinado derecha
      );

      //-------------------------
      // 🔹 Polígono DERECHO (Apunta hacia arriba)
      //-------------------------
      // Usamos Y original para que apunte hacia ARRIBA (opuesto al izquierdo)
      // Y mantenemos X invertido para simetría (esto equivale a rotar 180° el izquierdo)
      const baseRight = base.map(p => ({ x: -p.x, y: p.y }));

      const right = transform(
        baseRight,
        0.32,      // más a la derecha
        -0.04,
        -0.15      // rotarlo suave hacia arriba
      );

      return [left, right];
    }
  },
  {
    id: 26,
    nombre: 'Rombo horizontal', figura: 'rombo_horizontal',
    generarMulti: (w: number, h: number): Punto[][] => {
        const r = Math.min(w,h)*0.25;
        return [rombo(w/2, h/2, r*3, r*2)];
    }
  },
  {
    id: 27,
    nombre: 'Tres círculos entrelazados dobles', figura: '3_anillos',
    generarMulti: (w: number, h: number): Punto[][] => {
      const R = Math.min(w,h)*0.2;
      const R_in = R * 0.85; // Radio interno para efecto doble línea

      // Círculo 1 (Izquierda)
      const c1o = circulo(w*0.42, h*0.5, R);
      const c1i = circulo(w*0.42, h*0.5, R_in);

      // Círculo 2 (Derecha)
      const c2o = circulo(w*0.58, h*0.5, R);
      const c2i = circulo(w*0.58, h*0.5, R_in);

      // Círculo 3 (Arriba)
      const c3o = circulo(w*0.5, h*0.36, R);
      const c3i = circulo(w*0.5, h*0.36, R_in);

      return [c1o, c1i, c2o, c2i, c3o, c3i];
    }
  },
  {
    id: 28,
    nombre: 'Cubo isométrico',
    figura: 'cubo_isometrico',
    generarMulti: (w: number, h: number): Punto[][] => {
      const s = Math.min(w, h) * 0.35;   // tamaño del cubo
      const cx = w / 2;
      const cy = h / 2;
      const half = s / 2;

      // Desplazamiento del cuadrado de atrás (arriba-derecha)
      const dx = s * 0.35;
      const dy = -s * 0.35;

      // Cuadrado frontal (F1..F4)
      const F1 = { x: cx - half, y: cy + half }; // abajo-izquierda
      const F2 = { x: cx - half, y: cy - half }; // arriba-izquierda
      const F3 = { x: cx + half, y: cy - half }; // arriba-derecha
      const F4 = { x: cx + half, y: cy + half }; // abajo-derecha

      // Cuadrado trasero (B1..B4), desplazado
      const B1 = { x: F1.x + dx, y: F1.y + dy };
      const B2 = { x: F2.x + dx, y: F2.y + dy };
      const B3 = { x: F3.x + dx, y: F3.y + dy };
      const B4 = { x: F4.x + dx, y: F4.y + dy };

      const edges: Punto[][] = [
        // Cuadrado frontal
        linea(F1.x, F1.y, F2.x, F2.y),
        linea(F2.x, F2.y, F3.x, F3.y),
        linea(F3.x, F3.y, F4.x, F4.y),
        linea(F4.x, F4.y, F1.x, F1.y),

        // Cuadrado trasero
        linea(B1.x, B1.y, B2.x, B2.y),
        linea(B2.x, B2.y, B3.x, B3.y),
        linea(B3.x, B3.y, B4.x, B4.y),
        linea(B4.x, B4.y, B1.x, B1.y),

        // Aristas que conectan frente y fondo
        linea(F1.x, F1.y, B1.x, B1.y),
        linea(F2.x, F2.y, B2.x, B2.y),
        linea(F3.x, F3.y, B3.x, B3.y),
        linea(F4.x, F4.y, B4.x, B4.y),
      ];

      return edges;
    }
  },
  {
    id: 29,
    nombre: 'Figura tipo túnel', figura: 'tunel',
    generarMulti: (w: number, h: number): Punto[][] => {
        const lado = Math.min(w,h)*0.4;
        const cx = w/2, cy = h/2;
        
        // Cuadrado exterior
        const out = cuadrado(cx, cy, lado);
        
        // Cuadrado interior (más chico y a la derecha)
        const ladoInn = lado * 0.35; 
        const cxInn = cx + lado * 0.20; // Desplazado a la derecha
        const cyInn = cy;
        const inn = cuadrado(cxInn, cyInn, ladoInn);

        // Conectar esquinas
        const half = lado / 2;
        const halfInn = ladoInn / 2;

        const c1 = linea(cx - half, cy - half, cxInn - halfInn, cyInn - halfInn); // TL
        const c2 = linea(cx + half, cy - half, cxInn + halfInn, cyInn - halfInn); // TR
        const c3 = linea(cx + half, cy + half, cxInn + halfInn, cyInn + halfInn); // BR
        const c4 = linea(cx - half, cy + half, cxInn - halfInn, cyInn + halfInn); // BL

        return [out, inn, c1, c2, c3, c4];
    }
  },
  {
    id: 30,
    nombre: 'Estrella entrelazada de seis puntas',
    figura: 'estrella_seis',
    generarMulti: (w: number, h: number): Punto[][] => {
      const cx = w / 2;
      const cy = h / 2;
      const s = Math.min(w, h);
      const R_outer = s * 0.45; 
      const R_inner = s * 0.36; // Grosor de la línea
      
      // Rotación ligera para que no quede totalmente recta
      const rot = Math.PI / 6; 

      const createTriangle = (r: number, angleOffset: number) => {
        const pts: Punto[] = [];
        for (let i = 0; i < 3; i++) {
          const a = angleOffset + rot + i * (Math.PI * 2 / 3);
          pts.push({
            x: cx + r * Math.cos(a),
            y: cy + r * Math.sin(a)
          });
        }
        // Generar líneas entre vértices
        return [
          ...linea(pts[0].x, pts[0].y, pts[1].x, pts[1].y),
          ...linea(pts[1].x, pts[1].y, pts[2].x, pts[2].y),
          ...linea(pts[2].x, pts[2].y, pts[0].x, pts[0].y)
        ];
      };

      // Triángulo 1: Apunta hacia arriba (vértice superior en -90°)
      const t1Out = createTriangle(R_outer, -Math.PI / 2);
      const t1In  = createTriangle(R_inner, -Math.PI / 2);

      // Triángulo 2: Apunta hacia abajo (vértice inferior en +90°)
      const t2Out = createTriangle(R_outer, Math.PI / 2);
      const t2In  = createTriangle(R_inner, Math.PI / 2);

      return [t1Out, t1In, t2Out, t2In];
    }
  }
];

export const getModeloVMIMulti = (id: number, w: number, h: number): Punto[][] => {
  const item = VMI_EJERCICIOS_1.find(e => e.id === id);
  return item && 'generarMulti' in item ? (item as any).generarMulti(w, h) : [];
};

// Compatibilidad: versión plana usada en otros lugares (aplana multi)
export const getModeloVMI = (id: number, w: number, h: number): Punto[] => {
  const multi = getModeloVMIMulti(id, w, h);
  return multi.flat();
};

export const getInfoVMI = (id: number) => VMI_EJERCICIOS_1.find(e => e.id === id);

