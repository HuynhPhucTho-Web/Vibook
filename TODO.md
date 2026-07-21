# Auth public vs private — status

Completed implementation. See **docs/AUTH_PUBLIC_PRIVATE.md** for full route map, guard locations, and guest UI behavior.

## Checklist
- [x] Read Sidebar / Header / App / HeaderRightActions
- [x] Classify routes public/private
- [x] RequireAuth + requireLogin helper
- [x] Sidebar private links redirect to login
- [x] Header shows Login + Register when guest
- [x] Public pages load data without login (Home, Events, Groups, PlayGame, …)
- [x] Action handlers guard writes
- [x] Build passes
