import tailwindcssAnimate from 'tailwindcss-animate';

module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "modal-in": {
          "0%": { 
            opacity: "0", 
            transform: "translate(-50%, -48%) scale(0.96)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translate(-50%, -50%) scale(1)" 
          },
        },
        "modal-out": {
          "0%": { 
            opacity: "1", 
            transform: "translate(-50%, -50%) scale(1)" 
          },
          "100%": { 
            opacity: "0", 
            transform: "translate(-50%, -48%) scale(0.96)" 
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.15s cubic-bezier(0.22, 0.61, 0.36, 1)",
        "accordion-up": "accordion-up 0.15s cubic-bezier(0.22, 0.61, 0.36, 1)",
        "modal-in": "modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "modal-out": "modal-out 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
  ],
}