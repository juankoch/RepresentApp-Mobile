import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type PlayerTrialsContextValue = {
  appliedTrialIds: string[];
  applyToTrial: (trialId: string) => void;
  hasApplied: (trialId: string) => boolean;
};

const PlayerTrialsContext = createContext<PlayerTrialsContextValue | undefined>(
  undefined,
);

export function PlayerTrialsProvider({ children }: { children: ReactNode }) {
  const [appliedTrialIds, setAppliedTrialIds] = useState<string[]>([]);

  const value = useMemo<PlayerTrialsContextValue>(
    () => ({
      appliedTrialIds,
      applyToTrial: (trialId: string) => {
        setAppliedTrialIds((current) =>
          current.includes(trialId) ? current : [...current, trialId],
        );
      },
      hasApplied: (trialId: string) => appliedTrialIds.includes(trialId),
    }),
    [appliedTrialIds],
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
