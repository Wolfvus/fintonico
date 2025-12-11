/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Brand Colors
      colors: {
        // Primary brand color - Teal
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#2FA5A9',  // Main brand teal
          600: '#268F92',
          700: '#1D7275',
          800: '#155E5E',
          900: '#134E4A',
          950: '#042F2E',
        },
        // Accent color - Gold
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F5B700',  // Main brand gold
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        // Navy - text and headers
        navy: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#1E2A38',  // Main navy
          950: '#0F172A',
        },
        // Surface colors for backgrounds
        surface: {
          // Light mode surfaces
          light: {
            DEFAULT: '#EFF6FF',    // bg-blue-50 equivalent
            card: '#FFFFFF',
            elevated: '#DBEAFE',  // bg-blue-100
            muted: '#F1F5F9',
          },
          // Dark mode surfaces
          dark: {
            DEFAULT: '#111827',   // bg-gray-900
            card: '#1F2937',      // bg-gray-800
            elevated: '#374151',  // bg-gray-700
            muted: '#1F2937',
          },
        },
      },
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(252, 213, 53, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(252, 213, 53, 0.8)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      // Consistent border radius
      borderRadius: {
        'card': '0.75rem',  // 12px - consistent card radius
      },
      // Box shadows
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}
