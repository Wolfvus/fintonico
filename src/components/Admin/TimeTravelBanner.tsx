import { Clock } from 'lucide-react';
import { useDateOverrideStore } from '../../stores/dateOverrideStore';
import { useAuthStore } from '../../stores/authStore';

export const TimeTravelBanner: React.FC = () => {
  const { overrideDate, isActive, resetToToday } = useDateOverrideStore();
  const { isDevMode } = useAuthStore();

  if (!isDevMode || !isActive || !overrideDate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span className="font-medium">
          Time Travel Active: {overrideDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
      <button
        onClick={resetToToday}
        className="underline hover:no-underline font-semibold"
      >
        Reset to Today
      </button>
    </div>
  );
};
