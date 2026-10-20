import { ComponentProps } from 'react';
import { FontAwesome5 } from '@expo/vector-icons';

type IconName = ComponentProps<typeof FontAwesome5>['name'];

export type ProfileKind = 'player' | 'agent' | 'club';

export type ProfileStat = {
  value: string;
  label: string;
};

export type ProfileField = {
  icon: IconName;
  label: string;
  value: string;
};

export const OWN_PROFILE_ID = 'me';

export type UserProfile = {
  id: string;
  kind: ProfileKind;
  name: string;
  email?: string;
  location: string;
  photo?: number;
  photoUrl?: string;
  stats: ProfileStat[];
  fields: ProfileField[];
  about: string;
  birthDate?: string;
  conversationId?: string;
  representativeId?: string;
};

export function isOwnProfileId(userId?: string) {
  return !userId || userId === OWN_PROFILE_ID;
}

export function createEmptySessionProfile(kind: 'player' | 'agent'): UserProfile {
  return {
    id: OWN_PROFILE_ID,
    kind,
    name: '',
    email: '',
    location: '',
    stats: [
      { value: '—', label: 'Conexiones' },
      { value: '—', label: 'Edad' },
      kind === 'agent'
        ? { value: '—', label: 'Representados' }
        : { value: '✕', label: 'Representante' },
    ],
    fields:
      kind === 'agent'
        ? [
            { icon: 'building', label: 'Agencia', value: '' },
            { icon: 'briefcase', label: 'Experiencia', value: '' },
            { icon: 'star', label: 'Especialidad', value: '' },
            { icon: 'map-marker-alt', label: 'Zona', value: '' },
            { icon: 'users', label: 'Representados', value: '' },
            { icon: 'user-friends', label: 'Enfoque', value: '' },
          ]
        : [
            { icon: 'futbol', label: 'Posición', value: '' },
            { icon: 'flag', label: 'Categoría', value: '' },
            { icon: 'arrows-alt-v', label: 'Altura', value: '' },
            { icon: 'walking', label: 'Pierna hábil', value: '' },
            { icon: 'shield-alt', label: 'Club actual', value: '' },
            { icon: 'user-tie', label: 'Representante', value: '—' },
          ],
    about: '',
  };
}

export const otherUserProfiles: UserProfile[] = [];

export function getUserProfileById(id: string) {
  return otherUserProfiles.find((profile) => profile.id === id);
}

export function uniqueProfilesById(profiles: UserProfile[]) {
  const unique: UserProfile[] = [];
  const seen = new Set<string>();
  for (const profile of profiles) {
    const id = profile.id.trim().toLowerCase();
    if (!id || id === OWN_PROFILE_ID || seen.has(id)) {
      continue;
    }
    seen.add(id);
    unique.push(profile.id === id ? profile : { ...profile, id });
  }
  return unique;
}

export function getProfilesByKind(kind: ProfileKind) {
  return otherUserProfiles.filter((profile) => profile.kind === kind);
}

export function getProfileSecondary(profile: UserProfile) {
  if (profile.kind === 'player') {
    return (
      profile.fields.find((field) => field.label === 'Posición')?.value ??
      profile.location
    );
  }

  if (profile.kind === 'agent') {
    return (
      profile.fields.find((field) => field.label === 'Agencia')?.value ??
      profile.location
    );
  }

  return profile.location;
}

export function getProfileRating(profile: UserProfile) {
  return profile.stats.find((stat) => stat.label === 'Rating')?.value;
}

export function getProfileRoleLabel(kind: ProfileKind) {
  if (kind === 'player') {
    return 'Jugador';
  }
  if (kind === 'club') {
    return 'Club';
  }
  return 'Representante';
}

export const initialIncomingRequestIds: string[] = [];
export const initialConnectedIds: string[] = [];
export const agentIncomingRequestIds: string[] = [];
export const agentConnectedIds: string[] = [];
