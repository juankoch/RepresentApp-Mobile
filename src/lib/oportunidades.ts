import { fetchCreatedProfileKind } from '../context/PlayerProfileContext';
import { fetchPublicPeopleByIds } from './directory';
import { supabase } from './supabase';

export type OportunidadResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type Oportunidad = {
  id_oportunidad: number;
  fk_representante: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha_evento: string | null;
  ubicacion: string;
  requisitos: string;
  estado: string;
  fecha_publicacion: string | null;
};

export type Postulacion = {
  id_postulacion: number;
  fk_oportunidad: number;
  fk_jugador: string;
  estado: string;
  fecha_postulacion: string | null;
};

export type CreateOportunidadInput = {
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha_evento: string | null;
  ubicacion: string;
  requisitos: string;
};

export const ESTADO_OPORTUNIDAD_PUBLICADA = 'activa';
export const ESTADO_POSTULACION_INICIAL = 'pendiente';

export const OPORTUNIDAD_TIPOS = ['prueba', 'torneo', 'visoria', 'otro'] as const;
export type OportunidadTipo = (typeof OPORTUNIDAD_TIPOS)[number];

const OPORTUNIDAD_TIPO_LABELS: Record<OportunidadTipo, string> = {
  prueba: 'Prueba',
  torneo: 'Torneo',
  visoria: 'Visoría',
  otro: 'Otro',
};

const OPORTUNIDAD_COLUMNS =
  'id_oportunidad, fk_representante, tipo, titulo, descripcion, fecha_evento, ubicacion, requisitos, estado, fecha_publicacion';
const POSTULACION_COLUMNS =
  'id_postulacion, fk_oportunidad, fk_jugador, estado, fecha_postulacion';

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isRealUserId(value: string) {
  const id = value.trim();
  return id.length > 0 && id !== 'me';
}

function bigintId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function permissionMessage(
  error: {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null,
  fallback: string,
) {
  const parts = [error?.message, error?.code, error?.details, error?.hint]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : fallback;
}

function supabaseHost() {
  try {
    return new URL(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').host || 'unknown-host';
  } catch {
    return 'invalid-url';
  }
}

function supabaseKeyKind() {
  const key =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    '';
  if (key.startsWith('sb_publishable_')) {
    return 'publishable';
  }
  if (key.startsWith('eyJ')) {
    return 'jwt-anon';
  }
  return key ? 'other' : 'missing';
}

function decodeJwtClaims(accessToken: string | undefined) {
  if (!accessToken) {
    return null;
  }
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) {
      return null;
    }
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4;
    const withPad = pad ? `${padded}${'='.repeat(4 - pad)}` : padded;
    const json = JSON.parse(globalThis.atob(withPad)) as {
      role?: unknown;
      sub?: unknown;
      iss?: unknown;
      aud?: unknown;
      exp?: unknown;
    };
    return {
      role: typeof json.role === 'string' ? json.role : null,
      sub: typeof json.sub === 'string' ? json.sub : null,
      iss: typeof json.iss === 'string' ? json.iss : null,
      aud: typeof json.aud === 'string' ? json.aud : null,
      exp: typeof json.exp === 'number' ? json.exp : null,
    };
  } catch {
    return null;
  }
}

async function logOportunidadesQuery(params: {
  operation: string;
  table: 'oportunidades' | 'postulaciones';
  filter: string;
  error?: {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
    status?: number;
  } | null;
  status?: number;
}) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const accessToken = sessionData.session?.access_token;
  const claims = decodeJwtClaims(accessToken);
  const payload = {
    operation: params.operation,
    table: params.table,
    filter: params.filter,
    join: 'none',
    supabaseHost: supabaseHost(),
    keyKind: supabaseKeyKind(),
    persistSession: false,
    sessionPresent: Boolean(sessionData.session),
    hasAccessToken: Boolean(accessToken),
    userId: userData.user?.id ?? null,
    authRoleClaim: claims?.role ?? null,
    jwtIss: claims?.iss ?? null,
    jwtAud: claims?.aud ?? null,
    jwtExp: claims?.exp ?? null,
    getUserError: userError?.message ?? null,
    getSessionError: sessionError?.message ?? null,
    queryStatus: params.status ?? params.error?.status ?? null,
    errorMessage: params.error?.message ?? null,
    errorCode: params.error?.code ?? null,
    errorDetails: params.error?.details ?? null,
    errorHint: params.error?.hint ?? null,
  };
  console.log(
    params.table === 'postulaciones' ? '[postulaciones]' : '[oportunidades]',
    JSON.stringify(payload),
  );
}

async function requireAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  const userId = data.user?.id?.trim() || '';
  if (error) {
    return { ok: false as const, message: error.message };
  }
  if (!isRealUserId(userId)) {
    return { ok: false as const, message: 'No hay un usuario autenticado.' };
  }
  return { ok: true as const, userId };
}

async function requireKind(kind: 'player' | 'agent') {
  const auth = await requireAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const profile = await fetchCreatedProfileKind(auth.userId);
  if (profile.error) {
    return { ok: false as const, message: profile.error.message };
  }
  if (profile.kind !== kind) {
    return {
      ok: false as const,
      message:
        kind === 'agent'
          ? 'Solo un representante puede publicar oportunidades.'
          : 'Solo un jugador puede postularse a una oportunidad.',
    };
  }

  return auth;
}

function mapOportunidad(row: Record<string, unknown>): Oportunidad | null {
  const id = bigintId(row.id_oportunidad);
  const representante = textValue(row.fk_representante);
  const titulo = textValue(row.titulo);
  if (id == null || !isRealUserId(representante) || !titulo) {
    return null;
  }

  return {
    id_oportunidad: id,
    fk_representante: representante,
    tipo: textValue(row.tipo).toLowerCase(),
    titulo,
    descripcion: textValue(row.descripcion),
    fecha_evento: textValue(row.fecha_evento) || null,
    ubicacion: textValue(row.ubicacion),
    requisitos: textValue(row.requisitos),
    estado: textValue(row.estado).toLowerCase(),
    fecha_publicacion: textValue(row.fecha_publicacion) || null,
  };
}

function mapPostulacion(row: Record<string, unknown>): Postulacion | null {
  const id = bigintId(row.id_postulacion);
  const oportunidadId = bigintId(row.fk_oportunidad);
  const jugador = textValue(row.fk_jugador);
  if (id == null || oportunidadId == null || !isRealUserId(jugador)) {
    return null;
  }

  return {
    id_postulacion: id,
    fk_oportunidad: oportunidadId,
    fk_jugador: jugador,
    estado: textValue(row.estado).toLowerCase(),
    fecha_postulacion: textValue(row.fecha_postulacion) || null,
  };
}

function foldTipo(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function toOportunidadTipo(value: string): OportunidadTipo | null {
  const normalized = foldTipo(value);
  if (normalized === 'prueba' || normalized === 'pruebas') {
    return 'prueba';
  }
  if (normalized === 'torneo' || normalized === 'torneos') {
    return 'torneo';
  }
  if (normalized === 'visoria' || normalized === 'visorias') {
    return 'visoria';
  }
  if (normalized === 'otro' || normalized === 'otros') {
    return 'otro';
  }
  return null;
}

export function formatOportunidadTipo(value: string) {
  const tipo = toOportunidadTipo(value);
  return tipo ? OPORTUNIDAD_TIPO_LABELS[tipo] : value.trim();
}

export function isOportunidadDisponible(estado: string) {
  const value = estado.trim().toLowerCase();
  return value === 'activa' || value === 'abierta' || value === 'publicada';
}

export function parseFechaEvento(value: string) {
  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const dmy = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(raw);
  if (dmy) {
    return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  }

  return null;
}

export function formatFechaEvento(value: string | null) {
  const raw = textValue(value);
  if (!raw) {
    return 'A confirmar';
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }

  return raw;
}

export function formatFechaPublicacion(value: string | null) {
  const raw = textValue(value);
  if (!raw) {
    return '';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return formatFechaEvento(raw);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatOportunidadEstado(estado: string) {
  const value = estado.trim().toLowerCase();
  if (value === 'finalizada' || value === 'cerrada' || value === 'finished') {
    return 'Finalizada';
  }
  if (value === 'pendiente') {
    return 'Pendiente';
  }
  if (isOportunidadDisponible(value)) {
    return 'Activa';
  }
  return estado.trim() || 'Activa';
}

export function formatPostulacionEstado(estado: string) {
  const value = estado.trim().toLowerCase();
  if (value === 'pendiente') {
    return 'Pendiente';
  }
  if (value === 'aceptada') {
    return 'Aceptada';
  }
  if (value === 'rechazada') {
    return 'Rechazada';
  }
  return estado.trim() || 'Pendiente';
}

export async function fetchPublishedOportunidades(): Promise<
  OportunidadResult<Oportunidad[]>
> {
  const { data, error, status } = await supabase
    .from('oportunidades')
    .select(OPORTUNIDAD_COLUMNS)
    .in('estado', ['activa', 'abierta', 'publicada'])
    .order('fecha_publicacion', { ascending: false });

  await logOportunidadesQuery({
    operation: 'fetchPublishedOportunidades',
    table: 'oportunidades',
    filter: "estado IN ('activa','abierta','publicada') ORDER BY fecha_publicacion DESC",
    error,
    status,
  });

  if (error) {
    return { ok: false, message: permissionMessage(error, 'No se pudieron cargar las oportunidades.') };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapOportunidad(row);
    return mapped && isOportunidadDisponible(mapped.estado) ? [mapped] : [];
  });

  return { ok: true, data: rows };
}

export async function fetchMisOportunidades(): Promise<OportunidadResult<Oportunidad[]>> {
  const auth = await requireKind('agent');
  if (!auth.ok) {
    return auth;
  }

  const { data, error, status } = await supabase
    .from('oportunidades')
    .select(OPORTUNIDAD_COLUMNS)
    .eq('fk_representante', auth.userId)
    .order('fecha_publicacion', { ascending: false });

  await logOportunidadesQuery({
    operation: 'fetchMisOportunidades',
    table: 'oportunidades',
    filter: `fk_representante = ${auth.userId} ORDER BY fecha_publicacion DESC`,
    error,
    status,
  });

  if (error) {
    return { ok: false, message: permissionMessage(error, 'No se pudieron cargar tus oportunidades.') };
  }

  const rawRows = (data ?? []) as Record<string, unknown>[];
  const rows: Oportunidad[] = [];
  const dropped: Array<Record<string, unknown>> = [];
  for (const row of rawRows) {
    const mapped = mapOportunidad(row);
    if (!mapped) {
      dropped.push({
        reason: 'mapOportunidad_null',
        id_oportunidad: row.id_oportunidad,
        idType: typeof row.id_oportunidad,
        fk_representante: row.fk_representante,
        fkType: typeof row.fk_representante,
        titulo: row.titulo,
        estado: row.estado,
      });
      continue;
    }
    if (mapped.fk_representante !== auth.userId) {
      dropped.push({
        reason: 'fk_representante_mismatch',
        id_oportunidad: mapped.id_oportunidad,
        mappedFk: mapped.fk_representante,
        authUserId: auth.userId,
        sameIgnoreCase:
          mapped.fk_representante.toLowerCase() === auth.userId.toLowerCase(),
      });
      continue;
    }
    rows.push(mapped);
  }

  console.log(
    '[oportunidades] mis oportunidades raw count:',
    rawRows.length,
  );
  console.log(
    '[oportunidades] mis oportunidades raw ids:',
    rawRows.map((row) => ({
      id_oportunidad: row.id_oportunidad,
      idType: typeof row.id_oportunidad,
      fk_representante: row.fk_representante,
      titulo: row.titulo,
      estado: row.estado,
    })),
  );
  console.log('[oportunidades] mis oportunidades mapped count:', rows.length);
  console.log(
    '[oportunidades] mis oportunidades ids:',
    rows.map((row) => row.id_oportunidad),
  );
  console.log('[oportunidades] mis oportunidades dropped:', dropped);

  return { ok: true, data: rows };
}

export async function fetchOportunidadById(
  oportunidadId: string,
): Promise<OportunidadResult<Oportunidad | null>> {
  const id = bigintId(oportunidadId);
  if (id == null) {
    return { ok: true, data: null };
  }

  const { data, error, status } = await supabase
    .from('oportunidades')
    .select(OPORTUNIDAD_COLUMNS)
    .eq('id_oportunidad', id)
    .maybeSingle();

  await logOportunidadesQuery({
    operation: 'fetchOportunidadById',
    table: 'oportunidades',
    filter: `id_oportunidad = ${id}`,
    error,
    status,
  });

  if (error) {
    return { ok: false, message: permissionMessage(error, 'No se pudo cargar la oportunidad.') };
  }

  return { ok: true, data: data ? mapOportunidad(data as Record<string, unknown>) : null };
}

export async function fetchOportunidadesByIds(
  ids: number[],
): Promise<OportunidadResult<Oportunidad[]>> {
  const uniqueIds = [...new Set(ids.filter((id) => Number.isFinite(id)))];
  if (uniqueIds.length === 0) {
    return { ok: true, data: [] };
  }

  const { data, error, status } = await supabase
    .from('oportunidades')
    .select(OPORTUNIDAD_COLUMNS)
    .in('id_oportunidad', uniqueIds);

  await logOportunidadesQuery({
    operation: 'fetchOportunidadesByIds',
    table: 'oportunidades',
    filter: `id_oportunidad IN (${uniqueIds.join(',')})`,
    error,
    status,
  });

  if (error) {
    return { ok: false, message: permissionMessage(error, 'No se pudieron cargar las oportunidades.') };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapOportunidad(row);
    return mapped ? [mapped] : [];
  });

  rows.sort((a, b) => {
    const left = a.fecha_publicacion || '';
    const right = b.fecha_publicacion || '';
    return right.localeCompare(left);
  });

  return { ok: true, data: rows };
}

export async function createOportunidad(
  input: CreateOportunidadInput,
): Promise<OportunidadResult<Oportunidad>> {
  try {
    const auth = await requireKind('agent');
    if (!auth.ok) {
      return auth;
    }

    const titulo = input.titulo.trim();
    const tipo = toOportunidadTipo(input.tipo);
    if (!titulo) {
      return { ok: false, message: 'El título es obligatorio.' };
    }
    if (!tipo) {
      return {
        ok: false,
        message: 'El tipo debe ser prueba, torneo, visoria u otro.',
      };
    }

    const payload = {
      fk_representante: auth.userId,
      tipo,
      titulo,
      descripcion: input.descripcion.trim() || null,
      fecha_evento: input.fecha_evento,
      ubicacion: input.ubicacion.trim() || null,
      requisitos: input.requisitos.trim() || null,
      estado: ESTADO_OPORTUNIDAD_PUBLICADA,
      fecha_publicacion: new Date().toISOString(),
    };

    const { error, status } = await supabase.from('oportunidades').insert(payload);

    await logOportunidadesQuery({
      operation: 'createOportunidad',
      table: 'oportunidades',
      filter: `INSERT fk_representante = ${payload.fk_representante} tipo = ${payload.tipo} estado = ${payload.estado}`,
      error,
      status,
    });

    if (error) {
      return {
        ok: false,
        message: permissionMessage(error, 'No se pudo publicar la oportunidad.'),
      };
    }
    if (status !== 201) {
      return {
        ok: false,
        message: `No se pudo publicar la oportunidad (status ${status}). La fila no se confirmó en la base.`,
      };
    }

    console.log('[oportunidades] createOportunidad insert ok, id no leído (sin RETURNING)');

    return {
      ok: true,
      data: {
        id_oportunidad: 0,
        fk_representante: payload.fk_representante,
        tipo: payload.tipo,
        titulo: payload.titulo,
        descripcion: payload.descripcion ?? '',
        fecha_evento: payload.fecha_evento,
        ubicacion: payload.ubicacion ?? '',
        requisitos: payload.requisitos ?? '',
        estado: payload.estado,
        fecha_publicacion: payload.fecha_publicacion,
      },
    };
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : 'No se pudo publicar la oportunidad.';
    return { ok: false, message };
  }
}

export async function fetchMisPostulaciones(): Promise<OportunidadResult<Postulacion[]>> {
  const auth = await requireAuthenticatedUserId();
  if (!auth.ok) {
    return auth;
  }

  const { data, error, status } = await supabase
    .from('postulaciones')
    .select(POSTULACION_COLUMNS)
    .eq('fk_jugador', auth.userId)
    .order('fecha_postulacion', { ascending: false });

  await logOportunidadesQuery({
    operation: 'fetchMisPostulaciones',
    table: 'postulaciones',
    filter: `fk_jugador = ${auth.userId} ORDER BY fecha_postulacion DESC`,
    error,
    status,
  });

  if (error) {
    return { ok: false, message: permissionMessage(error, 'No se pudieron cargar tus postulaciones.') };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapPostulacion(row);
    return mapped && mapped.fk_jugador === auth.userId ? [mapped] : [];
  });

  return { ok: true, data: rows };
}

export async function fetchPostulacionesForOportunidad(
  oportunidadId: number,
): Promise<OportunidadResult<Postulacion[]>> {
  const { data, error } = await supabase
    .from('postulaciones')
    .select(POSTULACION_COLUMNS)
    .eq('fk_oportunidad', oportunidadId)
    .order('fecha_postulacion', { ascending: false });

  if (error) {
    return {
      ok: false,
      message: permissionMessage(error, 'No se pudieron cargar los postulantes.'),
    };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapPostulacion(row);
    return mapped && mapped.fk_oportunidad === oportunidadId ? [mapped] : [];
  });

  return { ok: true, data: rows };
}

export async function updatePostulacionEstado(
  postulacionId: number,
  estado: 'aceptada' | 'rechazada',
): Promise<OportunidadResult<Postulacion>> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const userId = user?.id ?? '';
    if (userError || !user || !isRealUserId(userId)) {
      return {
        ok: false,
        message: userError?.message || 'No hay un usuario autenticado.',
      };
    }

    const profile = await fetchCreatedProfileKind(userId);
    if (profile.error) {
      return { ok: false, message: profile.error.message };
    }
    if (profile.kind !== 'agent') {
      return {
        ok: false,
        message: 'Solo un representante puede responder postulaciones.',
      };
    }

    const current = await supabase
      .from('postulaciones')
      .select(POSTULACION_COLUMNS)
      .eq('id_postulacion', postulacionId)
      .maybeSingle();

    if (current.error) {
      return {
        ok: false,
        message: permissionMessage(current.error, 'No se pudo leer la postulación.'),
      };
    }

    const mapped = current.data
      ? mapPostulacion(current.data as Record<string, unknown>)
      : null;
    if (!mapped) {
      return { ok: false, message: 'No se encontró la postulación.' };
    }
    if (mapped.estado !== 'pendiente') {
      return { ok: false, message: 'Esta postulación ya fue respondida.' };
    }

    const oportunidad = await fetchOportunidadById(String(mapped.fk_oportunidad));
    if (!oportunidad.ok) {
      return oportunidad;
    }
    if (
      !oportunidad.data ||
      oportunidad.data.fk_representante.toLowerCase() !== userId.toLowerCase()
    ) {
      return {
        ok: false,
        message: 'Solo podés responder postulaciones de tus pruebas.',
      };
    }

    const { data, error, status } = await supabase
      .from('postulaciones')
      .update({ estado })
      .eq('id_postulacion', postulacionId)
      .eq('fk_oportunidad', mapped.fk_oportunidad)
      .eq('estado', 'pendiente')
      .select(POSTULACION_COLUMNS)
      .maybeSingle();

    await logOportunidadesQuery({
      operation: 'updatePostulacionEstado',
      table: 'postulaciones',
      filter: `UPDATE id_postulacion = ${postulacionId} estado = ${estado}`,
      error,
      status,
    });

    if (error) {
      return {
        ok: false,
        message: permissionMessage(
          error,
          estado === 'aceptada'
            ? 'No se pudo aceptar la postulación.'
            : 'No se pudo rechazar la postulación.',
        ),
      };
    }

    const updated = data ? mapPostulacion(data as Record<string, unknown>) : null;
    if (!updated) {
      return {
        ok: false,
        message:
          'No se pudo actualizar la postulación. Si el SELECT funciona, falta una policy UPDATE en public.postulaciones.',
      };
    }

    return { ok: true, data: updated };
  } catch (caught) {
    const message =
      caught instanceof Error
        ? caught.message
        : 'No se pudo actualizar la postulación.';
    return { ok: false, message };
  }
}

export async function fetchPostulacionCounts(
  oportunidadIds: number[],
): Promise<OportunidadResult<Map<number, number>>> {
  console.log('[postulaciones] oportunidad ids recibidos:', oportunidadIds);
  const uniqueIds = [...new Set(oportunidadIds.filter((id) => Number.isFinite(id)))];
  console.log('[postulaciones] oportunidad ids únicos:', uniqueIds);
  const counts = new Map<number, number>();
  if (uniqueIds.length === 0) {
    await logOportunidadesQuery({
      operation: 'fetchPostulacionCounts',
      table: 'postulaciones',
      filter: 'skipped: no oportunidad ids',
      error: null,
      status: 200,
    });
    return { ok: true, data: counts };
  }

  const { data, error, status } = await supabase
    .from('postulaciones')
    .select('id_postulacion, fk_oportunidad')
    .in('fk_oportunidad', uniqueIds);

  await logOportunidadesQuery({
    operation: 'fetchPostulacionCounts',
    table: 'postulaciones',
    filter: `fk_oportunidad IN (${uniqueIds.join(',')})`,
    error,
    status,
  });

  if (error) {
    return {
      ok: false,
      message: permissionMessage(error, 'No se pudieron cargar los postulantes.'),
    };
  }

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const oportunidadId = bigintId(row.fk_oportunidad);
    if (oportunidadId == null) {
      continue;
    }
    counts.set(oportunidadId, (counts.get(oportunidadId) ?? 0) + 1);
  }

  return { ok: true, data: counts };
}

export async function createPostulacion(
  oportunidadId: number,
): Promise<OportunidadResult<{ postulacion: Postulacion; alreadyApplied: boolean }>> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const userId = user?.id ?? '';
    if (userError || !user || !isRealUserId(userId)) {
      return {
        ok: false,
        message: userError?.message || 'No hay un usuario autenticado.',
      };
    }

    const profile = await fetchCreatedProfileKind(userId);
    if (profile.error) {
      return { ok: false, message: profile.error.message };
    }
    if (profile.kind !== 'player') {
      return {
        ok: false,
        message: 'Solo un jugador puede postularse a una oportunidad.',
      };
    }

    const existing = await supabase
      .from('postulaciones')
      .select(POSTULACION_COLUMNS)
      .eq('fk_oportunidad', oportunidadId)
      .eq('fk_jugador', user.id)
      .maybeSingle();

    if (existing.error) {
      await logOportunidadesQuery({
        operation: 'createPostulacion.existing',
        table: 'postulaciones',
        filter: `fk_oportunidad = ${oportunidadId} AND fk_jugador = ${user.id}`,
        error: existing.error,
      });
      return {
        ok: false,
        message: permissionMessage(existing.error, 'No se pudo verificar la postulación.'),
      };
    }

    const already = existing.data
      ? mapPostulacion(existing.data as Record<string, unknown>)
      : null;
    if (already) {
      return { ok: true, data: { postulacion: already, alreadyApplied: true } };
    }

    const payload = {
      fk_oportunidad: oportunidadId,
      fk_jugador: user.id,
      estado: ESTADO_POSTULACION_INICIAL,
      fecha_postulacion: new Date().toISOString(),
    };

    const { data: sessionData } = await supabase.auth.getSession();
    const claims = decodeJwtClaims(sessionData.session?.access_token);
    console.log(
      '[postulaciones] createPostulacion payload',
      JSON.stringify({
        fk_oportunidad: payload.fk_oportunidad,
        fk_jugador: payload.fk_jugador,
        estado: payload.estado,
        fecha_postulacion: payload.fecha_postulacion,
        getUserId: user.id,
        jwtSub: claims?.sub ?? null,
        fkMatchesGetUser: payload.fk_jugador === user.id,
        fkMatchesJwtSub: claims?.sub ? payload.fk_jugador === claims.sub : null,
        authRoleClaim: claims?.role ?? null,
        hasAccessToken: Boolean(sessionData.session?.access_token),
      }),
    );

    const { error, status } = await supabase.from('postulaciones').insert(payload);

    await logOportunidadesQuery({
      operation: 'createPostulacion',
      table: 'postulaciones',
      filter: `INSERT fk_oportunidad = ${payload.fk_oportunidad} fk_jugador = ${payload.fk_jugador}`,
      error,
      status,
    });

    if (error) {
      if (error.code === '23505' || /duplicate key|unique constraint/i.test(error.message)) {
        return {
          ok: true,
          data: {
            postulacion: {
              id_postulacion: 0,
              fk_oportunidad: oportunidadId,
              fk_jugador: user.id,
              estado: ESTADO_POSTULACION_INICIAL,
              fecha_postulacion: payload.fecha_postulacion,
            },
            alreadyApplied: true,
          },
        };
      }
      return {
        ok: false,
        message: permissionMessage(error, 'No se pudo enviar la postulación.'),
      };
    }
    if (status !== 201) {
      return {
        ok: false,
        message: `No se pudo enviar la postulación (status ${status}). La fila no se confirmó en la base.`,
      };
    }

    return {
      ok: true,
      data: {
        postulacion: {
          id_postulacion: 0,
          fk_oportunidad: payload.fk_oportunidad,
          fk_jugador: payload.fk_jugador,
          estado: payload.estado,
          fecha_postulacion: payload.fecha_postulacion,
        },
        alreadyApplied: false,
      },
    };
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : 'No se pudo enviar la postulación.';
    return { ok: false, message };
  }
}

export async function attachPublisherProfiles(rows: Oportunidad[]) {
  let people: Awaited<ReturnType<typeof fetchPublicPeopleByIds>> = [];
  try {
    people = await fetchPublicPeopleByIds(rows.map((row) => row.fk_representante));
  } catch {
    people = [];
  }
  const byId = new Map<string, (typeof people)[number]>();
  for (const profile of people) {
    byId.set(profile.id, profile);
    byId.set(profile.id.toLowerCase(), profile);
  }
  return rows.map((row) => {
    const profile =
      byId.get(row.fk_representante) ||
      byId.get(row.fk_representante.toLowerCase());
    return {
      oportunidad: row,
      representativeName: profile?.name || 'Representante',
      representativePhotoUrl: profile?.photoUrl,
    };
  });
}

export async function attachApplicantProfiles(rows: Postulacion[]) {
  let people: Awaited<ReturnType<typeof fetchPublicPeopleByIds>> = [];
  try {
    people = await fetchPublicPeopleByIds(rows.map((row) => row.fk_jugador));
  } catch {
    people = [];
  }
  const byId = new Map<string, (typeof people)[number]>();
  for (const profile of people) {
    byId.set(profile.id, profile);
    byId.set(profile.id.toLowerCase(), profile);
  }
  return rows.map((row) => {
    const profile =
      byId.get(row.fk_jugador) || byId.get(row.fk_jugador.toLowerCase());
    return {
      postulacion: row,
      profile: profile ?? null,
    };
  });
}
