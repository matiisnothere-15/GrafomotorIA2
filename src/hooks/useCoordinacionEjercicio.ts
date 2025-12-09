import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EJERCICIOS_NIVEL } from '../pages/configuracion/coordinacionConfig';
import type { EjercicioCoordinacion } from '../pages/configuracion/coordinacionConfig';
import { modelosCoordinacion } from '../components/coordenadasModelos';


export const useCoordinacionEjercicio = () => {
  const { nivel, ejercicio } = useParams<{ nivel: string; ejercicio: string }>();
  const navigate = useNavigate();

  // 1. Extraer datos de la URL
  const nivelNumero = useMemo(() => Number((nivel || '').replace(/[^\d]/g, '') || 1), [nivel]);
  const ejercicioId = ejercicio || '';

  // 2. Obtener configuración del ejercicio
  const ejerciciosDelNivel = useMemo(() => EJERCICIOS_NIVEL[nivelNumero] || [], [nivelNumero]);
  
  const ejercicioActual = useMemo((): EjercicioCoordinacion | undefined => 
    ejerciciosDelNivel.find(e => e.id === ejercicioId),
    [ejerciciosDelNivel, ejercicioId]
  );

  const modelo = useMemo(() => 
    modelosCoordinacion[ejercicioId], 
    [ejercicioId]
  );

  // 3. Lógica de Navegación
  const actualIndex = ejercicioActual ? ejerciciosDelNivel.indexOf(ejercicioActual) : -1;
  const siguienteEjercicio = actualIndex !== -1 && actualIndex < ejerciciosDelNivel.length - 1 
    ? ejerciciosDelNivel[actualIndex + 1] 
    : null;
  const anteriorEjercicio = actualIndex !== -1 && actualIndex > 0 
    ? ejerciciosDelNivel[actualIndex - 1] 
    : null;

  const cambiarEjercicio = (nuevoEjercicioId: string) => {
    if (nuevoEjercicioId !== ejercicioId) {
      navigate(`/coordinacion-motriz/nivel${nivelNumero}/${nuevoEjercicioId}`);
    }
  };


  const irASiguienteEjercicio = (onFinalizar: () => void) => {
    if (siguienteEjercicio) {
      cambiarEjercicio(siguienteEjercicio.id);
    } else {
      onFinalizar();
    }
  };

  return {
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
  };
};