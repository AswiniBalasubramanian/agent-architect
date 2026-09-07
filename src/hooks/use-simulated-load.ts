import { useEffect, useState } from "react";

/**
 * Mimics the fetch of a scoped dataset. Re-runs whenever the scope key changes
 * (project or persona switch), so every page shows a real intermediate state
 * instead of snapping between datasets.
 */
export function useSimulatedLoad(scopeKey: string, delay = 420) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [scopeKey, delay]);

  return ready;
}
