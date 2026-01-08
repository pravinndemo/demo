export function isPerfEnabled(): boolean {
  try {
    const g = (globalThis as unknown) as { SVT_PERF?: unknown };
    if (g && (g.SVT_PERF === true || g.SVT_PERF === 'true' || g.SVT_PERF === '1' || g.SVT_PERF === 'on')) {
      return true;
    }
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem('SVT_PERF');
      if (v && (v === 'true' || v === '1' || v.toLowerCase() === 'on')) return true;
    }
  } catch {
    // ignore
  }
  return false;
}

// Safe console logger gated by perf flag
export function logPerf(...args: unknown[]): void {
  if (!isPerfEnabled()) return;
  try {
    (console.log as (...data: unknown[]) => void)(...args);
  } catch {
    // ignore
  }
}
