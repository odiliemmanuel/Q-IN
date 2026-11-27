export function getUserRole(): 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN' | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('qin:user');
    if (raw) {
      const parsed = JSON.parse(raw) as { role?: string };
      return (parsed?.role as 'NATIVE' | 'ADMIN' | 'SUPER_ADMIN') ?? null;
    }
  } catch {}
  return null;
}

export function isAdmin(): boolean {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isSuperAdmin(): boolean {
  return getUserRole() === 'SUPER_ADMIN';
}
