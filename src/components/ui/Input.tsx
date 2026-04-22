import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-[var(--kiri-muted)] uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kiri-muted)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-[var(--kiri-bg)] border rounded-lg px-3 py-2 text-sm
              text-[var(--kiri-body)] placeholder-[var(--kiri-muted)]
              focus:outline-none transition-colors
              ${icon ? 'pl-10' : ''}
              ${error 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-[var(--kiri-border)] focus:border-[var(--kiri-green)]'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-[var(--kiri-muted)] uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full bg-[var(--kiri-bg)] border rounded-lg px-3 py-2 text-sm
            text-[var(--kiri-body)] placeholder-[var(--kiri-muted)]
            focus:outline-none transition-colors resize-none
            ${error 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-[var(--kiri-border)] focus:border-[var(--kiri-green)]'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';