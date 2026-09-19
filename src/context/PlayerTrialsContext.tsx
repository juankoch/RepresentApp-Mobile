import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import {
  getPlayerTrialById,
  initialPublishedTrials,
  PlayerTrial,
  playerTrials,
} from '../data/playerTrials';

type PlayerTrialsContextValue = {
  appliedTrialIds: string[];
  applyToTrial: (trialId: string) => void;
  hasApplied: (trialId: string) => boolean;
  publishedTrials: PlayerTrial[];
  publishTrial: (trial: Omit<PlayerTrial, 'id' | 'crest' | 'hero'>) => void;
  getTrial: (trialId: string) => PlayerTrial | undefined;
  resetSession: () => void;
};

const PlayerTrialsContext = createContext<PlayerTrialsContextValue | undefined>(
  undefined,
);

export function PlayerTrialsProvider({ children }: { children: ReactNode }) {
  const [appliedTrialIds, setAppliedTrialIds] = useState<string[]>([]);
  const [publishedTrials, setPublishedTrials] = useState(initialPublishedTrials);

  const value = useMemo<PlayerTrialsContextValue>(
    () => ({
      appliedTrialIds,
      applyToTrial: (trialId: string) => {
        setAppliedTrialIds((current) =>
          current.includes(trialId) ? current : [...current, trialId],
        );
      },
      hasApplied: (trialId: string) => appliedTrialIds.includes(trialId),
      publishedTrials,
      publishTrial: (trial) => {
        const id = `published-${Date.now()}`;
        setPublishedTrials((current) => [
          {
            ...trial,
            id,
            crest: require('../../assets/mock/agent-marco.png'),
            hero: require('../../assets/mock/trial-hero.png'),
            status: 'active',
            applicants: 0,
            applicantIds: [],
          },
          ...current,
        ]);
      },
      getTrial: (trialId) =>
        publishedTrials.find((trial) => trial.id === trialId) ??
        getPlayerTrialById(trialId) ??
        playerTrials.find((trial) => trial.id === trialId),
      resetSession: () => {
        setAppliedTrialIds([]);
        setPublishedTrials(initialPublishedTrials);
      },
    }),
    [appliedTrialIds, publishedTrials],
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
