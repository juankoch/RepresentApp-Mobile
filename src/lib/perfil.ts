import { ProfileField, UserProfile } from '../data/playerProfiles';
import {
  fetchAcceptedConnections,
  partnerIdsFromAcceptedConnections,
} from './conexiones';
import { isRemotePhotoUrl } from './fotoPerfil';
import { piernaHabilToDisplay } from './piernaHabil';
import {
  getAcceptedRepresentationForPlayer,
  getRepresentedPlayers,
} from './representaciones';
import { supabase } from './supabase';

export type LoadedProfile = {
  id: string;
  kind: 'player' | 'agent';
  nombre: string;
  apellido: string;
  name: string;
  email: string;
  photoUrl?: string;
  pais: string;
  ciudad: string;
  location: string;
  fechaNacimientoIso: string;
  birthDateDisplay: string;
  ageYears: number | null;
  about: string;
  posicionNombre: string;
  categoria: string;
  alturaCm: number | null;
  alturaDisplay: string;
  piernaHabilDisplay: string;
  clubNombre: string;
  empresa: string;
  aniosExperiencia: number | null;
  experienciaDisplay: string;
  especialidad: string;
  zona: string;
  enfoque: string;
  representedCount: number | null;
  representativeId: string | null;
  representativeName: string | null;
  acceptedConnectionsCount: number | null;
  missingKindProfile: boolean;
};

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRealUserId(value: string) {
  const id = value.trim();
  return id.length > 0 && id !== 'me';
}

function displayOrPlaceholder(value: string) {
  return value.trim() ? value.trim() : 'Sin datos';
}

export function formatLocation(pais?: unknown, ciudad?: unknown) {
  const city = textValue(ciudad);
  const country = textValue(pais);
  return [city, country].filter(Boolean).join(', ');
}

export function parseLocationInput(value: string): { ciudad: string | null; pais: string | null } {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return { ciudad: null, pais: null };
  }
  if (parts.length === 1) {
    return { ciudad: parts[0], pais: null };
  }
  return {
    ciudad: parts.slice(0, -1).join(', '),
    pais: parts[parts.length - 1],
  };
}

export function formatBirthDateDisplay(value: unknown) {
  const raw = textValue(value);
  if (!raw) {
    return '';
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    return raw;
  }

  return '';
}

export function ageYearsFromBirthDate(value: unknown) {
  const raw = textValue(value);
  if (!raw) {
    return null;
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  const year = iso ? Number(iso[1]) : dmy ? Number(dmy[3]) : NaN;
  const month = iso ? Number(iso[2]) : dmy ? Number(dmy[2]) : NaN;
  const day = iso ? Number(iso[3]) : dmy ? Number(dmy[1]) : NaN;

  if (!year || !month || !day) {
    return null;
  }

  const birth = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 120) {
    return null;
  }

  return age;
}

function experienceDisplay(value: unknown) {
  let years: number | null = null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    years = value;
  } else if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.replace(/[^\d-]/g, ''), 10);
    years = Number.isFinite(parsed) ? parsed : null;
  }

  if (years == null) {
    return { years: null as number | null, label: '' };
  }

  return {
    years,
    label: years === 1 ? '1 año' : `${years} años`,
  };
}

function alturaFromDb(value: unknown) {
  let cm: number | null = null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    cm = value;
  } else if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.replace(/[^\d-]/g, ''), 10);
    cm = Number.isFinite(parsed) ? parsed : null;
  }

  if (cm == null || cm <= 0) {
    return { cm: null as number | null, label: '' };
  }

  return { cm, label: `${cm} cm` };
}

async function fetchNombreById(
  table: 'posiciones' | 'clubes',
  idField: 'id_posicion' | 'id_club',
  id: string | number | null,
) {
  if (id == null) {
    return '';
  }

  const { data, error } = await supabase
    .from(table)
    .select('nombre')
    .eq(idField, id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return textValue((data as { nombre?: unknown } | null)?.nombre);
}

async function fetchUsuarioRow(userId: string) {
  const first = await supabase
    .from('usuarios')
    .select(
      'id_usuario, nombre, apellido, email, fecha_nacimiento, foto_perfil, pais, ciudad',
    )
    .eq('id_usuario', userId)
    .maybeSingle();

  if (first.error && /ciudad/i.test(first.error.message)) {
    return supabase
      .from('usuarios')
      .select(
        'id_usuario, nombre, apellido, email, fecha_nacimiento, foto_perfil, pais',
      )
      .eq('id_usuario', userId)
      .maybeSingle();
  }

  return first;
}

async function countAcceptedConnections(userId: string) {
  try {
    const rows = await fetchAcceptedConnections(userId);
    return partnerIdsFromAcceptedConnections(rows, userId).length;
  } catch {
    return null;
  }
}

async function countAcceptedRepresentedPlayers(representativeId: string) {
  try {
    const rows = await getRepresentedPlayers(representativeId);
    return rows.filter((row) => row.estado === 'aceptada').length;
  } catch {
    return null;
  }
}

async function fetchRepresentativeName(representativeId: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('nombre, apellido')
    .eq('id_usuario', representativeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { nombre?: unknown; apellido?: unknown };
  const name = `${textValue(row.nombre)} ${textValue(row.apellido)}`.trim();
  return name || null;
}

function networkingStats(loaded: LoadedProfile): UserProfile['stats'] {
  const conexiones = {
    label: 'Conexiones',
    value:
      loaded.acceptedConnectionsCount == null
        ? '—'
        : String(loaded.acceptedConnectionsCount),
  };
  const edad = {
    label: 'Edad',
    value: loaded.ageYears == null ? '—' : String(loaded.ageYears),
  };

  if (loaded.kind === 'agent') {
    return [
      conexiones,
      edad,
      {
        label: 'Representados',
        value:
          loaded.representedCount == null
            ? '—'
            : String(loaded.representedCount),
      },
    ];
  }

  return [
    conexiones,
    edad,
    {
      label: 'Representante',
      value: loaded.representativeId ? '✓' : '✕',
    },
  ];
}

function playerFields(loaded: LoadedProfile): ProfileField[] {
  return [
    {
      icon: 'futbol',
      label: 'Posición',
      value: displayOrPlaceholder(loaded.posicionNombre),
    },
    {
      icon: 'flag',
      label: 'Categoría',
      value: displayOrPlaceholder(loaded.categoria),
    },
    {
      icon: 'arrows-alt-v',
      label: 'Altura',
      value: displayOrPlaceholder(loaded.alturaDisplay),
    },
    {
      icon: 'walking',
      label: 'Pierna hábil',
      value: displayOrPlaceholder(loaded.piernaHabilDisplay),
    },
    {
      icon: 'shield-alt',
      label: 'Club actual',
      value: displayOrPlaceholder(loaded.clubNombre),
    },
    {
      icon: 'user-tie',
      label: 'Representante',
      value: loaded.representativeName?.trim() || '—',
    },
  ];
}

function agentFields(loaded: LoadedProfile): ProfileField[] {
  return [
    {
      icon: 'building',
      label: 'Agencia',
      value: displayOrPlaceholder(loaded.empresa),
    },
    {
      icon: 'briefcase',
      label: 'Experiencia',
      value: displayOrPlaceholder(loaded.experienciaDisplay),
    },
    {
      icon: 'star',
      label: 'Especialidad',
      value: displayOrPlaceholder(loaded.especialidad),
    },
    {
      icon: 'map-marker-alt',
      label: 'Zona',
      value: displayOrPlaceholder(loaded.zona),
    },
    {
      icon: 'users',
      label: 'Representados',
      value:
        loaded.representedCount == null
          ? '—'
          : String(loaded.representedCount),
    },
    {
      icon: 'user-friends',
      label: 'Enfoque',
      value: displayOrPlaceholder(loaded.enfoque),
    },
  ];
}

export function profileToUserProfile(loaded: LoadedProfile): UserProfile {
  return {
    id: loaded.id,
    kind: loaded.kind,
    name: displayOrPlaceholder(loaded.name),
    email: loaded.email || undefined,
    location: displayOrPlaceholder(loaded.location),
    photoUrl: loaded.photoUrl,
    birthDate: loaded.birthDateDisplay || undefined,
    about: loaded.about.trim() ? loaded.about : 'Sin datos',
    stats: networkingStats(loaded),
    fields: loaded.kind === 'agent' ? agentFields(loaded) : playerFields(loaded),
    representativeId: loaded.representativeId ?? undefined,
  };
}

export async function fetchProfileByUserId(
  userId: string,
): Promise<LoadedProfile | null> {
  const id = userId.trim();
  if (!isRealUserId(id)) {
    return null;
  }

  const { data: usuario, error: usuarioError } = await fetchUsuarioRow(id);
  if (usuarioError) {
    throw usuarioError;
  }
  if (!usuario) {
    return null;
  }

  const usuarioRow = usuario as {
    nombre?: unknown;
    apellido?: unknown;
    email?: unknown;
    fecha_nacimiento?: unknown;
    foto_perfil?: unknown;
    pais?: unknown;
    ciudad?: unknown;
  };

  const { data: player, error: playerError } = await supabase
    .from('perfiles_jugador')
    .select('categoria, fk_posicion, fk_club_actual, pierna_habil, descripcion, altura_cm')
    .eq('id_usuario', id)
    .maybeSingle();

  if (playerError) {
    throw playerError;
  }

  const { data: agent, error: agentError } = await supabase
    .from('perfiles_representante')
    .select('descripcion, empresa, anios_experiencia, especialidad, zona, enfoque')
    .eq('id_usuario', id)
    .maybeSingle();

  if (agentError) {
    throw agentError;
  }

  const kind: 'player' | 'agent' = player ? 'player' : agent ? 'agent' : 'player';
  const nombre = textValue(usuarioRow.nombre);
  const apellido = textValue(usuarioRow.apellido);
  const fechaNacimientoIso = textValue(usuarioRow.fecha_nacimiento);
  const birthDateDisplay = formatBirthDateDisplay(usuarioRow.fecha_nacimiento);
  const ageYears = ageYearsFromBirthDate(usuarioRow.fecha_nacimiento);
  const photoRaw = textValue(usuarioRow.foto_perfil);
  const pais = textValue(usuarioRow.pais);
  const ciudad = textValue(usuarioRow.ciudad);

  let posicionNombre = '';
  let categoria = '';
  let altura = { cm: null as number | null, label: '' };
  let piernaHabilDisplay = '';
  let clubNombre = '';
  let about = '';
  let empresa = '';
  let especialidad = '';
  let zona = '';
  let enfoque = '';
  let experiencia = { years: null as number | null, label: '' };
  let missingKindProfile = false;

  if (kind === 'player') {
    missingKindProfile = !player;
    if (player) {
      const playerRow = player as {
        categoria?: unknown;
        fk_posicion?: string | number | null;
        fk_club_actual?: string | number | null;
        pierna_habil?: unknown;
        descripcion?: unknown;
        altura_cm?: unknown;
      };
      about = textValue(playerRow.descripcion);
      categoria = textValue(playerRow.categoria);
      altura = alturaFromDb(playerRow.altura_cm);
      piernaHabilDisplay = piernaHabilToDisplay(playerRow.pierna_habil);
      const [positionName, clubName] = await Promise.all([
        fetchNombreById('posiciones', 'id_posicion', playerRow.fk_posicion ?? null),
        fetchNombreById('clubes', 'id_club', playerRow.fk_club_actual ?? null),
      ]);
      posicionNombre = positionName;
      clubNombre = clubName;
    }
  } else if (agent) {
    const agentRow = agent as {
      descripcion?: unknown;
      empresa?: unknown;
      anios_experiencia?: unknown;
      especialidad?: unknown;
      zona?: unknown;
      enfoque?: unknown;
    };
    about = textValue(agentRow.descripcion);
    empresa = textValue(agentRow.empresa);
    especialidad = textValue(agentRow.especialidad);
    zona = textValue(agentRow.zona);
    enfoque = textValue(agentRow.enfoque);
    experiencia = experienceDisplay(agentRow.anios_experiencia);
  } else {
    missingKindProfile = true;
  }

  const [acceptedRepresentation, acceptedConnectionsCount, representedCount] =
    await Promise.all([
      getAcceptedRepresentationForPlayer(id),
      countAcceptedConnections(id),
      kind === 'agent' ? countAcceptedRepresentedPlayers(id) : Promise.resolve(null),
    ]);

  const representativeId =
    acceptedRepresentation && isRealUserId(acceptedRepresentation.fk_representante)
      ? acceptedRepresentation.fk_representante
      : null;
  const representativeName = representativeId
    ? await fetchRepresentativeName(representativeId)
    : null;

  return {
    id,
    kind,
    nombre,
    apellido,
    name: `${nombre} ${apellido}`.trim(),
    email: textValue(usuarioRow.email),
    photoUrl: isRemotePhotoUrl(photoRaw) ? photoRaw : undefined,
    pais,
    ciudad,
    location: formatLocation(pais, ciudad),
    fechaNacimientoIso,
    birthDateDisplay,
    ageYears,
    about,
    posicionNombre,
    categoria,
    alturaCm: altura.cm,
    alturaDisplay: altura.label,
    piernaHabilDisplay,
    clubNombre,
    empresa,
    aniosExperiencia: experiencia.years,
    experienciaDisplay: experiencia.label,
    especialidad,
    zona,
    enfoque,
    representedCount,
    representativeId,
    representativeName,
    acceptedConnectionsCount,
    missingKindProfile,
  };
}
