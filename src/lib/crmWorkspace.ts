import AsyncStorage from '@react-native-async-storage/async-storage';

import { CrmTag } from './crm';

export type CrmWorkspaceEntry = {
  note: string;
  tag: CrmTag;
};

export type CrmWorkspace = Record<string, CrmWorkspaceEntry>;

const STORAGE_PREFIX = 'representapp.crm.v1.';
const TAGS = new Set<CrmTag>([
  'activo',
  'seguimiento',
  'negociacion',
  'pausado',
]);

function storageKey(agentId: string) {
  return `${STORAGE_PREFIX}${agentId.trim()}`;
}

function normalizeEntry(value: unknown): CrmWorkspaceEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as { note?: unknown; tag?: unknown };
  const note = typeof record.note === 'string' ? record.note : '';
  const tag = TAGS.has(record.tag as CrmTag) ? (record.tag as CrmTag) : 'activo';
  return { note, tag };
}

export function emptyCrmEntry(): CrmWorkspaceEntry {
  return { note: '', tag: 'activo' };
}

export async function loadCrmWorkspace(agentId: string): Promise<CrmWorkspace> {
  const id = agentId.trim();
  if (!id || id === 'me') {
    return {};
  }

  try {
    const raw = await AsyncStorage.getItem(storageKey(id));
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    const workspace: CrmWorkspace = {};
    for (const [playerId, value] of Object.entries(parsed as Record<string, unknown>)) {
      const entry = normalizeEntry(value);
      if (playerId.trim() && entry) {
        workspace[playerId] = entry;
      }
    }
    return workspace;
  } catch {
    return {};
  }
}

export async function saveCrmPlayerEntry(
  agentId: string,
  playerId: string,
  entry: CrmWorkspaceEntry,
) {
  const agent = agentId.trim();
  const player = playerId.trim();
  if (!agent || agent === 'me' || !player || player === 'me') {
    return;
  }

  const workspace = await loadCrmWorkspace(agent);
  const next: CrmWorkspaceEntry = {
    note: entry.note.trim(),
    tag: TAGS.has(entry.tag) ? entry.tag : 'activo',
  };

  if (!next.note && next.tag === 'activo') {
    delete workspace[player];
  } else {
    workspace[player] = next;
  }

  await AsyncStorage.setItem(storageKey(agent), JSON.stringify(workspace));
}
