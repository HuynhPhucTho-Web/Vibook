import { doc, getDoc, collection, query, where, documentId, getDocs } from "firebase/firestore";
import { db } from "../components/firebase";

const STORAGE_KEY = "vb_user_profiles_v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour persistent cache
const userCache = new Map();
const inFlightRequests = new Map();

// Helper to safely load persisted user profiles from localStorage
function initCacheFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const now = Date.now();
    if (parsed && typeof parsed === "object") {
      Object.entries(parsed).forEach(([uid, entry]) => {
        if (entry && entry.profile && now - (entry.timestamp || 0) < CACHE_TTL_MS) {
          userCache.set(uid, entry);
        }
      });
    }
  } catch (e) {
    console.warn("Failed to read user profiles from localStorage", e);
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
      userCache.forEach((entry, uid) => {
        if (entry && entry.profile && now - (entry.timestamp || 0) < CACHE_TTL_MS) {
          plainObj[uid] = entry;
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plainObj));
    } catch (e) {
      console.warn("Failed to persist user profiles to localStorage", e);
    }
  }, 300);
}

// Initialize immediately on import
initCacheFromStorage();

/**
 * Get synchronously cached user profile (RAM or LocalStorage) in 0ms.
 * Use this on initial frame renders to prevent avatar & name popping.
 * @param {string} userId
 * @returns {{displayName: string, photo: string|null}|null}
 */
export function getUserProfileSync(userId) {
  if (!userId) return null;
  const cached = userCache.get(userId);
  if (cached && cached.profile) {
    return cached.profile;
  }
  return null;
}

/**
 * Fetch and cache user profile to prevent N+1 queries.
 * Writes to both RAM and LocalStorage.
 * @param {string} userId
 * @returns {Promise<{displayName: string, photo: string|null, firstName?: string, lastName?: string}|null>}
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  const now = Date.now();
  const cached = userCache.get(userId);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.profile;
  }

  if (inFlightRequests.has(userId)) {
    return inFlightRequests.get(userId);
  }

  const fetchPromise = (async () => {
    try {
      const snap = await getDoc(doc(db, "Users", userId));
      if (!snap.exists()) {
        const nullProfile = { displayName: "Anonymous", photo: null };
        userCache.set(userId, { profile: nullProfile, timestamp: now });
        persistCacheToStorage();
        return nullProfile;
      }

      const data = snap.data();
      const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      const displayName = fullName || data.displayName || data.email || "Anonymous";
      const photo = data.photo || data.photoURL || null;

      const profile = {
        displayName,
        photo,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
      };

      userCache.set(userId, { profile, timestamp: Date.now() });
      persistCacheToStorage();
      return profile;
    } catch (err) {
      console.error("Error fetching user profile for", userId, err);
      if (cached) return cached.profile;
      return null;
    } finally {
      inFlightRequests.delete(userId);
    }
  })();

  inFlightRequests.set(userId, fetchPromise);
  return fetchPromise;
}

/**
 * Batch preload multiple user profiles concurrently.
 * @param {string[]} userIds
 * @returns {Promise<void>}
 */
export async function batchGetUserProfiles(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const uncached = uniqueIds.filter((id) => !getUserProfileSync(id));

  if (uncached.length === 0) return;

  // Use documentId in [...] query if batch size <= 30
  if (uncached.length <= 30) {
    try {
      const snap = await getDocs(
        query(collection(db, "Users"), where(documentId(), "in", uncached))
      );
      snap.docs.forEach((d) => {
        const data = d.data();
        const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
        const displayName = fullName || data.displayName || data.email || "Anonymous";
        const photo = data.photo || data.photoURL || null;
        userCache.set(d.id, {
          profile: { displayName, photo, firstName: data.firstName || "", lastName: data.lastName || "" },
          timestamp: Date.now(),
        });
      });
      persistCacheToStorage();
      return;
    } catch {
      // Fall back to parallel individual fetches
    }
  }

  // Parallel fetch if where in query fails or exceeds 30
  await Promise.allSettled(uncached.map((id) => getUserProfile(id)));
}

/**
 * Invalidate or update the cache for a specific user (e.g. after profile update)
 * @param {string} userId
 * @param {object} [newProfile]
 */
export function setUserProfileCache(userId, newProfile) {
  if (!userId) return;
  if (newProfile) {
    userCache.set(userId, { profile: newProfile, timestamp: Date.now() });
  } else {
    userCache.delete(userId);
  }
  persistCacheToStorage();
}

