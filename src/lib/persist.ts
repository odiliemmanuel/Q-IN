let flushTimer: ReturnType<typeof setTimeout> | null = null
const pendingWrites = new Map<string, () => void>()

export function debouncedSaveJSON(key: string, value: unknown, delayMs = 150): void {
  pendingWrites.set(key, () => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable — ignore */
    }
  })

  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    pendingWrites.forEach((write) => write())
    pendingWrites.clear()
    flushTimer = null
  }, delayMs)
}

export function flushPendingWrites(): void {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  pendingWrites.forEach((write) => write())
  pendingWrites.clear()
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable — ignore */
  }
}
