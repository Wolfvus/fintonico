/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme - Professional finance colors
        'finance-dark': '#0F172A',
        'finance-darker': '#020617',
        'finance-border': '#334155',
        'finance-accent': '#3B82F6',
        'finance-success': '#10B981',
        'finance-danger': '#EF4444',
        'finance-warning': '#F59E0B',
        'finance-text': '#E2E8F0',
        'finance-text-dim': '#94A3B8',
        
        // Light theme - Clean and professional
        'finance-light': '#FFFFFF',
        'finance-light-bg': '#F8FAFC',
        'finance-light-border': '#E2E8F0',
        'finance-light-text': '#1E293B',
        'finance-light-text-dim': '#64748B',
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
    },
  },
  plugins: [],
}