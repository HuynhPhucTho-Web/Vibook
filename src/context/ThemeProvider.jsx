// ThemeProvider.jsx
import React, { useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContext';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [bodyBackground, setBodyBackground] = useState('#ffffff');

  // Theme classes for components
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

  // Header theme classes
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

  // Color options for background
  const colorOptions = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Gray', value: '#f0f2f5' },
    { name: 'Dark Gray', value: '#333333' },
    { name: 'Blue', value: '#e3f2fd' },
    { name: 'Green', value: '#e8f5e9' },
    { name: 'Purple', value: '#f3e5f5' },
  ];

  // Extended color palette
  const extendedColorOptions = [
    { name: 'Pure White', value: '#ffffff' },
    { name: 'Snow White', value: '#fafafa' },
    { name: 'Light Gray', value: '#f5f5f5' },
    { name: 'Cool Gray', value: '#f0f2f5' },
    { name: 'Warm Gray', value: '#f8f9fa' },
    { name: 'Dark Gray', value: '#e9ecef' },
    { name: 'Charcoal', value: '#6c757d' },
    { name: 'Dark Charcoal', value: '#495057' },
    { name: 'Near Black', value: '#343a40' },
    { name: 'Pure Black', value: '#000000' },
    { name: 'Sky Blue', value: '#e3f2fd' },
    { name: 'Ocean Blue', value: '#bbdefb' },
    { name: 'Deep Blue', value: '#90caf9' },
    { name: 'Navy Blue', value: '#64b5f6' },
    { name: 'Mint Green', value: '#e8f5e9' },
    { name: 'Forest Green', value: '#c8e6c9' },
    { name: 'Emerald Green', value: '#a5d6a7' },
    { name: 'Deep Green', value: '#81c784' },
    { name: 'Lavender', value: '#f3e5f5' },
    { name: 'Purple Mist', value: '#e1bee7' },
    { name: 'Violet', value: '#ce93d8' },
    { name: 'Deep Purple', value: '#ba68c8' },
    { name: 'Rose Pink', value: '#fce4ec' },
    { name: 'Pink Blush', value: '#f8bbd9' },
    { name: 'Hot Pink', value: '#f48fb1' },
    { name: 'Deep Pink', value: '#f06292' },
    { name: 'Warm Orange', value: '#fff3e0' },
    { name: 'Peach', value: '#ffe0b2' },
    { name: 'Sunset Orange', value: '#ffcc02' },
    { name: 'Deep Orange', value: '#ffab40' },
    { name: 'Sunny Yellow', value: '#fffde7' },
    { name: 'Golden Yellow', value: '#fff9c4' },
    { name: 'Bright Yellow', value: '#fff59d' },
    { name: 'Amber', value: '#fff176' },
    { name: 'Teal Light', value: '#e0f2f1' },
    { name: 'Aqua', value: '#b2dfdb' },
    { name: 'Turquoise', value: '#80cbc4' },
    { name: 'Deep Teal', value: '#4db6ac' },
  ];

  // CSS variables for theming
  const getCSSVariables = () => {
    const themeColors = {
      light: { primary: '#007bff', secondary: '#6c757d', background: '#ffffff', text: '#212529' },
      dark: { primary: '#0d6efd', secondary: '#6c757d', background: '#212529', text: '#ffffff' },
      red: { primary: '#dc3545', secondary: '#6c757d', background: '#fff5f5', text: '#721c24' },
      blue: { primary: '#0d6efd', secondary: '#6c757d', background: '#f0f8ff', text: '#0a58ca' },
      green: { primary: '#198754', secondary: '#6c757d', background: '#f0fff4', text: '#0f5132' },
      yellow: { primary: '#ffc107', secondary: '#6c757d', background: '#fffbf0', text: '#664d03' },
      purple: { primary: '#6f42c1', secondary: '#6c757d', background: '#f8f4ff', text: '#59359a' },
      pink: { primary: '#d63384', secondary: '#6c757d', background: '#fff0f6', text: '#ab296a' },
      indigo: { primary: '#6610f2', secondary: '#6c757d', background: '#f5f3ff', text: '#520dc2' },
      teal: { primary: '#20c997', secondary: '#6c757d', background: '#f0fdfa', text: '#0d9488' },
      orange: { primary: '#fd7e14', secondary: '#6c757d', background: '#fff8f0', text: '#cc5500' },
      cyan: { primary: '#0dcaf0', secondary: '#6c757d', background: '#f0fcff', text: '#0aa2c0' },
    };

    const colors = themeColors[theme] || themeColors.light;
    
    return `
      :root {
        --theme-primary: ${colors.primary};
        --theme-secondary: ${colors.secondary};
        --theme-background: ${colors.background};
        --theme-text: ${colors.text};
        --body-background: ${bodyBackground};
      }
    `;
  };

  // Custom CSS for extended themes and body background
  const customStyles = `
    ${getCSSVariables()}
    
    body {
      background-color: ${bodyBackground} !important;
      transition: background-color 0.3s ease;
    }
    
    /* Custom theme colors */
    .bg-purple-subtle { background-color: #f3e5f5 !important; }
    .text-purple { color: #6f42c1 !important; }
    .bg-purple { background-color: #6f42c1 !important; }
    
    .bg-pink-subtle { background-color: #fce4ec !important; }
    .text-pink { color: #d63384 !important; }
    .bg-pink { background-color: #d63384 !important; }
    
    .bg-indigo-subtle { background-color: #f5f3ff !important; }
    .text-indigo { color: #6610f2 !important; }
    .bg-indigo { background-color: #6610f2 !important; }
    
    .bg-teal-subtle { background-color: #e0f2f1 !important; }
    .text-teal { color: #20c997 !important; }
    .bg-teal { background-color: #20c997 !important; }
    
    .bg-orange-subtle { background-color: #fff3e0 !important; }
    .text-orange { color: #fd7e14 !important; }
    .bg-orange { background-color: #fd7e14 !important; }
    
    .bg-cyan-subtle { background-color: #cff4fc !important; }
    .text-cyan { color: #0dcaf0 !important; }
    .bg-cyan { background-color: #0dcaf0 !important; }
    
    /* Theme-based components */
    .themed-card {
      background-color: var(--theme-background);
      color: var(--theme-text);
      border: 1px solid var(--theme-primary);
    }
    
    .themed-button {
      background-color: var(--theme-primary);
      color: white;
      border: none;
    }
    
    .themed-input {
      background-color: var(--theme-background);
      color: var(--theme-text);
      border: 1px solid var(--theme-secondary);
    }
  `;

  // Load saved theme and background from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('vibook-theme');
    const savedBackground = localStorage.getItem('vibook-background');
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedBackground) {
      setBodyBackground(savedBackground);
    }
  }, []);

  // Save theme changes to localStorage
  const handleSetTheme = (newTheme) => {
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}] Changing theme to: ${newTheme}`);
    setTheme(newTheme);
    localStorage.setItem('vibook-theme', newTheme);
  };

  // Save background changes to localStorage
  const handleSetBodyBackground = (color) => {
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}] Changing body background to: ${color}`);
    setBodyBackground(color);
    localStorage.setItem('vibook-background', color);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme: handleSetTheme, 
      themes, 
      headerThemes, 
      bodyBackground, 
      setBodyBackground: handleSetBodyBackground,
      colorOptions,
      extendedColorOptions
    }}>
      <style>{customStyles}</style>
      <div className={`theme-root ${themes[theme]}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};