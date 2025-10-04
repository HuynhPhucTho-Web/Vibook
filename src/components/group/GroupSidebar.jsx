import React from "react";
import { NavLink, useParams } from "react-router-dom";

const baseTab =
  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors";
const activeTab = "bg-blue-600 text-white shadow-sm";
const idleTab =
  "text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-200";

export default function GroupSidebar() {
  const { groupId } = useParams();

  const getClass = ({ isActive }) => [baseTab, isActive ? activeTab : idleTab].join(" ");

  return (
    <div className="bg-white/95 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
      <nav className="max-w-5xl mx-auto px-3 md:px-4 py-2">
        {/* scroll ngang trên mobile nếu chật */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <NavLink to={`/groups/${groupId}`} end className={getClass}>Home</NavLink>
          <NavLink to={`/groups/${groupId}/members`} className={getClass}>Members</NavLink>
          <NavLink to={`/groups/${groupId}/media`} className={getClass}>Media</NavLink>
          <NavLink to={`/groups/${groupId}/events`} className={getClass}>Events</NavLink>
          <NavLink to={`/groups/${groupId}/about`} className={getClass}>About</NavLink>
        </div>
      </nav>
    </div>
  );
}
