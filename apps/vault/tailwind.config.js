/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Most tokens read from CSS variables so a theme can swap the
        // whole palette at runtime (see globals.css `[data-theme]` blocks).
        // `red`/`red-muted` stay hardcoded on purpose: expense/danger
        // should look the same regardless of which color theme is active.
        vault: {
          bg: 'var(--vault-bg)',
          surface: 'var(--vault-surface)',
          card: 'var(--vault-card)',
          border: 'var(--vault-border)',
          gold: 'var(--vault-accent)',
          'gold-light': 'var(--vault-accent-light)',
          red: '#E03E3E',
          'red-muted': '#991F1F',
          green: '#22C55E',
          muted: 'var(--vault-muted)',
          text: 'var(--vault-text)',
          'text-dim': 'var(--vault-text-dim)',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        mono: ['var(--font-ibm-mono)', 'monospace'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      animation: {
        'ticker': 'ticker 20s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'number-pop': 'numberPop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        ticker: { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-50%)' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        numberPop: { from: { transform: 'scale(0.85)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
      },
    },
  },
  plugins: [],
}
