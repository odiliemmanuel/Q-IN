'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStomp } from '@/lib/stomp-provider';
import type { ChatWsEvent, Message } from '../types';

export function useTopicStream(topicId: string) {
  const { connected, subscribe } = useStomp();
  const qc = useQueryClient();

  useEffect(() => {
    if (!connected || !topicId) return;

    const unsubscribe = subscribe(`/topic/chat/${topicId}`, (frame) => {
      const event: ChatWsEvent = JSON.parse(frame.body);

      qc.setQueryData<Message[][]>(['chat', 'messages', topicId], (old: Message[][] | undefined) => {
        if (!old) return old;

        const pages = [...old];

        if (event.type === 'CREATED') {
          const exists = pages[0]?.some((m: Message) => m.id === event.message.id);
          if (!exists && pages[0]) {
            pages[0] = [event.message, ...pages[0]];
          }
        } else if (event.type === 'EDITED' || event.type === 'DELETED') {
          for (let i = 0; i < pages.length; i++) {
            pages[i] = pages[i].map((m: Message) =>
              m.id === event.message.id ? event.message : m,
            );
          }
        }

        return pages;
      });
    });

    return unsubscribe;
  }, [connected, topicId, subscribe, qc]);
}
