import React from "react";
import { NavLink, useParams } from "react-router-dom";

const GroupSidebar = ({ group }) => {
  const { groupId } = useParams();

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-300"
    }`;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md p-4 mb-4">
      <nav className="flex flex-wrap gap-2">
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