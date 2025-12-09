// StarContext.tsx
import React, { createContext, useContext, useState } from "react";

interface StarContextType {
  numStars: number;
  setNumStars: (value: number) => void;
}

const StarContext = createContext<StarContextType | undefined>(undefined);

export const StarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [numStars, setNumStars] = useState(0);
  return (
    <StarContext.Provider value={{ numStars, setNumStars }}>
      {children}
    </StarContext.Provider>
  );
};

export const useStar = () => {
  const context = useContext(StarContext);
  if (!context) throw new Error("useStar must be used within a StarProvider");
  return context;
};