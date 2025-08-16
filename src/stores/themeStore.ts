import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true, // Default to dark theme

  toggleTheme: () => {
    const newTheme = !get().isDark;
    set({ isDark: newTheme });
    
    // Update document class and localStorage
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fintonico-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fintonico-theme', 'light');
    }
  },

  initializeTheme: () => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('fintonico-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme 
      ? savedTheme === 'dark' 
      : systemPrefersDark;

    set({ isDark: shouldBeDark });
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));