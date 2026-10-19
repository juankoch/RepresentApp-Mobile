import { supabase } from './supabase';

export type TipoNotificacionRepresentacion =
  | 'solicitud_recibida'
  | 'solicitud_aceptada'
  | 'solicitud_rechazada';

export type NotificacionRepresentacion = {
  id_notificacion: number;
  fk_destinatario: string;
  fk_emisor: string;
  fk_representacion: number;
  tipo: TipoNotificacionRepresentacion;
  leido: boolean;
  fecha_creacion: string;
};

export type NotificacionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const NOTIFICACION_COLUMNS =
  'id_notificacion, fk_destinatario, fk_emisor, fk_representacion, tipo, leido, fecha_creacion';

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

function normalizeTipo(value: unknown): TipoNotificacionRepresentacion | null {
  const tipo = textValue(value);
  if (
    tipo === 'solicitud_recibida' ||
    tipo === 'solicitud_aceptada' ||
    tipo === 'solicitud_rechazada'
  ) {
    return tipo;
  }
  return null;
}

function mapNotificacion(row: Record<string, unknown>): NotificacionRepresentacion | null {
  const id = bigintId(row.id_notificacion);
  const destinatario = textValue(row.fk_destinatario);
  const emisor = textValue(row.fk_emisor);
  const representacionId = bigintId(row.fk_representacion);
  const tipo = normalizeTipo(row.tipo);
  const fechaCreacion = textValue(row.fecha_creacion);
  if (
    id == null ||
    !isRealUserId(destinatario) ||
    !isRealUserId(emisor) ||
    representacionId == null ||
    !tipo ||
    !fechaCreacion
  ) {
    return null;
  }

  return {
    id_notificacion: id,
    fk_destinatario: destinatario,
    fk_emisor: emisor,
    fk_representacion: representacionId,
    tipo,
    leido: row.leido === true,
    fecha_creacion: fechaCreacion,
  };
}

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !isRealUserId(data.user.id)) {
    return null;
  }
  return data.user.id;
}

export async function fetchMyRepresentationNotifications(): Promise<
  NotificacionResult<NotificacionRepresentacion[]>
> {
  const myId = await getAuthenticatedUserId();
  if (!myId) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const { data, error } = await supabase
    .from('notificaciones_representacion')
    .select(NOTIFICACION_COLUMNS)
    .eq('fk_destinatario', myId)
    .order('fecha_creacion', { ascending: false });

  if (error) {
    return { ok: false, message: error.message };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapNotificacion(row);
    return mapped && mapped.fk_destinatario === myId ? [mapped] : [];
  });

  return { ok: true, data: rows };
}

export async function fetchUnreadRepresentationNotificationCount(): Promise<
  NotificacionResult<number>
> {
  const myId = await getAuthenticatedUserId();
  if (!myId) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const { count, error } = await supabase
    .from('notificaciones_representacion')
    .select('id_notificacion', { count: 'exact', head: true })
    .eq('fk_destinatario', myId)
    .eq('leido', false);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, data: count ?? 0 };
}

export async function markRepresentationNotificationAsRead(
  idNotificacion: number,
): Promise<NotificacionResult<true>> {
  const myId = await getAuthenticatedUserId();
  if (!myId) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const { data, error } = await supabase
    .from('notificaciones_representacion')
    .update({ leido: true })
    .eq('id_notificacion', idNotificacion)
    .eq('fk_destinatario', myId)
    .select('id_notificacion');

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data || data.length === 0) {
    return { ok: false, message: 'No se pudo marcar la notificación como leída.' };
  }

  return { ok: true, data: true };
}

export async function markAllRepresentationNotificationsAsRead(): Promise<
  NotificacionResult<true>
> {
  const myId = await getAuthenticatedUserId();
  if (!myId) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const { error } = await supabase
    .from('notificaciones_representacion')
    .update({ leido: true })
    .eq('fk_destinatario', myId)
    .eq('leido', false);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, data: true };
}
