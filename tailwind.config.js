/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // include jsx files
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: "fadeIn 0.5s ease-out forwards",
        bounceOnce: "bounceOnce 0.8s ease forwards",
        slideFade: "slideFade 0.4s ease-out forwards",
        spinSlow: "spin 4s linear infinite", // <-- Added slow spinning animation for gradient ring
        pulseRing: "pulseRing 2s ease-in-out infinite", // optional pulsing ring
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        bounceOnce: {
          "0%": { transform: "translateX(-50%) translateY(100%)" },
          "30%": { transform: "translateX(-50%) translateY(-10%)" },
          "50%": { transform: "translateX(-50%) translateY(0)" },
          "70%": { transform: "translateX(-50%) translateY(-5%)" },
          "100%": { transform: "translateX(-50%) translateY(0)" },
        },
        slideFade: {
          "0%": { opacity: 0, transform: "translateX(-10px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        pulseRing: {
          "0%, 100%": { transform: "scale(1)", opacity: 0.8 },
          "50%": { transform: "scale(1.05)", opacity: 1 },
        },
      },
      
      backgroundImage: {
        "whatsapp-pattern": "url('https://i.ibb.co/2hJp6kb/whatsapp-bg.png')",
      },
      backgroundSize: {
        "pattern-size": "60px 60px",
      },
      colors: {
        whatsappGreen: "#25D366",
        whatsappLight: "#DCF8C6",
        whatsappDark: "#075E54",
        whatsappGray: "#ECE5DD",
      },
      
    },
  },
  plugins: [],
};
