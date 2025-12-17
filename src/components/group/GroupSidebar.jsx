import React from "react";
import { NavLink, useParams } from "react-router-dom";
import "../../style/GroupSidebar.css";

export default function GroupSidebar() {
  const { groupId } = useParams();

  const cls = ({ isActive }) => `gst-tab ${isActive ? "is-active" : ""}`;

  return (
    <div className="gst-wrap">
      <nav className="gst-nav" aria-label="Group tabs">
        <NavLink to={`/groups/${groupId}`} end className={cls}>Home</NavLink>
        <NavLink to={`/groups/${groupId}/members`} className={cls}>Members</NavLink>
        <NavLink to={`/groups/${groupId}/media`} className={cls}>Media</NavLink>
        <NavLink to={`/groups/${groupId}/events`} className={cls}>Events</NavLink>
        <NavLink to={`/groups/${groupId}/about`} className={cls}>About</NavLink>
      </nav>
    </div>
  );
}
