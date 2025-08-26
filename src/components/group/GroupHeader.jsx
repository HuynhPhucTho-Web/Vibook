import React from "react";
import { FaUsers } from "react-icons/fa";

const GroupHeader = ({ group }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md">
      {/* Banner giả lập */}
      <div className="h-48 bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
        <h1 className="text-3xl font-bold text-white">Group Banner</h1>
      </div>

      {/* Info */}
      <div className="max-w-7xl mx-auto p-4 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-gray-500">{group.description}</p>
          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
            <FaUsers /> {group.members?.length || 0} thành viên
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg mt-3 sm:mt-0">
          + Mời bạn bè
        </button>
      </div>
    </div>
  );
};

export default GroupHeader;
