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
    .bg-purple-subtle { background-color: #e2d9f3; }
    .text-purple { color: #6f42c1; }
    .bg-purple { background-color: #6f42c1; }
    .bg-pink-subtle { background-color: #f7d6e6; }
    .text-pink { color: #d63384; }
    .bg-pink { background-color: #d63384; }
    .bg-indigo-subtle { background-color: #d6d8f7; }
    .text-indigo { color: #6610f2; }
    .bg-indigo { background-color: #6610f2; }
    .bg-teal-subtle { background-color: #d6f1f0; }
    .text-teal { color: #20c997; }
    .bg-teal { background-color: #20c997; }
    .bg-orange-subtle { background-color: #ffecd5; }
    .text-orange { color: #fd7e14; }
    .bg-orange { background-color: #fd7e14; }
    .bg-cyan-subtle { background-color: #cff4fc; }
    .text-cyan { color: #0dcaf0; }
    .bg-cyan { background-color: #0dcaf0; }
  `;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes, headerThemes }}>
      <style>{style}</style>
      {children}
    </ThemeContext.Provider>
  );
};