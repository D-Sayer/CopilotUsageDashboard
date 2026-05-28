import { useState, useCallback } from "react";
import type { UsageData } from "../types";

export function useUsageData() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: UsageData = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastSynced(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, lastSynced, fetchData };
}
