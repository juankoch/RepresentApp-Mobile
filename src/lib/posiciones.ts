import { supabase } from './supabase';

function posicionIdFromRow(row: { id_posicion?: unknown } | null) {
  const id = row?.id_posicion;
  if (typeof id === 'number' || typeof id === 'string') {
    return id;
  }
  return null;
}

export async function findOrCreatePosicionId(nombre: string) {
  const trimmed = nombre.trim();
  if (!trimmed) {
    return null;
  }

  const { data: existing, error: selectError } = await supabase
    .from('posiciones')
    .select('id_posicion')
    .ilike('nombre', trimmed)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  const existingId = posicionIdFromRow(
    existing as { id_posicion?: unknown } | null,
  );
  if (existingId != null) {
    return existingId;
  }

  const { error: insertError } = await supabase
    .from('posiciones')
    .insert({ nombre: trimmed });

  if (insertError) {
    throw insertError;
  }

  const { data: created, error: createdError } = await supabase
    .from('posiciones')
    .select('id_posicion')
    .ilike('nombre', trimmed)
    .limit(1)
    .maybeSingle();

  if (createdError) {
    throw createdError;
  }

  const createdId = posicionIdFromRow(
    created as { id_posicion?: unknown } | null,
  );
  if (createdId == null) {
    throw new Error('No se pudo crear la posición.');
  }

  return createdId;
}
