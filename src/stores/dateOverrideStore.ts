import { create } from 'zustand';

interface DateOverrideState {
  overrideDate: Date | null;
  isActive: boolean;
  setOverride: (date: Date | null) => void;
  resetToToday: () => void;
  adjustDays: (days: number) => void;
  adjustMonths: (months: number) => void;
}

export const useDateOverrideStore = create<DateOverrideState>((set, get) => ({
  overrideDate: null,
  isActive: false,

  setOverride: (date) => set({
    overrideDate: date,
    isActive: date !== null,
  }),

  resetToToday: () => set({
    overrideDate: null,
    isActive: false,
  }),

  adjustDays: (days) => {
    const current = get().overrideDate || new Date();
    const newDate = new Date(current);
    newDate.setDate(newDate.getDate() + days);
    set({ overrideDate: newDate, isActive: true });
  },

  adjustMonths: (months) => {
    const current = get().overrideDate || new Date();
    const newDate = new Date(current);
    newDate.setMonth(newDate.getMonth() + months);
    set({ overrideDate: newDate, isActive: true });
  },
}));
