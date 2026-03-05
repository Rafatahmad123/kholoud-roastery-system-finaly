/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'luxury-cream': '#faf9f6',
        'espresso-brown': '#2c1810',
        'gold': '#d4af37',
        'emerald': '#059669',
        'copper': '#b87333',
      },
      fontFamily: {
        'tajawal': ['Tajawal', 'sans-serif'],
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'neumorphic': '8px 8px 16px #e5e4e0, -8px -8px 16px #ffffff',
        'neumorphic-inset': 'inset 8px 8px 16px #e5e4e0, inset -8px -8px 16px #ffffff',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.3)',
        'emerald-glow': '0 0 20px rgba(5, 150, 105, 0.3)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'tilt': 'tilt 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        tilt: {
          '0%': { transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' },
          '100%': { transform: 'perspective(1000px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))' },
        }
      }
    },
  },
  plugins: [],
}
