// src/components/header/SearchBox.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";

const SearchBox = ({
  theme,
  t,
  searchRef,
  searchFocused,
  setSearchFocused,
  searchValue,
  setSearchValue,
  searchResults,
  isSearching,
}) => {
  return (
    <div
      ref={searchRef}
      className={`relative hidden md:block w-full ${searchFocused ? "focused" : ""}`}
    >
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          className={`w-full py-2 pl-4 pr-9 rounded-full border-none text-sm focus:outline-none focus:ring-2 ${
            theme === "light"
              ? "bg-black/10 text-black placeholder-black/70 focus:bg-black/15 focus:ring-black/20"
              : "bg-white/10 text-white placeholder-white/70 focus:bg-white/15 focus:ring-white/30"
          }`}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setSearchFocused(true)}
        />
        {searchValue && (
          <button
            className={`absolute right-2 w-5 h-5 flex items-center justify-center text-lg cursor-pointer bg-transparent border-none ${
              theme === "light" ? "text-black/70" : "text-white/70"
            }`}
            onClick={() => setSearchValue("")}
            type="button"
          >
            ×
          </button>
        )}
      </div>

      {/* SEARCH DROPDOWN */}
      {searchFocused && (searchValue || searchResults.length > 0) && (
        <div
          className={`absolute top-full left-0 w-full min-w-72 max-h-72 overflow-y-auto rounded-lg shadow-lg border mt-1 z-[1010] ${
            theme === "light"
              ? "bg-white border-gray-200"
              : "bg-gray-800 border-gray-700"
          }`}
        >
          <div className="p-3">
            {isSearching ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2" />
                <span
                  className={`text-sm ${
                    theme === "light" ? "text-gray-600" : "text-gray-300"
                  }`}
                >
                  {t("searching")}
                </span>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                {/* Users Section */}
                {searchResults.filter((r) => r.type === "user").length > 0 && (
                  <>
                    <h6
                      className={`text-xs font-bold uppercase mb-2 ${
                        theme === "light" ? "text-gray-600" : "text-gray-300"
                      }`}
                    >
                      {t("users")}
                    </h6>
                    {searchResults
                      .filter((r) => r.type === "user")
                      .map((user) => (
                        <Link
                          key={`user-${user.id}`}
                          to={`/user/${user.id}`}
                          className="block no-underline"
                          onClick={() => {
                            setTimeout(() => {
                              setSearchValue("");
                              setSearchFocused(false);
                            }, 0);
                          }}
                        >
                          <div
                            className={`flex items-center py-2 px-2 cursor-pointer transition-colors rounded hover:${
                              theme === "light" ? "bg-gray-100" : "bg-white/10"
                            }`}
                          >
                            <FaUser
                              className={`w-8 h-8 rounded-full mr-3 flex-shrink-0 ${
                                theme === "light" ? "text-gray-500" : "text-gray-400"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  theme === "light" ? "text-gray-900" : "text-white"
                                }`}
                              >
                                {user.displayName || t("anonymous")}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </>
                )}

                {/* Posts Section */}
                {searchResults.filter((r) => r.type === "post").length > 0 && (
                  <>
                    <h6
                      className={`text-xs font-bold uppercase mt-3 mb-2 ${
                        theme === "light" ? "text-gray-600" : "text-gray-300"
                      }`}
                    >
                      {t("posts")}
                    </h6>
                    {searchResults
                      .filter((r) => r.type === "post")
                      .map((post) => (
                        <Link
                          key={`post-${post.id}`}
                          to={`/post/${post.id}`}
                          className="block no-underline"
                          onClick={() => {
                            setTimeout(() => {
                              setSearchValue("");
                              setSearchFocused(false);
                            }, 0);
                          }}
                        >
                          <div
                            className={`flex items-start py-2 px-2 cursor-pointer transition-colors rounded hover:${
                              theme === "light" ? "bg-gray-100" : "bg-white/10"
                            }`}
                          >
                            <FaUser
                              className={`w-8 h-8 rounded-full mr-3 flex-shrink-0 ${
                                theme === "light" ? "text-gray-500" : "text-gray-400"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  theme === "light" ? "text-gray-900" : "text-white"
                                }`}
                              >
                                {post.userName || t("anonymous")}
                              </p>
                              <p
                                className={`text-xs truncate ${
                                  theme === "light" ? "text-gray-600" : "text-gray-300"
                                }`}
                              >
                                {post.content?.substring(0, 50) || t("noContent")}...
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </>
                )}
              </>
            ) : searchValue ? (
              <div className="text-center py-4">
                <span
                  className={`text-sm ${
                    theme === "light" ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {t("noResults")} "{searchValue}"
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;
