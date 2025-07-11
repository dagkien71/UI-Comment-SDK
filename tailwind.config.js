/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./demo/**/*.{js,ts,jsx,tsx,html}"],
  prefix: "uicm-",
  theme: {
    extend: {
      colors: {
        glass: {
          light: "rgba(255, 255, 255, 0.25)",
          dark: "rgba(0, 0, 0, 0.25)",
          border: "rgba(255, 255, 255, 0.18)",
        },
        accent: {
          DEFAULT: "rgba(99, 102, 241, 0.8)",
          hover: "rgba(79, 70, 229, 0.9)",
        },
      },
      backdropBlur: {
        glass: "12px",
      },
      borderRadius: {
        glass: "12px",
      },
      animation: {
        "bubble-appear": "bubble-appear 0.3s ease-out",
        "highlight-pulse": "highlight-pulse 2s infinite",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        "bubble-appear": {
          "0%": { opacity: "0", transform: "scale(0)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "highlight-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      zIndex: {
        "sdk-highlight": "999996",
        "sdk-bubble": "999997",
        "sdk-debug": "999998",
        "sdk-popup": "999999",
        "sdk-tooltip": "1000000",
      },
    },
  },
  plugins: [],
  corePlugins: {
    // Disable some core plugins that might conflict with host page
    preflight: false,
  },
};
