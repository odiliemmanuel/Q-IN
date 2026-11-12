import { createWebSocket } from 'rxjs';
import { observe, operate } from 'zen-observable';
import { StompClient } from '@stomp/stompjs';
import sockjs from 'sockjs-client';
// @ts-ignore - sockjs types
import { Client } from '@stomp/client';
// Default WebSocket configuration
const DEFAULT_CONFIG = {
    url: '',
    heartbeatInterval: 20000,
    maxReconnectAttempts: 10,
    initialBackoff: 1000,
};
// WebSocket state store
let wsSubject = null;
let wsObserver = null;
let stompClient = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
let isConnecting = false;
/**
 * Initialize WebSocket connection with STOMP
 */
export const initWebSocket = (config = DEFAULT_CONFIG) => {
    // Don't initialize if already connected
    if (isConnected())
        return;
    isConnecting = true;
    const sockjsUrl = config.url || import.meta.env.VITE_WS_URL || 'http://localhost:8000/ws';
    const url = sockjs(sockjsUrl);
    stompClient = new Client({
        webSocketFactory: () => url,
        heartbeatIncoming: DEFAULT_CONFIG.heartbeatInterval,
        heartbeatOutgoing: DEFAULT_CONFIG.heartbeatInterval,
        reconnectDelay: DEFAULT_CONFIG.initialBackoff,
        maxReconnectAttempts: DEFAULT_CONFIG.maxReconnectAttempts,
        debug: (str) => {
            // Optional: enable for debugging
            // console.log('[STOMP]', str)
        },
    });
    stompClient.activate();
    // Set up event listeners
    stompClient.connect({}, (frame) => {
        isConnecting = false;
        reconnectAttempts = 0;
        console.log('[WebSocket] Connected:', frame);
        // Subscribe to user-specific queue topics
        // This will be set up per-user when needed
        // Subscribe to general queue topics
        subscribeToTopic(WS_TOPICS.ALL_QUEUES);
    }, (error) => {
        isConnecting = false;
        console.error('[WebSocket] Connection error:', error);
        startReconnectTimer(config);
    }, '/ws');
};
/**
 * Subscribe to a WebSocket topic
 * @param destination The topic destination (e.g., /user/123/queue or /queue/abc123)
 */
export const subscribeToTopic = (destination, callback) => {
    if (!stompClient || !stompClient.connected) {
        console.warn('[WebSocket] Not connected, cannot subscribe to topic:', destination);
        return { id: '', destination, unsubscribe: () => { } };
    }
    return stompClient.subscribe(destination, (message) => {
        try {
            const payload = JSON.parse(message.body);
            callback(payload);
        }
        catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
        }
    });
};
/**
 * Publish a message to a WebSocket topic
 * @param destination The topic destination
 * @param message The message to publish
 */
export const publishToTopic = (destination, message) => {
    if (!stompClient || !stompClient.connected) {
        console.warn('[WebSocket] Not connected, cannot publish to topic:', destination);
        return;
    }
    stompClient.publish({
        destination,
        body: JSON.stringify(message),
    });
};
/**
 * Check if WebSocket is connected
 */
export const isConnected = () => {
    return !!stompClient && stompClient.connected;
};
/**
 * Get current connection state
 */
export const getConnectionState = () => {
    if (!stompClient) {
        return { connected: false, connecting: false, lastError: 'Not initialized', retryCount: 0 };
    }
    return {
        connected: stompClient.connected,
        connecting: isConnecting,
        lastError: stompClient.errored ? stompClient.lastError : undefined,
        retryCount: reconnectAttempts,
    };
};
/**
 * Start exponential backoff reconnect timer
 */
const startReconnectTimer = (config) => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }
    const backoff = Math.min(DEFAULT_CONFIG.initialBackoff * Math.pow(2, reconnectAttempts), 30000 // max 30s
    );
    reconnectAttempts++;
    console.log(`[WebSocket] Reconnect attempt ${reconnectAttempts} in ${backoff}ms`);
    reconnectTimeout = setTimeout(() => {
        initWebSocket(config);
    }, backoff);
};
/**
 * Manual reconnect
 */
export const manualReconnect = () => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    reconnectAttempts = 0;
    initWebSocket(DEFAULT_CONFIG);
};
/**
 * Disconnect WebSocket
 */
export const disconnectWebSocket = () => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
    }
    isConnecting = false;
};
/**
 * Subscribe to user-specific queue position updates
 * @param userId The user ID
 * @param callback Callback for position updates
 */
export const subscribeToUserQueue = (userId, callback) => {
    const destination = `/user/${userId}/queue`;
    const sub = subscribeToTopic(destination, (message) => {
        if (message.type === 'queue:positionUpdate') {
            callback(message.data);
        }
    });
    // Store subscription for cleanup if needed
    // In a real app, you'd manage subscriptions in a store
};
/**
 * Subscribe to queue detail real-time updates
 * @param queueId The queue ID
 * @param callback Callback for status/position updates
 */
export const subscribeToQueueDetail = (queueId, callback) => {
    const destination = `/queue/${queueId}`;
    const sub = subscribeToTopic(destination, (message) => {
        if (message.type === 'queue:statusChange' || message.type === 'queue:positionUpdate') {
            callback(message.data);
        }
    });
};
/**
 * Send real-time notification
 * @param notification The notification to send
 */
export const sendNotification = (notification) => {
    publishToTopic('/notifications', notification);
};
/**
 * Polling fallback for WebSocket
 * @returns Polling function
 */
export const createPollingFallback = (onMessage) => {
    let timerId = setInterval(async () => {
        try {
            const { data } = await fetch(`/api/ws/polling`).then((res) => res.json());
            if (data) {
                onMessage(data);
            }
        }
        catch (error) {
            console.error('[WebSocket] Polling error:', error);
        }
    }, 3000);
    return () => {
        if (timerId) {
            clearInterval(timerId);
        }
    };
};
