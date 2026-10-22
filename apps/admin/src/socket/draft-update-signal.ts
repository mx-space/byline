import type { DraftUpdatePayload } from './types'

// Mirrors `subscribeAdminSocket`/`socketChangeListeners` in SocketBridge: a
// module-level listener set plus an unsubscribe function. Subscribers get the
// typed payload without going through the raw `mx-admin:socket-event` window
// channel, and only the write page re-renders — not every consumer of the
// generic event.
const draftUpdateListeners = new Set<(payload: DraftUpdatePayload) => void>()

export function subscribeDraftUpdate(
  listener: (payload: DraftUpdatePayload) => void,
): () => void {
  draftUpdateListeners.add(listener)
  return () => {
    draftUpdateListeners.delete(listener)
  }
}

/**
 * Forward a validated DRAFT_UPDATE payload to every subscriber. Called by
 * SocketBridge only — nothing else may emit draft updates.
 */
export function emitDraftUpdate(payload: DraftUpdatePayload) {
  for (const listener of draftUpdateListeners) listener(payload)
}
