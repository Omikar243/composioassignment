/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#090D16",
        surface: {
          glass: "rgba(15, 23, 42, 0.65)",
          hover: "rgba(30, 41, 59, 0.75)",
          elevated: "rgba(30, 41, 59, 0.50)",
        },
        borderGlass: "rgba(148, 163, 184, 0.15)",
        epistemic: {
          tested: {
            bg: "rgba(6, 78, 59, 0.50)",
            text: "#34D399",
            border: "rgba(16, 185, 129, 0.40)",
          },
          documented: {
            bg: "rgba(30, 58, 138, 0.50)",
            text: "#60A5FA",
            border: "rgba(59, 130, 246, 0.40)",
          },
          hypothesis: {
            bg: "rgba(120, 53, 15, 0.50)",
            text: "#FBBF24",
            border: "rgba(245, 158, 11, 0.40)",
          },
        },
        authMode: {
          oauth: {
            bg: "rgba(88, 28, 135, 0.35)",
            text: "#C084FC",
            border: "rgba(168, 85, 247, 0.40)",
          },
          hybrid: {
            bg: "rgba(14, 116, 144, 0.35)",
            text: "#22D3EE",
            border: "rgba(6, 182, 212, 0.40)",
          },
          direct: {
            bg: "rgba(19, 78, 74, 0.35)",
            text: "#2DD4BF",
            border: "rgba(20, 184, 166, 0.40)",
          },
        },
      },
      boxShadow: {
        "glass-card": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-glow": "0 0 25px -5px rgba(56, 189, 248, 0.15)",
        "purple-glow": "0 0 25px -5px rgba(168, 85, 247, 0.25)",
        "cyan-glow": "0 0 25px -5px rgba(34, 211, 238, 0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
