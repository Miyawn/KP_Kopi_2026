export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: "#F9F6F1",
          100: "#F1E7DB",
          200: "#DFCBB2",
          300: "#CBAE89",
          400: "#B58F64",
          500: "#A17245",
          600: "#855935",
          700: "#6A452B",
          800: "#4D311F",
          900: "#2E1D13",
        },
        cream: "#F5E6D3",
        accent: "#9FE0C5",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ['"Space Grotesk"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 15px 45px rgba(0,0,0,0.08)",
        soft: "0 12px 30px rgba(42, 28, 17, 0.12)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
