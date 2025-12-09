export interface Escala {
  puntaje_raw?: number;
  edad_mes?: string;
  puntaje_estandar?: number | string;
  puntaje?: number; // Mantener por compatibilidad si se usa en otro lado
  puntaje_raw_calculado?: number;
  edad_calculada?: string;
}