import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../components/firebase";

// In-memory cache for user's saved post IDs (Set of postIds)
const userSavedPostsCache = new Map(); // userId -> Set<postId>
const inFlightRequests = new Map(); // userId -> Promise<Set<postId>>

/**
 * Preload and cache all saved post IDs for a user to eliminate per-card getDoc calls
 * @param {string} userId
 * @returns {Promise<Set<string>>}
 */
export async function getUserSavedPostIds(userId) {
  if (!userId) return new Set();

  if (userSavedPostsCache.has(userId)) {
    return userSavedPostsCache.get(userId);
  }

  if (inFlightRequests.has(userId)) {
    return inFlightRequests.get(userId);
  }

  const fetchPromise = (async () => {
    try {
      const q = query(collection(db, "SavedPosts"), where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const set = new Set();
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const postId = data.postId || docSnap.id.replace(`${userId}_`, "");
        if (postId) set.add(postId);
      });
      userSavedPostsCache.set(userId, set);
      return set;
    } catch (err) {
      console.error("Error fetching saved post IDs for user:", userId, err);
      return new Set();
    } finally {
      inFlightRequests.delete(userId);
    }
  })();

  inFlightRequests.set(userId, fetchPromise);
  return fetchPromise;
}

/**
 * Check synchronously if a post is saved from memory cache
 * @param {string} userId
 * @param {string} postId
 * @returns {boolean|null} boolean if in cache, null if cache not yet populated
 */
export function isPostSavedSync(userId, postId) {
  if (!userId || !postId) return false;
  const userSet = userSavedPostsCache.get(userId);
  if (!userSet) return null;
  return userSet.has(postId);
}

/**
 * Optimistically update the cached set when user toggles save
 * @param {string} userId
 * @param {string} postId
 * @param {boolean} isSaved
 */
export function updateSavedPostCache(userId, postId, isSaved) {
  if (!userId || !postId) return;
  let userSet = userSavedPostsCache.get(userId);
  if (!userSet) {
    userSet = new Set();
    userSavedPostsCache.set(userId, userSet);
  }
  if (isSaved) {
    userSet.add(postId);
  } else {
    userSet.delete(postId);
  }
}

/**
 * Clear cache on logout
 * @param {string} [userId]
 */
export function clearSavedPostsCache(userId) {
  if (userId) {
    userSavedPostsCache.delete(userId);
  } else {
    userSavedPostsCache.clear();
  }
}

