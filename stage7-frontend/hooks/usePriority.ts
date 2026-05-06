// hooks/usePriority.ts
import { useState, useEffect } from "react";
import { Notification } from "../components/NotificationCard";
import { getTopN } from "../lib/scoring";
import logger from "../lib/logger";

export default function usePriority(initialN: number = 10) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [n, setN] = useState<number>(initialN);

  const fetchPriority = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://20.207.122.201/evaluation-service/notifications");
      if (!res.ok) throw new Error("API error");
      const data: any = await res.json();
      
      const topN: any = getTopN(data.notifications || data, n);
      setNotifications(topN);
      logger.info(`Computed top ${n} priority notifications`);
    } catch (e) {
      // Fallback: in a real app you might use cached data
      logger.warn("Priority fetch failed - using empty list or fallback");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriority();
  }, [n]);

  return {
    notifications,
    loading,
    n,
    setN,
    refresh: fetchPriority
  };
}
