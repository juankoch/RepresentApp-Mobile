import { createContext, ReactNode, useContext, useMemo } from 'react';

type PlayerTrialsContextValue = {
  resetSession: () => void;
};

const PlayerTrialsContext = createContext<PlayerTrialsContextValue | undefined>(
  undefined,
);

export function PlayerTrialsProvider({ children }: { children: ReactNode }) {
  const value = useMemo<PlayerTrialsContextValue>(
    () => ({
      resetSession: () => undefined,
    }),
    [],
  );

  return (
    <PlayerTrialsContext.Provider value={value}>
      {children}
    </PlayerTrialsContext.Provider>
  );
}

export function usePlayerTrials() {
  const context = useContext(PlayerTrialsContext);
  if (!context) {
    throw new Error('usePlayerTrials must be used within PlayerTrialsProvider');
  }
  return context;
}
