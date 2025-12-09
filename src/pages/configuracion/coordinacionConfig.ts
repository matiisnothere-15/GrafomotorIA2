/**
 * Define la estructura de un ejercicio de coordinación.
 */
export interface EjercicioCoordinacion {
  id: string; // El identificador usado en la URL y para las coordenadas (ej: 'lineas_horizontales')
  nombre: string; // El nombre para mostrar en la UI (ej: 'Líneas Horizontales')
  dbId: number; // El ID numérico exacto que espera la base de datos
  siguienteTexto?: string; // Texto para el botón "siguiente"
}

/**
 * Define la estructura de todos los ejercicios, organizados por nivel.
 * Esta es ahora la "Fuente Única de Verdad".
 * * Ventajas:
 * - Añadir/quitar/reordenar ejercicios es tan simple como editar este array.
 * - No más lógica de 'actualIndex' o cálculos de ID en el componente.
 * - El dbId es explícito, eliminando el "código mágico" (ej: nivel * 3 + 1).
 */
export const EJERCICIOS_NIVEL: Record<number, EjercicioCoordinacion[]> = {
  1: [
    { id: 'lineas_horizontales', nombre: 'Líneas Horizontales', dbId: 1, siguienteTexto: 'Ir a Verticales' },
    { id: 'lineas_verticales', nombre: 'Líneas Verticales', dbId: 2, siguienteTexto: 'Ir a Diagonales' },
    { id: 'lineas_diagonales', nombre: 'Líneas Diagonales', dbId: 3, siguienteTexto: 'Ir a Círculo' },
    { id: 'circulo', nombre: 'Círculo', dbId: 4, siguienteTexto: 'Ir a Cuadrado' },
    { id: 'cuadrado', nombre: 'Cuadrado', dbId: 5, siguienteTexto: 'Ir a X' },
    { id: 'linea_x', nombre: 'Línea X', dbId: 6, siguienteTexto: 'Ir a Triángulo' },
    { id: 'triangulo', nombre: 'Triángulo', dbId: 7, siguienteTexto: 'Ir a Cruz' },
    { id: 'cruz', nombre: 'Cruz', dbId: 8, siguienteTexto: 'Finalizar' },
  ],
  2: [
    // Asumiendo que el Nivel 2 tiene sus propios IDs de BD
    { id: 'lineas_verticales', nombre: 'Líneas Verticales', dbId: 5, siguienteTexto: 'Ir a Diagonales' },
    { id: 'lineas_diagonales', nombre: 'Líneas Diagonales', dbId: 6, siguienteTexto: 'Ir a Círculo' },
    { id: 'circulo', nombre: 'Círculo', dbId: 7, siguienteTexto: 'Finalizar' },
  ],
  3: [
    // ...y así sucesivamente
    { id: 'lineas_horizontales', nombre: 'Líneas Horizontales', dbId: 8, siguienteTexto: 'Ir a Verticales' },
    { id: 'lineas_verticales', nombre: 'Líneas Verticales', dbId: 9, siguienteTexto: 'Ir a Diagonales' },
    { id: 'lineas_diagonales', nombre: 'Líneas Diagonales', dbId: 10, siguienteTexto: 'Ir a Círculo' },
    { id: 'circulo', nombre: 'Círculo', dbId: 11, siguienteTexto: 'Finalizar' },
  ],
};