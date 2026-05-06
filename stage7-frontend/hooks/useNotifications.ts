// hooks/useNotifications.ts
import { useState, useEffect } from "react";
import { Notification } from "../components/NotificationCard";
import logger from "../lib/logger";

const SAMPLE_NOTIFICATIONS: Notification[] = [
  // Placements
  { ID: "p1", Message: "Google is visiting campus for Software Engineering roles. Package: 30 LPA.", Type: "Placement", Timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), score: 95 },
  { ID: "p2", Message: "Amazon OA test links have been sent to shortlisted candidates. Check your email.", Type: "Placement", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), score: 88 },
  { ID: "p3", Message: "Mock Interview scheduled for final year students at 3 PM in Seminar Hall.", Type: "Placement", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), score: 75 },
  { ID: "p4", Message: "Microsoft has announced the Engage mentorship program. Apply by Friday.", Type: "Placement", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), score: 82 },
  { ID: "p5", Message: "Resume building workshop by alumni on Saturday. Mandatory for pre-final years.", Type: "Placement", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), score: 65 },

  // Results
  { ID: "r1", Message: "End Semester results for 6th Semester B.Tech have been declared. Check portal.", Type: "Result", Timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), score: 90 },
  { ID: "r2", Message: "Mid-Term grades for Data Structures & Algorithms are now available.", Type: "Result", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), score: 78 },
  { ID: "r3", Message: "Re-evaluation forms for last semester are open until next week.", Type: "Result", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), score: 60 },
  { ID: "r4", Message: "Final Project Viva scores have been updated by your respective guides.", Type: "Result", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), score: 85 },
  { ID: "r5", Message: "List of students eligible for the Dean's List has been published.", Type: "Result", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(), score: 72 },

  // Events
  { ID: "e1", Message: "Annual Tech Fest 'Innovate 2026' starts tomorrow! Get your passes now.", Type: "Event", Timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), score: 80 },
  { ID: "e2", Message: "Guest lecture on AI and Web3 by Dr. Smith in Auditorium at 10 AM.", Type: "Event", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), score: 68 },
  { ID: "e3", Message: "Inter-college basketball tournament finals this evening at the sports complex.", Type: "Event", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), score: 55 },
  { ID: "e4", Message: "Hackathon registrations closing tonight. Win prizes up to $5000!", Type: "Event", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), score: 88 },
  { ID: "e5", Message: "Photography club exhibition in the main library lobby all day today.", Type: "Event", Timestamp: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(), score: 45 },
];

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [notificationType, setNotificationType] = useState<string>("All");

  const unreadCount = notifications.filter((n) => !viewedIds.has(n.ID)).length;

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        "http://20.207.122.201/evaluation-service/notifications"
      );
      if (!res.ok) throw new Error("API error");
      const data: Notification[] = await res.json();
      setNotifications(data);
      logger.info("Fetched notifications from API");
    } catch (e) {
      // fallback to sample data
      setNotifications(SAMPLE_NOTIFICATIONS);
      logger.warn("API failed – using fallback data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadMore = () => {
    // In demo we just stop after one page
    setHasMore(false);
  };

  const refresh = () => {
    fetchData();
  };

  const markAllViewed = () => {
    const allIds = new Set(notifications.map((n) => n.ID));
    setViewedIds(allIds);
    logger.info("All notifications marked as read");
  };

  // filter by type (All shows everything)
  const filtered =
    notificationType === "All"
      ? notifications
      : notifications.filter((n) => n.Type === notificationType);

  return {
    notifications: filtered,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    viewedIds,
    markAllViewed,
    notificationType,
    setNotificationType,
    unreadCount,
  };
}
