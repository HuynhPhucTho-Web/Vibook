/**
 * Route auth classification for ThoDev.
 *
 * Public: browse/read without login. Mutations (create, kết bạn, like…) check auth in handlers.
 * Private: RequireAuth redirects guests to /login.
 *
 * Settings is public at route level; privacy / notifications / security sections
 * are gated inside the page for guests.
 */

/** Paths that require an authenticated user at the route level */
export const PRIVATE_PATHS = [
  "/profile", // own profile (no :uid)
  "/messenger",
  "/notifications",
  "/cart",
  "/checkout",
  "/my-orders",
  "/seller-dashboard",
  "/manage-products",
];

/** True if this path needs login to enter the page */
export function pathRequiresAuth(pathname) {
  if (!pathname) return false;
  if (PRIVATE_PATHS.includes(pathname)) return true;
  return PRIVATE_PATHS.some(
    (p) => p !== "/profile" && (pathname === p || pathname.startsWith(`${p}/`)),
  );
}

/**
 * Public routes (MainLayout, no RequireAuth):
 * /homevibook, /post/:postId, /profile/:uid, /user/:uid,
 * /groups, /groups/:groupId/*, /events, /videos, /story, /playgame,
 * /market, /product/:id, /friends
 */
