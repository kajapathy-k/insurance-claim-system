/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        background: "#0A0D14",
        surface: "#111622",
        "surface-light": "#1A2235",
        primary: "#3B82F6",
        "primary-glow": "#60A5FA",
        success: "#10B981",
        "success-glow": "#34D399",
        danger: "#F43F5E",
        "danger-glow": "#FB7185",
        warning: "#F59E0B",
        "warning-glow": "#FBBF24",
        muted: "#64748B",
        border: "#1E293B",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.15)",
        "glow-success": "0 0 20px rgba(16, 185, 129, 0.15)",
        "glow-danger": "0 0 20px rgba(244, 63, 94, 0.15)",
        "glow-warning": "0 0 20px rgba(245, 158, 11, 0.15)",
        soft: "0 10px 40px rgba(0, 0, 0, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
}
