import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db, auth } from "../components/firebase";

const STORAGE_KEY = "vb_comment_counts_v2";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes persistent cache

// In-memory cache for post comment counts: postId -> { count: number, verified: boolean }
const postCommentCountCache = new Map();
// Deduplicate concurrent in-flight requests: postId -> Promise<number>
const inFlightRequests = new Map();
// Subscribed components to sync real-time changes: postId -> Set<callback>
const listeners = new Map();

// Helper to safely load persisted comment counts from localStorage
function initCacheFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const now = Date.now();
    if (parsed && typeof parsed === "object") {
      Object.entries(parsed).forEach(([postId, entry]) => {
        if (entry && typeof entry.count === "number" && now - (entry.timestamp || 0) < CACHE_TTL_MS) {
          postCommentCountCache.set(postId, {
            count: entry.count,
            verified: Boolean(entry.verified),
          });
        }
      });
    }
  } catch (e) {
    console.warn("Failed to read comment counts from localStorage", e);
  }
}

// Helper to save all cached items to localStorage (debounced)
let saveTimeout = null;
function persistCacheToStorage() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const plainObj = {};
      const now = Date.now();
      postCommentCountCache.forEach((entry, postId) => {
        if (entry && typeof entry.count === "number") {
          plainObj[postId] = {
            count: entry.count,
            verified: Boolean(entry.verified),
            timestamp: now,
          };
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plainObj));
    } catch (e) {
      console.warn("Failed to persist comment counts to localStorage", e);
    }
  }, 300);
}

// Initialize immediately on import
initCacheFromStorage();

/**
 * Check if the cached count for a post was fully verified (including all replies).
 * @param {string} postId
 * @returns {boolean}
 */
export function isCommentCountVerified(postId) {
  if (!postId) return false;
  const entry = postCommentCountCache.get(postId);
  return Boolean(entry?.verified);
}

/**
 * Get synchronously cached comment count for a post (RAM or LocalStorage) in 0ms.
 * @param {string} postId
 * @returns {number|null} number if cached, null if not in cache
 */
export function getCachedCommentCount(postId) {
  if (!postId) return null;
  const entry = postCommentCountCache.get(postId);
  if (entry && typeof entry.count === "number") {
    return entry.count;
  }
  return null;
}

/**
 * Store comment count in memory and localStorage, and notify listeners.
 * @param {string} postId
 * @param {number} count
 * @param {boolean} [verified=true]
 */
export function setCachedCommentCount(postId, count, verified = null) {
  if (!postId || typeof count !== "number" || isNaN(count)) return;
  const safeCount = Math.max(0, Math.floor(count));
  const isVerified = verified !== null ? Boolean(verified) : safeCount === 0;
  postCommentCountCache.set(postId, { count: safeCount, verified: isVerified });
  persistCacheToStorage();

  const postListeners = listeners.get(postId);
  if (postListeners) {
    postListeners.forEach((cb) => {
      try {
        cb(safeCount);
      } catch (err) {
        console.error("Error in comment count listener:", err);
      }
    });
  }
}

/**
 * Fetch comment count from Firestore comments subcollection + replies, with in-flight deduplication.
 * Once computed, caches in memory + localStorage and writes back denormalized field to Posts/{postId}.
 * @param {string} postId
 * @param {boolean} [force=false]
 * @returns {Promise<number>}
 */
export async function fetchPostCommentCount(postId, force = false) {
  if (!postId) return 0;

  const cached = postCommentCountCache.get(postId);
  if (!force && cached && cached.verified) {
    return cached.count;
  }

  if (inFlightRequests.has(postId)) {
    return inFlightRequests.get(postId);
  }

  const fetchPromise = (async () => {
    try {
      const snap = await getDocs(collection(db, "Posts", postId, "comments"));
      if (snap.empty) {
        setCachedCommentCount(postId, 0, true);
        if (auth.currentUser) {
          updateDoc(doc(db, "Posts", postId), { commentCount: 0 }).catch(() => {});
        }
        return 0;
      }

      let total = snap.docs.length;
      await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data() || {};
          let replyCount = typeof data.replyCount === "number" ? data.replyCount : 0;
          if (replyCount === 0) {
            try {
              const replySnap = await getDocs(
                collection(db, "Posts", postId, "comments", d.id, "replies")
              );
              if (!replySnap.empty) {
                replyCount = replySnap.docs.length;
                if (auth.currentUser) {
                  updateDoc(doc(db, "Posts", postId, "comments", d.id), {
                    replyCount,
                  }).catch(() => {});
                }
              }
            } catch {
              // Ignore if no permission or empty
            }
          }
          total += replyCount;
        })
      );

      setCachedCommentCount(postId, total, true);

      // Self-healing: persist denormalized count back to Firestore post doc if user signed in
      // so future feed queries deliver commentCount synchronously with likes & other data
      if (auth.currentUser) {
        updateDoc(doc(db, "Posts", postId), { commentCount: total }).catch(() => {
          // Silently ignore if insufficient permissions or deleted
        });
      }

      return total;
    } catch (err) {
      console.warn("Could not fetch comment count for post:", postId, err);
      return cached?.count ?? 0;
    } finally {
      inFlightRequests.delete(postId);
    }
  })();

  inFlightRequests.set(postId, fetchPromise);
  return fetchPromise;
}

/**
 * Batch preload and verify comment counts concurrently for multiple posts at the Feed level.
 * Automatically checks and recalculates any posts that have not been verified with replies.
 * @param {string[]} postIds
 * @returns {Promise<void>}
 */
export async function preloadCommentCounts(postIds) {
  if (!Array.isArray(postIds) || postIds.length === 0) return;
  const unverified = postIds.filter((id) => id && !isCommentCountVerified(id));
  if (unverified.length === 0) return;

  await Promise.allSettled(unverified.map((id) => fetchPostCommentCount(id, true)));
}

/**
 * Subscribe a component to comment count updates for a specific post.
 * @param {string} postId
 * @param {(count: number) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeCommentCount(postId, callback) {
  if (!postId || typeof callback !== "function") return () => {};

  if (!listeners.has(postId)) {
    listeners.set(postId, new Set());
  }
  listeners.get(postId).add(callback);

  return () => {
    const postListeners = listeners.get(postId);
    if (postListeners) {
      postListeners.delete(callback);
      if (postListeners.size === 0) {
        listeners.delete(postId);
      }
    }
  };
}
