import { getCachedCommentCount, setCachedCommentCount, isCommentCountVerified, preloadCommentCounts } from "./postCommentCache";
import { getUserProfileSync, batchGetUserProfiles } from "./userCache";

/** Feed helpers — keep post list merges consistent & cheap */

export const FEED_PAGE_SIZE = 6;

export function postTimeMs(post) {
  if (!post) return 0;
  const c = post.createdAt;
  if (c?.toMillis) return c.toMillis();
  if (typeof c === "number") return c;
  if (c?.seconds) return c.seconds * 1000;
  return 0;
}

/** Newest first, unique by id (later groups win on conflict) */
export function mergeUniquePosts(...postGroups) {
  const postsById = new Map();
  postGroups.flat().forEach((post) => {
    if (post?.id) postsById.set(post.id, post);
  });
  return Array.from(postsById.values()).sort(
    (a, b) => postTimeMs(b) - postTimeMs(a),
  );
}

/**
 * Merge live first-page results into an existing feed without dropping
 * posts already loaded via "load more".
 */
export function mergeFirstPageIntoFeed(prevPosts, firstPagePosts) {
  if (!firstPagePosts?.length) return prevPosts || [];
  const firstIds = new Set(firstPagePosts.map((p) => p.id));
  const older = (prevPosts || []).filter((p) => p?.id && !firstIds.has(p.id));
  return mergeUniquePosts(firstPagePosts, older);
}

export function mapPostDocs(docs) {
  const missingCommentPostIds = [];
  const missingUserIds = [];

  const mapped = docs.map((d) => {
    const data = d.data() || {};
    let commentCount;
    const isVerified = isCommentCountVerified(d.id);
    const cached = getCachedCommentCount(d.id);

    if (isVerified && typeof cached === "number") {
      commentCount = cached;
    } else if (typeof data.commentCount === "number") {
      commentCount = data.commentCount;
      // Mark as unverified so background preload will verify replies
      setCachedCommentCount(d.id, data.commentCount, false);
      missingCommentPostIds.push(d.id);
    } else {
      if (typeof cached === "number") {
        commentCount = cached;
      } else if (Array.isArray(data.comments) && data.comments.length > 0) {
        commentCount = data.comments.length;
      } else {
        commentCount = undefined;
      }
      missingCommentPostIds.push(d.id);
    }

    // Synchronously resolve author avatar & name from cache if missing or default
    let userPhoto = data.userPhoto;
    let userName = data.userName;
    const authorUid = data.userId;

    if (authorUid) {
      const cachedUser = getUserProfileSync(authorUid);
      if (cachedUser) {
        if (!userPhoto || userPhoto === "/default-avatar.png") {
          userPhoto = cachedUser.photo || userPhoto;
        }
        if (!userName || userName === "Anonymous") {
          userName = cachedUser.displayName || userName;
        }
      } else {
        missingUserIds.push(authorUid);
      }
    }

    return {
      id: d.id,
      ...data,
      userName: userName || data.userName || "Anonymous",
      userPhoto: userPhoto || data.userPhoto || null,
      commentCount,
      saveCount: typeof data.saveCount === "number" ? data.saveCount : 0,
      shareCount: typeof data.shareCount === "number" ? data.shareCount : 0,
      likes: data.likes || {},
    };
  });

  // Concurrently preload missing comment counts and user profiles in background
  if (missingCommentPostIds.length > 0) {
    preloadCommentCounts(missingCommentPostIds);
  }
  if (missingUserIds.length > 0) {
    batchGetUserProfiles(missingUserIds);
  }

  return mapped;
}
