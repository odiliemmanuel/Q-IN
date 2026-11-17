export const socketClient = {
  connect(_token?: string) {
    /* no-op: no STOMP/SockJS configured */
  },
  async disconnect(): Promise<void> {
    /* idempotent no-op */
  },
}
