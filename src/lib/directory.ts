import { UserProfile } from '../data/playerProfiles';
import { isRemotePhotoUrl } from './fotoPerfil';
import { fetchProfileByUserId, profileToUserProfile } from './perfil';
import { supabase } from './supabase';

export type DirectoryPerson = {
  id: string;
  kind: 'player' | 'agent';
  name: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  subtitle: string;
  position?: string;
  club?: string;
  agency?: string;
  location?: string;
  isPremium: boolean;
};

export type DirectoryClub = {
  id: string;
  name: string;
  location: string;
  photoUrl?: string;
};

export type DirectorySearchResult = {
  id: string;
  kind: 'player' | 'agent' | 'club';
  name: string;
  subtitle: string;
  photoUrl?: string;
  isPremium?: boolean;
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

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
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

function personFromUsuario(
  id: string,
  usuario: Record<string, unknown> | undefined,
  kind: 'player' | 'agent',
  subtitle: string,
  extras: Partial<DirectoryPerson> = {},
): DirectoryPerson | null {
  if (!usuario) {
    return null;
  }

  const firstName = textValue(usuario.nombre);
  const lastName = textValue(usuario.apellido);
  const name = `${firstName} ${lastName}`.trim();
  if (!name) {
    return null;
  }

  const photoRaw = textValue(usuario.foto_perfil);
  return {
    id,
    kind,
    name,
    firstName,
    lastName,
    photoUrl: isRemotePhotoUrl(photoRaw) ? photoRaw : undefined,
    subtitle,
    location: locationFromUsuario(usuario.pais, usuario.ciudad),
    isPremium: isPremiumFlag(usuario.es_premium),
    ...extras,
  };
}

export function sortPremiumFirst(people: DirectoryPerson[]) {
  return [...people].sort((a, b) => {
    if (a.isPremium !== b.isPremium) {
      return a.isPremium ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
  });
}

export async function fetchDirectoryPlayers() {
  const myId = await currentUserId();
  const { data, error } = await supabase
    .from('perfiles_jugador')
    .select('id_usuario, fk_posicion, fk_club_actual, categoria');

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as {
    id_usuario?: unknown;
    fk_posicion?: string | number | null;
    fk_club_actual?: string | number | null;
    categoria?: unknown;
  }[];
  const ids = rows
    .map((row) => textValue(row.id_usuario) || String(row.id_usuario ?? ''))
    .filter((id) => id && id !== myId);

  const [usuarios, posiciones, clubes] = await Promise.all([
    fetchUsuariosByIds(ids),
    fetchCatalog('posiciones', 'id_posicion'),
    fetchCatalog('clubes', 'id_club'),
  ]);

  const people: DirectoryPerson[] = [];
  for (const row of rows) {
    const id = textValue(row.id_usuario) || String(row.id_usuario ?? '');
    if (!id || id === myId) {
      continue;
    }
    const position = row.fk_posicion != null ? posiciones.get(String(row.fk_posicion)) : '';
    const club = row.fk_club_actual != null ? clubes.get(String(row.fk_club_actual)) : '';
    const subtitle = [position, club || textValue(row.categoria)].filter(Boolean).join(' · ');
    const person = personFromUsuario(id, usuarios.get(id), 'player', subtitle || 'Jugador', {
      position: position || undefined,
      club: club || undefined,
    });
    if (person) {
      people.push(person);
    }
  }

  return sortPremiumFirst(people);
}

export async function fetchDirectoryAgents() {
  const myId = await currentUserId();
  const { data, error } = await supabase
    .from('perfiles_representante')
    .select('id_usuario, empresa');

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as { id_usuario?: unknown; empresa?: unknown }[];
  const ids = rows
    .map((row) => textValue(row.id_usuario) || String(row.id_usuario ?? ''))
    .filter((id) => id && id !== myId);

  const usuarios = await fetchUsuariosByIds(ids);
  const people: DirectoryPerson[] = [];
  for (const row of rows) {
    const id = textValue(row.id_usuario) || String(row.id_usuario ?? '');
    if (!id || id === myId) {
      continue;
    }
    const agency = textValue(row.empresa);
    const person = personFromUsuario(
      id,
      usuarios.get(id),
      'agent',
      agency || 'Representante',
      { agency: agency || undefined },
    );
    if (person) {
      people.push(person);
    }
  }

  return sortPremiumFirst(people);
}

export async function fetchDirectoryClubs() {
  const first = await supabase
    .from('clubes')
    .select('id_club, nombre, ciudad, pais, escudo_url')
    .order('nombre');
  let data: unknown[] | null = first.data;
  let error = first.error;

  if (error && /escudo_url|ciudad/i.test(error.message)) {
    const retry = await supabase.from('clubes').select('id_club, nombre, pais').order('nombre');
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const name = textValue(row.nombre);
    if (!name) {
      return [];
    }
    const photoRaw = textValue(row.escudo_url);
    return [
      {
        id: String(row.id_club ?? ''),
        name,
        location: locationFromUsuario(row.pais, row.ciudad),
        photoUrl: isRemotePhotoUrl(photoRaw) ? photoRaw : undefined,
      } satisfies DirectoryClub,
    ];
  });
}

function matchesDirectoryQuery(values: string[], query: string) {
  const tokens = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) {
    return false;
  }

  const haystack = values
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

export async function searchDirectory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [] as DirectorySearchResult[];
  }

  const [players, agents, clubs] = await Promise.all([
    fetchDirectoryPlayers(),
    fetchDirectoryAgents(),
    fetchDirectoryClubs(),
  ]);

  const people = [...players, ...agents]
    .filter((person) =>
      matchesDirectoryQuery(
        [person.name, person.firstName, person.lastName, person.subtitle, person.position ?? '', person.club ?? '', person.agency ?? ''],
        trimmed,
      ),
    )
    .map((person) => ({
      id: person.id,
      kind: person.kind,
      name: person.name,
      subtitle: person.subtitle,
      photoUrl: person.photoUrl,
      isPremium: person.isPremium,
    }));

  const clubResults = clubs
    .filter((club) => matchesDirectoryQuery([club.name, club.location], trimmed))
    .map((club) => ({
      id: `club:${club.id}`,
      kind: 'club' as const,
      name: club.name,
      subtitle: club.location || 'Club',
      photoUrl: club.photoUrl,
    }));

  return [...people, ...clubResults];
}

export async function fetchPublicUserProfile(userId: string): Promise<UserProfile | null> {
  const loaded = await fetchProfileByUserId(userId);
  return loaded ? profileToUserProfile(loaded) : null;
}
