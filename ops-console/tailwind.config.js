/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ops-bg':       '#0b0d10',
        'ops-panel':    '#14181d',
        'ops-panel-alt':'#1a1f25',
        'ops-border':   '#262d36',
        'ops-text':     '#e6e9ee',
        'ops-muted':    '#8a93a0',
        'ops-accent':   '#5eead4',
        'ops-accent-2': '#38bdf8',
        'ops-warn':     '#fbbf24',
        'ops-danger':   '#f87171',
        'ops-success':  '#4ade80',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'soft':    '0 2px 8px rgba(0, 0, 0, 0.15)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
