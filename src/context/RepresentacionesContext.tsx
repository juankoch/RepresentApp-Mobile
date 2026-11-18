import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  acceptRepresentationRequest,
  endRepresentation,
  fetchIncomingRepresentationRequests,
  fetchMisRepresentaciones,
  getActiveRepresentationForPlayer as fetchActiveRepresentationForPlayer,
  getAuthenticatedUserId,
  getRepresentedPlayers as fetchRepresentedPlayers,
  isRepresentedBy as fetchIsRepresentedBy,
  isRepresenting as fetchIsRepresenting,
  rejectRepresentationRequest,
  Representacion,
  RepresentacionMutationResult,
  sendRepresentationRequest,
} from '../lib/representaciones';
import { usePlayerProfile } from './PlayerProfileContext';

type RepresentacionesContextValue = {
  representaciones: Representacion[];
  incomingRequests: Representacion[];
  loading: boolean;
  error: string | null;
  incomingCount: number;
  activeRepresentation: Representacion | null;
  representedPlayers: Representacion[];
  refresh: () => Promise<void>;
  sendRequest: (otherUserId: string) => Promise<RepresentacionMutationResult>;
  accept: (idRepresentacion: number) => Promise<RepresentacionMutationResult>;
  reject: (idRepresentacion: number) => Promise<RepresentacionMutationResult>;
  end: (idRepresentacion: number) => Promise<RepresentacionMutationResult>;
  isRepresentedBy: (userId: string, representativeId: string) => Promise<boolean>;
  isRepresenting: (representativeId: string, playerId: string) => Promise<boolean>;
  getActiveRepresentationForPlayer: (
    playerId: string,
  ) => Promise<Representacion | null>;
  getRepresentedPlayers: (representativeId: string) => Promise<Representacion[]>;
};

const RepresentacionesContext = createContext<
  RepresentacionesContextValue | undefined
>(undefined);

function isUsableUserId(value: string | null) {
  return Boolean(value && value.trim() && value.trim() !== 'me');
}

export function RepresentacionesProvider({ children }: { children: ReactNode }) {
  const { role } = usePlayerProfile();
  const [myId, setMyId] = useState<string | null>(null);
  const [representaciones, setRepresentaciones] = useState<Representacion[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Representacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearState = useCallback(() => {
    setMyId(null);
    setRepresentaciones([]);
    setIncomingRequests([]);
  }, []);

  const getRepresentedPlayers = useCallback((representativeId: string) => {
    return fetchRepresentedPlayers(representativeId);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = await getAuthenticatedUserId();
      if (!isUsableUserId(userId)) {
        clearState();
        return;
      }

      setMyId(userId);

      const [mine, incoming] = await Promise.all([
        fetchMisRepresentaciones(),
        fetchIncomingRepresentationRequests(),
      ]);

      if (!mine.ok) {
        clearState();
        setError(mine.message);
        return;
      }
      if (!incoming.ok) {
        setRepresentaciones(mine.data);
        setIncomingRequests([]);
        return;
      }

      setRepresentaciones(mine.data);
      setIncomingRequests(incoming.data);
    } catch (caught) {
      clearState();
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se pudieron cargar las representaciones.',
      );
    } finally {
      setLoading(false);
    }
  }, [clearState]);

  const incomingCount = incomingRequests.length;

  const activeRepresentation = useMemo(() => {
    if (role !== 'player' || !isUsableUserId(myId)) {
      return null;
    }
    return (
      representaciones.find(
        (row) => row.estado === 'aceptada' && row.fk_jugador === myId,
      ) ?? null
    );
  }, [myId, representaciones, role]);

  const representedPlayers = useMemo(() => {
    if (role !== 'agent' || !isUsableUserId(myId)) {
      return [] as Representacion[];
    }
    return representaciones.filter(
      (row) => row.estado === 'aceptada' && row.fk_representante === myId,
    );
  }, [myId, representaciones, role]);

  const value = useMemo<RepresentacionesContextValue>(
    () => ({
      representaciones,
      incomingRequests,
      loading,
      error,
      incomingCount,
      activeRepresentation,
      representedPlayers,
      refresh,
      sendRequest: async (otherUserId) => {
        const result = await sendRepresentationRequest(otherUserId);
        await refresh();
        return result;
      },
      accept: async (idRepresentacion) => {
        const result = await acceptRepresentationRequest(idRepresentacion);
        await refresh();
        return result;
      },
      reject: async (idRepresentacion) => {
        const result = await rejectRepresentationRequest(idRepresentacion);
        await refresh();
        return result;
      },
      end: async (idRepresentacion) => {
        const result = await endRepresentation(idRepresentacion);
        await refresh();
        return result;
      },
      isRepresentedBy: (userId, representativeId) =>
        fetchIsRepresentedBy(userId, representativeId),
      isRepresenting: (representativeId, playerId) =>
        fetchIsRepresenting(representativeId, playerId),
      getActiveRepresentationForPlayer: (playerId) =>
        fetchActiveRepresentationForPlayer(playerId),
      getRepresentedPlayers,
    }),
    [
      activeRepresentation,
      error,
      getRepresentedPlayers,
      incomingCount,
      incomingRequests,
      loading,
      refresh,
      representedPlayers,
      representaciones,
    ],
  );

  return (
    <RepresentacionesContext.Provider value={value}>
      {children}
    </RepresentacionesContext.Provider>
  );
}

export function useRepresentaciones() {
  const context = useContext(RepresentacionesContext);
  if (!context) {
    throw new Error(
      'useRepresentaciones must be used within RepresentacionesProvider',
    );
  }
  return context;
}
