import { supabase } from './supabase';

export const HIGHLIGHTS_BUCKET = 'highlights';
export const MAX_HIGHLIGHTS = 6;

const MULTIMEDIA_COLUMNS =
  'id_multimedia, fk_jugador, tipo, url, titulo, descripcion, fecha_subida';

export type HighlightVideo = {
  id: number;
  playerId: string;
  url: string;
  title: string;
  uploadedAt: string;
};

export type HighlightResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
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

function isRealUserId(value: string) {
  const id = value.trim();
  return id.length > 0 && id !== 'me';
}

function mapHighlight(row: Record<string, unknown>): HighlightVideo | null {
  const id = bigintId(row.id_multimedia);
  const playerId = textValue(row.fk_jugador);
  const url = textValue(row.url);
  if (id == null || !isRealUserId(playerId) || !url) {
    return null;
  }
  return {
    id,
    playerId,
    url,
    title: textValue(row.titulo) || 'Highlight',
    uploadedAt: textValue(row.fecha_subida),
  };
}

function tableMissingMessage(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? '';
  if (
    error?.code === '42P01' ||
    /relation .*multimedia.* does not exist|could not find the table/i.test(message)
  ) {
    return 'Falta la tabla public.multimedia en Supabase. Corré el SQL de highlights.';
  }
  if (/bucket|not found|does not exist/i.test(message)) {
    return 'Falta el bucket "highlights" en Storage. Crealo público en Supabase.';
  }
  return message || 'No se pudo completar la operación.';
}

function videoExtension(mimeType?: string | null, fileName?: string | null) {
  const fromName = fileName?.split('.').pop()?.trim().toLowerCase();
  if (fromName && /^(mp4|mov|m4v|webm)$/.test(fromName)) {
    return fromName === 'm4v' ? 'mp4' : fromName;
  }
  if (mimeType === 'video/quicktime') {
    return 'mov';
  }
  if (mimeType === 'video/webm') {
    return 'webm';
  }
  return 'mp4';
}

function storagePathFromPublicUrl(url: string) {
  const marker = `/object/public/${HIGHLIGHTS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) {
    return null;
  }
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0] ?? '');
}

export async function fetchHighlights(
  playerId: string,
): Promise<HighlightResult<HighlightVideo[]>> {
  const id = playerId.trim();
  if (!isRealUserId(id)) {
    return { ok: true, data: [] };
  }

  const { data, error } = await supabase
    .from('multimedia')
    .select(MULTIMEDIA_COLUMNS)
    .eq('fk_jugador', id)
    .eq('tipo', 'video')
    .order('fecha_subida', { ascending: false });

  if (error) {
    return { ok: false, message: tableMissingMessage(error) };
  }

  const videos = ((data ?? []) as Record<string, unknown>[]).flatMap((row) => {
    const mapped = mapHighlight(row);
    return mapped ? [mapped] : [];
  });

  return { ok: true, data: videos };
}

export async function uploadHighlight(params: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  title: string;
}): Promise<HighlightResult<HighlightVideo>> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData.user?.id?.trim() ?? '';
  if (userError || !isRealUserId(userId)) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }

  const existing = await fetchHighlights(userId);
  if (!existing.ok) {
    return existing;
  }
  if (existing.data.length >= MAX_HIGHLIGHTS) {
    return {
      ok: false,
      message: `Podés subir hasta ${MAX_HIGHLIGHTS} highlights.`,
    };
  }

  const response = await fetch(params.uri);
  if (!response.ok) {
    return { ok: false, message: 'No se pudo leer el video seleccionado.' };
  }

  const extension = videoExtension(params.mimeType, params.fileName);
  const path = `${userId}/${Date.now()}.${extension}`;
  const body = await response.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(HIGHLIGHTS_BUCKET)
    .upload(path, body, {
      contentType: params.mimeType || 'video/mp4',
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, message: tableMissingMessage(uploadError) };
  }

  const { data: publicData } = supabase.storage
    .from(HIGHLIGHTS_BUCKET)
    .getPublicUrl(path);
  const url = publicData.publicUrl;
  if (!url) {
    return { ok: false, message: 'No se pudo obtener la URL del video.' };
  }

  const title = params.title.trim() || 'Highlight';
  const { data, error } = await supabase
    .from('multimedia')
    .insert({
      fk_jugador: userId,
      tipo: 'video',
      url,
      titulo: title,
      descripcion: null,
    })
    .select(MULTIMEDIA_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    await supabase.storage.from(HIGHLIGHTS_BUCKET).remove([path]);
    return {
      ok: false,
      message: tableMissingMessage(error),
    };
  }

  const mapped = mapHighlight(data as Record<string, unknown>);
  if (!mapped) {
    return { ok: false, message: 'No se pudo guardar el highlight.' };
  }
  return { ok: true, data: mapped };
}

export async function deleteHighlight(
  highlight: HighlightVideo,
): Promise<HighlightResult<true>> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData.user?.id?.trim() ?? '';
  if (userError || !isRealUserId(userId)) {
    return { ok: false, message: 'No hay un usuario autenticado.' };
  }
  if (highlight.playerId !== userId) {
    return { ok: false, message: 'Solo podés borrar tus highlights.' };
  }

  const { error } = await supabase
    .from('multimedia')
    .delete()
    .eq('id_multimedia', highlight.id)
    .eq('fk_jugador', userId);

  if (error) {
    return { ok: false, message: tableMissingMessage(error) };
  }

  const storagePath = storagePathFromPublicUrl(highlight.url);
  if (storagePath) {
    await supabase.storage.from(HIGHLIGHTS_BUCKET).remove([storagePath]);
  }

  return { ok: true, data: true };
}
