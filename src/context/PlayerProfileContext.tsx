import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import {
  highlightCatalog,
  PlayerHighlight,
} from '../data/playerHighlights';
import {
  agentConnectedIds,
  agentIncomingRequestIds,
  currentAgentProfile,
  currentPlayerProfile,
  getUserProfileById,
  initialConnectedIds,
  initialIncomingRequestIds,
  isOwnProfileId,
  OWN_PROFILE_ID,
  UserProfile,
} from '../data/playerProfiles';
import { supabase } from '../lib/supabase';
import { UserRole } from '../theme/brand';

export type UserRating = {
  stars: number;
  comment: string;
};

type PlayerProfileContextValue = {
  role: UserRole;
  startSession: (nextRole: UserRole, profileUpdates?: Partial<UserProfile>) => void;
  currentProfile: UserProfile;
  getProfile: (userId: string) => UserProfile | undefined;
  isOwnProfile: (userId?: string) => boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  sentRequestIds: string[];
  incomingRequestIds: string[];
  connectedIds: string[];
  sendRequest: (userId: string) => void;
  hasSentRequest: (userId: string) => boolean;
  acceptIncomingRequest: (userId: string) => void;
  rejectIncomingRequest: (userId: string) => void;
  isConnected: (userId: string) => boolean;
  isPremium: boolean;
  activatePremium: () => void;
  ratings: Record<string, UserRating>;
  rateUser: (userId: string, stars: number, comment: string) => void;
  getRating: (userId: string) => UserRating | undefined;
  reportedIds: string[];
  reportUser: (userId: string) => void;
  hasReported: (userId: string) => boolean;
  blockedIds: string[];
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
  highlights: PlayerHighlight[];
  addHighlight: () => void;
  resetSession: () => void;
};

const PlayerProfileContext = createContext<PlayerProfileContextValue | undefined>(
  undefined,
);

export async function fetchCreatedProfileKind(userId: string) {
  const { data: player, error: playerError } = await supabase
    .from('perfiles_jugador')
    .select('id_usuario')
    .eq('id_usuario', userId)
    .maybeSingle();

  if (playerError) {
    return { kind: null, error: playerError };
  }
  if (player) {
    return { kind: 'player' as const, error: null };
  }

  const { data: agent, error: agentError } = await supabase
    .from('perfiles_representante')
    .select('id_usuario')
    .eq('id_usuario', userId)
    .maybeSingle();

  if (agentError) {
    return { kind: null, error: agentError };
  }
  if (agent) {
    return { kind: 'agent' as const, error: null };
  }

  return { kind: null, error: null };
}

function emptySessionState(role: UserRole) {
  return {
    currentProfile:
      role === 'agent' ? currentAgentProfile : currentPlayerProfile,
    incomingRequestIds:
      role === 'agent' ? agentIncomingRequestIds : initialIncomingRequestIds,
    connectedIds: role === 'agent' ? agentConnectedIds : initialConnectedIds,
  };
}

export function PlayerProfileProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('player');
  const [currentProfile, setCurrentProfile] = useState<UserProfile>({
    ...currentPlayerProfile,
    name: '',
    email: '',
    location: '',
    about: '',
  });
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [incomingRequestIds, setIncomingRequestIds] = useState(
    initialIncomingRequestIds,
  );
  const [connectedIds, setConnectedIds] = useState(initialConnectedIds);
  const [isPremium, setIsPremium] = useState(false);
  const [ratings, setRatings] = useState<Record<string, UserRating>>({});
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<PlayerHighlight[]>([]);

  function applyRole(nextRole: UserRole, profileUpdates?: Partial<UserProfile>) {
    const next = emptySessionState(nextRole);
    setRole(nextRole);
    setCurrentProfile({
      ...next.currentProfile,
      ...profileUpdates,
      id: OWN_PROFILE_ID,
      kind: nextRole === 'agent' ? 'agent' : 'player',
      name: profileUpdates?.name?.trim() || '',
      email: profileUpdates?.email?.trim() || '',
      location: profileUpdates?.location?.trim() || '',
      about: profileUpdates?.about?.trim() || '',
      birthDate: profileUpdates?.birthDate,
      fields: profileUpdates?.fields ?? next.currentProfile.fields,
      stats: profileUpdates?.stats ?? next.currentProfile.stats,
    });
    setSentRequestIds([]);
    setIncomingRequestIds(next.incomingRequestIds);
    setConnectedIds(next.connectedIds);
    setIsPremium(false);
    setRatings({});
    setReportedIds([]);
    setBlockedIds([]);
    setHighlights([]);
  }

  const value = useMemo<PlayerProfileContextValue>(
    () => ({
      role,
      startSession: applyRole,
      currentProfile,
      getProfile: (userId) =>
        isOwnProfileId(userId) ? currentProfile : getUserProfileById(userId),
      isOwnProfile: isOwnProfileId,
      updateProfile: (updates) => {
        setCurrentProfile((current) => ({
          ...current,
          ...updates,
          fields: updates.fields ?? current.fields,
          stats: updates.stats ?? current.stats,
        }));
      },
      sentRequestIds,
      incomingRequestIds,
      connectedIds,
      sendRequest: (userId) => {
        if (isOwnProfileId(userId) || blockedIds.includes(userId)) {
          return;
        }
        if (connectedIds.includes(userId) || incomingRequestIds.includes(userId)) {
          return;
        }
        setSentRequestIds((current) =>
          current.includes(userId) ? current : [...current, userId],
        );
      },
      hasSentRequest: (userId) => sentRequestIds.includes(userId),
      acceptIncomingRequest: (userId) => {
        if (blockedIds.includes(userId)) {
          return;
        }
        setIncomingRequestIds((current) =>
          current.filter((id) => id !== userId),
        );
        setSentRequestIds((current) => current.filter((id) => id !== userId));
        setConnectedIds((current) =>
          current.includes(userId) ? current : [...current, userId],
        );
      },
      rejectIncomingRequest: (userId) => {
        setIncomingRequestIds((current) =>
          current.filter((id) => id !== userId),
        );
      },
      isConnected: (userId) => connectedIds.includes(userId),
      isPremium,
      activatePremium: () => setIsPremium(true),
      ratings,
      rateUser: (userId, stars, comment) => {
        if (isOwnProfileId(userId)) {
          return;
        }
        setRatings((current) => ({
          ...current,
          [userId]: { stars, comment },
        }));
      },
      getRating: (userId) => ratings[userId],
      reportedIds,
      reportUser: (userId) => {
        if (isOwnProfileId(userId)) {
          return;
        }
        setReportedIds((current) =>
          current.includes(userId) ? current : [...current, userId],
        );
      },
      hasReported: (userId) => reportedIds.includes(userId),
      blockedIds,
      blockUser: (userId) => {
        if (isOwnProfileId(userId)) {
          return;
        }
        setBlockedIds((current) =>
          current.includes(userId) ? current : [...current, userId],
        );
      },
      unblockUser: (userId) => {
        setBlockedIds((current) => current.filter((id) => id !== userId));
      },
      isBlocked: (userId) => blockedIds.includes(userId),
      highlights,
      addHighlight: () => {
        setHighlights((current) => {
          const next = highlightCatalog.find(
            (item) => !current.some((highlight) => highlight.id === item.id),
          );
          return next ? [...current, next] : current;
        });
      },
      resetSession: () => applyRole('player'),
    }),
    [
      blockedIds,
      connectedIds,
      currentProfile,
      highlights,
      incomingRequestIds,
      isPremium,
      ratings,
      reportedIds,
      role,
      sentRequestIds,
    ],
  );

  return (
    <PlayerProfileContext.Provider value={value}>
      {children}
    </PlayerProfileContext.Provider>
  );
}

export function usePlayerProfile() {
  const context = useContext(PlayerProfileContext);
  if (!context) {
    throw new Error('usePlayerProfile must be used within PlayerProfileProvider');
  }
  return context;
}
