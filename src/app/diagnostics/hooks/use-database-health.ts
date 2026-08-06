import { useState, useEffect } from "react";
import { databaseHealthData } from "../mock-data";
import { DatabaseHealthMetrics } from "../types";

export function useDatabaseHealth() {
  const [data, setData] = useState<DatabaseHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In the future, this will be replaced with a Supabase query/RPC call
    // e.g., const { data, error } = await supabase.rpc('get_database_health')
    
    const fetchHealth = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData(databaseHealthData);
      setLoading(false);
    };

    fetchHealth();
  }, []);

  return { data, loading };
}
