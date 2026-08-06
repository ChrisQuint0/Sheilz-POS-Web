import { useState, useEffect } from "react";
import { databasePerformanceData } from "../mock-data";
import { DatabasePerformanceMetrics } from "../types";

export function useDatabasePerformance() {
  const [data, setData] = useState<DatabasePerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In the future, this will fetch from Supabase performance views or endpoints
    
    const fetchPerformance = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 600));
      setData(databasePerformanceData);
      setLoading(false);
    };

    fetchPerformance();
  }, []);

  return { data, loading };
}
