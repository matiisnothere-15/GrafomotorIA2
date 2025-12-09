import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGlobalPaciente } from '../../context/PacienteContext';
import { crearEvaluacionEscala } from '../../services/evaluacionEscalaService';
import { evaluarTrazadoGuiado } from '../../utils/evaluacionSimple';
import type { EvaluacionEscala } from '../../models/EvaluacionEscala';

// Hooks y Configuración
import { useCoordinacionEjercicio } from '../../hooks/useCoordinacionEjercicio';

// Componentes
import PizarraConSVG from '../../components/PizarraConSVG';
import MenuEjercicio from '../../components/MenuEjercicio';
import EvaluacionIA from '../../components/EvaluacionIA';
import ResumenIA from '../../components/ResumenIA';
import IconoIA from '../../components/IconoIA';
import { ModalActualizacion } from '../../components/ModalActualizacion';

// Estilos (asegúrate que aquí estén las nuevas clases)
import './CopiaFigura.css'; 

// Constantes
const MIN_COORDS_PARA_EVALUAR = 20;

/**
 * Página del ejercicio de Coordinación Motriz.
 * * Refactorizada para usar el hook 'useCoordinacionEjercicio' que encapsula
 * la lógica de negocio, navegación y configuración.
 */
const CoordinacionMotriz: React.FC = () => {
  const { id: pacienteId } = useGlobalPaciente();
  
  // El hook personalizado maneja toda la lógica de URL, config y navegación
  const {
    nivelNumero,
    ejercicioId,
    ejercicioActual,
    modelo,
    ejerciciosDelNivel,
    siguienteEjercicio,
    anteriorEjercicio,
    cambiarEjercicio,
    irASiguienteEjercicio,
    navigate,
  } = useCoordinacionEjercicio();

  // Bloqueo de volver a ejercicios anteriores una vez se avanza
  const storageKey = useMemo(() => `coord-bloqueo-nivel-${nivelNumero}`, [nivelNumero]);
  const [minIndexPermitido, setMinIndexPermitido] = useState<number>(() => {
    const stored = sessionStorage.getItem(storageKey);
    const parsed = stored ? Number(stored) : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  });
  const actualIndex = useMemo(
    () => (ejercicioActual ? ejerciciosDelNivel.indexOf(ejercicioActual) : -1),
    [ejercicioActual, ejerciciosDelNivel]
  );

  useEffect(() => {
    // Si el usuario accede directo a un ejercicio más avanzado, elevamos el mínimo permitido
    if (actualIndex >= 0 && actualIndex > minIndexPermitido) {
      setMinIndexPermitido(actualIndex);
      sessionStorage.setItem(storageKey, String(actualIndex));
    }
  }, [actualIndex, minIndexPermitido, storageKey]);

  // --- Estado de la UI ---
  const [coords, setCoords] = useState<{ x: number; y: number }[]>([]);
  const [modeloTransformado, setModeloTransformado] = useState<{ x: number; y: number }[]>([]);
  const [puntuacion, setPuntuacion] = useState<number | null>(null);
  const [grosorLinea, setGrosorLinea] = useState(4);
  const [resetKey, setResetKey] = useState(0); // Para forzar reinicio de la pizarra

  // --- Estado de Evaluación ---
  const [precisionMedica, setPrecisionMedica] = useState(0); // Puntuación para la BD
  const [puntuacionesUsuario, setPuntuacionesUsuario] = useState<number[]>([]); // Para el resumen
  // Eliminado analisisIA no utilizado
  
  // --- Estado de Modales ---
  const [mostrarEvaluacionIA, setMostrarEvaluacionIA] = useState(false);
  const [mostrarResumenIA, setMostrarResumenIA] = useState(false);
  const [mostrarModalActualizacion, setMostrarModalActualizacion] = useState(false);

  // Valida que el modelo exista al cargar
  useEffect(() => {
    if (!modelo || modelo.length === 0) {
      console.error(`Modelo no encontrado para el ejercicio: ${ejercicioId}`);
      // Opcional: navegar a una página de error o al menú
    }
  }, [modelo, ejercicioId]);

  /**
   * Reinicia el estado local para un nuevo dibujo o ejercicio.
   */
  const reiniciarEjercicio = useCallback(() => {
    setPuntuacion(null);
    setCoords([]);
    setPrecisionMedica(0);
    setResetKey(prev => prev + 1);
  }, []);

  /**
   * Guarda la evaluación actual en la base de datos.
   */
const guardarCoordenadas = useCallback(async () => {
    if (!ejercicioActual || puntuacion === null || !pacienteId) return;

    try {
      // --- INICIO DE LA CORRECCIÓN ---
      // Convierte [{x: 10, y: 20}, ...] a [[10, 20], ...]
      // que es el formato que tu backend parece esperar.
      const resultadoParaBackend = coords.map(p => [Math.round(p.x), Math.round(p.y)]);
      // --- FIN DE LA CORRECCIÓN ---

      const datos: EvaluacionEscala = {
        fecha: new Date().toISOString().split("T")[0],
        tipo_escala: "coordinacion motriz",
        // Tipado 'JSON' requiere serializable; usamos stringify/parse como en VMIParte1
        resultado: JSON.parse(JSON.stringify(resultadoParaBackend)),
        puntaje: precisionMedica, // Guardamos la puntuación "médica"
        id_paciente: Number(pacienteId),
        id_ejercicio: ejercicioActual.dbId, // ID obtenido de la config
      };

      console.log('Enviando datos de CoordinacionMotriz:', datos);
      await crearEvaluacionEscala(datos);
      console.log("✅ Evaluación MÉDICA creada.");

    } catch (e) {
      console.error("❌ Error en POST de guardarCoordenadas:", e);
    }
  }, [coords, ejercicioActual, pacienteId, puntuacion, precisionMedica]);
  /**
   * Cambia al siguiente ejercicio, guardando el progreso actual primero.
   */
  const cambiarTipoLinea = async (nuevoEjercicioId: string) => {
    if (coords.length > MIN_COORDS_PARA_EVALUAR && puntuacion !== null) {
      await guardarCoordenadas();
    }
    
    // Reinicia el estado y navega
    reiniciarEjercicio();
    setPuntuacionesUsuario([]); // Resetea el historial de la sesión
    cambiarEjercicio(nuevoEjercicioId);
  };

  /**
   * Evalúa el trazado del usuario contra el modelo.
   */
  const calcularPrecision = useCallback(() => {
    if (coords.length < MIN_COORDS_PARA_EVALUAR || modeloTransformado.length === 0 || !ejercicioId) {
      setPuntuacion(null);
      return;
    }

    try {
      // Usamos la misma evaluación para ambas puntuaciones
      // Aplicamos una regla de "carril" para penalizar salir del camino
      const puntuacionCalculada = evaluarTrazadoGuiado(
        coords,
        modeloTransformado,
        ejercicioId,
        { anchoCarrilPx: 25, activarReglaCarril: true }
      );
      
      setPuntuacion(puntuacionCalculada);
      setPrecisionMedica(puntuacionCalculada); // Asumimos que es la misma por ahora
      setPuntuacionesUsuario(prev => [...prev, puntuacionCalculada]);
      
      // Análisis IA mock removido

    } catch (error) {
      console.error('❌ Error en calcularPrecision:', error);
      setPuntuacion(null);
    }
  }, [coords, modeloTransformado, ejercicioId]);

  // Hook para re-evaluar cuando el dibujo o el modelo cambian
  useEffect(() => {
    calcularPrecision();
  }, [calcularPrecision]); // Se dispara cuando las dependencias de calcularPrecision cambian

  /**
   * Guarda el progreso y navega al siguiente ejercicio, o muestra el resumen.
   */
  const manejarSiguienteEjercicio = async () => {
    await guardarCoordenadas();

    // Al avanzar, bloqueamos volver a ejercicios previos
    if (actualIndex >= 0) {
      const nuevoMin = Math.max(minIndexPermitido, actualIndex + 1);
      setMinIndexPermitido(nuevoMin);
      sessionStorage.setItem(storageKey, String(nuevoMin));
    }

    irASiguienteEjercicio(() => {
      // Esta es la función 'onFinalizar'
      setMostrarResumenIA(true);
    });
    
    // Reinicia el estado local para el próximo ejercicio (si hay uno)
    reiniciarEjercicio();
  };

  // --- Helpers de la UI ---

  const promedioUsuario = useMemo(() => 
    Math.round(
      puntuacionesUsuario.reduce((a, b) => a + b, 0) / (puntuacionesUsuario.length || 1)
    ), [puntuacionesUsuario]);

  const textoBotonSiguiente = ejercicioActual?.siguienteTexto || 'Siguiente';

  const getColorClass = (puntaje: number | null): string => {
    if (puntaje === null) return '';
    if (puntaje >= 80) return 'verde';
    if (puntaje >= 60) return 'amarillo-verdoso';
    return 'amarillo';
  };

  const getMensaje = (puntaje: number | null): string => {
    if (puntaje === null) return 'Sigue el trazo...';
    if (puntaje >= 80) return '¡Genial!';
    if (puntaje >= 60) return '¡Bien hecho!';
    return '¡Podrías mejorar!';
  };

  const manejarEvaluarConIA = () => {
    if (coords.length > MIN_COORDS_PARA_EVALUAR && modeloTransformado.length > 0) {
      setMostrarEvaluacionIA(true);
    }
  };

  // --- Renderizado ---

  return (
    <div className="figura-wrapper">
      <MenuEjercicio
        onReiniciar={() => {
          reiniciarEjercicio();
          setGrosorLinea(4);
        }}
        onVolverSeleccion={() => navigate('/actividades')}
        onCambiarAncho={setGrosorLinea}
        mostrarOpcionPosicion={false}
      />

      {/* Menú de selección de ejercicios (Estilo VMI: anterior/actual/siguiente) */}
      <div className="selector-nivel">
        {anteriorEjercicio && actualIndex > minIndexPermitido && (
          <button onClick={() => cambiarTipoLinea(anteriorEjercicio.id)}>
            ← {anteriorEjercicio.nombre}
          </button>
        )}
        <span className="actual">
          {ejercicioActual ? `${ejercicioActual.nombre}` : ejercicioId}
        </span>
        {siguienteEjercicio && (
          <button onClick={() => cambiarTipoLinea(siguienteEjercicio.id)}>
            {siguienteEjercicio.nombre} →
          </button>
        )}
      </div>

      <PizarraConSVG
        key={resetKey}
        onFinishDraw={setCoords}
        coordsModelo={modelo}
        onModeloTransformado={setModeloTransformado}
        background="#fff"
        color="black"
        lineWidth={grosorLinea}
        colorModelo="#aaaaaa"
        grosorModelo={10}
        grosorLineaCoordenadas={20} // Grosor específico para CoordinacionMotriz
        rellenarModelo={false}
        cerrarTrazo={false}
        suavizarModelo={true}
        ejercicioId={ejercicioId}
      />

      {/* Botón Siguiente (Clase CSS en lugar de inline-style) */}
      {coords.length > MIN_COORDS_PARA_EVALUAR && (
        <button 
          className="boton-flotante-siguiente" 
          onClick={manejarSiguienteEjercicio}
        >
          {textoBotonSiguiente}
        </button>
      )}
      

      {/* --- Modales --- */}

      {mostrarEvaluacionIA && modeloTransformado.length > 0 && (
        <EvaluacionIA
          coordenadasModelo={modeloTransformado}
          coordenadasPaciente={coords} // Ya no se necesita escalar/filtrar
          figuraObjetivo={ejercicioActual?.nombre || ejercicioId || 'Ejercicio'}
          puntuacionOriginal={puntuacion ? Math.round((puntuacion / 100) * 5) : 1}
          onClose={() => setMostrarEvaluacionIA(false)}
          onAceptarEvaluacion={(estrellasIA) => {
            // Esta lógica puede simplificarse si la IA solo da estrellas
            const nuevaPuntuacion = Math.round((estrellasIA / 5) * 100);
            setPuntuacion(nuevaPuntuacion);
          }}
        />
      )}

      {mostrarResumenIA && (
        <ResumenIA
          tipoEjercicio="Coordinación Motriz"
          nivel={nivelNumero}
          precisiones={puntuacionesUsuario}
          promedioPrecision={promedioUsuario}
          ejerciciosCompletados={puntuacionesUsuario.length}
          onClose={() => {
            setMostrarResumenIA(false);
            navigate('/actividades');
          }}
        />
      )}

      <ModalActualizacion
        isOpen={mostrarModalActualizacion}
        onClose={() => setMostrarModalActualizacion(false)}
        titulo="Área de Dibujo a la Izquierda"
        mensaje="La funcionalidad de evaluación cuando el área de dibujo está a la izquierda será implementada en las siguientes actualizaciones del sistema."
      />
    </div>
  );
};

export default CoordinacionMotriz;