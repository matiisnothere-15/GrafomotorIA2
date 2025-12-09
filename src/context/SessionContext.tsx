import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SessionResult {
  ejercicioId: number;
  nombre: string;
  figura: string;
  score: number; // Estrellas (0-5)
  metrics: any; // Respuesta completa del backend
  ai_feedback?: {
    observacion_clinica?: string;
    recomendaciones?: string[];
    puntuacion_ia?: number;
    conclusion?: string;
  };
  timestamp: Date;
}

interface SessionContextType {
  results: SessionResult[];
  addResult: (result: SessionResult) => void;
  clearResults: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [results, setResults] = useState<SessionResult[]>([]);

  const addResult = (result: SessionResult) => {
    setResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <SessionContext.Provider value={{ results, addResult, clearResults }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession debe usarse dentro de un SessionProvider');
  }
  return context;
};
