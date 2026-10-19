import { areUsersConnected as areUsersConnectedByAcceptedConnection } from './conexiones';
import { supabase } from './supabase';

export type RepresentationStatus = 'pendiente' | 'aceptada' | 'rechazada';

export type Representacion = {
  id_representacion: number;
  fk_jugador: string;
  fk_representante: string;
  fk_solicitante: string;
  estado: RepresentationStatus;
  fecha_solicitud: string;
  fecha_respuesta: string | null;
};

export type RepresentacionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type RepresentacionMutationResult =
  | { ok: true }
  | { ok: false; message: string };

type RepresentationNotificationTipo =
  | 'solicitud_recibida'
  | 'solicitud_aceptada'
  | 'solicitud_rechazada';

const REPRESENTACION_COLUMNS =
  'id_representacion, fk_jugador, fk_representante, fk_solicitante, estado, fecha_solicitud, fecha_respuesta';

const ACTIVE_STATUSES: RepresentationStatus[] = ['pendiente', 'aceptada'];

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

function normalizeStatus(value: unknown): RepresentationStatus | null {
  const estado = textValue(value).toLowerCase();
  if (estado === 'pendiente' || estado === 'aceptada' || estado === 'rechazada') {
    return estado;
  }
  return null;
}

function isUniqueViolation(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }
  return (
    error.code === '23505' ||
    /duplicate key|unique constraint|representaciones_unica_activa_por_jugador/i.test(
      error.message ?? '',
    )
  );
}

function mapRepresentacion(row: Record<string, unknown>): Representacion | null {
  const id = bigintId(row.id_representacion);
  const jugador = textValue(row.fk_jugador);
  const representante = textValue(row.fk_representante);
  const solicitante = textValue(row.fk_solicitante);
  const estado = normalizeStatus(row.estado);
  const fechaSolicitud = textValue(row.fecha_solicitud);
  if (
    id == null ||
    !isRealUserId(jugador) ||
    !isRealUserId(representante) ||
    !isRealUserId(solicitante) ||
    !estado ||
    !fechaSolicitud
  ) {
    return null;
  }

  return {
    id_representacion: id,
    fk_jugador: jugador,
    fk_representante: representante,
    fk_solicitante: solicitante,
    estado,
    fecha_solicitud: fechaSolicitud,
    fecha_respuesta: textValue(row.fecha_respuesta) || null,
  };
}

function mutationErrorMessage(error: { message?: string } | null, fallback: string) {
  const message = error?.message?.trim() || fallback;
  if (/row-level security|permission denied/i.test(message)) {
    return 'No se pudo actualizar la representación. Revisá las policies de public.representaciones.';
  }
  return message;
}

async function createRepresentationNotification(params: {
  destinatarioId: string;
  emisorId: string;
  representacionId: number;
  tipo: RepresentationNotificationTipo;
}) {
  const destinatarioId = params.destinatarioId.trim();
  const emisorId = params.emisorId.trim();
  if (
    !isRealUserId(destinatarioId) ||
    !isRealUserId(emisorId) ||
    destinatarioId === 'me' ||
    emisorId === 'me' ||
    destinatarioId === emisorId
  ) {
    return;
  }

  await supabase.from('notificaciones_representacion').insert({
    fk_destinatario: destinatarioId,
    fk_emisor: emisorId,
    fk_representacion: params.representacionId,
    tipo: params.tipo,
  });
}

export async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
}

async function fetchUserKind(userId: string) {
  if (!isRealUserId(userId)) {
    return { kind: null as 'player' | 'agent' | null, error: null };
  }

  const { data: player, error: playerError } = await supabase
    .from('perfiles_jugador')
    .select('id_usuario')
    .eq('id_usuario', userId)
    .maybeSingle();

  if (playerError) {
    return { kind: null as 'player' | 'agent' | null, error: playerError };
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
    return { kind: null as 'player' | 'agent' | null, error: agentError };
  }
  if (agent) {
    return { kind: 'agent' as const, error: null };
  }

  return { kind: null as 'player' | 'agent' | null, error: null };
}

function canonicalPair(
  myId: string,
  otherId: string,
  myKind: 'player' | 'agent',
  otherKind: 'player' | 'agent',
) {
  if (myKind === otherKind) {
    return null;
  }
  if (myKind === 'player' && otherKind === 'agent') {
    return { fk_jugador: myId, fk_representante: otherId };
  }
  if (myKind === 'agent' && otherKind === 'player') {
    return { fk_jugador: otherId, fk_representante: myId };
  }
  return null;
}

export async function areUsersConnected(userId: string, otherUserId: string) {
  return areUsersConnectedByAcceptedConnection(userId, otherUserId);
}

async function fetchRepresentacionRow(idRepresentacion: number) {
  const { data, error } = await supabase
    .from('representaciones')
    .select(REPRESENTACION_COLUMNS)
    .eq('id_representacion', idRepresentacion)
    .maybeSingle();

  if (error) {
    return { row: null as Representacion | null, error };
  }

  return {
    row: data ? mapRepresentacion(data as Record<string, unknown>) : null,
    error: null,
  };
}

function pickRepresentationBetweenUsers(rows: Representacion[]) {
  const accepted = rows.find((row) => row.estado === 'aceptada');
  if (accepted) {
    return accepted;
  }
  const pending = rows.find((row) => row.estado === 'pendiente');
  if (pending) {
    return pending;
  }
  return rows[0] ?? null;
}

export async function getRepresentationBetweenUsers(
  userId: string,
  otherUserId: string,
): Promise<Representacion | null> {
  if (!isRealUserId(userId) || !isRealUserId(otherUserId) || userId.trim() === otherUserId.trim()) {
    return null;
  }

  const first = userId.trim();
  const second = otherUserId.trim();
  const { data, error } = await supabase
    .from('representaciones')
    .select(REPRESENTACION_COLUMNS)
    .or(
      `and(fk_jugador.eq.${first},fk_representante.eq.${second}),and(fk_jugador.eq.${second},fk_representante.eq.${first})`,
    )
    .order('fecha_solicitud', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapRepresentacion(row);
    return mapped ? [mapped] : [];
  });

  return pickRepresentationBetweenUsers(rows);
}

export async function getActiveRepresentationForPlayer(playerId: string) {
  if (!isRealUserId(playerId)) {
    return null;
  }

  const { data, error } = await supabase
    .from('representaciones')
    .select(REPRESENTACION_COLUMNS)
    .eq('fk_jugador', playerId.trim())
    .in('estado', ACTIVE_STATUSES)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRepresentacion(data as Record<string, unknown>) : null;
}

export async function sendRepresentationRequest(
  otherUserId: string,
): Promise<RepresentacionMutationResult> {
  const myId = await getAuthenticatedUserId();
  if (!myId || !isRealUserId(myId)) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const otherId = otherUserId.trim();
  if (!isRealUserId(otherId) || otherId === myId) {
    return { ok: false, message: 'No podés solicitarte representación a vos mismo.' };
  }

  const [myKindResult, otherKindResult] = await Promise.all([
    fetchUserKind(myId),
    fetchUserKind(otherId),
  ]);

  if (myKindResult.error) {
    return { ok: false, message: myKindResult.error.message };
  }
  if (otherKindResult.error) {
    return { ok: false, message: otherKindResult.error.message };
  }
  if (!myKindResult.kind || !otherKindResult.kind) {
    return {
      ok: false,
      message: 'No se pudo determinar el rol de ambos usuarios.',
    };
  }

  const pair = canonicalPair(myId, otherId, myKindResult.kind, otherKindResult.kind);
  if (!pair) {
    return {
      ok: false,
      message: 'La representación solo puede solicitarse entre un jugador y un representante.',
    };
  }

  const connected = await areUsersConnected(myId, otherId);
  if (!connected) {
    return {
      ok: false,
      message:
        'Tenés que estar conectado con este usuario para solicitar representación.',
    };
  }

  const active = await getActiveRepresentationForPlayer(pair.fk_jugador);
  if (active) {
    if (active.fk_representante === pair.fk_representante) {
      return {
        ok: false,
        message:
          active.estado === 'aceptada'
            ? 'Ya existe una representación aceptada entre estos usuarios.'
            : 'Ya existe una solicitud de representación pendiente entre estos usuarios.',
      };
    }
    return {
      ok: false,
      message: 'Este jugador ya tiene una representación pendiente o aceptada.',
    };
  }

  const { data, error } = await supabase
    .from('representaciones')
    .insert({
      fk_jugador: pair.fk_jugador,
      fk_representante: pair.fk_representante,
      fk_solicitante: myId,
      estado: 'pendiente',
    })
    .select('id_representacion')
    .maybeSingle();

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        message: 'Este jugador ya tiene una representación pendiente o aceptada.',
      };
    }
    return {
      ok: false,
      message: mutationErrorMessage(error, 'No se pudo enviar la solicitud de representación.'),
    };
  }

  const createdId = bigintId(
    (data as { id_representacion?: unknown } | null)?.id_representacion,
  );
  const destinatarioId =
    pair.fk_jugador === myId ? pair.fk_representante : pair.fk_jugador;
  if (createdId != null) {
    await createRepresentationNotification({
      destinatarioId,
      emisorId: myId,
      representacionId: createdId,
      tipo: 'solicitud_recibida',
    });
  }

  return { ok: true };
}

async function responderSolicitud(
  idRepresentacion: number,
  estado: 'aceptada' | 'rechazada',
): Promise<RepresentacionMutationResult> {
  const myId = await getAuthenticatedUserId();
  if (!myId || !isRealUserId(myId)) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const { row, error: fetchError } = await fetchRepresentacionRow(idRepresentacion);
  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }
  if (!row) {
    return { ok: false, message: 'No encontramos esa solicitud de representación.' };
  }
  if (row.estado !== 'pendiente') {
    return { ok: false, message: 'La solicitud ya no está pendiente.' };
  }
  if (row.fk_jugador !== myId && row.fk_representante !== myId) {
    return { ok: false, message: 'No tenés acceso a esta solicitud de representación.' };
  }
  if (row.fk_solicitante === myId) {
    return {
      ok: false,
      message: 'Solo el destinatario de la solicitud puede responderla.',
    };
  }

  const { data, error } = await supabase
    .from('representaciones')
    .update({
      estado,
      fecha_respuesta: new Date().toISOString(),
    })
    .eq('id_representacion', idRepresentacion)
    .eq('estado', 'pendiente')
    .neq('fk_solicitante', myId)
    .or(`fk_jugador.eq.${myId},fk_representante.eq.${myId}`)
    .select('id_representacion');

  if (error) {
    return {
      ok: false,
      message: mutationErrorMessage(
        error,
        estado === 'aceptada'
          ? 'No se pudo aceptar la solicitud de representación.'
          : 'No se pudo rechazar la solicitud de representación.',
      ),
    };
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      message:
        'No se pudo actualizar la solicitud de representación. Si el SELECT funciona, falta una policy UPDATE en public.representaciones.',
    };
  }

  await createRepresentationNotification({
    destinatarioId: row.fk_solicitante,
    emisorId: myId,
    representacionId: idRepresentacion,
    tipo: estado === 'aceptada' ? 'solicitud_aceptada' : 'solicitud_rechazada',
  });

  return { ok: true };
}

export function acceptRepresentationRequest(idRepresentacion: number) {
  return responderSolicitud(idRepresentacion, 'aceptada');
}

export function rejectRepresentationRequest(idRepresentacion: number) {
  return responderSolicitud(idRepresentacion, 'rechazada');
}

export async function fetchMisRepresentaciones(): Promise<
  RepresentacionResult<Representacion[]>
> {
  const myId = await getAuthenticatedUserId();
  if (!myId || !isRealUserId(myId)) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const { data, error } = await supabase
    .from('representaciones')
    .select(REPRESENTACION_COLUMNS)
    .or(`fk_jugador.eq.${myId},fk_representante.eq.${myId}`)
    .order('fecha_solicitud', { ascending: false });

  if (error) {
    return { ok: false, message: error.message };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapRepresentacion(row);
    return mapped ? [mapped] : [];
  });

  return { ok: true, data: rows };
}

export async function fetchIncomingRepresentationRequests(): Promise<
  RepresentacionResult<Representacion[]>
> {
  const myId = await getAuthenticatedUserId();
  if (!myId || !isRealUserId(myId)) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const { data, error } = await supabase
    .from('representaciones')
    .select(REPRESENTACION_COLUMNS)
    .eq('estado', 'pendiente')
    .neq('fk_solicitante', myId)
    .or(`fk_jugador.eq.${myId},fk_representante.eq.${myId}`)
    .order('fecha_solicitud', { ascending: false });

  if (error) {
    return { ok: false, message: error.message };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapRepresentacion(row);
    return mapped && mapped.fk_solicitante !== myId ? [mapped] : [];
  });

  return { ok: true, data: rows };
}

export async function isRepresentedBy(userId: string, representativeId: string) {
  if (!isRealUserId(userId) || !isRealUserId(representativeId)) {
    return false;
  }

  const { data, error } = await supabase
    .from('representaciones')
    .select('id_representacion')
    .eq('fk_jugador', userId.trim())
    .eq('fk_representante', representativeId.trim())
    .eq('estado', 'aceptada')
    .limit(1);

  if (error) {
    throw error;
  }

  return (data ?? []).length > 0;
}

export async function isRepresenting(representativeId: string, playerId: string) {
  return isRepresentedBy(playerId, representativeId);
}

export async function getRepresentedPlayers(representativeId: string) {
  if (!isRealUserId(representativeId)) {
    return [] as Representacion[];
  }

  const { data, error } = await supabase
    .from('representaciones')
    .select(REPRESENTACION_COLUMNS)
    .eq('fk_representante', representativeId.trim())
    .eq('estado', 'aceptada')
    .order('fecha_solicitud', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapRepresentacion(row);
    return mapped ? [mapped] : [];
  });
}
