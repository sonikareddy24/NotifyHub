// priority_inbox.ts
// Pushkar Prabhath Rayana | AV.SC.U4CSE23135

import logger from "./stage7-frontend/lib/logger.ts";

const API_URL = "http://20.207.122.201/evaluation-service/notifications";

interface Notification {
  ID: string;
  Type: "Placement" | "Result" | "Event";
  Message: string;
  Timestamp: string;
}

interface ScoredNotification extends Notification {
  score: number;
  rank: number;
}

const TYPE_WEIGHT: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function computeScore(notification: Notification): number {
  const weight = TYPE_WEIGHT[notification.Type] ?? 0;
  const ageMs = Date.now() - new Date(notification.Timestamp).getTime();
  const ageMinutes = Math.max(0, ageMs / 60000);
  const recencyScore = 1 / (1 + ageMinutes);
  return weight * 100 + recencyScore * 10;
}

class MinHeap {
  private heap: ScoredNotification[] = [];
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  private parentIdx(i: number): number { return Math.floor((i - 1) / 2); }
  private leftIdx(i: number): number { return 2 * i + 1; }
  private rightIdx(i: number): number { return 2 * i + 2; }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private bubbleUp(i: number): void {
    while (i > 0 && this.heap[this.parentIdx(i)].score > this.heap[i].score) {
      this.swap(i, this.parentIdx(i));
      i = this.parentIdx(i);
    }
  }

  private bubbleDown(i: number): void {
    let smallest = i;
    const l = this.leftIdx(i);
    const r = this.rightIdx(i);
    if (l < this.heap.length && this.heap[l].score < this.heap[smallest].score) smallest = l;
    if (r < this.heap.length && this.heap[r].score < this.heap[smallest].score) smallest = r;
    if (smallest !== i) { this.swap(i, smallest); this.bubbleDown(smallest); }
  }

  push(item: ScoredNotification): void {
    if (this.heap.length < this.capacity) {
      this.heap.push(item);
      this.bubbleUp(this.heap.length - 1);
    } else if (item.score > this.min()) {
      this.heap[0] = item;
      this.bubbleDown(0);
    }
  }

  min(): number { return this.heap.length > 0 ? this.heap[0].score : -Infinity; }

  toSortedArray(): ScoredNotification[] {
    return [...this.heap].sort((a, b) => b.score - a.score);
  }
}

async function fetchAllNotifications(): Promise<Notification[]> {
  logger.info("Fetching notifications from API", { url: API_URL });
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data: any = await response.json();
    logger.info("Notifications fetched", { count: data.notifications?.length ?? 0 });
    return data.notifications as Notification[];
  } catch (err) {
    logger.warn("API fetch failed, using sample data", { error: String(err) });
    return [
      { ID: "1", Type: "Placement", Message: "Google Hiring", Timestamp: new Date().toISOString() },
      { ID: "2", Type: "Result", Message: "Mid-term Results", Timestamp: new Date(Date.now() - 3600000).toISOString() },
      { ID: "3", Type: "Event", Message: "Tech Fest", Timestamp: new Date(Date.now() - 7200000).toISOString() },
      { ID: "4", Type: "Placement", Message: "Microsoft Hiring", Timestamp: new Date(Date.now() - 86400000).toISOString() },
      { ID: "5", Type: "Result", Message: "Final Exam Results", Timestamp: new Date(Date.now() - 172800000).toISOString() },
      { ID: "6", Type: "Event", Message: "Cultural Night", Timestamp: new Date(Date.now() - 259200000).toISOString() },
      { ID: "7", Type: "Placement", Message: "Amazon Interview", Timestamp: new Date(Date.now() - 432000000).toISOString() },
      { ID: "8", Type: "Result", Message: "Lab Results", Timestamp: new Date(Date.now() - 604800000).toISOString() },
      { ID: "9", Type: "Event", Message: "Workshop on AI", Timestamp: new Date(Date.now() - 777600000).toISOString() },
      { ID: "10", Type: "Placement", Message: "Apple Hiring", Timestamp: new Date(Date.now() - 1000000000).toISOString() },
    ] as Notification[];
  }
}

async function getTopNPriorityNotifications(n: number = 10): Promise<ScoredNotification[]> {
  logger.info(`Computing top ${n} priority notifications`);
  const notifications = await fetchAllNotifications();
  const heap = new MinHeap(n);

  for (const notification of notifications) {
    heap.push({ ...notification, score: computeScore(notification), rank: 0 });
  }

  const result = heap.toSortedArray().map((n, i) => ({ ...n, rank: i + 1 }));
  logger.info(`Priority inbox ready`, { topN: n });
  return result;
}

async function main() {
  const top10 = await getTopNPriorityNotifications(10);

  console.log("\n================================================");
  console.log("   TOP 10 PRIORITY NOTIFICATIONS");
  console.log("   Pushkar Prabhath Rayana | AV.SC.U4CSE23135");
  console.log("================================================\n");

  console.table(
    top10.map((n) => ({
      Rank: `#${n.rank}`,
      Type: n.Type,
      Message: n.Message,
      Timestamp: n.Timestamp,
      Score: n.score.toFixed(4),
    }))
  );

  console.log("\nScoring: Placement(3×100) > Result(2×100) > Event(1×100) + recency bonus\n");
}

main().catch((err) => {
  logger.error("Fatal error", { error: String(err) });
  process.exit(1);
});
