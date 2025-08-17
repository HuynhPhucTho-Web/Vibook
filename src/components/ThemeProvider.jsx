import React, { useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const themes = {
    light: 'bg-light text-dark',
    dark: 'bg-dark text-white',
    red: 'bg-danger-subtle text-danger',
    blue: 'bg-primary-subtle text-primary',
    green: 'bg-success-subtle text-success',
    yellow: 'bg-warning-subtle text-warning',
    purple: 'bg-purple-subtle text-purple',
    pink: 'bg-pink-subtle text-pink',
    indigo: 'bg-indigo-subtle text-indigo',
    teal: 'bg-teal-subtle text-teal',
    orange: 'bg-orange-subtle text-orange',
    cyan: 'bg-cyan-subtle text-cyan',
  };

  const headerThemes = {
    light: 'bg-primary text-white',
    dark: 'bg-dark text-white',
    red: 'bg-danger text-white',
    blue: 'bg-primary text-white',
    green: 'bg-success text-white',
    yellow: 'bg-warning text-white',
    purple: 'bg-purple text-white',
    pink: 'bg-pink text-white',
    indigo: 'bg-indigo text-white',
    teal: 'bg-teal text-white',
    orange: 'bg-orange text-white',
    cyan: 'bg-cyan text-white',
  };

  const style = `
    :root {
      .bg-purple-subtle { background-color: #e2d9f3 !important; }
      .text-purple { color: #6f42c1 !important; }
      .bg-purple { background-color: #6f42c1 !important; }
      .bg-pink-subtle { background-color: #f7d6e6 !important; }
      .text-pink { color: #d63384 !important; }
      .bg-pink { background-color: #d63384 !important; }
      .bg-indigo-subtle { background-color: #d6d8f7 !important; }
      .text-indigo { color: #6610f2 !important; }
      .bg-indigo { background-color: #6610f2 !important; }
      .bg-teal-subtle { background-color: #d6f1f0 !important; }
      .text-teal { color: #20c997 !important; }
      .bg-teal { background-color: #20c997 !important; }
      .bg-orange-subtle { background-color: #ffecd5 !important; }
      .text-orange { color: #fd7e14 !important; }
      .bg-orange { background-color: #fd7e14 !important; }
      .bg-cyan-subtle { background-color: #cff4fc !important; }
      .text-cyan { color: #0dcaf0 !important; }
      .bg-cyan { background-color: #0dcaf0 !important; }
    }
  `;

  // Log theme changes for debugging
  const handleSetTheme = (newTheme) => {
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}] Changing theme to: ${newTheme}`);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, themes, headerThemes }}>
      <style>{style}</style>
      <div className={`theme-root ${themes[theme]}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};