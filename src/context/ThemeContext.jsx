// context/ThemeContext.jsx
import { createContext, useLayoutEffect, useState } from "react";

// Context and provider intentionally live together to preserve the existing import API.
// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext();

/* Aligned with DESIGN.md void-black + accent atmospheres */
const BACKGROUND_COLORS = {
  default: { light: "#f4f2fb", dark: "#0c0d14" },
  sky: { light: "#eef6ff", dark: "#0b1525" },
  lavender: { light: "#f5f1ff", dark: "#171225" },
  mint: { light: "#effbf6", dark: "#0c1d18" },
  warm: { light: "#fff7ed", dark: "#21160f" },
};

export const ThemeProvider = ({ children }) => {
  // Lấy theme từ localStorage, nếu không có thì mặc định là light
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [background, setBackground] = useState(
    () => localStorage.getItem("app_background") || "default",
  );

  useLayoutEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Lưu vào localStorage để lần sau load lại giữ nguyên theme
    const selectedBackground = BACKGROUND_COLORS[background] || BACKGROUND_COLORS.default;
    root.style.setProperty("--app-background", selectedBackground[theme]);
    root.dataset.appBackground = background;
    localStorage.setItem("theme", theme);
    localStorage.setItem("app_background", background);
  }, [background, theme]);

  // Hàm toggle theme cho tiện khi gọi
  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, background, setBackground }}>
      {children}
    </ThemeContext.Provider>
  );
};
