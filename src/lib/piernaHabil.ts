export const PIERNA_HABIL_DB = [
  'derecha',
  'izquierda',
  'ambidiestra',
] as const;

export type PiernaHabilDb = (typeof PIERNA_HABIL_DB)[number];

const DISPLAY_BY_DB: Record<PiernaHabilDb, string> = {
  derecha: 'Derecha',
  izquierda: 'Izquierda',
  ambidiestra: 'Ambidiestra',
};

const ALIASES: Record<string, PiernaHabilDb> = {
  derecha: 'derecha',
  derecho: 'derecha',
  diestro: 'derecha',
  diestra: 'derecha',
  izquierda: 'izquierda',
  izquierdo: 'izquierda',
  zurdo: 'izquierda',
  zurda: 'izquierda',
  ambidiestra: 'ambidiestra',
  ambidiestro: 'ambidiestra',
};

function normalizePiernaHabilInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function piernaHabilToDb(value: string): PiernaHabilDb | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return ALIASES[normalizePiernaHabilInput(trimmed)] ?? null;
}

export function piernaHabilToDisplay(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  const dbValue = piernaHabilToDb(value);
  if (!dbValue) {
    return value.trim();
  }

  return DISPLAY_BY_DB[dbValue];
}
