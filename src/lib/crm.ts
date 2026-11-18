import { isRemotePhotoUrl } from './fotoPerfil';
import { ageYearsFromBirthDate } from './perfil';
import { getRepresentedPlayers, Representacion } from './representaciones';
import { supabase } from './supabase';

export type CrmTag = 'activo' | 'seguimiento' | 'negociacion' | 'pausado';

export const CRM_TAGS: { id: CrmTag; label: string }[] = [
  { id: 'activo', label: 'Activo' },
  { id: 'seguimiento', label: 'Seguimiento' },
  { id: 'negociacion', label: 'Negociación' },
  { id: 'pausado', label: 'Pausado' },
];

export type CrmPlayer = {
  id: string;
  representationId: number;
  name: string;
  photoUrl?: string;
  position: string;
  club: string;
  category: string;
  location: string;
  age: number | null;
  isPremium: boolean;
  representedAt: string | null;
};

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isPremiumFlag(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function locationFromUsuario(pais?: unknown, ciudad?: unknown) {
  const city = textValue(ciudad);
  const country = textValue(pais);
  return [city, country].filter(Boolean).join(', ');
}

async function fetchCatalog(
  table: 'posiciones' | 'clubes',
  idField: 'id_posicion' | 'id_club',
) {
  const { data, error } = await supabase.from(table).select(`${idField}, nombre`);
  if (error) {
    throw error;
  }

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const record = row as Record<string, unknown>;
    const id = record[idField];
    const nombre = textValue(record.nombre);
    if (id != null && nombre) {
      map.set(String(id), nombre);
    }
  }
  return map;
}

async function fetchUsuariosByIds(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, Record<string, unknown>>();
  }

  let data: unknown[] | null = null;
  let error: { message: string } | null = null;

  const first = await supabase
    .from('usuarios')
    .select(
      'id_usuario, nombre, apellido, email, fecha_nacimiento, foto_perfil, pais, ciudad, es_premium',
    )
    .in('id_usuario', ids);
  data = first.data;
  error = first.error;

  if (error && /ciudad/i.test(error.message)) {
    const retry = await supabase
      .from('usuarios')
      .select(
        'id_usuario, nombre, apellido, email, fecha_nacimiento, foto_perfil, pais, es_premium',
      )
      .in('id_usuario', ids);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw error;
  }

  const map = new Map<string, Record<string, unknown>>();
  for (const row of data ?? []) {
    const record = row as Record<string, unknown>;
    const id = textValue(record.id_usuario) || String(record.id_usuario ?? '');
    if (id) {
      map.set(id, record);
    }
  }
  return map;
}

async function fetchPlayerRows(ids: string[]) {
  if (ids.length === 0) {
    return new Map<
      string,
      {
        fk_posicion?: string | number | null;
        fk_club_actual?: string | number | null;
        categoria?: unknown;
      }
    >();
  }

  const { data, error } = await supabase
    .from('perfiles_jugador')
    .select('id_usuario, fk_posicion, fk_club_actual, categoria')
    .in('id_usuario', ids);

  if (error) {
    throw error;
  }

  const map = new Map<
    string,
    {
      fk_posicion?: string | number | null;
      fk_club_actual?: string | number | null;
      categoria?: unknown;
    }
  >();
  for (const row of data ?? []) {
    const record = row as {
      id_usuario?: unknown;
      fk_posicion?: string | number | null;
      fk_club_actual?: string | number | null;
      categoria?: unknown;
    };
    const id = textValue(record.id_usuario) || String(record.id_usuario ?? '');
    if (id) {
      map.set(id, record);
    }
  }
  return map;
}

export function formatCrmDate(value: string | null) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function crmTagLabel(tag: CrmTag) {
  return CRM_TAGS.find((item) => item.id === tag)?.label ?? 'Activo';
}

export async function fetchCrmRoster(
  representativeId: string,
  rows?: Representacion[],
): Promise<CrmPlayer[]> {
  const representations =
    rows ?? (await getRepresentedPlayers(representativeId));
  const accepted = representations.filter((row) => row.estado === 'aceptada');
  const ids = accepted
    .map((row) => row.fk_jugador.trim())
    .filter((id) => id && id !== 'me');

  if (ids.length === 0) {
    return [];
  }

  const [usuarios, players, posiciones, clubes] = await Promise.all([
    fetchUsuariosByIds(ids),
    fetchPlayerRows(ids),
    fetchCatalog('posiciones', 'id_posicion'),
    fetchCatalog('clubes', 'id_club'),
  ]);

  const roster: CrmPlayer[] = [];
  for (const row of accepted) {
    const id = row.fk_jugador.trim();
    const usuario = usuarios.get(id);
    if (!usuario) {
      continue;
    }

    const name = `${textValue(usuario.nombre)} ${textValue(usuario.apellido)}`.trim();
    if (!name) {
      continue;
    }

    const player = players.get(id);
    const position =
      player?.fk_posicion != null
        ? posiciones.get(String(player.fk_posicion)) || ''
        : '';
    const club =
      player?.fk_club_actual != null
        ? clubes.get(String(player.fk_club_actual)) || ''
        : '';
    const photoRaw = textValue(usuario.foto_perfil);

    roster.push({
      id,
      representationId: row.id_representacion,
      name,
      photoUrl: isRemotePhotoUrl(photoRaw) ? photoRaw : undefined,
      position,
      club,
      category: textValue(player?.categoria),
      location: locationFromUsuario(usuario.pais, usuario.ciudad),
      age: ageYearsFromBirthDate(usuario.fecha_nacimiento),
      isPremium: isPremiumFlag(usuario.es_premium),
      representedAt: row.fecha_respuesta || row.fecha_solicitud,
    });
  }

  return roster.sort((a, b) => {
    const aTime = a.representedAt ? Date.parse(a.representedAt) : 0;
    const bTime = b.representedAt ? Date.parse(b.representedAt) : 0;
    return bTime - aTime;
  });
}
