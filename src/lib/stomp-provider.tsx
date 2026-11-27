'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';

interface StompContextValue {
  connected: boolean;
  subscribe: (
    destination: string,
    callback: (msg: IMessage) => void,
  ) => () => void;
  send: (destination: string, body: string) => void;
}

const StompContext = createContext<StompContextValue | null>(null);

export function StompProvider({
  token,
  children,
}: {
  token: string | null;
  children: React.ReactNode;
}) {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return;
    }

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
        : 'ws://localhost:3000/ws');

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [token]);

  const subscribe = (
    destination: string,
    callback: (msg: IMessage) => void,
  ): (() => void) => {
    if (!clientRef.current || !connected) {
      return () => {};
    }
    const sub: StompSubscription = clientRef.current.subscribe(
      destination,
      callback,
    );
    return () => sub.unsubscribe();
  };

  const send = (destination: string, body: string): void => {
    if (clientRef.current && connected) {
      clientRef.current.publish({ destination, body });
    }
  };

  const value: StompContextValue = { connected, subscribe, send };

  return (
    <StompContext.Provider value={value}>
      {children}
    </StompContext.Provider>
  );
}

export const useStomp = (): StompContextValue => {
  const ctx = useContext(StompContext);
  if (!ctx) {
    throw new Error('useStomp must be used inside StompProvider');
  }
  return ctx;
};
