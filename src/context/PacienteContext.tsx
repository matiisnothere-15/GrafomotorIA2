import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type PacienteContextType = {
  id: string | null;
  nombre: string | null;
  edad_mes: string | null;
  setGlobalPaciente: (id: string, nombre: string, anio_mes: string) => void;
  limpiarPaciente: () => void;
};

const PacienteContext = createContext<PacienteContextType | undefined>(undefined);

export const PacienteProvider = ({ children }: { children: ReactNode }) => {
  const [id, setId] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [edad_mes, setAnioMes] = useState<string | null>(null);

  const setGlobalPaciente = (id: string, nombre: string, edad_mes: string) => {
    setId(id);
    setNombre(nombre);
    setAnioMes(edad_mes);
  };

  const limpiarPaciente = () => {
    setId(null);
    setNombre(null);
  };

  return (
    <PacienteContext.Provider value={{ id, nombre, edad_mes, setGlobalPaciente, limpiarPaciente }}>
      {children}
    </PacienteContext.Provider>
  );
};

export const useGlobalPaciente = () => {
  const context = useContext(PacienteContext);
  if (!context) throw new Error("usePaciente debe usarse dentro de PacienteProvider");
  return context;
};