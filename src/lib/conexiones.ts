import { supabase } from './supabase';

export type Conexion = {
  id_conexion: number;
  fk_solicitante: string;
  fk_receptor: string;
  estado: string;
  fecha_solicitud: string | null;
  fecha_respuesta: string | null;
};

export type ConexionMutationResult =
  | { ok: true }
  | { ok: false; message: string };

const CONEXION_COLUMNS =
  'id_conexion, fk_solicitante, fk_receptor, estado, fecha_solicitud, fecha_respuesta';

export async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
}

function isRealUserId(value: string) {
  const id = normalizeUserId(value);
  return id.length > 0 && id !== 'me';
}

function normalizeUserId(value: string) {
  return value.trim().toLowerCase();
}

export async function areUsersConnected(userId: string, otherUserId: string) {
  if (!isRealUserId(userId) || !isRealUserId(otherUserId) || userId.trim() === otherUserId.trim()) {
    return false;
  }

  const first = userId.trim();
  const second = otherUserId.trim();
  const { data, error } = await supabase
    .from('conexiones')
    .select('id_conexion')
    .eq('estado', 'aceptada')
    .or(
      `and(fk_solicitante.eq.${first},fk_receptor.eq.${second}),and(fk_solicitante.eq.${second},fk_receptor.eq.${first})`,
    )
    .limit(1);

  if (error) {
    return false;
  }

  return (data ?? []).length > 0;
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function mapConexion(row: Record<string, unknown>): Conexion | null {
  const solicitante = textValue(row.fk_solicitante);
  const receptor = textValue(row.fk_receptor);
  const idRaw = row.id_conexion;
  const id =
    typeof idRaw === 'number'
      ? idRaw
      : typeof idRaw === 'string'
        ? Number(idRaw)
        : NaN;
  if (!solicitante || !receptor || !Number.isFinite(id)) {
    return null;
  }

  return {
    id_conexion: id,
    fk_solicitante: solicitante,
    fk_receptor: receptor,
    estado: textValue(row.estado).toLowerCase(),
    fecha_solicitud: textValue(row.fecha_solicitud) || null,
    fecha_respuesta: textValue(row.fecha_respuesta) || null,
  };
}

export function otherUserId(conexion: Conexion, myId: string) {
  return conexion.fk_solicitante === myId
    ? conexion.fk_receptor
    : conexion.fk_solicitante;
}

export function belongsToUser(conexion: Conexion, userId: string) {
  const id = normalizeUserId(userId);
  return (
    normalizeUserId(conexion.fk_solicitante) === id ||
    normalizeUserId(conexion.fk_receptor) === id
  );
}

export function connectionPartnerId(conexion: Conexion, userId: string) {
  const id = normalizeUserId(userId);
  const solicitante = normalizeUserId(conexion.fk_solicitante);
  const receptor = normalizeUserId(conexion.fk_receptor);
  if (solicitante !== id && receptor !== id) {
    return null;
  }
  return solicitante === id ? receptor : solicitante;
}

export function partnerIdsFromAcceptedConnections(
  rows: Conexion[],
  userId: string,
) {
  const id = normalizeUserId(userId);
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (row.estado !== 'aceptada' || !belongsToUser(row, id)) {
      continue;
    }
    const otherUserId = connectionPartnerId(row, id);
    if (!otherUserId || otherUserId === 'me' || otherUserId === id || seen.has(otherUserId)) {
      continue;
    }
    seen.add(otherUserId);
    ids.push(otherUserId);
  }

  return ids;
}

export async function fetchAcceptedConnectionPartnerIds(userId: string) {
  const rows = await fetchAcceptedConnections(userId);
  return partnerIdsFromAcceptedConnections(rows, userId);
}

export function isActiveConexionEstado(estado: string) {
  return estado === 'pendiente' || estado === 'aceptada';
}

function mutationErrorMessage(error: { message?: string } | null, fallback: string) {
  const message = error?.message?.trim() || fallback;
  if (/row-level security|permission denied/i.test(message)) {
    return 'No se pudo actualizar la conexión. Falta una policy UPDATE en public.conexiones.';
  }
  return message;
}

export async function fetchMisConexiones() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const myId = user?.id?.trim() || null;
  if (userError || !myId || myId === 'me') {
    return {
      myId: null as string | null,
      rows: [] as Conexion[],
      error: userError ?? null,
    };
  }

  const [asSolicitante, asReceptor] = await Promise.all([
    supabase
      .from('conexiones')
      .select(CONEXION_COLUMNS)
      .eq('fk_solicitante', myId),
    supabase
      .from('conexiones')
      .select(CONEXION_COLUMNS)
      .eq('fk_receptor', myId),
  ]);

  if (asSolicitante.error) {
    return { myId, rows: [] as Conexion[], error: asSolicitante.error };
  }
  if (asReceptor.error) {
    return { myId, rows: [] as Conexion[], error: asReceptor.error };
  }

  const seen = new Set<string>();
  const rows: Conexion[] = [];
  for (const raw of [...(asSolicitante.data ?? []), ...(asReceptor.data ?? [])]) {
    const mapped = mapConexion(raw as Record<string, unknown>);
    if (
      !mapped ||
      !belongsToUser(mapped, myId) ||
      (mapped.estado !== 'aceptada' && mapped.estado !== 'pendiente')
    ) {
      continue;
    }
    const rowKey = String(mapped.id_conexion);
    if (seen.has(rowKey)) {
      continue;
    }
    seen.add(rowKey);
    rows.push(mapped);
  }

  return { myId, rows, error: null };
}

export async function fetchAcceptedConnections(userId: string) {
  if (!isRealUserId(userId)) {
    return [] as Conexion[];
  }

  const id = userId.trim();
  const [asSolicitante, asReceptor] = await Promise.all([
    supabase
      .from('conexiones')
      .select(CONEXION_COLUMNS)
      .eq('estado', 'aceptada')
      .eq('fk_solicitante', id),
    supabase
      .from('conexiones')
      .select(CONEXION_COLUMNS)
      .eq('estado', 'aceptada')
      .eq('fk_receptor', id),
  ]);

  if (asSolicitante.error) {
    throw asSolicitante.error;
  }
  if (asReceptor.error) {
    throw asReceptor.error;
  }

  const seen = new Set<string>();
  const rows: Conexion[] = [];
  for (const raw of [...(asSolicitante.data ?? []), ...(asReceptor.data ?? [])]) {
    const mapped = mapConexion(raw as Record<string, unknown>);
    if (!mapped || mapped.estado !== 'aceptada' || !belongsToUser(mapped, id)) {
      continue;
    }
    const rowKey = String(mapped.id_conexion);
    if (seen.has(rowKey)) {
      continue;
    }
    seen.add(rowKey);
    rows.push(mapped);
  }

  return rows;
}

async function findActiveRelation(myId: string, otherId: string) {
  const { data, error } = await supabase
    .from('conexiones')
    .select(CONEXION_COLUMNS)
    .or(
      `and(fk_solicitante.eq.${myId},fk_receptor.eq.${otherId}),and(fk_solicitante.eq.${otherId},fk_receptor.eq.${myId})`,
    );

  if (error) {
    return { row: null as Conexion | null, error };
  }

  const row =
    ((data ?? []) as Record<string, unknown>[])
      .flatMap((item) => {
        const mapped = mapConexion(item);
        return mapped ? [mapped] : [];
      })
      .find((item) => isActiveConexionEstado(item.estado)) ?? null;

  return { row, error: null };
}

export async function sendConnectionRequest(
  receptorId: string,
): Promise<ConexionMutationResult> {
  const myId = await getAuthenticatedUserId();
  if (!myId) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const otherId = receptorId.trim();
  if (!otherId || otherId === 'me' || otherId === myId) {
    return { ok: false, message: 'No podés enviarte una solicitud a vos mismo.' };
  }

  const existing = await findActiveRelation(myId, otherId);
  if (existing.error) {
    return { ok: false, message: existing.error.message };
  }
  if (existing.row) {
    return {
      ok: false,
      message: 'Ya existe una solicitud o conexión con este usuario.',
    };
  }

  const { error } = await supabase.from('conexiones').insert({
    fk_solicitante: myId,
    fk_receptor: otherId,
    estado: 'pendiente',
  });

  if (error) {
    return { ok: false, message: mutationErrorMessage(error, 'No se pudo enviar la solicitud.') };
  }

  return { ok: true };
}

async function responderSolicitud(
  idConexion: number,
  estado: 'aceptada' | 'rechazada',
): Promise<ConexionMutationResult> {
  const myId = await getAuthenticatedUserId();
  if (!myId) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const { data, error } = await supabase
    .from('conexiones')
    .update({
      estado,
      fecha_respuesta: new Date().toISOString(),
    })
    .eq('id_conexion', idConexion)
    .eq('fk_receptor', myId)
    .eq('estado', 'pendiente')
    .select('id_conexion');

  if (error) {
    return {
      ok: false,
      message: mutationErrorMessage(
        error,
        estado === 'aceptada'
          ? 'No se pudo aceptar la solicitud.'
          : 'No se pudo rechazar la solicitud.',
      ),
    };
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      message:
        'No se pudo actualizar la solicitud. Si el SELECT funciona, falta una policy UPDATE en public.conexiones.',
    };
  }

  return { ok: true };
}

export function acceptConnectionRequest(idConexion: number) {
  return responderSolicitud(idConexion, 'aceptada');
}

export function rejectConnectionRequest(idConexion: number) {
  return responderSolicitud(idConexion, 'rechazada');
}

export function incomingPendingFrom(
  rows: Conexion[],
  myId: string | null,
  userId: string,
) {
  if (!myId) {
    return undefined;
  }
  return rows.find(
    (row) =>
      row.estado === 'pendiente' &&
      row.fk_receptor === myId &&
      row.fk_solicitante === userId,
  );
}
