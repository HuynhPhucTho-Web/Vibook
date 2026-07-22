/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        vb: {
          surface: "#12131a",
          "surface-low": "#1a1b22",
          "surface-container": "#1e1f27",
          "on-surface": "#e3e1ec",
          "on-surface-variant": "#cdc3d6",
          primary: "#d5baff",
          "primary-container": "#8e54e9",
          secondary: "#b2c5ff",
          neon: "#8e54e9",
          electric: "#4776e6",
          deep: "#0c0d14",
          outline: "#968d9f",
          "outline-variant": "#4b4454",
        },
      },
      fontFamily: {
        sans: [
          "Hanken Grotesk",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        vb: "0.5rem",
        "vb-md": "0.75rem",
        "vb-lg": "1rem",
        "vb-xl": "1.5rem",
      },
      boxShadow: {
        "vb-glow": "0 0 12px rgba(142, 84, 233, 0.4)",
        "vb-glow-strong": "0 0 16px rgba(142, 84, 233, 0.7)",
        "vb-elevated": "0 8px 32px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "vb-gradient": "linear-gradient(135deg, #8e54e9, #4776e6)",
      },
    },
  },
  plugins: [],
};
