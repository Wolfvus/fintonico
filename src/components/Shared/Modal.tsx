import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  children,
  footer,
}) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${sizeClasses[size]} bg-[var(--color-surface-card)] rounded-xl shadow-2xl border border-[color:var(--color-border)] overflow-hidden`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-[var(--color-surface-elevated)] border-[color:var(--color-border)]">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="text-secondary">{icon}</div>
            )}
            <div>
              <h2
                id="modal-title"
                className="text-lg font-semibold text-primary"
              >
                {title}
              </h2>
              {description && (
                <p className="text-xs text-muted">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--color-surface-muted)]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </header>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <footer className="flex flex-wrap justify-end items-center gap-3 px-6 py-4 border-t bg-[var(--color-surface-elevated)] border-[color:var(--color-border)]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

// Common button styles for modal footers
export const modalButtonStyles = {
  primary: 'btn-primary text-sm font-semibold',
  secondary: 'btn-secondary px-3 py-2 text-sm font-medium',
  danger:
    'px-3 py-2 text-sm font-medium rounded-lg transition-colors border border-[color:var(--color-error)] text-[color:var(--color-error)] hover:bg-[var(--color-error-bg)] disabled:opacity-50 disabled:cursor-not-allowed',
};
