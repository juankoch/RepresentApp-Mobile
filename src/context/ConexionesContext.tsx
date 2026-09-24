import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  acceptConnectionRequest,
  Conexion,
  ConexionMutationResult,
  fetchMisConexiones,
  incomingPendingFrom,
  otherUserId,
  rejectConnectionRequest,
  sendConnectionRequest,
} from '../lib/conexiones';
import { usePlayerProfile } from './PlayerProfileContext';

type ConexionesContextValue = {
  myId: string | null;
  rows: Conexion[];
  incomingPending: Conexion[];
  incomingCount: number;
  acceptedOtherUserIds: string[];
  refresh: () => Promise<{ myId: string | null; rows: Conexion[] }>;
  sendRequest: (userId: string) => Promise<ConexionMutationResult>;
  hasSentRequest: (userId: string) => boolean;
  isConnected: (userId: string) => boolean;
  hasIncomingFrom: (userId: string) => boolean;
  acceptIncomingRequest: (userId: string) => Promise<ConexionMutationResult>;
  rejectIncomingRequest: (userId: string) => Promise<ConexionMutationResult>;
};

const ConexionesContext = createContext<ConexionesContextValue | undefined>(
  undefined,
);

export function ConexionesProvider({ children }: { children: ReactNode }) {
  const { isBlocked } = usePlayerProfile();
  const [myId, setMyId] = useState<string | null>(null);
  const [rows, setRows] = useState<Conexion[]>([]);

  const refresh = useCallback(async () => {
    const result = await fetchMisConexiones();
    setMyId(result.myId);
    setRows(result.rows);
    return { myId: result.myId, rows: result.rows };
  }, []);

  const incomingPending = useMemo(
    () =>
      myId
        ? rows.filter(
            (row) => row.estado === 'pendiente' && row.fk_receptor === myId,
          )
        : [],
    [myId, rows],
  );

  const acceptedOtherUserIds = useMemo(() => {
    if (!myId) {
      return [];
    }
    return rows
      .filter((row) => row.estado === 'aceptada')
      .map((row) => otherUserId(row, myId));
  }, [myId, rows]);

  const value = useMemo<ConexionesContextValue>(
    () => ({
      myId,
      rows,
      incomingPending,
      incomingCount: incomingPending.length,
      acceptedOtherUserIds,
      refresh,
      sendRequest: async (userId) => {
        if (isBlocked(userId)) {
          return {
            ok: false,
            message: 'No podés enviarle una solicitud a un usuario bloqueado.',
          };
        }
        const result = await sendConnectionRequest(userId);
        await refresh();
        return result;
      },
      hasSentRequest: (userId) =>
        Boolean(
          myId &&
            rows.some(
              (row) =>
                row.estado === 'pendiente' &&
                row.fk_solicitante === myId &&
                row.fk_receptor === userId,
            ),
        ),
      isConnected: (userId) => acceptedOtherUserIds.includes(userId),
      hasIncomingFrom: (userId) => Boolean(incomingPendingFrom(rows, myId, userId)),
      acceptIncomingRequest: async (userId) => {
        const row = incomingPendingFrom(rows, myId, userId);
        if (!row) {
          return { ok: false, message: 'No hay una solicitud pendiente de este usuario.' };
        }
        const result = await acceptConnectionRequest(row.id_conexion);
        await refresh();
        return result;
      },
      rejectIncomingRequest: async (userId) => {
        const row = incomingPendingFrom(rows, myId, userId);
        if (!row) {
          return { ok: false, message: 'No hay una solicitud pendiente de este usuario.' };
        }
        const result = await rejectConnectionRequest(row.id_conexion);
        await refresh();
        return result;
      },
    }),
    [acceptedOtherUserIds, incomingPending, isBlocked, myId, refresh, rows],
  );

  return (
    <ConexionesContext.Provider value={value}>{children}</ConexionesContext.Provider>
  );
}

export function useConexiones() {
  const context = useContext(ConexionesContext);
  if (!context) {
    throw new Error('useConexiones must be used within ConexionesProvider');
  }
  return context;
}
