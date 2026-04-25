/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont',
          '"SF Pro Display"', '"SF Pro Text"',
          'Inter', 'system-ui', 'sans-serif',
        ],
      },
      colors: {
        // Semantic theme colors — driven by CSS variables, flip via html.dark
        page:          'rgb(var(--bg) / <alpha-value>)',
        surface:       'rgb(var(--surface) / <alpha-value>)',
        soft:          'rgb(var(--muted) / <alpha-value>)',
        elevated:      'rgb(var(--elevated) / <alpha-value>)',
        'fg':          'rgb(var(--fg) / <alpha-value>)',
        'fg-muted':    'rgb(var(--fg-muted) / <alpha-value>)',
        'fg-subtle':   'rgb(var(--fg-subtle) / <alpha-value>)',
        'on-elevated': 'rgb(var(--on-elevated) / <alpha-value>)',
        line:          'rgb(var(--line) / <alpha-value>)',

        accent: {
          DEFAULT: '#0071e3',
          hover:   '#0077ed',
          press:   '#006edb',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        soft: '0 1px 2px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
        pop:  '0 10px 40px rgba(0,0,0,0.18)',
      },
      borderRadius: { xl2: '1.25rem' },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
