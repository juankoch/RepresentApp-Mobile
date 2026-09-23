export type ChatMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  status?: 'sent' | 'read';
};

export type Conversation = {
  id: string;
  profileId?: string;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
  avatar?: number;
  avatarUrl?: string;
  messages: ChatMessage[];
};

export type MessageRequest = {
  id: string;
  profileId?: string;
  name: string;
  role: string;
  subtitle: string;
  avatar?: number;
  avatarUrl?: string;
};

export const initialConversations: Conversation[] = [];
export const initialMessageRequests: MessageRequest[] = [];
export const agentConversations: Conversation[] = [];
export const agentMessageRequests: MessageRequest[] = [];
