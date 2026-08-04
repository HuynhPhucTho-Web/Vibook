import React, { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [keyword, setKeyword] = useState("");
  const [searchConfig, setSearchConfig] = useState(null);

  return (
    <SearchContext.Provider
      value={{
        keyword,
        setKeyword,
        searchConfig,
        setSearchConfig,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
