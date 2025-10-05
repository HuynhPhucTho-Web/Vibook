// context/ThemeProvider.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContext";

export const ThemeProvider = ({ children }) => {
  // đọc lần đầu
  const [theme, setTheme] = useState(() => localStorage.getItem("vibook-theme") || "light");
  // bodyBackground tự đồng bộ theo theme (không cần lưu riêng)
  const bodyBackground = theme === "dark" ? "#0b0f19" : "#f0f2f5";

  // toggle & set
  const handleSetTheme = (next) => {
    setTheme(next);
    localStorage.setItem("vibook-theme", next);
  };
  const toggleTheme = () => handleSetTheme(theme === "light" ? "dark" : "light");

  // áp class "dark" cho html (để tailwind/dark class dùng được, nếu có)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  // CSS variables + ép background cho body/root
  const styleText = useMemo(() => {
    const colors =
      theme === "dark"
        ? { primary: "#0d6efd", secondary: "#6c757d", background: "#111318", text: "#ffffff" }
        : { primary: "#007bff", secondary: "#6c757d", background: "#ffffff", text: "#212529" };

    return `
      :root {
        --theme-primary: ${colors.primary};
        --theme-secondary: ${colors.secondary};
        --theme-background: ${colors.background};
        --theme-text: ${colors.text};
        --body-background: ${bodyBackground};
      }
      html, body, #root {
        min-height: 100%;
        background: var(--body-background) !important;
        color: var(--theme-text);
      }
      /* Mọi container lớn để trong suốt, để lộ nền body */
      .theme-root,
      .theme-root .App,
      .theme-root main,
      .theme-root .container-fluid,
      .theme-root .container,
      .theme-root .row,
      .theme-root [class*="col-"],
      .theme-root section {
        background: transparent !important;
      }
    `;
  }, [theme, bodyBackground]);

  // class text theo theme (khỏi dùng bg-*)
  const themeClass = theme === "dark" ? "text-white" : "text-dark";

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, toggleTheme }}>
      <style>{styleText}</style>
      <div className={`theme-root ${themeClass}`}>{children}</div>
    </ThemeContext.Provider>
  );
};
