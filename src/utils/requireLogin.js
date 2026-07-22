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

function LockIcon() {
  return React.createElement(
    "svg",
    {
      width: 18,
      height: 18,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
    },
    React.createElement("rect", {
      x: 3,
      y: 11,
      width: 18,
      height: 11,
      rx: 2,
      ry: 2,
    }),
    React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }),
  );
}

function CloseIcon() {
  return React.createElement(
    "svg",
    {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
    },
    React.createElement("line", { x1: 18, y1: 6, x2: 6, y2: 18 }),
    React.createElement("line", { x1: 6, y1: 6, x2: 18, y2: 18 }),
  );
}

/**
 * Tech glassmorphism login toast (BR §2.3).
 * Title + feature message + Login / optional Register + close.
 * Does NOT auto-redirect.
 */
function LoginPromptToast({
  title = "Chưa đăng nhập",
  message,
  from,
  navigate,
  loginLabel = "Đăng nhập",
  registerLabel,
  closeToast,
}) {
  const goTo = (path) => {
    const target = rememberLoginFrom(from);
    if (typeof closeToast === "function") closeToast();
    if (typeof navigate === "function") {
      navigate(path, { state: { from: target } });
    } else {
      window.location.assign(path);
    }
  };

  return React.createElement(
    "div",
    { className: "tech-toast", role: "status" },
    React.createElement(
      "div",
      { className: "tech-toast__icon", "aria-hidden": true },
      React.createElement(LockIcon),
    ),
    React.createElement(
      "div",
      { className: "tech-toast__content" },
      React.createElement("div", { className: "tech-toast__title" }, title),
      React.createElement("div", { className: "tech-toast__desc" }, message),
    ),
    React.createElement(
      "div",
      { className: "tech-toast__actions" },
      React.createElement(
        "button",
        {
          type: "button",
          className: "tech-toast__btn",
          onClick: () => goTo("/login"),
        },
        loginLabel,
      ),
      registerLabel
        ? React.createElement(
            "button",
            {
              type: "button",
              className: "tech-toast__btn tech-toast__btn--ghost",
              onClick: () => goTo("/register"),
            },
            registerLabel,
          )
        : null,
    ),
    React.createElement(
      "button",
      {
        type: "button",
        className: "tech-toast__close",
        "aria-label": "Close",
        onClick: () => {
          if (typeof closeToast === "function") closeToast();
        },
      },
      React.createElement(CloseIcon),
    ),
  );
}

/**
 * Guard for write/action handlers (like, comment, cart, create, friend…).
 * Returns the current user if logged in; otherwise shows glassmorphism toast.
 *
 * @param {object} [options]
 * @param {import('react-router-dom').NavigateFunction} [options.navigate]
 * @param {string} [options.message] Feature-specific description
 * @param {string} [options.title] Toast title (default: Chưa đăng nhập)
 * @param {string} [options.from]
 * @param {string} [options.loginLabel]
 * @param {string} [options.registerLabel] Optional; omit to hide Register
 * @returns {import('firebase/auth').User|null}
 */
export function requireLogin(options = {}) {
  const {
    navigate,
    message = "Đăng nhập ViBook để đồng bộ dữ liệu",
    title = "Chưa đăng nhập",
    from,
    loginLabel = "Đăng nhập",
    registerLabel,
  } = options;
  const user = auth.currentUser;

  if (user) return user;

  rememberLoginFrom(from);

  const renderToast = ({ closeToast }) =>
    React.createElement(LoginPromptToast, {
      title,
      message,
      from,
      navigate,
      loginLabel,
      registerLabel,
      closeToast,
    });

  const toastOpts = {
    toastId: TOAST_ID,
    position: "top-center",
    autoClose: 8000,
    closeOnClick: false,
    closeButton: false,
    draggable: true,
    hideProgressBar: true,
    icon: false,
    className: "tech-toast-container",
    bodyClassName: "tech-toast-body",
  };

  if (toast.isActive(TOAST_ID)) {
    toast.update(TOAST_ID, {
      ...toastOpts,
      render: renderToast,
    });
  } else {
    toast(renderToast, toastOpts);
  }

  return null;
}

/** @returns {boolean} */
export function isLoggedIn() {
  return Boolean(auth.currentUser);
}
