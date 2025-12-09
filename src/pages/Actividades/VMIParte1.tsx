// Reemplazo completo del archivo con una versión saneada e integrada
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DoblePizarra from '../../components/DoblePizarra';
import { getModeloVMIMulti, getInfoVMI, VMI_EJERCICIOS_1 } from '../../components/vmiModelos';
import type { Punto } from '../../components/vmiModelos';
import { evaluarTrazadoAmigableSimple, evaluarTrazadoMedicoSimple, evaluarSimilitudGeometrica } from '../../utils/evaluacionSimple';
import type { EvaluacionEscala } from '../../models/EvaluacionEscala';
import { crearEvaluacionEscala } from '../../services/evaluacionEscalaService';
import { convertirPuntaje } from '../../services/escalaService';
import { useGlobalPaciente } from '../../context/PacienteContext';
import { useSession } from '../../context/SessionContext';
import MenuEjercicio from '../../components/MenuEjercicio';
import './CopiaFigura.css';
import { vmiService } from '../../services/vmiService';

const VMIParte1: React.FC = () => {
  const navigate = useNavigate();
  const { ejercicio } = useParams<{ ejercicio: string }>();
  const id = Number(ejercicio || '7');
  const info = getInfoVMI(id);
  const { id: pacienteId, edad_mes } = useGlobalPaciente();
  const { addResult, results } = useSession();
  const [modeloMulti, setModeloMulti] = useState<Punto[][]>([]);
  const [modeloTransformado, setModeloTransformado] = useState<Punto[]>([]);
  const [, setPuntuacion] = useState<number>(0);
  const [, setPuntuacionMedica] = useState<number>(0);
  const [posicionFigura, setPosicionFigura] = useState<'izquierda' | 'derecha'>('izquierda');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [grosorLinea, setGrosorLinea] = useState(4);
  const [resetKey, setResetKey] = useState(0);
  const pizarraRef = useRef<any>(null);
  const [, setReglaError] = useState<string | null>(null);
  // Fases: intro, imitación (vertical, horizontal, círculo), luego VMI
  const [fase, setFase] = useState<'intro'|'imitacion_v'|'imitacion_h'|'imitacion_c'|'vmi'>('vmi');
  // Subfase de imitación: controlamos solo la etapa del paciente (la terapeuta viene de intro)
  const [subfase] = useState<'terapeuta'|'paciente'>('terapeuta');
  // Dibujo de terapeuta capturado en intro (multi-trazo)
  const [modeloImitacion] = useState<Punto[][]>([]);
  const [guardando, setGuardando] = useState(false);
  // Instrucción visible durante los primeros 3s en intro
  const [mostrarInstruccionIntro, setMostrarInstruccionIntro] = useState(true);
  // Etiquetas de Terapeuta y Paciente visibles durante los primeros 3s
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true);
  // Siempre iniciar en intro -> imitaciones -> VMI (sin persistir estado entre sesiones)
  useEffect(() => {
    // setFase('intro');
    // setSubfase('terapeuta');
    setFase('vmi');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const coordsModeloMultiMemo = useMemo(
    () => modeloMulti.map(stroke => stroke.map(p => [p.x, p.y] as [number, number])),
    [modeloMulti]
  );

  useEffect(() => {
    const resize = () => {
      const width = Math.max(600, Math.round((window.innerWidth || 1200) / 2));
      const height = Math.max(400, window.innerHeight || 800);
      // Seleccionar modelo según fase
      if (fase === 'intro') {
        // En intro no hay modelo: práctica libre sin convertir a figura
        setModeloMulti([]);
      } else if (fase === 'imitacion_v' || fase === 'imitacion_h' || fase === 'imitacion_c') {
        // En imitación, mostrar siempre el modelo que haya dibujado la terapeuta
        setModeloMulti(modeloImitacion);
      } else {
        setModeloMulti(getModeloVMIMulti(id, width, height));
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [id, fase, subfase, modeloImitacion]);


  const idx = useMemo(() => VMI_EJERCICIOS_1.findIndex(e => e.id === id), [id]);
  const anterior = VMI_EJERCICIOS_1[idx - 1]?.id;
  const siguiente = VMI_EJERCICIOS_1[idx + 1]?.id;

  const limpiarEjercicio = () => {
    try { pizarraRef.current?.limpiar?.(); } catch {}
    setPuntuacion(0);
    setPuntuacionMedica(0);
    setGrosorLinea(4);
    setResetKey(k => k + 1);
  };

  useEffect(() => {
    limpiarEjercicio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fase]);

  // Mostrar la instrucción en intro durante 3 segundos
  useEffect(() => {
    if (fase !== 'intro') return;
    setMostrarInstruccionIntro(true);
    const t = setTimeout(() => setMostrarInstruccionIntro(false), 3000);
    return () => clearTimeout(t);
  }, [fase]);

  // Mostrar etiquetas de Terapeuta y Paciente durante 3 segundos en intro/imitación
  useEffect(() => {
    if (fase === 'vmi') {
      setMostrarEtiquetas(false);
      return;
    }
    setMostrarEtiquetas(true);
    const t = setTimeout(() => setMostrarEtiquetas(false), 3000);
    return () => clearTimeout(t);
  }, [fase, subfase]);

  // const figuraObjetivoCanon = useMemo(() => {
  //   const nombre = info?.nombre?.toLowerCase() || '';
  //   const fig = info?.figura?.toLowerCase() || '';
  //   if (fig === 'linea' && /vertical/.test(nombre)) return 'linea_vertical';
  //   if (fig === 'linea' && /horizontal/.test(nombre)) return 'linea_horizontal';
  //   if (fig === 'circulo') return 'circulo';
  //   if (fig === 'cuadrado') return 'cuadrado';
  //   if (fig === 'triangulo') return 'triangulo';
  //   return undefined;
  // }, [info]);

  const filtrarCoordenadasAreaDibujo = (lista: Punto[], posicion: 'izquierda' | 'derecha') => {
    const pizarraWidth = window.innerWidth / 2;
    return lista.filter(({ x }) => (posicion === 'izquierda' ? x > pizarraWidth : x < pizarraWidth));
  };

  const escalarCoordenadasUsuario = (lista: Punto[], posicion: 'izquierda' | 'derecha') => {
    const pizarraWidth = window.innerWidth / 2;
    const pizarraHeight = window.innerHeight;
    return lista.map(({ x, y }) => {
      let xRel, yRel, xFinal;
      if (posicion === 'izquierda') {
        xRel = (x - pizarraWidth) / pizarraWidth;
        yRel = y / pizarraHeight;
        xFinal = xRel * pizarraWidth;
      } else {
        xRel = x / pizarraWidth;
        yRel = y / pizarraHeight;
        xFinal = xRel * pizarraWidth + pizarraWidth;
      }
      return { x: xFinal, y: yRel * pizarraHeight };
    });
  };

  // Mensajes de resultado deshabilitados según solicitud del usuario

  const evaluarAhora = async (): Promise<{ ok: boolean; motivo?: string; score?: number; med?: number }> => {
    // En fase de introducción, no evaluar
    if (fase === 'intro') return { ok: true, score: 0, med: 0 };
    // En imitación, durante subfase de terapeuta no evaluamos
    if (fase !== 'vmi' && subfase === 'terapeuta') return { ok: true, score: 0, med: 0 };
    const strokesMulti: Punto[][] = (pizarraRef.current?.getStrokes?.() as Punto[][]) || [];
    const todos = strokesMulti.flat();
    if (!todos || todos.length < 10 || modeloTransformado.length === 0) {
      setPuntuacion(0);
      setPuntuacionMedica(0);
      setReglaError(null);
      return { ok: false, motivo: 'Dibujo insuficiente para evaluar', score: 0, med: 0 };
    }
    const filtradas = filtrarCoordenadasAreaDibujo(todos, posicionFigura);
    const escaladas = escalarCoordenadasUsuario(filtradas, posicionFigura);

    // Reglas visuales desactivadas: la validación de orientación se realiza en backend
    setReglaError(null);

    const score = evaluarTrazadoAmigableSimple(escaladas, modeloTransformado, info?.figura);
    const med = evaluarTrazadoMedicoSimple(escaladas, modeloTransformado, info?.figura);
    setPuntuacion(score);
    setPuntuacionMedica(med);
    return { ok: med > 0, score, med };
  };

  const onFinishDraw = async (_stroke: Punto[]) => {
    /*
    // Capturar trazo de la terapeuta en la MISMA doble pizarra y convertirlo en modelo (lado izquierdo)
    const half = window.innerWidth / 2;
  const isTherapistPhase = (fase !== 'vmi' && subfase === 'terapeuta');
    if (!isTherapistPhase) return;
  // En intro no convertimos a modelo (evita sensación de duplicación)
  if (fase === 'intro') return;
    if (!stroke || stroke.length < 2) return;
    const avgX = stroke.reduce((s, p) => s + p.x, 0) / stroke.length;
    // Solo consideramos como modelo si el trazo está en el lado izquierdo
    if (avgX >= half) return;
    // Convertir inmediatamente a modelo y limpiar el trazo de usuario
    setModeloImitacion(prev => {
      const nuevo = [...prev, stroke];
      // 1) primero actualizamos el modelo para que DoblePizarra reciba las nuevas coords
      setModeloMulti(nuevo);
      // 2) limpiar de inmediato la capa de usuario y forzar redibujo del modelo
      try { pizarraRef.current?.limpiar?.(); } catch {}
      // 3) y repetir en el próximo frame por seguridad (evita cualquier carrera puntual)
      try {
        requestAnimationFrame(() => {
          try { pizarraRef.current?.limpiar?.(); } catch {}
        });
      } catch {
        setTimeout(() => { try { pizarraRef.current?.limpiar?.(); } catch {} }, 0);
      }
      return nuevo;
    });
    // Pasar automáticamente a subfase paciente para que sea una sola "imitación" por figura
    if (fase === 'imitacion_v' || fase === 'imitacion_h' || fase === 'imitacion_c') {
      setSubfase('paciente');
    }
    */
  };

  const guardarEvaluacion = async () => {
    if (!info) return;
    setGuardando(true);
    try {
      // 1. Evaluar localmente y obtener puntajes frescos
      const { score: localScore, med: localMed } = await evaluarAhora();
      
      // Usar los valores devueltos, no el estado (que puede no haberse actualizado aún)
      const finalScore = localScore ?? 0;
      const finalMed = localMed ?? 0;

      let vmiBackendResult: any | null = null;
      let scoreBinario = 0;
      
      // Solo intentar guardar si hay paciente
      if (pacienteId) {
        const strokesMulti: Punto[][] = (pizarraRef.current?.getStrokes?.() as Punto[][]) || [];
        const pacienteConStroke = strokesMulti.flatMap((stroke, i) => {
          const filtradas = filtrarCoordenadasAreaDibujo(stroke, posicionFigura);
          const escaladas = escalarCoordenadasUsuario(filtradas, posicionFigura);
          return escaladas.map(p => ({ ...p, stroke: i }));
        });

        try {
          const modeloConStroke = modeloTransformado.map(p => ({ ...p, stroke: 0 }));
          // En VMI usamos la figura objetivo canónica del ejercicio
          // const figuraObjetivoFase = figuraObjetivoCanon;

          // Mapeo de nombres para el backend (según solicitud)
          const mapeoNombresBackend: Record<string, string> = {
            'linea vertical': 'linea vertical',
            'linea horizontal': 'linea horizontal',
            'circulo': 'circulo',
            'cruz': 'cruz',
            'linea diagonal': 'linea diagonal',
            'cuadrado': 'cuadrado',
            'linea diagonal invertida': 'linea diagonal invertida',
            'equis (x)': 'equis (x)',
            'triangulo': 'triangulo',
            'angulo + circulo': 'angulo + circulo',
            'estrella simple': 'estrella simple',
            'cruz direccional con flechas': 'cruz direccional con flechas',
            'tres circulos superpuestos': 'tres circulos superpuestos',
            'patron de puntos en triangulo': 'patron de puntos en triangulo',
            'circulo + rombo': 'circulo + rombo',
            'rombo vertical': 'rombo vertical',
            'figura compuesta de triangulos': 'figura compuesta de triangulos',
            'patron circular de puntos': 'patron circular de puntos',
            'poligonos entrelazados': 'poligonos entrelazados',
            'rombo horizontal': 'rombo horizontal',
            'tres circulos entrelazados dobles': 'tres circulos entrelazados dobles',
            'cubo isometrico': 'cubo isometrico',
            'figura tipo tunel': 'figura tipo tunel',
            'estrella entrelazada de seis puntas': 'estrella entrelazada de seis puntas'
          };

          // Normalizar nombre para buscar en el mapa (quitar acentos y minúsculas)
          const nombreNormalizado = (info?.nombre || '')
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Eliminar diacríticos

          // Intentar buscar coincidencia exacta o parcial
          let nombreBackend = mapeoNombresBackend[nombreNormalizado];
          
          if (!nombreBackend) {
             // Fallback: buscar si alguna clave está contenida en el nombre
             const key = Object.keys(mapeoNombresBackend).find(k => nombreNormalizado.includes(k));
             if (key) nombreBackend = mapeoNombresBackend[key];
             else nombreBackend = nombreNormalizado; // Enviar tal cual si no hay match
          }

          // Solo enviar al backend si hay trazos válidos
          if (pacienteConStroke.length > 5) {
            const payload = {
              figura_objetivo: nombreBackend,
              coordenadas_paciente: pacienteConStroke,
              coordenadas_modelo: modeloConStroke,
              client_metrics: {
                puntuacion_amigable: finalScore,
                puntuacion_medica: finalMed,
              }
            };
            
            // Usar el nuevo endpoint
            vmiBackendResult = await vmiService.evaluar(payload as any); // Cast temporal si la interfaz no coincide aún
          } else {
            console.warn('⚠️ Dibujo insuficiente o vacío, omitiendo evaluación backend.');
          }
        } catch (e) {
          console.warn('⚠️ No se pudo enviar payload VMI al backend:', e);
        }

        const closedShape = vmiBackendResult?.closed_shape;
        const circleMetrics = vmiBackendResult?.circle_metrics;
        // Metadatos para VMI
        const tipo_escala = 'VMI_Copia_Figuras_Parte1';
        const nombreEj = info.nombre;
        const figuraEj = info.figura;
        const idEj = info.id;

        // Preferir score del backend si existe, sino usar el local
        let scoreStars = (typeof vmiBackendResult?.score?.stars === 'number') 
          ? vmiBackendResult.score.stars 
          : finalScore;

        // VALIDACIÓN LOCAL ESTRICTA DE FORMA
        // Si el backend dice que está bien (>=3 estrellas) pero la forma básica es incorrecta localmente, forzamos fallo.
        /*
        if (scoreStars >= 3 && pacienteConStroke.length > 0) {
             // Usar nombre de figura del info (ej. 'cuadrado')
             const scoreForma = evaluarFormaBasica(pacienteConStroke, info.figura || '');
             if (scoreForma === 0) {
                 console.warn("⚠️ Backend aprobó pero validación local rechazó la forma. Forzando fallo.");
                 scoreStars = 1; 
             }
        }
        */

        // VMI: 3 o más estrellas = 1 punto, menos = 0 puntos
        scoreBinario = scoreStars >= 3 ? 1 : 0;

        // ---------------------------------------------------------
        // CÁLCULO ANTICIPADO DE PUNTAJE TOTAL Y CONVERSIÓN (SI CORRESPONDE)
        // ---------------------------------------------------------
        const puntajeAcumulado = results.reduce((acc, r) => acc + r.score, 0);
        const itemsAprobados = puntajeAcumulado + scoreBinario;
        const bonusEdad = 0; // Bonificación desactivada
        const totalRawScore = itemsAprobados + bonusEdad;

        // Verificar condiciones de término
        const esFallo = scoreBinario === 0;
        const ultimos = results.slice(-2);
        const fallo1 = ultimos.length > 0 ? ultimos[ultimos.length - 1].score < 1 : false;
        const fallo2 = ultimos.length > 1 ? ultimos[ultimos.length - 2].score < 1 : false;
        const esTecho = esFallo && fallo1 && fallo2;
        const esFin = !siguiente;

        let resultadoConversion = null;

        if (esTecho || esFin) {
          try {
            // Usar la misma lógica robusta que en el test
            const pId = pacienteId ? Number(pacienteId) : undefined;
            resultadoConversion = await convertirPuntaje(
              'vmi', 
              totalRawScore.toString(), 
              edad_mes || undefined, 
              pId
            );
          } catch (e) {
            console.error('Error convirtiendo puntaje VMI:', e);
          }
        }

        const datos: EvaluacionEscala = {
          fecha: new Date().toISOString().split('T')[0],
          tipo_escala,
          resultado: JSON.parse(JSON.stringify({
            ejercicio: idEj,
            nombre: nombreEj,
            figura: figuraEj,
            puntuacion_amigable: scoreStars, // Guardamos las estrellas en el detalle JSON
            puntuacion_medica: finalMed,
            vmi_backend: vmiBackendResult || undefined,
            closed_shape: closedShape || undefined,
            circle_metrics: circleMetrics || undefined,
            score_vmi: scoreBinario, // Guardamos explícitamente el 0/1
            puntaje_estandar_final: resultadoConversion?.puntaje || resultadoConversion?.puntaje_estandar // Guardamos el estándar si se calculó
          })),
          puntaje: scoreBinario, // Guardamos el puntaje binario para que el backend pueda sumar correctamente
          id_paciente: Number(pacienteId),
          id_ejercicio: idEj
        };

        // Agregar al contexto de sesión para el resumen final
        // IMPORTANTE: Guardamos el scoreBinario (0 o 1) para que la suma del Raw Score sea correcta
        
        // Calcular Procrustes localmente para el resumen
        const flatPaciente = pacienteConStroke.map(p => ({x: p.x, y: p.y}));
        const flatModelo = modeloTransformado.map(p => ({x: p.x, y: p.y}));
        const procrustesScore = evaluarSimilitudGeometrica(flatPaciente, flatModelo);

        addResult({
          ejercicioId: idEj,
          nombre: nombreEj,
          figura: figuraEj,
          score: scoreBinario, 
          metrics: { ...vmiBackendResult, local_procrustes: procrustesScore },
          ai_feedback: vmiBackendResult?.analisis_ia,
          timestamp: new Date()
        });

        // Guardar evaluación
        const ok = await crearEvaluacionEscala(datos);
        if (!ok) {
          console.warn('⚠️ No se pudo guardar la evaluación VMI, se continuará con la navegación');
        }

        // Navegación
        if (esTecho) {
          console.warn('🛑 Se alcanzó el techo (3 fallos consecutivos). Finalizando prueba.');
          navigate('/actividad/vmi/resumen', { state: { resultadoEvaluacion: resultadoConversion } });
          return;
        }

        if (esFin) {
          navigate('/actividad/vmi/resumen', { state: { resultadoEvaluacion: resultadoConversion } });
        } else {
          const nextId = siguiente;
          limpiarEjercicio();
          if (nextId) {
            navigate(`/actividad/vmi/parte1/${nextId}`);
          }
        }
      } else {
        console.warn('⚠️ No hay paciente seleccionado, se omite el guardado y se avanza.');
        const nextId = siguiente;
        limpiarEjercicio();
        if (nextId) {
          navigate(`/actividad/vmi/parte1/${nextId}`);
        } else {
          navigate('/actividad/vmi/resumen');
        }
      }
    } catch (e) {
      console.error('❌ Error guardando evaluación VMI:', e);
      if (fase !== 'vmi') {
        // En imitación/intro, avanzar de todas formas
        if (fase === 'intro') setFase('imitacion_v');
        else setFase('vmi');
        limpiarEjercicio();
        return;
      }
      const nextId = siguiente;
      limpiarEjercicio();
      if (nextId) navigate(`/actividad/vmi/parte1/${nextId}`);
      else navigate('/actividad/vmi/resumen');
    } finally {
      setGuardando(false);
    }
  };



  return (
    <div className="copiafigura-wrapper" ref={containerRef}>
      <MenuEjercicio
        onReiniciar={() => {
          setPuntuacion(0);
          setPuntuacionMedica(0);
          setGrosorLinea(4);
          setResetKey(k => k + 1);
        }}
        onVolverSeleccion={() => navigate('/actividades')}
        onCambiarAncho={setGrosorLinea}
        onCambiarPosicionFigura={setPosicionFigura}
        posicionFigura={fase !== 'vmi' ? 'izquierda' : posicionFigura}
        mostrarOpcionPosicion={fase === 'vmi'}
      />

      <div className="selector-nivel">
        {fase === 'vmi' && anterior && (
          <button onClick={() => navigate(`/actividad/vmi/parte1/${anterior}`)}>
            ← Ejercicio {anterior}
          </button>
        )}
        <span className="actual">
          {fase === 'intro' && 'Paso previo: terapeuta dibuja (no se evalúa)'}
          {fase === 'imitacion_v' && 'Imitación: línea vertical'}
          {fase === 'imitacion_h' && 'Imitación: línea horizontal'}
          {fase === 'imitacion_c' && 'Imitación: círculo'}
          {/* Fases simplificadas: solo una imitación previa */}
          {fase === 'vmi' && (info ? `Ejercicio ${info.id}: ${info.nombre}` : `Ejercicio ${id}`)}
        </span>
        {fase === 'vmi' && siguiente && (
          <button onClick={() => navigate(`/actividad/vmi/parte1/${siguiente}`)}>
            Ejercicio {siguiente} →
          </button>
        )}
      </div>

      {/* Instrucciones y renderizado según fase */}
      {/* Una sola DoblePizarra para todas las fases: en 'intro' la terapeuta dibuja a la izquierda y eso pasa a ser el modelo en vivo */}
      {/* Etiquetas y guía en intro/imitación */}
      {fase !== 'vmi' && mostrarEtiquetas && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: '25%', top: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>Terapeuta</div>
            <div style={{ position: 'absolute', left: '75%', top: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>Paciente</div>
          </div>
          {mostrarInstruccionIntro && fase === 'intro' && (
            <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,0.95)', border: '1px solid #ddd', borderRadius: 12, padding: 16, zIndex: 1000, maxWidth: 520, textAlign: 'center', pointerEvents: 'none' }}>
              La terapeuta dibuja en el lado izquierdo y el trazo aparecerá como modelo. Este mensaje desaparecerá en 3 segundos.
            </div>
          )}
        </>
      )}

      <DoblePizarra
        ref={pizarraRef}
        key={`${resetKey}-${id}-${fase}-${subfase}`}
        onFinishDraw={onFinishDraw}
        coordsModeloMulti={coordsModeloMultiMemo}
        onModeloTransformado={setModeloTransformado}
        background="#fff"
        color="black"
        lineWidth={Math.max(grosorLinea, 6)}
        colorModelo="#aaaaaa"
        grosorModelo={id === 20 ? 4 : 10}
        rellenarModelo={false}
        cerrarTrazo={false}
        suavizarModelo={true}
        posicionFigura={fase !== 'vmi' ? 'izquierda' : posicionFigura}
      />

      {/* Mensaje de resultado oculto */}

      {/* Mensajes de regla desactivados; backend decide orientación/corrección */}

      <div style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: 1000 }}>
        <button
          className="guardar-btn"
          onClick={guardarEvaluacion}
          disabled={guardando}
          style={{ position: 'static', margin: 0 }}
        >
          {guardando ? 'Guardando...' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};

export default VMIParte1;
