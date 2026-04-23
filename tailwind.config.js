/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'hsl(210 20% 98%)',
        foreground: 'hsl(215 25% 12%)',
        card: '#ffffff',
        'card-foreground': 'hsl(215 25% 12%)',
        primary: {
          DEFAULT: 'hsl(205 78% 42%)',
          foreground: '#ffffff',
          light: 'hsl(205 78% 52%)',
          dim: 'hsla(205, 78%, 42%, 0.1)',
        },
        secondary: {
          DEFAULT: 'hsl(210 15% 93%)',
          foreground: 'hsl(215 25% 20%)',
        },
        muted: {
          DEFAULT: 'hsl(210 15% 95%)',
          foreground: 'hsl(215 10% 48%)',
        },
        accent: {
          DEFAULT: 'hsl(25 95% 53%)',
          foreground: '#ffffff',
          light: 'hsla(25, 95%, 53%, 0.15)',
        },
        border: 'hsl(210 18% 89%)',
        input: 'hsl(210 18% 89%)',
        ring: 'hsl(205 78% 42%)',
        sidebar: {
          DEFAULT: 'hsl(215 28% 14%)',
          foreground: 'hsl(210 15% 85%)',
          primary: 'hsl(205 78% 52%)',
          'primary-foreground': '#ffffff',
          accent: 'hsl(215 25% 20%)',
          'accent-foreground': 'hsl(210 15% 92%)',
          border: 'hsl(215 20% 22%)',
        },
        emerald: {
          100: '#d1fae5',
          500: '#10b981',
          800: '#065f46',
        },
        amber: {
          100: '#fef3c7',
          500: '#f59e0b',
          800: '#92400e',
        },
        blue: {
          100: '#dbeafe',
          500: '#3b82f6',
          800: '#1e40af',
        },
        red: {
          100: '#fee2e2',
          500: '#ef4444',
          800: '#991b1b',
        },
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        sidebar: '2px 0 8px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};