import React, { useState } from 'react';
import { ThemeContext } from './ThemeContext';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [bodyBackground, setBodyBackground] = useState('#ffffff');

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

  const colorOptions = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Gray', value: '#f0f2f5' },
    { name: 'Dark Gray', value: '#333333' },
    { name: 'Blue', value: '#e3f2fd' },
    { name: 'Green', value: '#e8f5e9' },
    { name: 'Purple', value: '#f3e5f5' },
  ];

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
      body { background-color: ${bodyBackground} !important; }
    }
  `;

  // Log theme changes for debugging
  const handleSetTheme = (newTheme) => {
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}] Changing theme to: ${newTheme}`);
    setTheme(newTheme);
  };

  // Log background color changes for debugging
  const handleSetBodyBackground = (color) => {
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}] Changing body background to: ${color}`);
    setBodyBackground(color);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme: handleSetTheme, 
      themes, 
      headerThemes, 
      bodyBackground, 
      setBodyBackground: handleSetBodyBackground,
      colorOptions 
    }}>
      <style>{style}</style>
      <div className={`theme-root ${themes[theme]}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};