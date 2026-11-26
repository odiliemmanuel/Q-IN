'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SwapRequest, SwapAction } from './types';

export const swapKeys = {
  incoming: ['swap', 'incoming'] as const,
  outgoing: ['swap', 'outgoing'] as const,
};

export function useIncomingSwaps() {
  return useQuery<SwapRequest[]>({
    queryKey: swapKeys.incoming,
    queryFn: async () => {
      const data = await apiClient.get<SwapRequest[]>('/api/queue/swap/incoming', true);
      return data;
    },
    refetchInterval: 10000,
  });
}

export function useOutgoingSwaps() {
  return useQuery<SwapRequest[]>({
    queryKey: swapKeys.outgoing,
    queryFn: async () => {
      const data = await apiClient.get<SwapRequest[]>('/api/queue/swap/outgoing', true);
      return data;
    },
    refetchInterval: 10000,
  });
}

export function useCreateSwap() {
  const qc = useQueryClient();
  return useMutation<SwapRequest, Error, string>({
    mutationFn: async (targetUserId: string) => {
      const data = await apiClient.post<SwapRequest>(
        '/api/queue/swap/request',
        { targetUserId },
        true,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: swapKeys.outgoing });
      qc.invalidateQueries({ queryKey: swapKeys.incoming });
    },
  });
}

export function useRespondSwap() {
  const qc = useQueryClient();
  return useMutation<void, Error, SwapAction>({
    mutationFn: async ({ id, action }: SwapAction) => {
      await apiClient.post<void>(`/api/queue/swap/${id}/${action}`, {}, true);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: swapKeys.incoming });
      qc.invalidateQueries({ queryKey: swapKeys.outgoing });
      qc.invalidateQueries({ queryKey: ['queue'] });
    },
  });
}

export function useCancelSwap() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiClient.post<void>(`/api/queue/swap/${id}/cancel`, {}, true);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: swapKeys.outgoing });
    },
  });
}
