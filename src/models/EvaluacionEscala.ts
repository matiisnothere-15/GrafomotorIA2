export interface EvaluacionEscala {
  fecha: string;
  tipo_escala: string;
  resultado: JSON | null;
  puntaje: number | undefined;
  id_paciente: number;
  id_ejercicio: number;
}
