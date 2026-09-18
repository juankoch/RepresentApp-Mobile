import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  Conversation,
  initialConversations,
  initialMessageRequests,
  MessageRequest,
} from '../data/playerMessages';

type PlayerMessagesContextValue = {
  conversations: Conversation[];
  requests: MessageRequest[];
  sendMessage: (conversationId: string, text: string) => void;
  deleteConversation: (conversationId: string) => void;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
};

const PlayerMessagesContext = createContext<
  PlayerMessagesContextValue | undefined
>(undefined);

function currentTimeLabel() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function PlayerMessagesProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [requests, setRequests] = useState(initialMessageRequests);

  const value = useMemo<PlayerMessagesContextValue>(
    () => ({
      conversations,
      requests,
      sendMessage: (conversationId, text) => {
        const trimmed = text.trim();
        if (!trimmed) {
          return;
        }
        const time = currentTimeLabel();
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  preview: trimmed,
                  time,
                  unread: 0,
                  messages: [
                    ...conversation.messages,
                    {
                      id: `${conversationId}-${Date.now()}`,
                      fromMe: true,
                      text: trimmed,
                      time,
                      status: 'sent',
                    },
                  ],
                }
              : conversation,
          ),
        );
      },
      deleteConversation: (conversationId) => {
        setConversations((current) =>
          current.filter((conversation) => conversation.id !== conversationId),
        );
      },
      acceptRequest: (requestId) => {
        const request = requests.find((item) => item.id === requestId);
        if (!request) {
          return;
        }
        setRequests((current) => current.filter((item) => item.id !== requestId));
        setConversations((current) => {
          if (current.some((conversation) => conversation.id === requestId)) {
            return current;
          }
          return [
            {
              id: requestId,
              name: request.name,
              role: request.role,
              preview: 'Conversación iniciada',
              time: 'Ahora',
              unread: 0,
              avatar: request.avatar,
              messages: [],
            },
            ...current,
          ];
        });
      },
      rejectRequest: (requestId) => {
        setRequests((current) => current.filter((item) => item.id !== requestId));
      },
    }),
    [conversations, requests],
  );

  return (
    <PlayerMessagesContext.Provider value={value}>
      {children}
    </PlayerMessagesContext.Provider>
  );
}

export function usePlayerMessages() {
  const context = useContext(PlayerMessagesContext);
  if (!context) {
    throw new Error(
      'usePlayerMessages must be used within PlayerMessagesProvider',
    );
  }
  return context;
}
