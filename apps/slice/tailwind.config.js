/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        slice: {
          bg: '#FFFBEF',
          surface: '#FFF8E1',
          card: '#FFFFFF',
          border: '#E8E0C8',
          orange: '#FF5E1A',
          'orange-light': '#FF7D42',
          dark: '#2D2D2D',
          muted: '#8A8070',
          'text-dim': '#B0A898',
          receipt: '#F5F0E0',
        },
      },
      fontFamily: {
        receipt: ['Courier Prime', 'Courier New', 'monospace'],
        display: ['Fredoka One', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'print': 'print 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-up': 'fadeUp 0.4s ease forwards',
        'tear': 'tear 0.5s ease-out forwards',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        print: {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeUp: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          from: { transform: 'scale(0.8)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
