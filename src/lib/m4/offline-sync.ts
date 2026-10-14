import {
  SprintSubmissionPayload,
  SprintResult,
} from "@/content/m4/sprint-schema";

const OFFLINE_STORAGE_KEY = "bbs_offline_sprints_v1";

export interface QueuedOfflineSprint {
  id: string;
  payload: SprintSubmissionPayload;
  queuedAt: string;
}

/**
 * Checks if current browser environment has network connectivity.
 */
export function isBrowserOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

/**
 * Retrieves all offline queued sprint payloads from localStorage.
 */
export function getQueuedOfflineSprints(): QueuedOfflineSprint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedOfflineSprint[];
  } catch (err) {
    console.warn("Failed to read offline sprints from localStorage:", err);
    return [];
  }
}

/**
 * Saves a completed sprint payload to offline storage queue.
 */
export function queueOfflineSprint(
  payload: SprintSubmissionPayload
): QueuedOfflineSprint {
  const queued: QueuedOfflineSprint = {
    id: `offline-${payload.date}-${Date.now()}`,
    payload: {
      ...payload,
      completedOffline: true,
    },
    queuedAt: new Date().toISOString(),
  };

  if (typeof window === "undefined") return queued;

  try {
    const existing = getQueuedOfflineSprints();
    // Replace if same date exists to avoid duplicate entries
    const filtered = existing.filter((s) => s.payload.date !== payload.date);
    filtered.push(queued);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to queue offline sprint:", err);
  }

  return queued;
}

/**
 * Removes a synced sprint from offline storage queue.
 */
export function removeQueuedOfflineSprint(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getQueuedOfflineSprints();
    const updated = existing.filter((s) => s.id !== id);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to remove offline sprint from queue:", err);
  }
}

/**
 * Attempts to sync all queued offline sprints with the server.
 */
export async function syncOfflineSprints(): Promise<{
  syncedCount: number;
  failedCount: number;
  results: SprintResult[];
}> {
  const queue = getQueuedOfflineSprints();
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0, results: [] };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const results: SprintResult[] = [];

  for (const item of queue) {
    try {
      const res = await fetch("/api/m4/sprint/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        syncedCount++;
        results.push(json.data);
        removeQueuedOfflineSprint(item.id);
      } else {
        failedCount++;
      }
    } catch (err) {
      console.warn("Failed syncing sprint item:", item.id, err);
      failedCount++;
    }
  }

  return { syncedCount, failedCount, results };
}
