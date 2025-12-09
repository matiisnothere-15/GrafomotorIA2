import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalPaciente } from '../../context/PacienteContext';
import ColumnaFiguras from '../../components/ColumnaFiguras';
import type { EvaluacionEscala } from '../../models/EvaluacionEscala';
import './CopiaFigura.css';

// Servicios
import { convertirPuntaje } from '../../services/escalaService';
import { crearEvaluacionEscala } from '../../services/evaluacionEscalaService';

// Sonidos
import next from '../../assets/sonidos/next.mp3';
import error from '../../assets/sonidos/error.mp3';
import dodo from '../../assets/sonidos/dodo.mp3';
import klick from '../../assets/sonidos/klick.mp3';
import ring from '../../assets/sonidos/ring.mp3';

// ================================ Importación de las figuras ==========================
// Figuras pagina 1
// Col1
import pag1col1fig1 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-1/1.svg';
import pag1col1fig2 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-1/2.svg';
// Col2
import pag1col2fig1 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-2/1.svg';
import pag1col2fig2 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-2/2.svg';
// Col3
import pag1col3fig1 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-3/1.svg';
import pag1col3fig2 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-3/2.svg';
// Col4
import pag1col4fig1 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-4/1.svg';
import pag1col4fig2 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-4/2.svg';
// Col5
import pag1col5fig1 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-5/1.svg';
import pag1col5fig2 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-5/2.svg';
// Col6
import pag1col6fig1 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-6/1.svg';
import pag1col6fig2 from '../../assets/ejercicios/percepcion-visual/pagina-1/columna-6/2.svg';

// figuras pagina 2
// Col1
import pag2col1fig1 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-1/1.svg';
import pag2col1fig2 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-1/2.svg';
import pag2col1fig3 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-1/3.svg';
// Col2
import pag2col2fig1 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-2/1.svg';
import pag2col2fig2 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-2/2.svg';
import pag2col2fig3 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-2/3.svg';
// Col3
import pag2col3fig1 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-3/1.svg';
import pag2col3fig2 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-3/2.svg';
import pag2col3fig3 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-3/3.svg';
// Col4
import pag2col4fig1 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-4/1.svg';
import pag2col4fig2 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-4/2.svg';
import pag2col4fig3 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-4/3.svg';
// Col5
import pag2col5fig1 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-5/1.svg';
import pag2col5fig2 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-5/2.svg';
import pag2col5fig3 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-5/3.svg';
import pag2col5fig4 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-5/4.svg';
// Col6
import pag2col6fig1 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-6/1.svg';
import pag2col6fig2 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-6/2.svg';
import pag2col6fig3 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-6/3.svg';
import pag2col6fig4 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-6/4.svg';
// Col7
import pag2col7fig1 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-7/1.svg';
import pag2col7fig2 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-7/2.svg';
import pag2col7fig3 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-7/3.svg';
import pag2col7fig4 from '../../assets/ejercicios/percepcion-visual/pagina-2/columna-7/4.svg';

// Figuras pagina 3
// Col1
import pag3col1fig1 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-1/1.svg';
import pag3col1fig2 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-1/2.svg';
import pag3col1fig3 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-1/3.svg';
import pag3col1fig4 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-1/4.svg';
import pag3col1fig5 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-1/5.svg';
// Col2
import pag3col2fig1 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-2/1.svg';
import pag3col2fig2 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-2/2.svg';
import pag3col2fig3 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-2/3.svg';
import pag3col2fig4 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-2/4.svg';
import pag3col2fig5 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-2/5.svg';
// Col3
import pag3col3fig1 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-3/1.svg';
import pag3col3fig2 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-3/2.svg';
import pag3col3fig3 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-3/3.svg';
import pag3col3fig4 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-3/4.svg';
import pag3col3fig5 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-3/5.svg';
// Col4
import pag3col4fig1 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-4/1.svg';
import pag3col4fig2 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-4/2.svg';
import pag3col4fig3 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-4/3.svg';
import pag3col4fig4 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-4/4.svg';
import pag3col4fig5 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-4/5.svg';
// Col5
import pag3col5fig1 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-5/1.svg';
import pag3col5fig2 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-5/2.svg';
import pag3col5fig3 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-5/3.svg';
import pag3col5fig4 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-5/4.svg';
import pag3col5fig5 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-5/5.svg';
// Col6
import pag3col6fig1 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-6/1.svg';
import pag3col6fig2 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-6/2.svg';
import pag3col6fig3 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-6/3.svg';
import pag3col6fig4 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-6/4.svg';
import pag3col6fig5 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-6/5.svg';
import pag3col6fig6 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-6/6.svg';
// Col7
import pag3col7fig1 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-7/1.svg';
import pag3col7fig2 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-7/2.svg';
import pag3col7fig3 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-7/3.svg';
import pag3col7fig4 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-7/4.svg';
import pag3col7fig5 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-7/5.svg';
import pag3col7fig6 from '../../assets/ejercicios/percepcion-visual/pagina-3/columna-7/6.svg';

// Figuras pagina 4
// Col1
import pag4col1fig1 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-1/1.svg';
import pag4col1fig2 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-1/2.svg';
import pag4col1fig3 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-1/3.svg';
import pag4col1fig4 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-1/4.svg';
import pag4col1fig5 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-1/5.svg';
import pag4col1fig6 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-1/6.svg';
// Col2
import pag4col2fig1 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-2/1.svg';
import pag4col2fig2 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-2/2.svg';
import pag4col2fig3 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-2/3.svg';
import pag4col2fig4 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-2/4.svg';
import pag4col2fig5 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-2/5.svg';
import pag4col2fig6 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-2/6.svg';
// Col3
import pag4col3fig1 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-3/1.svg';
import pag4col3fig2 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-3/2.svg';
import pag4col3fig3 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-3/3.svg';
import pag4col3fig4 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-3/4.svg';
import pag4col3fig5 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-3/5.svg';
import pag4col3fig6 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-3/6.svg';
// Col4
import pag4col4fig1 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-4/1.svg';
import pag4col4fig2 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-4/2.svg';
import pag4col4fig3 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-4/3.svg';
import pag4col4fig4 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-4/4.svg';
import pag4col4fig5 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-4/5.svg';
import pag4col4fig6 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-4/6.svg';
// Col5
import pag4col5fig1 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-5/1.svg';
import pag4col5fig2 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-5/2.svg';
import pag4col5fig3 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-5/3.svg';
import pag4col5fig4 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-5/4.svg';
import pag4col5fig5 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-5/5.svg';
import pag4col5fig6 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-5/6.svg';
import pag4col5fig7 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-5/7.svg';
// Col6
import pag4col6fig1 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-6/1.svg';
import pag4col6fig2 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-6/2.svg';
import pag4col6fig3 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-6/3.svg'; 
import pag4col6fig4 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-6/4.svg';
import pag4col6fig5 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-6/5.svg';
import pag4col6fig6 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-6/6.svg';
import pag4col6fig7 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-6/7.svg';
// Col7
import pag4col7fig1 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-7/1.svg';
import pag4col7fig2 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-7/2.svg';
import pag4col7fig3 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-7/3.svg';
import pag4col7fig4 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-7/4.svg';
import pag4col7fig5 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-7/5.svg';
import pag4col7fig6 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-7/6.svg';
import pag4col7fig7 from '../../assets/ejercicios/percepcion-visual/pagina-4/columna-7/7.svg';

const PercepcionVisual: React.FC = () => {
  // ============================== Definición de las columnas y figuras ==============================
  // Columnas de figuras por página
  const columnas = [
    [
      { images: [pag1col1fig1, pag1col1fig2, pag1col1fig1], size: 120, posicionFiguraCorrecta: 2 },
      { images: [pag1col2fig1, pag1col2fig1, pag1col2fig2], size: 120, posicionFiguraCorrecta: 1 },
      { images: [pag1col3fig1, pag1col3fig2, pag1col3fig1], size: 120, posicionFiguraCorrecta: 2 },
      { images: [pag1col4fig1, pag1col4fig1, pag1col4fig2], size: 120, posicionFiguraCorrecta: 1 },
      { images: [pag1col5fig2, pag1col5fig1, pag1col5fig2], size: 120, posicionFiguraCorrecta: 2 },
      { images: [pag1col6fig1, pag1col6fig1, pag1col6fig2], size: 120, posicionFiguraCorrecta: 1 }
    ],
    [
      { images: [pag2col1fig2, pag2col1fig1, pag2col1fig2, pag2col1fig3], size: 120, posicionFiguraCorrecta: 2 },
      { images: [pag2col2fig3, pag2col2fig1, pag2col2fig2, pag2col2fig3], size: 120, posicionFiguraCorrecta: 3 },
      { images: [pag2col3fig3, pag2col3fig1, pag2col3fig2, pag2col3fig3], size: 120, posicionFiguraCorrecta: 3 },
      { images: [pag2col4fig2, pag2col4fig1, pag2col4fig2, pag2col4fig3], size: 120, posicionFiguraCorrecta: 2 },
      { images: [pag2col5fig3, pag2col5fig1, pag2col5fig2, pag2col5fig3, pag2col5fig4], size: 85, posicionFiguraCorrecta: 3 },
      { images: [pag2col6fig2, pag2col6fig1, pag2col6fig2, pag2col6fig3, pag2col6fig4], size: 85, posicionFiguraCorrecta: 2 },
      { images: [pag2col7fig4, pag2col7fig1, pag2col7fig2, pag2col7fig3, pag2col7fig4], size: 85, posicionFiguraCorrecta: 4 }
    ],
    [
      { images: [pag3col1fig3, pag3col1fig1, pag3col1fig2, pag3col1fig3, pag3col1fig4, pag3col1fig5], size: 85, posicionFiguraCorrecta: 3 },
      { images: [pag3col2fig4, pag3col2fig1, pag3col2fig2, pag3col2fig3, pag3col2fig4, pag3col2fig5], size: 85, posicionFiguraCorrecta: 4 },
      { images: [pag3col3fig2, pag3col3fig1, pag3col3fig2, pag3col3fig3, pag3col3fig4, pag3col3fig5], size: 85, posicionFiguraCorrecta: 2 },
      { images: [pag3col4fig5, pag3col4fig1, pag3col4fig2, pag3col4fig3, pag3col4fig4, pag3col4fig5], size: 85, posicionFiguraCorrecta: 5 },
      { images: [pag3col5fig5, pag3col5fig1, pag3col5fig2, pag3col5fig3, pag3col5fig4, pag3col5fig5], size: 85, posicionFiguraCorrecta: 5 },
      { images: [pag3col6fig4, pag3col6fig1, pag3col6fig2, pag3col6fig3, pag3col6fig4, pag3col6fig5, pag3col6fig6], size: 70, posicionFiguraCorrecta: 4 },
      { images: [pag3col7fig3, pag3col7fig1, pag3col7fig2, pag3col7fig3, pag3col7fig4, pag3col7fig5, pag3col7fig6], size: 70, posicionFiguraCorrecta: 3 }
    ],
    [
      { images: [pag4col1fig5, pag4col1fig1, pag4col1fig2, pag4col1fig3, pag4col1fig4, pag4col1fig5, pag4col1fig6], size: 70, posicionFiguraCorrecta: 5 },
      { images: [pag4col2fig3, pag4col2fig1, pag4col2fig2, pag4col2fig3, pag4col2fig4, pag4col2fig5, pag4col2fig6], size: 70, posicionFiguraCorrecta: 3 },
      { images: [pag4col3fig5, pag4col3fig1, pag4col3fig2, pag4col3fig3, pag4col3fig4, pag4col3fig5, pag4col3fig6], size: 70, posicionFiguraCorrecta: 5 },
      { images: [pag4col4fig3, pag4col4fig1, pag4col4fig2, pag4col4fig3, pag4col4fig4, pag4col4fig5, pag4col4fig6], size: 70, posicionFiguraCorrecta: 3 },
      { images: [pag4col5fig7, pag4col5fig1, pag4col5fig2, pag4col5fig3, pag4col5fig4, pag4col5fig5, pag4col5fig6, pag4col5fig7], size: 70, posicionFiguraCorrecta: 7 },
      { images: [pag4col6fig6, pag4col6fig1, pag4col6fig2, pag4col6fig3, pag4col6fig4, pag4col6fig5, pag4col6fig6, pag4col6fig7], size: 70, posicionFiguraCorrecta: 6 },
      { images: [pag4col7fig3, pag4col7fig1, pag4col7fig2, pag4col7fig3, pag4col7fig4, pag4col7fig5, pag4col7fig6, pag4col7fig7], size: 70, posicionFiguraCorrecta: 3 }
    ]
  ];

  const { edad_mes, id } = useGlobalPaciente();

  // ============================== Funciones de navegación ==============================
  const [modalError, setModalError] = useState(false);
  const [modalTiempoFinalizado, setModalTiempoFinalizado] = useState(false);
  const [modalResultados, setModalResultados] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [puntaje, setPuntaje] = useState<number | undefined>(0);
  let puntaje2 = 0;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Temporizador (10 minutos = 600 segundos)
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [timerActive, setTimerActive] = useState<boolean>(true);

  // Edad y mes paciente
  const [edad, setEdad] = useState<String | null>(null);
  const [mes, setMes] = useState<String | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }

    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [pagina]);

  const [totalCorrectas, setTotalCorrectas] = useState(0);
  const [totalPreguntas, setTotalPreguntas] = useState(0);

  const audio = new Audio(next);
  const dodoAudio = new Audio(dodo);
  const audioError = new Audio(error);
  const klickAudio = new Audio(klick);
  const ringAudio = new Audio(ring);

  const siguienteEjercicio = async () => {
    let correctasTotales = 0;
    let totalPreguntas = 0;
    let totalincorrectas = 0;
    validacionesPorPagina.forEach((validaciones) => {
      const correctas = validaciones.filter(v => v).length;
      const total = validaciones.length;
      correctasTotales += correctas;
      puntaje2 += correctas;
      totalPreguntas += total;
      totalincorrectas += (total - correctas);
      setTotalCorrectas(correctasTotales);
      setTotalPreguntas(totalPreguntas);
    });

    if (pagina < columnas.length - 1) {
      console.log(totalincorrectas)
      if (totalincorrectas >= 3) {
        audioError.play();
        setTimerActive(false);
        setModalError(true);
        return;
      } else {
        setPagina((prev) => prev + 1);
        audio.play();
      }
    } else {
      if (totalincorrectas >= 3) {
        audioError.play();
        setTimerActive(false);
        setModalError(true);
        return;
      } else {
        setTimerActive(false);
        const resultado = await convertirPuntaje("pv", puntaje2.toString(), edad_mes!);
        const valor: string | null = edad_mes;
        if (!valor) {
          throw new Error("El valor de la edad y mes del paciente esta vacio");
        }
        const [edad, mes] = valor?.split("-");
        setEdad(edad);
        setMes(mes);
        setPuntaje(resultado.puntaje);
        setModalResultados(true);

        // Guardando evaluacion
        const datos: EvaluacionEscala = {
          fecha: new Date().toISOString().split("T")[0],
          tipo_escala: "Percepcion Visual",
          resultado: null,
          puntaje: resultado.puntaje,
          id_paciente: Number(id),
          id_ejercicio: 28
        };

        await crearEvaluacionEscala(datos);

        dodoAudio.play();
      }
    }
  };

  const irAlHome = () => {
    klickAudio.play();
    navigate('/actividades');
  };

  const reiniciarActividad = () => {
    klickAudio.play();
    setModalError(false);
    setModalTiempoFinalizado(false);
    setPagina(0);
    setValidacionesPorPagina([]);
    setResetSignal((s) => s + 1);
    // Reiniciar temporizador a 10:00
    setSecondsLeft(600);
    setTimerActive(true);
  };

  // Efecto del temporizador: decrementa cada segundo mientras esté activo
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // tiempo finalizado
          clearInterval(interval);
          setTimerActive(false);
          // notificar al usuario
          ringAudio.play();
          setModalTiempoFinalizado(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ============================== Funciones de validación ==============================
  const [validacionesPorPagina, setValidacionesPorPagina] = useState<(boolean | undefined)[][]>([]);

  const manejarValidacion = (paginaIndex: number, figuraIndex: number, esValido: boolean) => {
    setValidacionesPorPagina((prev) => {
      const nuevo = [...prev];
      
      if (!nuevo[paginaIndex]) {
        nuevo[paginaIndex] = [];
      }

      nuevo[paginaIndex][figuraIndex] = esValido;

      return nuevo;
    });
  };

  // Verificar si la página actual está completa
  const validacionesPaginaActual = validacionesPorPagina[pagina] || [];
  const paginaCompleta = validacionesPaginaActual.length === columnas[pagina].length && !validacionesPaginaActual.includes(undefined);

  // Índice para numerar columnas entre páginas
  const baseIndex = columnas.slice(0, pagina).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#ffffffff', minHeight: '100vh', alignItems: 'center', overflow: 'scroll', width: '100%' }}>

      {/* Botón "Salir" del ejercicio arriba a la izquierda */}
      <button
        className="home-btn"
        onClick={irAlHome}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000
        }}
      >
        Salir
      </button>

      {/* Temporizador */}
      <div
        className="home-btn"
        style={{
          fontWeight: 'bolder',
          position: 'fixed',
          top: '20px',
          fontSize: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        <p style={{ margin: 0 }}>{formatTime(secondsLeft)}</p>
      </div>

      {/* Columna de imagenes: fila horizontal con scroll en pantallas pequeñas/tablet */}
      <div ref={containerRef} className='columnas'>
        {columnas[pagina].map((columna, idx) => (
          <div key={`${pagina}-${idx}`} style={{ flex: '0 0 auto', marginTop: '50px' }}>
            <p style={{fontWeight: 'bolder', textAlign: "center"}}>{baseIndex + idx + 1}</p>
            <ColumnaFiguras
              images={columna.images}
              size={columna.size}
              posicionFiguraCorrecta={columna.posicionFiguraCorrecta}
              onValidacion={(esValido) => manejarValidacion(pagina, idx, esValido)}
              resetSignal={resetSignal}
            />
          </div>
        ))}
      </div>

      {/* Botón "Siguiente" arriba a la derecha */}
      {
        paginaCompleta && (
          <button
            className="guardar-btn"
            onClick={siguienteEjercicio}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000
            }}
          >
            Siguiente Página
          </button>
        )
      }

      {/*Modal de error*/}
      {
        modalError

        &&

        <div className='modal'>
          <div className='modal-contenido-pacientes'>
            <h3>¡Oh no! Has cometido el máximo de 3 errores en esta actividad.</h3>
            <div className="campo">
              ¡Pero no te desanimes! Puedes volver a intentarlo de nuevo, ¿quieres regresar a la pantalla de actividades o volver a intentarlo?
            </div>

            <div className="modal-acciones">
              <button style={{ backgroundColor: "red", color: "white" }} onClick={reiniciarActividad}>Volver a iniciar</button>
              <button style={{ backgroundColor: "gray", color: "white" }} onClick={irAlHome}>Salir</button>
            </div>
          </div>
        </div>
      }

      {/*Modal tiempo finalizado*/}
      {
        modalTiempoFinalizado

        &&

        <div className='modal'>
          <div className='modal-contenido-pacientes'>
            <h3>¡El tiempo para completar la actividad a finalizado! ⏰</h3>
            <div className="campo">
              ¡Pero no te desanimes! Puedes volver a intentarlo de nuevo, ¿quieres regresar a la pantalla de actividades o volver a intentarlo?
            </div>

            <div className="modal-acciones">
              <button style={{ backgroundColor: "red", color: "white" }} onClick={reiniciarActividad}>Volver a iniciar</button>
              <button style={{ backgroundColor: "gray", color: "white" }} onClick={irAlHome}>Salir</button>
            </div>
          </div>
        </div>
      }

      {/*Modal de resultados*/}
      {
        modalResultados

        &&

        <div className='modal'>
          <div className='modal-contenido-pacientes'>
            <h3>¡Felicitaciones por completar la actividad!</h3>
            <div className="campo">
              <p>Respuestas correctas: {totalCorrectas} de {totalPreguntas} preguntas.</p>
              <p>Edad: {edad} años {mes} meses</p>
              <p>Puntuación escala: {puntaje}</p>
            </div>
            <div className="modal-acciones">
              <button style={{ backgroundColor: "red", color: "white" }} onClick={irAlHome}>Salir</button>
            </div>
          </div>
        </div>
      }

    </div>
  );
};

export default PercepcionVisual;