import { Notification } from "./api";

export interface ScoredNotification extends Notification {
  score: number;
  rank: number;
}

const TYPE_WEIGHT: Record<string, number> = { Placement: 3, Result: 2, Event: 1 };

export function computeScore(n: Notification): number {
  const weight = TYPE_WEIGHT[n.Type] ?? 0;
  const ageMinutes = Math.max(0, (Date.now() - new Date(n.Timestamp).getTime()) / 60000);
  return weight * 100 + (1 / (1 + ageMinutes)) * 10;
}

export function getTopN(notifications: Notification[], n: number): ScoredNotification[] {
  return notifications
    .map((n) => ({ ...n, score: computeScore(n), rank: 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((n, i) => ({ ...n, rank: i + 1 }));
}
