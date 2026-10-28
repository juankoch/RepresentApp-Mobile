import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { getUnreadMessageCount } from '../lib/mensajes';

type MensajesUnreadContextValue = {
  unreadCount: number;
  refresh: () => Promise<void>;
};

const MensajesUnreadContext = createContext<
  MensajesUnreadContextValue | undefined
>(undefined);

export function MensajesUnreadProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    const result = await getUnreadMessageCount();
    setUnreadCount(result.ok ? result.data : 0);
  }, []);

  const value = useMemo<MensajesUnreadContextValue>(
    () => ({
      unreadCount,
      refresh,
    }),
    [refresh, unreadCount],
  );

  return (
    <MensajesUnreadContext.Provider value={value}>
      {children}
    </MensajesUnreadContext.Provider>
  );
}

export function useMensajesUnread() {
  const context = useContext(MensajesUnreadContext);
  if (!context) {
    throw new Error('useMensajesUnread must be used within MensajesUnreadProvider');
  }
  return context;
}
