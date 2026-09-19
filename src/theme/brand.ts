import { colors } from './colors';

export type UserRole = 'player' | 'agent';

export type BrandColors = {
  header: string;
  headerAlt: string;
  accent: string;
  muted: string;
  soft: string;
};

export function getBrandColors(role: UserRole): BrandColors {
  if (role === 'agent') {
    return {
      header: colors.agentHeader,
      headerAlt: colors.agentHeaderAlt,
      accent: colors.agentAccent,
      muted: colors.agentMuted,
      soft: colors.agentSoft,
    };
  }

  return {
    header: colors.homeHeader,
    headerAlt: colors.homeHeaderAlt,
    accent: colors.homeAccent,
    muted: colors.homeMuted,
    soft: colors.homeSoft,
  };
}
