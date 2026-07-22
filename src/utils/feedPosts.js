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
  return docs.map((d) => ({ id: d.id, ...d.data() }));
}
