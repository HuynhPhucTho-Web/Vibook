/**
 * Re-export shim so Vite/HMR resolving either
 * `requireLogin.js` or `requireLogin.jsx` both work.
 */
export {
  rememberLoginFrom,
  getLoginRedirect,
  clearLoginRedirect,
  requireLogin,
  isLoggedIn,
} from "./requireLogin.js";
