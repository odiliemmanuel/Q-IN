'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type PaginatedResponse } from '@/lib/api-client';
import type { Message, Mention, Topic, ChatUserSearchResult, TopicContextType } from './types';

export const chatKeys = {
  topics: ['chat', 'topics'] as const,
  messages: (topicId: string) => ['chat', 'messages', topicId] as const,
  mentions: ['chat', 'mentions'] as const,
  userSearch: (q: string) => ['chat', 'users', 'search', q] as const,
};

export function useTopics(contextType?: TopicContextType) {
  return useQuery<Topic[]>({
    queryKey: [...chatKeys.topics, contextType],
    queryFn: async () => {
      const params = contextType ? `?contextType=${contextType}&page=0&size=100` : '?page=0&size=100';
      const data = await apiClient.get<Topic[]>(`/api/chat/topics${params}`, true);
      return data;
    },
  });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation<Topic, Error, { title: string; description?: string; contextType?: TopicContextType }>({
    mutationFn: async (data) => {
      const topic = await apiClient.post<Topic>('/api/chat/topics', data, true);
      return topic;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.topics });
    },
  });
}

export function useLockUnlockTopic() {
  const qc = useQueryClient();
  return useMutation<void, Error, { topicId: string; lock: boolean }>({
    mutationFn: async ({ topicId, lock }) => {
      await apiClient.patch(`/api/chat/topics/${topicId}/lock`, { lock }, true);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.topics });
    },
  });
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (topicId: string) => {
      await apiClient.delete(`/api/chat/topics/${topicId}`, true);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.topics });
    },
  });
}

export function useMessages(topicId: string, pageSize = 50) {
  return useInfiniteQuery<Message[], Error>({
    queryKey: chatKeys.messages(topicId),
    queryFn: async ({ pageParam = 0 }) => {
      const data = await apiClient.get<PaginatedResponse<Message>>(
        `/api/chat/topics/${topicId}/messages?page=${pageParam}&size=${pageSize}`,
        true,
      );
      return data.content;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < pageSize ? undefined : allPages.length,
    initialPageParam: 0,
    enabled: !!topicId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation<Message, Error, { topicId: string; content: string; replyToMessageId?: string }>({
    mutationFn: async ({ topicId, content, replyToMessageId }) => {
      const message = await apiClient.post<Message>(
        `/api/chat/topics/${topicId}/messages`,
        { content, replyToMessageId },
        true,
      );
      return message;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(data.topicId) });
    },
  });
}

export function useMentions() {
  return useQuery<Mention[]>({
    queryKey: chatKeys.mentions,
    queryFn: async () => {
      const data = await apiClient.get<Mention[]>('/api/chat/mentions/me', true);
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useUserSearch() {
  return useMutation<ChatUserSearchResult[], Error, string>({
    mutationFn: async (q: string) => {
      const data = await apiClient.get<ChatUserSearchResult[]>(
        `/api/chat/users/search?q=${encodeURIComponent(q)}&limit=10`,
        true,
      );
      return data;
    },
  });
}
