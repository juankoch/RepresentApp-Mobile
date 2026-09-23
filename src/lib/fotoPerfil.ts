import { supabase } from './supabase';

export const FOTO_PERFIL_BUCKET = 'fotos-perfil';

export function isRemotePhotoUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function photoExtension(mimeType?: string | null, fileName?: string | null) {
  const fromName = fileName?.split('.').pop()?.trim().toLowerCase();
  if (fromName && /^(jpe?g|png|webp|heic|heif)$/.test(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  if (mimeType === 'image/png') {
    return 'png';
  }
  if (mimeType === 'image/webp') {
    return 'webp';
  }
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    return 'heic';
  }
  return 'jpg';
}

export async function uploadAuthenticatedUserPhoto(params: {
  userId: string;
  uri: string;
  mimeType: string;
  extension: string;
}) {
  const path = `${params.userId}/foto-perfil.${params.extension}`;
  const response = await fetch(params.uri);
  if (!response.ok) {
    throw new Error('No se pudo leer la imagen seleccionada.');
  }

  const body = await response.arrayBuffer();
  const { error } = await supabase.storage
    .from(FOTO_PERFIL_BUCKET)
    .upload(path, body, {
      contentType: params.mimeType || 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(FOTO_PERFIL_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    throw new Error('No se pudo obtener la URL de la foto subida.');
  }

  return data.publicUrl;
}
