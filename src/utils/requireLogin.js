import React from "react";
import { toast } from "react-toastify";
import { auth } from "../components/firebase";

const FROM_KEY = "vibook_login_from";
const TOAST_ID = "vibook-require-login";

/** Remember where to return after login (state + sessionStorage fallback). */
export function rememberLoginFrom(path) {
  const target =
    path && path.startsWith("/")
      ? path
      : `${window.location.pathname}${window.location.search}`;
  try {
    sessionStorage.setItem(FROM_KEY, target);
  } catch {
    // ignore
  }
  return target;
}

/** Resolve post-login path from router state or sessionStorage. */
export function getLoginRedirect(stateFrom) {
  if (typeof stateFrom === "string" && stateFrom.startsWith("/")) {
    return stateFrom;
  }
  try {
    const stored = sessionStorage.getItem(FROM_KEY);
    if (stored && stored.startsWith("/")) return stored;
  } catch {
    // ignore
  }
  return "/homevibook";
}

export function clearLoginRedirect() {
  try {
    sessionStorage.removeItem(FROM_KEY);
  } catch {
    // ignore
  }
}

/**
 * Small toast body: message + Login / dismiss buttons.
 * Does NOT auto-redirect — user chooses to open login.
 */
function LoginPromptToast({
  message,
  from,
  navigate,
  loginLabel = "Đăng nhập",
  dismissLabel = "Đóng",
  closeToast,
}) {
  const goLogin = () => {
    const target = rememberLoginFrom(from);
    if (typeof closeToast === "function") closeToast();
    if (typeof navigate === "function") {
      navigate("/login", { state: { from: target } });
    } else {
      window.location.assign("/login");
    }
  };

  return React.createElement(
    "div",
    { className: "login-prompt-toast", role: "status" },
    React.createElement("p", { className: "login-prompt-toast__msg" }, message),
    React.createElement(
      "div",
      { className: "login-prompt-toast__actions" },
      React.createElement(
        "button",
        {
          type: "button",
          className: "login-prompt-toast__btn login-prompt-toast__btn--primary",
          onClick: goLogin,
        },
        loginLabel,
      ),
      React.createElement(
        "button",
        {
          type: "button",
          className: "login-prompt-toast__btn login-prompt-toast__btn--ghost",
          onClick: () => {
            if (typeof closeToast === "function") closeToast();
          },
        },
        dismissLabel,
      ),
    ),
  );
}

/**
 * Guard for write/action handlers (like, comment, cart, create, friend…).
 * Returns the current user if logged in; otherwise shows a toast popup
 * with a Login button (no auto-redirect).
 *
 * @param {object} [options]
 * @param {import('react-router-dom').NavigateFunction} [options.navigate]
 * @param {string} [options.message]
 * @param {string} [options.from]
 * @param {string} [options.loginLabel]
 * @param {string} [options.dismissLabel]
 * @returns {import('firebase/auth').User|null}
 */
export function requireLogin(options = {}) {
  const {
    navigate,
    message = "Vui lòng đăng nhập để tiếp tục",
    from,
    loginLabel = "Đăng nhập",
    dismissLabel = "Đóng",
  } = options;
  const user = auth.currentUser;

  if (user) return user;

  // Remember path now so Login works even if user navigates later
  rememberLoginFrom(from);

  toast(
    ({ closeToast }) =>
      React.createElement(LoginPromptToast, {
        message,
        from,
        navigate,
        loginLabel,
        dismissLabel,
        closeToast,
      }),
    {
      toastId: TOAST_ID,
      position: "top-center",
      autoClose: 8000,
      closeOnClick: false,
      draggable: true,
      type: "info",
      className: "login-prompt-toast-container",
      bodyClassName: "login-prompt-toast-body",
    },
  );

  return null;
}

/** @returns {boolean} */
export function isLoggedIn() {
  return Boolean(auth.currentUser);
}
