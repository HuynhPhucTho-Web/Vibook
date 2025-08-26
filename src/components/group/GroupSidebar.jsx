import React from "react";
import { NavLink, useParams } from "react-router-dom";

const GroupSidebar = ({ group }) => {
  const { groupId } = useParams();

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded-lg mb-2 ${
      isActive ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700"
    }`;

  return (
    <div className="bg-white dark:bg-gray-800 py-4">
      <h2 className="text-xl font-bold mb-4">{group.name}</h2>
      <nav className="space-y-2">
        <NavLink to={`/groups/${groupId}`} end className={linkClass}>
          Home
        </NavLink>
        <NavLink to={`/groups/${groupId}/members`} className={linkClass}>
          Members
        </NavLink>
        <NavLink to={`/groups/${groupId}/media`} className={linkClass}>
          Media
        </NavLink>
        <NavLink to={`/groups/${groupId}/events`} className={linkClass}>
          Events
        </NavLink>
        <NavLink to={`/groups/${groupId}/about`} className={linkClass}>
          About
        </NavLink>
      </nav>
    </div>
  );
};

export default GroupSidebar;
