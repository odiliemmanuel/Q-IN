export type TopicContextType = 'ALL' | 'GENERAL' | 'QUEUE' | 'SPACE';

export interface Topic {
  id: string;
  name: string;
  description?: string;
  contextType: TopicContextType;
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  messageCount: number;
}

export interface Message {
  id: string;
  topicId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  replyToMessageId?: string;
  createdAt: string;
  edited: boolean;
  deleted: boolean;
}

export interface Mention {
  id: string;
  topicId: string;
  topicName: string;
  senderUsername: string;
  messageSnippet: string;
  createdAt: string;
  read: boolean;
}

export interface ChatUserSearchResult {
  id: string;
  username: string;
  name?: string;
}

export interface ChatWsEvent {
  type: 'CREATED' | 'EDITED' | 'DELETED';
  message: Message;
  topicId: string;
}
