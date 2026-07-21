# Auth: Public vs Private (updated)

## Policy

- **App entry:** `/` → `/homevibook` (home first; login is never the landing page).
- **Browse/view is public** for feed, groups, events, store, stories, videos, games, friends directory, profiles.
- **Restricted:** Messenger (DM), friend-request / join / create / like / comment / cart checkout actions, and account pages.
- **Guest private action:** toast popup with a **Login** button (no auto-redirect). After login, return via `state.from` / `sessionStorage`.

## Guard

| Piece | Path |
|-------|------|
| Route guard | `src/components/auth/RequireAuth.jsx` |
| Action helper | `src/utils/requireLogin.js` |
| Path map | `src/config/routeAuth.js` |

## Routes

### Public (no `RequireAuth`)

| Route | Notes |
|-------|--------|
| `/homevibook` | Feed view |
| `/post/:postId` | Post detail |
| `/profile/:uid` | Profile view |
| `/user/:uid` | User detail |
| `/groups`, `/groups/:groupId/*` | Groups |
| `/events` | Events list |
| `/videos`, `/story`, `/playgame` | Media / games |
| `/market`, `/product/:id` | Store browse |
| `/friends` | Public find-friends browse; My friends / requests need login |

### Private (`RequireAuth`)

| Route | Notes |
|-------|--------|
| `/messenger` | DMs |
| `/profile` | Own profile |
| `/notifications` | Inbox |
| `/cart`, `/checkout`, `/my-orders` | Commerce |
| `/seller-dashboard`, `/manage-products` | Seller |
| `/settings` | Account |

## Sidebar

| Item | Guest click |
|------|-------------|
| Home, Friends, Groups, Events, Videos, Story, PlayGame, Market | Open page (view) |
| **Messenger** | → `/login` |
| **Settings** | → `/login` |
| Logout | Disabled when guest |

## Header (guest)

- **Login** + **Register**
- Hide messenger, notifications, user menu
- `unreadCount` stays `0`

## Write actions (toast + Login button)

Post create/react/save/share, comments, story create, event create/join, group create/join/post, game create, cart add, friend request / follow, private friend tabs, sidebar Messenger/Settings.

`requireLogin()` shows a small toast: message + **Đăng nhập** / **Đóng**. User stays on the page until they click Login.

## Login return path

`getLoginRedirect()` reads `location.state.from` then `sessionStorage.vibook_login_from`, default `/homevibook`.
