import React from 'react';
import {
  Home,
  Wallet,
  Menu,
  X,
  LogOut,
  User,
  Moon,
  Sun,
  DollarSign,
  Landmark,
  Settings,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { CurrencySelector } from '../Currency/CurrencySelector';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
  isDark?: boolean;
  onThemeToggle?: () => void;
  onLogoClick?: () => void;
  onDateClick?: () => void;
  onOpenSettings?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  isMobileMenuOpen = false,
  onMobileMenuToggle,
  isDark = false,
  onThemeToggle,
  onLogoClick,
  onDateClick,
  onOpenSettings
}) => {
  const { user, signOut } = useAuthStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'income', label: 'Income', icon: DollarSign },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'networth', label: 'Net Worth', icon: Landmark },
    { id: 'accounts', label: 'Accounts', icon: BookOpen },
  ];

  const handleSignOut = async () => {
    await signOut();
    if (onMobileMenuToggle && isMobileMenuOpen) {
      onMobileMenuToggle();
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-blue-100 dark:bg-gray-800 border-r border-blue-200 dark:border-gray-700 transition-all duration-300 ease-in-out z-50 lg:w-16 hover:lg:w-64 group overflow-hidden"
      >
        {/* Logo */}
        <div className="p-2 border-b border-blue-200 dark:border-gray-700">
          <button 
            onClick={onLogoClick}
            className="w-full h-10 flex items-center justify-center lg:group-hover:justify-start gap-3 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg px-2"
          >
            <img 
              src="/fintonico-logo.png" 
              alt="FINTONICO" 
              className="w-6 h-6 flex-shrink-0 object-contain"
            />
            <h1 className="font-bold text-gray-900 dark:text-white text-xl whitespace-nowrap hidden lg:group-hover:block">
              FINTONICO
            </h1>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={(e) => {
                  onTabChange(item.id);
                  e.currentTarget.blur();
                }}
                  className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  activeTab === item.id
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium hidden lg:group-hover:block transition-all duration-300 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle Section */}
        <div className="p-2 border-t border-blue-200 dark:border-gray-700">
          <button
            onClick={onThemeToggle}
            className="w-full flex items-center justify-center lg:group-hover:justify-start gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300"
          >
            {isDark ? (
              <Sun className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium hidden lg:group-hover:block transition-all duration-300 whitespace-nowrap">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          <button
            onClick={onOpenSettings}
            className="mt-2 w-full flex items-center justify-center lg:group-hover:justify-start gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium hidden lg:group-hover:block transition-all duration-300 whitespace-nowrap">
              Settings
            </span>
          </button>
        </div>

        {/* User Section */}
        <div className="p-2 border-t border-blue-200 dark:border-gray-700">
          {user && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 justify-center lg:group-hover:justify-start">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate hidden lg:group-hover:block transition-all duration-300">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center lg:group-hover:justify-start gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium hidden lg:group-hover:block transition-all duration-300 whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-blue-100 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-3">
          <button 
            onClick={onLogoClick}
            className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
          >
            <img 
              src="/fintonico-logo.png" 
              alt="FINTONICO" 
              className="w-6 h-6 flex-shrink-0 object-contain"
            />
            <h1 className="text-base font-bold text-gray-900 dark:text-white">
              FINTONICO
            </h1>
          </button>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={onDateClick}
              className="h-7 px-2 flex items-center bg-blue-200 dark:bg-gray-700 rounded-lg hover:bg-blue-300 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                })}
              </span>
            </button>
            <CurrencySelector />
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <button
            onClick={onMobileMenuToggle}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={onMobileMenuToggle}>
          <div
            className="fixed right-0 top-0 bottom-0 w-64 bg-blue-100 dark:bg-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-20 px-4 pb-6">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        onMobileMenuToggle?.();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[48px] ${
                        activeTab === item.id
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-700'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 border-2 border-transparent'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Theme Toggle */}
              <div className="mt-6 pt-6 border-t border-blue-200 dark:border-gray-700">
                <button
                  onClick={onThemeToggle}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors min-h-[48px]"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-5 h-5" />
                      <span className="font-medium text-sm">Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5" />
                      <span className="font-medium text-sm">Dark Mode</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onOpenSettings?.();
                    onMobileMenuToggle?.();
                  }}
                  className="mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors min-h-[48px]"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium text-sm">Settings</span>
                </button>
              </div>

              {user && (
                <div className="mt-6 pt-6 border-t border-blue-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
