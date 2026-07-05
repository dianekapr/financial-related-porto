/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All tokens read from CSS variables so a Vault Skin can swap the
        // whole palette at runtime (see lib/theme/skins.ts + ThemeStyleTag,
        // which generate the `[data-theme]` variable blocks).
        vault: {
          bg: 'var(--vault-bg)',
          surface: 'var(--vault-surface)',
          card: 'var(--vault-card)',
          border: 'var(--vault-border)',
          accent: 'var(--vault-accent)',
          'accent-light': 'var(--vault-accent-light)',
          'accent-hover': 'var(--vault-accent-hover)',
          'accent-contrast': 'var(--vault-accent-contrast)',
          muted: 'var(--vault-muted)',
          text: 'var(--vault-text)',
          'text-dim': 'var(--vault-text-dim)',
          success: 'var(--vault-success)',
          warning: 'var(--vault-warning)',
          danger: 'var(--vault-danger)',
          info: 'var(--vault-info)',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        mono: ['var(--font-ibm-mono)', 'monospace'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        vault: '0 8px 30px var(--vault-shadow)',
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
