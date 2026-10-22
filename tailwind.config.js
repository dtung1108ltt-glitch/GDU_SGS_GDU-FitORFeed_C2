/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-amber': '0 0 20px -4px rgba(251, 191, 36, 0.25)',
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.3)',
        'glow-rose': '0 0 28px -2px rgba(244, 63, 94, 0.45)',
        'glow-cyan': '0 0 20px -4px rgba(6, 182, 212, 0.25)',
      },
    },
  },
  plugins: [],
}
