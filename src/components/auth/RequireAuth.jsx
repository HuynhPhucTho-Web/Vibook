import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * Route guard: only renders nested routes when `user` is set.
 * Guests are redirected to /login with `state.from` for return navigation.
 */
export default function RequireAuth({ user }) {
  const location = useLocation();

  if (!user) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}
