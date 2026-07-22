# Auth: Public vs Private

Aligned with `docs/BUSINESS_RULES.md` (BRD v2.0).

## Policy

- **App entry:** `/` → `/homevibook` (home first; login is never the landing page).
- **Browse/view is public** for feed, groups, events, store, stories, videos, games, friends directory, profiles.
- **Restricted writes:** friend-request / join / create / like / comment / cart / checkout, etc.
- **Guest private action:** toast with **Đăng nhập / Đăng ký / Đóng** (no auto-redirect). After auth, return via `state.from` / `sessionStorage`.

## Guard

| Piece | Path |
|-------|------|
| Route guard | `src/components/auth/RequireAuth.jsx` |
| Action helper | `src/utils/requireLogin.js` |
| Path map | `src/config/routeAuth.js` |
| Firestore rules | `firestore.rules` |

## Routes

### Public (no `RequireAuth`)

| Route | Notes |
|-------|--------|
| `/homevibook` | Feed view |
| `/post/:postId` | Post detail |
| `/profile/:uid` | Profile view |
| `/user/:uid` | User detail |
| `/groups`, `/groups/:groupId/*` | Groups browse |
| `/events` | Events list |
| `/videos`, `/story`, `/playgame` | Media / games |
| `/market`, `/product/:id` | Store browse |
| `/friends` | Find Friends public; My Friends / Requests → toast |
| `/settings` | Public page; privacy / notifications / security gated in UI |

### Private (`RequireAuth`)

| Route | Notes |
|-------|--------|
| `/messenger` | DMs |
| `/profile` | Own profile |
| `/notifications` | Inbox |
| `/cart`, `/checkout`, `/my-orders` | Commerce |
| `/seller-dashboard`, `/manage-products` | Seller |

## Sidebar (BR §4)

| Item | Guest |
|------|--------|
| Home, Friends, Groups, Events, Videos, Story, PlayGame, Market, **Settings** | Open page (view) |
| **Messenger** | Visible, locked → login toast (not auto-redirect) |
| Logout | Visible, **disabled** |

## Settings (guest)

| Section | Guest |
|---------|--------|
| Appearance (theme, background, language) | ✅ |
| Accessibility | ✅ |
| Privacy, Notifications, Security | 🔒 toast + login gate |

## Header (guest) — BR §5

- **Login** + **Register** only
- Hide messenger, notifications, user menu
- `unreadCount` = 0

## Friends (BR §9)

- Guest content: **Find Friends** only
- Tabs My Friends / Friend Requests: visible but locked; click → feature-specific toast
- No private friendship data for guests (Firestore + UI)

## Firestore (browse first)

| Collection | Guest read | Write |
|------------|------------|--------|
| Users | ✅ public | Owner only |
| Posts, comments | ✅ public | Signed-in |
| Groups, group posts | ✅ public | Member / owner |
| Events, Stories, Games, Products | ✅ public | Signed-in / owner |
| FriendRequests, Friendships | ❌ private participants | Signed-in |
| Messages | ❌ friends only | Friends only |
| Carts, Orders | ❌ owner | Owner / parties |

## Write actions

All mutations call `requireLogin()` with a **feature-specific** message (not a single generic “đăng bài” string).

## Login return path

`getLoginRedirect()`: `location.state.from` → `sessionStorage.vibook_login_from` → `/homevibook`.
