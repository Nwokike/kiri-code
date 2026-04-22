import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Dialog({ isOpen, onClose, title, description, children, size = 'md' }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div 
        ref={dialogRef}
        className={`relative w-full ${sizeClasses[size]} bg-[var(--kiri-surface)] border border-[var(--kiri-border)] rounded-xl shadow-2xl overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--kiri-border)]">
            <div>
              <h2 id="dialog-title" className="text-base font-bold text-[var(--kiri-heading)] tracking-wide">
                {title}
              </h2>
              {description && (
                <p id="dialog-description" className="text-xs text-[var(--kiri-muted)] mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--kiri-muted)] hover:text-[var(--kiri-body)] hover:bg-[#ffffff08] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

export function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel',
  variant = 'default'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-[var(--kiri-muted)] mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-[var(--kiri-muted)] hover:text-[var(--kiri-body)] transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            variant === 'danger' 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-[var(--kiri-green)] text-white hover:bg-[var(--kiri-green-dark)]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}