import logger from "./logger";

export const API_BASE = "http://20.207.122.201/evaluation-service";

export interface Notification {
  ID: string;
  Type: "Placement" | "Result" | "Event";
  Message: string;
  Timestamp: string;
}

export interface FetchNotificationsParams {
  page?: number;
  limit?: number;
  notification_type?: "Placement" | "Result" | "Event" | "";
}

export async function fetchNotifications(params: FetchNotificationsParams = {}): Promise<Notification[]> {
  const { page = 1, limit = 20, notification_type = "" } = params;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(limit));
  if (notification_type) query.set("notification_type", notification_type);

  const url = `${API_BASE}/notifications?${query.toString()}`;
  logger.info("Fetching notifications", { url, page, limit, notification_type });

  const res = await fetch(url);
  if (!res.ok) {
    logger.error("Failed to fetch notifications", { status: res.status });
    throw new Error(`Failed to fetch: ${res.status}`);
  }

  const data = await res.json();
  logger.info("Notifications fetched", { count: data.notifications?.length ?? 0 });
  return data.notifications ?? [];
}
