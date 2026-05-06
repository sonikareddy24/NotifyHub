// priority_inbox.ts
// Pushkar Prabhath Rayana | AV.SC.U4CSE23135
import logger from "./stage7-frontend/lib/logger.ts";
const API_URL = "http://20.207.122.201/evaluation-service/notifications";
const TYPE_WEIGHT = {
    Placement: 3,
    Result: 2,
    Event: 1,
};
function computeScore(notification) {
    const weight = TYPE_WEIGHT[notification.Type] ?? 0;
    const ageMs = Date.now() - new Date(notification.Timestamp).getTime();
    const ageMinutes = Math.max(0, ageMs / 60000);
    const recencyScore = 1 / (1 + ageMinutes);
    return weight * 100 + recencyScore * 10;
}
class MinHeap {
    heap = [];
    capacity;
    constructor(capacity) {
        this.capacity = capacity;
    }
    parentIdx(i) { return Math.floor((i - 1) / 2); }
    leftIdx(i) { return 2 * i + 1; }
    rightIdx(i) { return 2 * i + 2; }
    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
    bubbleUp(i) {
        while (i > 0 && this.heap[this.parentIdx(i)].score > this.heap[i].score) {
            this.swap(i, this.parentIdx(i));
            i = this.parentIdx(i);
        }
    }
    bubbleDown(i) {
        let smallest = i;
        const l = this.leftIdx(i);
        const r = this.rightIdx(i);
        if (l < this.heap.length && this.heap[l].score < this.heap[smallest].score)
            smallest = l;
        if (r < this.heap.length && this.heap[r].score < this.heap[smallest].score)
            smallest = r;
        if (smallest !== i) {
            this.swap(i, smallest);
            this.bubbleDown(smallest);
        }
    }
    push(item) {
        if (this.heap.length < this.capacity) {
            this.heap.push(item);
            this.bubbleUp(this.heap.length - 1);
        }
        else if (item.score > this.min()) {
            this.heap[0] = item;
            this.bubbleDown(0);
        }
    }
    min() { return this.heap.length > 0 ? this.heap[0].score : -Infinity; }
    toSortedArray() {
        return [...this.heap].sort((a, b) => b.score - a.score);
    }
}
async function fetchAllNotifications() {
    logger.info("Fetching notifications from API", { url: API_URL });
    const response = await fetch(API_URL);
    if (!response.ok) {
        logger.error("API request failed", { status: response.status });
        throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    logger.info("Notifications fetched", { count: data.notifications?.length ?? 0 });
    return data.notifications;
}
async function getTopNPriorityNotifications(n = 10) {
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
    console.table(top10.map((n) => ({
        Rank: `#${n.rank}`,
        Type: n.Type,
        Message: n.Message,
        Timestamp: n.Timestamp,
        Score: n.score.toFixed(4),
    })));
    console.log("\nScoring: Placement(3×100) > Result(2×100) > Event(1×100) + recency bonus\n");
}
main().catch((err) => {
    logger.error("Fatal error", { error: String(err) });
    process.exit(1);
});
