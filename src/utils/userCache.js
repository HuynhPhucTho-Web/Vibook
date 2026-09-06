import { doc, getDoc } from "firebase/firestore";
import { db } from "../components/firebase";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
const userCache = new Map();
const inFlightRequests = new Map();

/**
 * Fetch and cache user profile to prevent N+1 queries and duplicate onSnapshot listeners
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
      return profile;
    } catch (err) {
      console.error("Error fetching user profile for", userId, err);
      // If error occurs but we had a stale cache, return it
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
}

