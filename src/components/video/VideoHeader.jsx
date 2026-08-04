import React from 'react';
import { FaUser } from 'react-icons/fa';

const VideoHeader = ({ theme, user, handleLogin, onLogoClick }) => {
  return (
    <header className={`border-b ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-800 bg-[#0f0f0f]'} sticky top-0 z-50 py-2`}>
      <div className="max-w-[1400px] mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-1 cursor-pointer" onClick={onLogoClick}>
          <span className="text-2xl font-black text-red-600">V</span>
          <span className="text-lg font-bold tracking-tighter hidden sm:block">VideoTube</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <img src={user.avatar} className="w-8 h-8 rounded-full border border-gray-500" alt="user" />
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 border border-blue-500 text-blue-500 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-500/10">
              <FaUser/> Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default VideoHeader;
