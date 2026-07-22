import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

/**
 * Route guard: requires signed-in + emailVerified (email/password).
 * Guests / unverified → /login with state.from.
 */
export default function RequireAuth({ user }) {
  const location = useLocation();
  const allowed = Boolean(user?.emailVerified);

  useEffect(() => {
    // Clear half-open sessions (registered but never verified)
    if (user && !user.emailVerified) {
      signOut(auth).catch(() => {});
    }
  }, [user]);

  if (!allowed) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from,
          needsEmailVerification: Boolean(user && !user.emailVerified),
        }}
      />
    );
  }

  return <Outlet />;
}
