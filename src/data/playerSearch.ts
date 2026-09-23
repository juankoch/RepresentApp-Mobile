export type SearchResultKind = 'player' | 'agent' | 'club';

export type SearchResult = {
  id: string;
  name: string;
  kind: SearchResultKind;
  subtitle: string;
  photo?: number;
  photoUrl?: string;
  isPremium?: boolean;
};

export const playerSearchResults: SearchResult[] = [];
export const initialRecentSearches: string[] = [];
