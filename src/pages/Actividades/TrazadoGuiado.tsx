// Contenido de src/pages/Actividades/TrazadoGuiado.tsx
import { useGlobalPaciente } from '../../context/PacienteContext';

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DoblePizarra from '../../components/DoblePizarra';
import { modelosTrazado } from '../../components/coordenadasModelos';
import MenuEjercicio from '../../components/MenuEjercicio';
import EvaluacionIA from '../../components/EvaluacionIA';
import ResumenIA from '../../components/ResumenIA';
import IconoIA from '../../components/IconoIA';
import { crearEvaluacionEscala } from '../../services/evaluacionEscalaService'; // ✅ importa servicio
import type { EvaluacionEscala } from '../../models/EvaluacionEscala'; // ✅ importa tipo
import { evaluarTrazadoGuiado } from '../../utils/evaluacionSimple';
import { ModalActualizacion } from '../../components/ModalActualizacion';
import { BASE_URL, getHeaders } from '../../services/api';
import AnalisisChatGPT from '../../components/AnalisisChatGPT';
import './CopiaFigura.css';

const nombresBonitos: Record<string, string> = {
  montaña: 'Montaña',
  ondas: 'Ondas Suaves',
  ola: 'Ola Marina',
  punteagudo: 'Picos Agudos',
  caminocurva: 'Camino Curvo',
  espiral: 'Espiral Creativa',
  curvasE: 'Curvas Enfrentadas',
  doble_espiral: 'Doble Espiral',
  zigzag_espiral: 'Zigzag en Espiral',
};

const TrazadoGuiado: React.FC = () => {
  const { id } = useGlobalPaciente();

  const { nivel, figura } = useParams();
  const navigate = useNavigate();
  const modelo = modelosTrazado[figura || ''];

  const [coords, setCoords] = useState<{ x: number; y: number }[]>([]);
  const [modeloTransformado, setModeloTransformado] = useState<{ x: number; y: number }[]>([]);
  const [puntuacion, setPuntuacion] = useState<number | null>(null);
  const [grosorLinea, setGrosorLinea] = useState(4);
  const [precisiones, setPrecisiones] = useState<number[]>([]);
  const [keyPizarra, setKeyPizarra] = useState(Date.now());
  const [posicionFigura, setPosicionFigura] = useState<'izquierda' | 'derecha'>('izquierda');
  const [mostrarEvaluacionIA, setMostrarEvaluacionIA] = useState(false);
  const [, setPuntuacionIA] = useState<number | null>(null);
  const [mostrarResumenIA, setMostrarResumenIA] = useState(false);
  const [puntuacionesUsuario, setPuntuacionesUsuario] = useState<number[]>([]); // Para el resumen IA
  const [analisisChatGPT, setAnalisisChatGPT] = useState<any>(null);
  const [mostrarModalActualizacion, setMostrarModalActualizacion] = useState(false);

  const trazadosNivel: Record<number, string[]> = {
    1: ['montaña', 'ondas', 'ola'],
    2: ['punteagudo', 'caminocurva', 'espiral'],
    3: ['curvasE', 'doble_espiral', 'zigzag_espiral'],
  };

  const nivelNumero = Number((nivel || '').replace(/[^\d]/g, ''));
  const figuras = trazadosNivel[nivelNumero] || [];
  const actualIndex = figuras.indexOf(figura || '');

  useEffect(() => {
    if (!modelo || modelo.length === 0) {
      alert('❌ Modelo no encontrado');
    }
  }, [modelo]);

  // Debug del modal
  useEffect(() => {
    console.log('🔴 Estado del modal cambió:', mostrarModalActualizacion);
  }, [mostrarModalActualizacion]);

  // Función para manejo inteligente del cambio de posición
  const manejarCambioPosicionFigura = (nuevaPosicion: 'izquierda' | 'derecha') => {
    console.log('🔄 Cambio de posición detectado:', {
      posicionActual: posicionFigura,
      nuevaPosicion: nuevaPosicion,
      estadoModalAntes: mostrarModalActualizacion
    });
    
    // Si es derecha, el área de dibujo va a la izquierda - mostrar modal
    if (nuevaPosicion === 'derecha') {
      console.log('🚀 Mostrando modal de mantenimiento - área de dibujo a la izquierda');
      setMostrarModalActualizacion(true);
      console.log('✅ Modal establecido a true - posición NO cambiada');
      return; // NO cambiar la posición
    }
    
    // Solo cambiar posición si es izquierda (área de dibujo a la derecha)
    setPosicionFigura(nuevaPosicion);
    setKeyPizarra(Date.now()); // Forzar re-render
    
    console.log('🔄 Cambio completado para izquierda:', {
      nuevaPosicion
    });
  };

  // Función async separada para evaluar coordenadas
  const evaluarCoordenadas = async () => {
    // 👇 **LÓGICA MEJORADA CON ESCALADO**
    // Solo calcular si el trazo tiene una longitud mínima
    if (coords.length > 20 && modeloTransformado.length > 0) {
      // Filtrar coordenadas del área de dibujo correcta
      const coordsFiltradas = filtrarCoordenadasAreaDibujo(coords, posicionFigura);
      
      // 👇 **ESCALAR COORDENADAS DEL USUARIO PARA QUE COINCIDAN CON EL MODELO**
      const coordsEscaladas = escalarCoordenadasUsuario(coordsFiltradas);
      
      console.log('🔍 Debug evaluación:', {
        coordsOriginales: coords.length,
        coordsFiltradas: coordsFiltradas.length,
        coordsEscaladas: coordsEscaladas.length,
        posicionFigura,
        modeloTransformado: modeloTransformado.length
      });
      
      if (coordsEscaladas.length > 10) {
        await calcularPrecision(coordsEscaladas, modeloTransformado);
      } else {
        console.log('⚠️ No hay suficientes coordenadas escaladas para evaluar');
        setPuntuacion(null);
      }
    } else {
      // Si no, no se muestra puntuación
      setPuntuacion(null);
    }
  };

  useEffect(() => {
    evaluarCoordenadas();
  }, [coords, modeloTransformado, posicionFigura]);

  // Función para filtrar coordenadas del área de dibujo correcta
  const filtrarCoordenadasAreaDibujo = (coords: { x: number; y: number }[], posicion: 'izquierda' | 'derecha') => {
    const pizarraWidth = window.innerWidth / 2;
    
    return coords.filter(coord => {
      if (posicion === 'izquierda') {
        // Si la figura está a la izquierda, solo tomar coordenadas de la derecha
        return coord.x > pizarraWidth;
      } else {
        // Si la figura está a la derecha, solo tomar coordenadas de la izquierda
        return coord.x < pizarraWidth;
      }
    });
  };

  // 👇 **FUNCIÓN PARA SUPERPONER COORDENADAS DEL USUARIO ENCIMA DEL MODELO**
  const escalarCoordenadasUsuario = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0 || modeloTransformado.length === 0) return [];
    
    console.log('🎯 Superponiendo dibujo del paciente encima del modelo:', {
      coordsUsuario: coords.length,
      modeloTransformado: modeloTransformado.length
    });
    
    // Calcular el área de dibujo del usuario (derecha o izquierda según posición)
    const pizarraWidth = window.innerWidth / 2;
    const areaDibujoUsuario = posicionFigura === 'izquierda' ? 'derecha' : 'izquierda';
    
    // Calcular offset para mover coordenadas del área de dibujo al área del modelo
    const offsetX = areaDibujoUsuario === 'derecha' ? -pizarraWidth : pizarraWidth;
    
    // Superponer las coordenadas del usuario encima del modelo
    const coordsSuperpuestas = coords.map(coord => ({
      x: coord.x + offsetX, // Mover al área del modelo
      y: coord.y // Mantener la misma altura
    }));
    
    console.log('📍 Coordenadas superpuestas:', {
      originales: coords.slice(0, 3),
      superpuestas: coordsSuperpuestas.slice(0, 3),
      offsetX
    });
    
    return coordsSuperpuestas;
  };

  // 👇 **FUNCIONES AUXILIARES PARA VALIDACIÓN DE FORMA - NO UTILIZADAS**
  /* const calcularArea = (coords: { x: number; y: number }[]) => {
    if (coords.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      area += coords[i].x * coords[j].y;
      area -= coords[j].x * coords[i].y;
    }
    return Math.abs(area) / 2;
  };

  const calcularLongitud = (coords: { x: number; y: number }[]) => {
    let longitud = 0;
    for (let i = 1; i < coords.length; i++) {
      const dx = coords[i].x - coords[i - 1].x;
      const dy = coords[i].y - coords[i - 1].y;
      longitud += Math.sqrt(dx * dx + dy * dy);
    }
    return longitud;
  }; */

  // 👇 **EVALUACIÓN PARA EL NIÑO (MÁS FLEXIBLE) - NO UTILIZADA**
  /* const calcularPrecisionAmigable = (
    usuario: { x: number; y: number }[],
    modelo: { x: number; y: number }[]
  ) => {
    console.log('🎯 Calculando precisión AMIGABLE para el niño:', {
      usuarioLength: usuario.length,
      modeloLength: modelo.length
    });

    if (usuario.length < 10 || modelo.length < 10) {
      console.log('❌ No hay suficientes puntos para evaluar');
      return 0;
    }

    const estaCerca = usuario.some(puntoUsuario => 
      modelo.some(puntoModelo => {
        const distancia = Math.sqrt(
          Math.pow(puntoUsuario.x - puntoModelo.x, 2) +
          Math.pow(puntoUsuario.y - puntoModelo.y, 2)
        );
        return distancia < 200; // 👈 **MÁS FLEXIBLE: 200px**
      })
    );

    console.log('📍 ¿Está cerca del modelo? (amigable)', estaCerca);

    if (!estaCerca) {
      console.log('❌ El trazo no está cerca del modelo');
      return 0;
    }

    let sumaDistancias = 0;
    usuario.forEach(({ x: ux, y: uy }) => {
      let menorDistancia = Infinity;
      modelo.forEach(({ x: mx, y: my }) => {
        const dx = mx - ux;
        const dy = my - uy;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia < menorDistancia) menorDistancia = distancia;
      });
      sumaDistancias += menorDistancia;
    });

    const promedio = sumaDistancias / usuario.length;
    const maxDistancia = 250; // 👈 **MÁS FLEXIBLE: 250px**
    let baseScore = Math.max(0, 100 - (promedio / maxDistancia) * 100);
    
    // 👇 **BONUS MÁS CONSERVADOR PARA NIÑOS**
    if (usuario.length > 100) baseScore += 5; // Bonus menor por trazo detallado
    if (baseScore > 0 && baseScore < 20) baseScore += 5; // Bonus mínimo por intentar
    
    let puntosCubiertos = 0;
    const umbral = 30; // 👈 **MÁS FLEXIBLE: 30px**
    modelo.forEach(({ x: mx, y: my }) => {
      for (let i = 0; i < usuario.length; i++) {
        const { x: ux, y: uy } = usuario[i];
        const dx = mx - ux;
        const dy = my - uy;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia <= umbral) {
          puntosCubiertos++;
          break;
        }
      }
    });

    const cobertura = puntosCubiertos / modelo.length;
    if (cobertura < 0.6) { // 👈 **MÁS ESTRICTO: 60%**
      baseScore *= cobertura;
    }

    // 👇 **VALIDACIÓN MÁS FLEXIBLE PARA NIÑOS**
    const validarFormaAmigable = () => {
      const areaModelo = calcularArea(modelo);
      const areaUsuario = calcularArea(usuario);
      
      const ratioArea = Math.min(areaModelo, areaUsuario) / Math.max(areaModelo, areaUsuario);
      if (ratioArea < 0.2) { // 👈 **MÁS ESTRICTO: 20%**
        console.log('⚠️ Áreas muy diferentes (amigable):', { areaModelo, areaUsuario, ratioArea });
        return 0.3; // Penalización más fuerte
      }
      
      return 1; // Sin penalización
    };

    const factorForma = validarFormaAmigable();
    baseScore *= factorForma;

    // 👇 **VALIDACIÓN ADICIONAL: PENALIZAR TRAZOS MUY SIMPLES**
    const validarComplejidad = () => {
      // Si el trazo es muy corto comparado con el modelo
      const ratioLongitud = usuario.length / modelo.length;
      if (ratioLongitud < 0.3) { // Menos del 30% de puntos
        console.log('⚠️ Trazo muy simple (amigable):', { 
          usuarioLength: usuario.length, 
          modeloLength: modelo.length, 
          ratioLongitud 
        });
        return 0.4; // Penalización por trazo muy simple
      }
      
      // Si el trazo tiene muy pocos puntos
      if (usuario.length < 20) {
        console.log('⚠️ Trazo muy corto (amigable):', { usuarioLength: usuario.length });
        return 0.3; // Penalización severa por trazo muy corto
      }
      
      return 1; // Sin penalización
    };

    const factorComplejidad = validarComplejidad();
    baseScore *= factorComplejidad;

    const finalScore = Math.min(100, Math.round(baseScore)); // Cap a 100
    console.log('🌟 Resultado evaluación AMIGABLE:', {
      promedio,
      baseScore,
      cobertura,
      factorForma,
      factorComplejidad,
      finalScore,
      'bonus aplicado': baseScore > 0 ? 'Sí' : 'No'
    });
    
    return finalScore;
  }; */

  // 👇 **EVALUACIÓN PARA EL TERAPEUTA (PRECISA) - NO UTILIZADA**
  /* const calcularPrecisionMedica = (
    usuario: { x: number; y: number }[],
    modelo: { x: number; y: number }[]
  ) => {
    console.log('🎯 Calculando precisión MÉDICA para el terapeuta:', {
      usuarioLength: usuario.length,
      modeloLength: modelo.length
    });

    if (usuario.length < 10 || modelo.length < 10) {
      console.log('❌ No hay suficientes puntos para evaluar');
      return 0;
    }

    const estaCerca = usuario.some(puntoUsuario => 
      modelo.some(puntoModelo => {
        const distancia = Math.sqrt(
          Math.pow(puntoUsuario.x - puntoModelo.x, 2) +
          Math.pow(puntoUsuario.y - puntoModelo.y, 2)
        );
        return distancia < 150; // 👈 **PRECISO: 150px**
      })
    );

    console.log('📍 ¿Está cerca del modelo? (médico)', estaCerca);

    if (!estaCerca) {
      console.log('❌ El trazo no está cerca del modelo');
      return 0;
    }

    let sumaDistancias = 0;
    usuario.forEach(({ x: ux, y: uy }) => {
      let menorDistancia = Infinity;
      modelo.forEach(({ x: mx, y: my }) => {
        const dx = mx - ux;
        const dy = my - uy;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia < menorDistancia) menorDistancia = distancia;
      });
      sumaDistancias += menorDistancia;
    });

    const promedio = sumaDistancias / usuario.length;
    const maxDistancia = 100; // 👈 **PRECISO: 100px**
    let baseScore = Math.max(0, 100 - (promedio / maxDistancia) * 100);
    
    let puntosCubiertos = 0;
    const umbral = 15; // 👈 **PRECISO: 15px**
    modelo.forEach(({ x: mx, y: my }) => {
      for (let i = 0; i < usuario.length; i++) {
        const { x: ux, y: uy } = usuario[i];
        const dx = mx - ux;
        const dy = my - uy;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        if (distancia <= umbral) {
          puntosCubiertos++;
          break;
        }
      }
    });

    const cobertura = puntosCubiertos / modelo.length;
    if (cobertura < 0.7) { // 👈 **PRECISO: 70%**
      baseScore *= cobertura;
    }

    // 👇 **VALIDACIÓN PRECISA PARA TERAPEUTAS**
    const validarFormaMedica = () => {
      const areaModelo = calcularArea(modelo);
      const areaUsuario = calcularArea(usuario);
      
      const ratioArea = Math.min(areaModelo, areaUsuario) / Math.max(areaModelo, areaUsuario);
      if (ratioArea < 0.3) { // 👈 **PRECISO: 30%**
        console.log('⚠️ Áreas muy diferentes (médico):', { areaModelo, areaUsuario, ratioArea });
        return 0.3; // Penalización severa
      }
      
      const longitudModelo = calcularLongitud(modelo);
      const longitudUsuario = calcularLongitud(usuario);
      const ratioLongitud = Math.min(longitudModelo, longitudUsuario) / Math.max(longitudModelo, longitudUsuario);
      if (ratioLongitud < 0.4) { // 👈 **PRECISO: 40%**
        console.log('⚠️ Longitudes muy diferentes (médico):', { longitudModelo, longitudUsuario, ratioLongitud });
        return 0.4; // Penalización moderada
      }
      
      return 1; // Sin penalización
    };

    const factorForma = validarFormaMedica();
    baseScore *= factorForma;

    const finalScore = Math.round(baseScore);
    console.log('🏥 Resultado evaluación MÉDICA:', {
      promedio,
      baseScore,
      cobertura,
      factorForma,
      finalScore,
      sumaDistancias,
      usuarioLength: usuario.length,
      modeloLength: modelo.length,
      puntosCubiertos
    });
    
    return finalScore;
  }; */

  const calcularPrecision = async (
    usuario: { x: number; y: number }[],
    modelo: { x: number; y: number }[]
  ) => {
    try {
      // 👇 **INTENTAR USAR BACKEND CON IA PRIMERO**
      console.log('🤖 Enviando evaluación al backend con IA...');
      console.log('📊 Datos enviados:', {
        coordenadas_usuario: usuario.length,
        coordenadas_modelo: modelo.length,
        figura: figura,
        nivel: nivelNumero,
        paciente_id: id || 1
      });
      
      const respuesta = await fetch(`${BASE_URL}/evaluaciones/crearevaluaciones`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          fecha: new Date().toISOString(),
          tipo_escala: 'Escala_de_motricidad_fina',
          resultado: {
            coordenadasUsuario: usuario,
            coordenadasModelo: modelo,
            figuraEsperada: figura,
            usarChatGPT: true,
            contexto: {
              paciente: 'Paciente actual',
              sesion: 'Sesión actual',
              nivel: 'básico'
            }
          },
          puntaje: 0,
          id_paciente: id || 1,
          id_ejercicio: 1
        })
      });
      
      console.log('📡 Respuesta del backend:', {
        status: respuesta.status,
        statusText: respuesta.statusText,
        ok: respuesta.ok
      });

      if (respuesta.ok) {
        const evaluacionIA = await respuesta.json();
        
        console.log('🎯 RESPUESTA COMPLETA DEL BACKEND:', evaluacionIA);
        console.log('🔍 Campos disponibles en la respuesta:', Object.keys(evaluacionIA));
        console.log('🔍 Campos en resultado:', evaluacionIA.resultado ? Object.keys(evaluacionIA.resultado) : 'No hay resultado');
        console.log('🔍 Estructura de la respuesta:', {
          tieneResultado: !!evaluacionIA.resultado,
          tienePuntaje: !!evaluacionIA.puntaje,
          tienePuntuacionChatGPT: !!evaluacionIA.resultado?.puntuacion_chatgpt,
          tieneAnalisisChatGPT: !!evaluacionIA.resultado?.analisis_chatgpt,
          puntaje: evaluacionIA.puntaje,
          resultado: evaluacionIA.resultado,
          figura: figura
        });
        
        // Extraer puntuación de la respuesta del backend
        const puntuacionIA = evaluacionIA.resultado?.puntuacion_chatgpt || evaluacionIA.puntaje || 0;
        const analisisIA = evaluacionIA.resultado?.analisis_chatgpt || 'Análisis con IA';
        
        console.log('📊 Puntuación extraída:', {
          puntuacionIA,
          analisisIA,
          fuente: evaluacionIA.resultado?.puntuacion_chatgpt ? 'puntuacion_chatgpt' : 'puntaje'
        });
        
        // Si el backend no devuelve una puntuación válida, usar evaluación local
        if (puntuacionIA === 0 || !evaluacionIA.resultado?.puntuacion_chatgpt) {
          console.log('⚠️ Backend no devolvió puntuación válida, usando evaluación local');
          
          const puntuacionLocal = evaluarTrazadoGuiado(usuario, modelo, figura);
          const puntuacionMedica = evaluarTrazadoGuiado(usuario, modelo, figura);
          
          console.log('🌟 Resultado evaluación local:', {
            puntuacionLocal,
            puntuacionMedica,
            figura: figura
          });
          
          setPuntuacion(puntuacionLocal);
          setPrecisiones(prev => [...prev, puntuacionMedica]);
          setPuntuacionesUsuario(prev => [...prev, puntuacionLocal]);
          
          // Guardar análisis local
          const analisisCompleto = {
            puntuacion: puntuacionLocal,
            analisis: `Evaluación local para ${figura}`,
            formaDetectada: figura,
            precision: puntuacionMedica / 100,
            cobertura: puntuacionLocal / 100,
            sugerencias: ['Continúa practicando'],
            errores: [],
            fortalezas: ['Buen intento']
          };
          
          console.log('📝 Análisis local guardado:', analisisCompleto);
          setAnalisisChatGPT(analisisCompleto);
          
        } else {
          // Usar evaluación del backend
          console.log('🎯 Estableciendo puntuación del backend:', puntuacionIA);
          setPuntuacion(puntuacionIA);
          setPrecisiones(prev => [...prev, puntuacionIA]);
          setPuntuacionesUsuario(prev => [...prev, puntuacionIA]);
          
          // Guardar análisis de IA
          const analisisCompleto = {
            puntuacion: puntuacionIA,
            analisis: analisisIA,
            formaDetectada: figura,
            precision: puntuacionIA / 100,
            cobertura: puntuacionIA / 100,
            sugerencias: evaluacionIA.resultado?.sugerencias_chatgpt || ['Continúa practicando'],
            errores: evaluacionIA.resultado?.detalles?.errores || [],
            fortalezas: evaluacionIA.resultado?.detalles?.fortalezas || ['Buen intento']
          };
          
          console.log('📝 Análisis del backend guardado:', analisisCompleto);
          setAnalisisChatGPT(analisisCompleto);
        }
        
      } else {
        throw new Error(`Backend error: ${respuesta.status}`);
      }
      
    } catch (error) {
      console.error('❌ Error con backend, usando evaluación local:', error);
      
      // 👇 **FALLBACK AL SISTEMA LOCAL**
      console.log('🎯 Evaluando con sistema local (Trazado Guiado):', {
        usuario: usuario.length,
        modelo: modelo.length,
        figura: figura
      });
      
      const puntuacionAmigable = evaluarTrazadoGuiado(usuario, modelo, figura);
      const puntuacionMedica = evaluarTrazadoGuiado(usuario, modelo, figura);
      
      console.log('🌟 Resultado evaluación local:', {
        puntuacionAmigable,
        puntuacionMedica,
        figura: figura
      });
      
      setPuntuacion(puntuacionAmigable);
      setPrecisiones(prev => [...prev, puntuacionMedica]);
      setPuntuacionesUsuario(prev => [...prev, puntuacionAmigable]);
      
      // Guardar análisis local
      setAnalisisChatGPT({
        puntuacion: puntuacionAmigable,
        analisis: `Evaluación local para ${figura}`,
        formaDetectada: figura,
        precision: puntuacionMedica / 100,
        cobertura: puntuacionAmigable / 100,
        sugerencias: ['Continúa practicando'],
        errores: [],
        fortalezas: ['Buen intento']
      });
    }
  };

const guardarCoordenadas = async () => {
  if (!figura || !nivel || puntuacion === null) return;

  try {
    // Igual que en CopiaFigura: construir string y parsear a JSON
    const formateado = coords.map(p => `[${Math.round(p.x)}, ${Math.round(p.y)}]`).join(',\n');
    const contenido = `[\n${formateado}\n]`;
    const jsonData = JSON.parse(contenido); // <- ahora sí encaja con tipo JSON

    // 👇 **USAR LA PUNTUACIÓN MÉDICA PARA GUARDAR (NO LA AMIGABLE)**
    const puntuacionMedica = precisiones[precisiones.length - 1] || 0;

    const datos: EvaluacionEscala = {
      fecha: new Date().toISOString().split("T")[0],
      tipo_escala: "trazado guiado",
      resultado: jsonData, // <- se ajusta al tipo JSON
      puntaje: puntuacionMedica, // 👈 **PUNTUACIÓN MÉDICA PRECISA**
      id_paciente: Number(id),
      id_ejercicio: actualIndex + 1 + (nivelNumero - 1) * 3
    };

   console.log('Enviando datos de TrazadoGuiado (MÉDICOS):', datos);
   console.log('📊 Comparación:', {
     'Puntuación mostrada al niño': puntuacion,
     'Puntuación guardada para terapeuta': puntuacionMedica
   });

    const resultado = await crearEvaluacionEscala(datos);
    console.log("✅ Evaluación MÉDICA creada:", datos);
    console.log(resultado ? "✅ Coordenadas guardadas" : "❌ Error al guardar");
  } catch (e) {
    console.error("❌ Error en POST:", e);
  }
};


  const siguienteFigura = async () => {
    await guardarCoordenadas(); // ✅ guardar antes de continuar
    const siguiente = figuras[actualIndex + 1];
    if (siguiente) {
      setCoords([]);
      setPuntuacion(null);
      setKeyPizarra(Date.now());
      navigate(`/trazado-guiado/nivel${nivelNumero}/${siguiente}`);
    } else {
      // Mostrar resumen IA para todos los niveles
      setMostrarResumenIA(true);
    }
  };


  // Promedio para el resumen IA (usando las puntuaciones que vio el usuario)
  const promedioUsuario = Math.round(
    puntuacionesUsuario.reduce((a, b) => a + b, 0) / (puntuacionesUsuario.length || 1)
  );

  const anterior = figuras[actualIndex - 1];
  const siguiente = figuras[actualIndex + 1];
  
  // 👇 **NUEVAS FUNCIONES PARA ESTILOS DINÁMICOS**
  const getColorClass = (puntaje: number | null) => {
    if (puntaje === null) return '';
    if (puntaje >= 80) return 'verde';    // 4-5 estrellas = verde
    if (puntaje >= 60) return 'amarillo'; // 2-3 estrellas = amarillo
    return 'rojo';                        // 1 estrella = rojo
  };

  const getMensaje = (puntaje: number | null) => {
    if (puntaje === null) return '';
    if (puntaje >= 80) return '¡Excelente!';
    if (puntaje >= 60) return '¡Muy bien!';
    return '¡Sigue intentando!';
  };

  // Función para mostrar evaluación IA manualmente
  const manejarEvaluarConIA = () => {
    console.log('🔍 TrazadoGuiado - Intentando evaluar con IA:', {
      coordsLength: coords.length,
      modeloTransformadoLength: modeloTransformado.length,
      figura: figura,
      posicionFigura: posicionFigura
    });
    
    if (coords.length > 20 && modeloTransformado.length > 0) {
      console.log('✅ TrazadoGuiado - Mostrando evaluación IA');
      setMostrarEvaluacionIA(true);
    } else {
      console.log('❌ TrazadoGuiado - No se puede evaluar:', {
        reason: coords.length <= 20 ? 'coords insuficientes' : 'modelo no transformado'
      });
    }
  };

  // Función para aceptar la evaluación de IA
  const manejarAceptarEvaluacionIA = (estrellasIA: number) => {
    setPuntuacionIA(estrellasIA);
    // Convertir estrellas a porcentaje (1 estrella = 20%, 5 estrellas = 100%)
    const nuevaPuntuacion = Math.round((estrellasIA / 5) * 100);
    setPuntuacion(nuevaPuntuacion);
  };


  return (
    <div className="copiafigura-wrapper">
      <MenuEjercicio
        onReiniciar={() => {
          setCoords([]);
          setPuntuacion(null);
          setGrosorLinea(4);
          setKeyPizarra(Date.now());
        }}
        onVolverSeleccion={() => navigate('/trazados')}
        onCambiarAncho={(valor) => setGrosorLinea(valor)}
        onCambiarPosicionFigura={manejarCambioPosicionFigura}
        posicionFigura={posicionFigura}
        mostrarOpcionPosicion={true}
      />

      <div className="selector-nivel">
        {anterior && (
          <button onClick={() => navigate(`/trazado-guiado/nivel${nivelNumero}/${anterior}`)}>
            ← {nombresBonitos[anterior] || anterior}
          </button>
        )}
        <span className="actual">{nombresBonitos[figura || ''] || figura}</span>
        {siguiente && (
          <button onClick={siguienteFigura}>
            {nombresBonitos[siguiente] || siguiente} →
          </button>
        )}
      </div>

      <DoblePizarra
        key={keyPizarra}
        onFinishDraw={setCoords}
        coordsModelo={modelo}
        onModeloTransformado={(coords) => {
          console.log('🔍 TrazadoGuiado - Recibiendo modelo transformado:', coords.length, 'puntos');
          setModeloTransformado(coords);
        }}
        background="#fff"
        color="black"
        lineWidth={grosorLinea}
        colorModelo="#aaaaaa"
        grosorModelo={10}
        rellenarModelo={false}
        cerrarTrazo={false}
        posicionFigura={posicionFigura}
        cambiarPosicionFigura={manejarCambioPosicionFigura}
      />

      {/* Botón Siguiente arriba a la derecha */}
      {coords.length > 20 && (
        <button 
          className="guardar-btn" 
          onClick={siguienteFigura}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000
          }}
        >
          Siguiente
        </button>
      )}
      
      {/* Botón de evaluación IA abajo a la derecha */}
      {coords.length > 20 && (
        <button 
          onClick={manejarEvaluarConIA}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            width: 'auto',
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#b91c1c';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#dc2626';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <IconoIA size={24} className="compacto" />
          IA
        </button>
      )}
      
      {/* 👇 JSX MODIFICADO PARA USAR LA CLASE Y MENSAJE DINÁMICOS */}
      {puntuacion !== null && (
        <div className={`resultado-box ${getColorClass(puntuacion)}`}>
          <div className="resultado-mensaje">{getMensaje(puntuacion)}</div>
        </div>
      )}

      {/* 👇 ANÁLISIS DETALLADO DE CHATGPT */}
      {analisisChatGPT && (
        <AnalisisChatGPT
          puntuacion={analisisChatGPT.puntuacion}
          analisis={analisisChatGPT.analisis}
          formaDetectada={analisisChatGPT.formaDetectada}
          precision={analisisChatGPT.precision}
          cobertura={analisisChatGPT.cobertura}
          sugerencias={analisisChatGPT.sugerencias}
          errores={analisisChatGPT.errores}
          fortalezas={analisisChatGPT.fortalezas}
        />
      )}


      {/* Evaluación IA */}
      {mostrarEvaluacionIA && modeloTransformado.length > 0 && (
        <EvaluacionIA
          coordenadasModelo={modeloTransformado}
          coordenadasPaciente={escalarCoordenadasUsuario(filtrarCoordenadasAreaDibujo(coords, posicionFigura))}
          figuraObjetivo={nombresBonitos[figura || ''] || figura || 'Figura'}
          puntuacionOriginal={puntuacion ? Math.round((puntuacion / 100) * 5) : 1}
          onClose={() => setMostrarEvaluacionIA(false)}
          onAceptarEvaluacion={manejarAceptarEvaluacionIA}
        />
      )}

      {/* Resumen IA para todos los niveles */}
      {mostrarResumenIA && (
        <ResumenIA
          tipoEjercicio="Trazado Guiado"
          nivel={nivelNumero}
          precisiones={puntuacionesUsuario}
          promedioPrecision={promedioUsuario}
          ejerciciosCompletados={puntuacionesUsuario.length}
          onClose={() => {
            setMostrarResumenIA(false);
            navigate('/trazados');
          }}
        />
      )}

      {/* Modal de actualización futura */}
      <ModalActualizacion
        isOpen={mostrarModalActualizacion}
        onClose={() => {
          console.log('❌ Cerrando modal');
          setMostrarModalActualizacion(false);
        }}
        titulo="Área de Dibujo a la Izquierda"
        mensaje="La funcionalidad de evaluación cuando el área de dibujo está a la izquierda será implementada en las siguientes actualizaciones del sistema."
      />

    </div>
  );
};

export default TrazadoGuiado;