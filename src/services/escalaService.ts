import type { Escala } from "../models/Escala"
import { BASE_URL, getHeaders } from "./api"

// POST: Convertir puntaje a escala por edad y mes (o por id_paciente automático)
export const convertirPuntaje = async (
    tipo_ejercicio: string, 
    puntaje_raw?: string | number, 
    edad_mes?: string,
    id_paciente?: number | string
): Promise<Escala> => {
    const data: any = {
        tipo_ejercicio
    };

    // Según la definición del backend, se espera: tipo_ejercicio, puntaje, edad_mes
    // No se menciona id_paciente para la conversión pura.
    /*
    if (id_paciente !== undefined && id_paciente !== null) {
        data.id_paciente = Number(id_paciente);
    }
    */
    
    if (puntaje_raw !== undefined) {
        data.puntaje_raw = puntaje_raw;
        data.puntaje = puntaje_raw; // Clave requerida por el backend python
    }
    if (edad_mes !== undefined) {
        data.edad_mes = edad_mes;
        data.anio_mes = edad_mes; // El backend usa el argumento anio_mes
    }

    console.log("📤 Enviando payload a convertir_puntaje:", data);

    const res = await fetch(`${BASE_URL}/escala/convertir_puntaje`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.msg || "Error al crear ejercicio")
    }

    return await res.json()
}