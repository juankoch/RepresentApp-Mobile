export type PlayerTrial = {
  id: string;
  name: string;
  club: string;
  date: string;
  ageRange: string;
  location: string;
  evaluationType: string;
  description: string;
  crest?: number;
  hero?: number;
  status?: 'active' | 'finished';
  applicants?: number;
  applicantIds?: string[];
};

export const playerTrials: PlayerTrial[] = [];
export const initialPublishedTrials: PlayerTrial[] = [];

export function getPlayerTrialById(id: string) {
  return (
    playerTrials.find((trial) => trial.id === id) ??
    initialPublishedTrials.find((trial) => trial.id === id)
  );
}
