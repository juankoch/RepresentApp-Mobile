import { supabase } from './supabase';

function clubIdFromRow(row: { id_club?: unknown } | null) {
  const id = row?.id_club;
  if (typeof id === 'number' || typeof id === 'string') {
    return id;
  }
  return null;
}

export async function findOrCreateClubId(nombre: string) {
  const trimmed = nombre.trim();
  if (!trimmed) {
    return null;
  }

  const { data: existing, error: selectError } = await supabase
    .from('clubes')
    .select('id_club')
    .ilike('nombre', trimmed)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  const existingId = clubIdFromRow(existing as { id_club?: unknown } | null);
  if (existingId != null) {
    return existingId;
  }

  const { data: created, error: insertError } = await supabase
    .from('clubes')
    .insert({ nombre: trimmed })
    .select('id_club')
    .single();

  if (insertError) {
    throw insertError;
  }

  const createdId = clubIdFromRow(created as { id_club?: unknown } | null);
  if (createdId == null) {
    throw new Error('No se pudo crear el club.');
  }

  return createdId;
}
