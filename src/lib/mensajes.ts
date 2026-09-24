import { ChatMessage } from '../data/playerMessages';
import { supabase } from './supabase';

export type MensajesResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type ConversationListItem = {
  id: string;
  profileId: string;
  preview: string;
  time: string;
  unread: number;
};

type ConversacionRow = {
  id_conversacion: number;
  fk_usuario_a: string;
  fk_usuario_b: string;
};

const CONVERSACION_COLUMNS = 'id_conversacion, fk_usuario_a, fk_usuario_b, fecha_creacion';
const MENSAJE_COLUMNS =
  'id_mensaje, fk_conversacion, fk_emisor, contenido, leido, fecha_envio';

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

function idAsString(value: unknown) {
  const id = bigintId(value);
  return id == null ? '' : String(id);
}

function formatMessageTime(value: unknown) {
  const raw = textValue(value);
  if (!raw) {
    return '';
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function canonicalPair(userId: string, otherUserId: string) {
  const first = userId.trim().toLowerCase();
  const second = otherUserId.trim().toLowerCase();
  return first < second
    ? { fk_usuario_a: first, fk_usuario_b: second }
    : { fk_usuario_a: second, fk_usuario_b: first };
}

function otherParticipant(row: ConversacionRow, userId: string) {
  return row.fk_usuario_a === userId ? row.fk_usuario_b : row.fk_usuario_a;
}

function isParticipant(row: ConversacionRow, userId: string) {
  return row.fk_usuario_a === userId || row.fk_usuario_b === userId;
}

function isUniqueViolation(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }
  return error.code === '23505' || /duplicate key|unique constraint/i.test(error.message ?? '');
}

function mapChatMessage(row: Record<string, unknown>, userId: string): ChatMessage | null {
  const id = idAsString(row.id_mensaje);
  const text = textValue(row.contenido);
  const emisor = textValue(row.fk_emisor);
  if (!id || !text || !emisor) {
    return null;
  }
  const fromMe = emisor === userId;
  const leido = row.leido === true;
  return {
    id,
    fromMe,
    text,
    time: formatMessageTime(row.fecha_envio),
    status: fromMe ? (leido ? 'read' : 'sent') : undefined,
  };
}

async function requireAuthenticatedUserId(userId: string) {
  if (!isRealUserId(userId)) {
    return { ok: false as const, message: 'El usuario autenticado no es válido.' };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false as const, message: 'No hay un usuario autenticado.' };
  }

  if (data.user.id !== userId.trim()) {
    return { ok: false as const, message: 'El usuario no coincide con la sesión autenticada.' };
  }

  return { ok: true as const, userId: data.user.id };
}

function mapConversacion(row: Record<string, unknown>): ConversacionRow | null {
  const id = bigintId(row.id_conversacion);
  const usuarioA = textValue(row.fk_usuario_a);
  const usuarioB = textValue(row.fk_usuario_b);
  if (id == null || !usuarioA || !usuarioB) {
    return null;
  }
  return {
    id_conversacion: id,
    fk_usuario_a: usuarioA,
    fk_usuario_b: usuarioB,
  };
}

async function fetchConversacionRow(conversationId: string) {
  const id = bigintId(conversationId);
  if (id == null) {
    return { row: null as ConversacionRow | null, error: null };
  }

  const { data, error } = await supabase
    .from('conversaciones')
    .select(CONVERSACION_COLUMNS)
    .eq('id_conversacion', id)
    .maybeSingle();

  if (error) {
    return { row: null as ConversacionRow | null, error };
  }

  return { row: data ? mapConversacion(data as Record<string, unknown>) : null, error: null };
}

export async function getConversationBetweenUsers(userId: string, otherUserId: string) {
  if (!isRealUserId(userId) || !isRealUserId(otherUserId) || userId.trim() === otherUserId.trim()) {
    return null;
  }

  const pair = canonicalPair(userId, otherUserId);
  const { data, error } = await supabase
    .from('conversaciones')
    .select('id_conversacion')
    .eq('fk_usuario_a', pair.fk_usuario_a)
    .eq('fk_usuario_b', pair.fk_usuario_b)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const id = idAsString((data as { id_conversacion?: unknown }).id_conversacion);
  return id && id !== 'me' ? id : null;
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

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
): Promise<MensajesResult<string>> {
  const auth = await requireAuthenticatedUserId(userId);
  if (!auth.ok) {
    return auth;
  }

  if (!isRealUserId(otherUserId) || auth.userId === otherUserId.trim()) {
    return { ok: false, message: 'No podés iniciar una conversación con vos mismo.' };
  }

  const connected = await areUsersConnected(auth.userId, otherUserId);
  if (!connected) {
    return {
      ok: false,
      message: 'Solo podés chatear con usuarios con los que tenés una conexión aceptada.',
    };
  }

  const existing = await getConversationBetweenUsers(auth.userId, otherUserId);
  if (existing) {
    return { ok: true, data: existing };
  }

  const pair = canonicalPair(auth.userId, otherUserId);
  const { data, error } = await supabase
    .from('conversaciones')
    .insert({
      fk_usuario_a: pair.fk_usuario_a,
      fk_usuario_b: pair.fk_usuario_b,
    })
    .select('id_conversacion')
    .maybeSingle();

  if (error) {
    if (isUniqueViolation(error)) {
      const raced = await getConversationBetweenUsers(auth.userId, otherUserId);
      if (raced) {
        return { ok: true, data: raced };
      }
    }
    return { ok: false, message: error.message };
  }

  const createdId = idAsString((data as { id_conversacion?: unknown } | null)?.id_conversacion);
  if (!createdId) {
    const fallback = await getConversationBetweenUsers(auth.userId, otherUserId);
    if (fallback) {
      return { ok: true, data: fallback };
    }
    return { ok: false, message: 'No se pudo crear la conversación.' };
  }

  return { ok: true, data: createdId };
}

export async function getUserConversations(
  userId: string,
): Promise<MensajesResult<ConversationListItem[]>> {
  const auth = await requireAuthenticatedUserId(userId);
  if (!auth.ok) {
    return auth;
  }

  const { data, error } = await supabase
    .from('conversaciones')
    .select(CONVERSACION_COLUMNS)
    .or(`fk_usuario_a.eq.${auth.userId},fk_usuario_b.eq.${auth.userId}`);

  if (error) {
    return { ok: false, message: error.message };
  }

  const conversations = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapConversacion(row);
    return mapped && isParticipant(mapped, auth.userId) ? [mapped] : [];
  });

  if (conversations.length === 0) {
    return { ok: true, data: [] };
  }

  const conversationIds = conversations.map((row) => row.id_conversacion);
  const { data: messageRows, error: messagesError } = await supabase
    .from('mensajes')
    .select(MENSAJE_COLUMNS)
    .in('fk_conversacion', conversationIds)
    .order('fecha_envio', { ascending: true });

  if (messagesError) {
    return { ok: false, message: messagesError.message };
  }

  const byConversation = new Map<
    number,
    { last?: Record<string, unknown>; unread: number }
  >();

  for (const raw of (messageRows ?? []) as Record<string, unknown>[]) {
    const conversationId = bigintId(raw.fk_conversacion);
    if (conversationId == null) {
      continue;
    }
    const current = byConversation.get(conversationId) ?? { unread: 0 };
    current.last = raw;
    const emisor = textValue(raw.fk_emisor);
    if (emisor && emisor !== auth.userId && raw.leido !== true) {
      current.unread += 1;
    }
    byConversation.set(conversationId, current);
  }

  const items = conversations
    .map((row) => {
      const stats = byConversation.get(row.id_conversacion);
      const last = stats?.last;
      return {
        id: String(row.id_conversacion),
        profileId: otherParticipant(row, auth.userId),
        preview: last ? textValue(last.contenido) : '',
        time: last ? formatMessageTime(last.fecha_envio) : '',
        unread: stats?.unread ?? 0,
        sortKey: last ? textValue(last.fecha_envio) : '',
      };
    })
    .sort((left, right) => {
      if (left.sortKey === right.sortKey) {
        return right.id.localeCompare(left.id);
      }
      return right.sortKey.localeCompare(left.sortKey);
    })
    .map(({ sortKey: _sortKey, ...item }) => item satisfies ConversationListItem);

  return { ok: true, data: items };
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
): Promise<MensajesResult<ChatMessage[]>> {
  const auth = await requireAuthenticatedUserId(userId);
  if (!auth.ok) {
    return auth;
  }

  const { row, error } = await fetchConversacionRow(conversationId);
  if (error) {
    return { ok: false, message: error.message };
  }
  if (!row || !isParticipant(row, auth.userId)) {
    return { ok: false, message: 'No tenés acceso a esta conversación.' };
  }

  const { data, error: messagesError } = await supabase
    .from('mensajes')
    .select(MENSAJE_COLUMNS)
    .eq('fk_conversacion', row.id_conversacion)
    .order('fecha_envio', { ascending: true });

  if (messagesError) {
    return { ok: false, message: messagesError.message };
  }

  const messages = ((data ?? []) as Record<string, unknown>[]).flatMap((item) => {
    const mapped = mapChatMessage(item, auth.userId);
    return mapped ? [mapped] : [];
  });

  return { ok: true, data: messages };
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  text: string,
): Promise<MensajesResult<ChatMessage>> {
  const auth = await requireAuthenticatedUserId(userId);
  if (!auth.ok) {
    return auth;
  }

  const contenido = text.trim();
  if (!contenido) {
    return { ok: false, message: 'El mensaje no puede estar vacío.' };
  }

  const { row, error } = await fetchConversacionRow(conversationId);
  if (error) {
    return { ok: false, message: error.message };
  }
  if (!row || !isParticipant(row, auth.userId)) {
    return { ok: false, message: 'No tenés acceso a esta conversación.' };
  }

  const { data, error: insertError } = await supabase
    .from('mensajes')
    .insert({
      fk_conversacion: row.id_conversacion,
      fk_emisor: auth.userId,
      contenido,
    })
    .select(MENSAJE_COLUMNS)
    .maybeSingle();

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  const sent = data ? mapChatMessage(data as Record<string, unknown>, auth.userId) : null;
  if (!sent) {
    return { ok: false, message: 'No se pudo enviar el mensaje.' };
  }

  return { ok: true, data: sent };
}

export async function markConversationAsRead(
  conversationId: string,
  userId: string,
): Promise<MensajesResult<true>> {
  const auth = await requireAuthenticatedUserId(userId);
  if (!auth.ok) {
    return auth;
  }

  const { row, error } = await fetchConversacionRow(conversationId);
  if (error) {
    return { ok: false, message: error.message };
  }
  if (!row || !isParticipant(row, auth.userId)) {
    return { ok: false, message: 'No tenés acceso a esta conversación.' };
  }

  const { error: updateError } = await supabase
    .from('mensajes')
    .update({ leido: true })
    .eq('fk_conversacion', row.id_conversacion)
    .eq('leido', false)
    .neq('fk_emisor', auth.userId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  return { ok: true, data: true };
}

export async function deleteConversation(
  conversationId: string,
  userId: string,
): Promise<MensajesResult<true>> {
  const auth = await requireAuthenticatedUserId(userId);
  if (!auth.ok) {
    return auth;
  }

  const { row, error } = await fetchConversacionRow(conversationId);
  if (error) {
    return { ok: false, message: error.message };
  }
  if (!row || !isParticipant(row, auth.userId)) {
    return { ok: false, message: 'No tenés acceso a esta conversación.' };
  }

  const { error: messagesError } = await supabase
    .from('mensajes')
    .delete()
    .eq('fk_conversacion', row.id_conversacion);

  if (messagesError) {
    return { ok: false, message: messagesError.message };
  }

  const { error: deleteError } = await supabase
    .from('conversaciones')
    .delete()
    .eq('id_conversacion', row.id_conversacion);

  if (deleteError) {
    return { ok: false, message: deleteError.message };
  }

  return { ok: true, data: true };
}
