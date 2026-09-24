import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import {
  highlightCatalog,
  PlayerHighlight,
} from '../data/playerHighlights';
import {
  createEmptySessionProfile,
  getUserProfileById,
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
  startSession: (
    nextRole: UserRole,
    profileUpdates?: Partial<UserProfile>,
    sessionIsPremium?: boolean,
  ) => void;
  currentProfile: UserProfile;
  getProfile: (userId: string) => UserProfile | undefined;
  isOwnProfile: (userId?: string) => boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isPremium: boolean;
  activatePremium: () => Promise<{ ok: true } | { ok: false; message: string }>;
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

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRemotePhotoUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export type AuthenticatedUserIdentity = {
  name: string;
  firstName: string;
  email: string;
  photoUrl?: string;
  isPremium: boolean;
};

function isPremiumFlag(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export async function fetchAuthenticatedUserPremium() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { isPremium: false, error: userError };
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('es_premium')
    .eq('id_usuario', userData.user.id)
    .maybeSingle();

  if (error || !data) {
    return { isPremium: false, error };
  }

  const premiumRow = data as { es_premium?: unknown } | null;
  return {
    isPremium: isPremiumFlag(premiumRow?.es_premium),
    error: null,
  };
}

export async function persistAuthenticatedUserPremium() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      ok: false as const,
      message:
        userError?.message ??
        'No hay un usuario autenticado. Iniciá sesión e intentá de nuevo.',
    };
  }

  const userId = userData.user.id;

  const { data: updatedRows, error: updateError, count } = await supabase
    .from('usuarios')
    .update({ es_premium: true }, { count: 'exact' })
    .eq('id_usuario', userId)
    .select('id_usuario, es_premium');

  console.log('[PREMIUM DEBUG] userId:', userId);
  console.log('[PREMIUM DEBUG] updateError:', updateError);
  console.log('[PREMIUM DEBUG] count:', count);
  console.log('[PREMIUM DEBUG] updatedRows:', updatedRows);

  if (updateError) {
    return { ok: false as const, message: updateError.message };
  }

  const updatedRow = Array.isArray(updatedRows)
    ? (updatedRows[0] as { id_usuario?: unknown; es_premium?: unknown } | undefined)
    : (updatedRows as { id_usuario?: unknown; es_premium?: unknown } | null);

  if ((count ?? 0) < 1 || !updatedRow) {
    return {
      ok: false as const,
      message:
        'No se actualizó ninguna fila en public.usuarios. Comprobá que exista tu usuario y que RLS permita UPDATE de es_premium cuando auth.uid() = id_usuario.',
    };
  }

  if (!isPremiumFlag(updatedRow.es_premium)) {
    return {
      ok: false as const,
      message: 'El UPDATE no devolvió es_premium = true.',
    };
  }

  const { data: confirmed, error: confirmError } = await supabase
    .from('usuarios')
    .select('es_premium')
    .eq('id_usuario', userId)
    .maybeSingle();

  console.log('[PREMIUM DEBUG] userId:', userId);
  console.log('[PREMIUM DEBUG] confirmError:', confirmError);
  console.log('[PREMIUM DEBUG] confirmData:', confirmed);

  if (confirmError) {
    return { ok: false as const, message: confirmError.message };
  }

  const confirmedRow = confirmed as { es_premium?: unknown } | null;
  if (!isPremiumFlag(confirmedRow?.es_premium)) {
    return {
      ok: false as const,
      message:
        'Supabase no confirmó es_premium = true al volver a leer public.usuarios.',
    };
  }

  return { ok: true as const };
}

export async function fetchAuthenticatedUserIdentity() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    return { identity: null as AuthenticatedUserIdentity | null, error: userError };
  }

  const user = userData.user;
  if (!user) {
    return {
      identity: null as AuthenticatedUserIdentity | null,
      error: new Error('No hay un usuario autenticado.'),
    };
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('nombre, apellido, email, foto_perfil')
    .eq('id_usuario', user.id)
    .maybeSingle();

  if (usuarioError) {
    return { identity: null as AuthenticatedUserIdentity | null, error: usuarioError };
  }

  const usuarioRow = usuario as {
    nombre?: unknown;
    apellido?: unknown;
    email?: unknown;
    foto_perfil?: unknown;
  } | null;

  const firstName = textValue(usuarioRow?.nombre);
  const lastName = textValue(usuarioRow?.apellido);
  const photoRaw = textValue(usuarioRow?.foto_perfil);

  const { data: premiumRow } = await supabase
    .from('usuarios')
    .select('es_premium')
    .eq('id_usuario', user.id)
    .maybeSingle();

  return {
    identity: {
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      email: textValue(usuarioRow?.email) || user.email?.trim() || '',
      photoUrl: isRemotePhotoUrl(photoRaw) ? photoRaw : undefined,
      isPremium:
        (premiumRow as { es_premium?: unknown } | null)?.es_premium === true,
    },
    error: null,
  };
}

function emptySessionState(role: UserRole) {
  return {
    currentProfile: createEmptySessionProfile(
      role === 'agent' ? 'agent' : 'player',
    ),
  };
}

export function PlayerProfileProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('player');
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() =>
    createEmptySessionProfile('player'),
  );
  const [isPremium, setIsPremium] = useState(false);
  const [ratings, setRatings] = useState<Record<string, UserRating>>({});
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<PlayerHighlight[]>([]);

  function applyRole(
    nextRole: UserRole,
    profileUpdates?: Partial<UserProfile>,
    sessionIsPremium = false,
  ) {
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
      photo: profileUpdates?.photo,
      photoUrl: profileUpdates?.photoUrl,
    });
    setIsPremium(sessionIsPremium === true);
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
      isPremium,
      activatePremium: async () => {
        const result = await persistAuthenticatedUserPremium();
        if (!result.ok) {
          return result;
        }
        setIsPremium(true);
        return result;
      },
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
      currentProfile,
      highlights,
      isPremium,
      ratings,
      reportedIds,
      role,
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
