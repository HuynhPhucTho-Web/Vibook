import React from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import SearchResults from "./SearchResults";
import { useSearch } from "../../context/SearchContext";

const SearchBox = ({ theme, t, searchRef, searchFocused, setSearchFocused, searchValue, setSearchValue, searchResults, isSearching, placeholder, mode = "global" }) => {
  const { searchConfig } = useSearch();

  const closeResults = () => {
    setSearchValue("");
    setSearchFocused(false);
  };

  return (
    <div ref={searchRef} className={`header-search-box relative hidden md:block w-full ${searchFocused ? "is-focused" : ""}`}>
      <div className="header-search-input-wrap">
        <FaSearch className="header-search-leading-icon" aria-hidden="true" />
        <input
          type="search"
          placeholder={placeholder || t("searchPlaceholder")}
          className="header-search-input"
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            searchConfig?.onSearch?.(event.target.value);
          }}
          onFocus={() => setSearchFocused(true)}
          aria-label={t("searchPlaceholder")}
          aria-expanded={searchFocused && !!searchValue.trim()}
        />
        {searchValue && <button className="header-search-clear" onClick={() => setSearchValue("")} type="button" aria-label="Xóa nội dung tìm kiếm"><FaTimes /></button>}
        <span className="header-search-shortcut">Ctrl K</span>
      </div>

      {searchFocused && searchValue.trim() && !searchConfig && (
        <div className={`search-results-panel ${theme === "light" ? "light" : "dark"}`}>
          <SearchResults theme={theme} t={t} query={searchValue} results={searchResults} isSearching={isSearching} onSelect={closeResults} mode={mode} />
        </div>
      )}
    </div>
  );
};

export default SearchBox;
