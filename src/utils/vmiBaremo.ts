// Utilidad para calcular edad y rango para VMI

export const calcularEdadCronologica = (fechaNacimiento: string): { anios: number, meses: number } => {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  
  if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
    anios--;
    meses += 12;
  }
  
  // Ajuste de días para meses
  if (hoy.getDate() < nacimiento.getDate()) {
    meses--;
    if (meses < 0) {
      meses = 11;
      anios--; // Esto ya debería estar cubierto arriba, pero por seguridad
    }
  }
  
  return { anios, meses };
};

export const obtenerRangoEdadVMI = (fechaNacimiento: string): string | null => {
  const { anios, meses } = calcularEdadCronologica(fechaNacimiento);
  
  // Formato exacto de la base de datos: "Año-Mes" (ej. "4-0", "4-1", "3-10")
  return `${anios}-${meses}`;
};
