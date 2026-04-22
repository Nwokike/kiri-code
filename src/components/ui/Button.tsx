import React, { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--kiri-bg)] disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      default: 'bg-[var(--kiri-surface)] border border-[var(--kiri-border)] text-[var(--kiri-body)] hover:bg-[var(--kiri-surface-raised)] hover:border-[var(--kiri-muted)] focus:ring-[var(--kiri-green)]',
      primary: 'bg-[var(--kiri-green)] text-white hover:bg-[var(--kiri-green-dark)] focus:ring-[var(--kiri-green)] shadow-lg shadow-green-900/20',
      secondary: 'bg-[var(--kiri-surface-subtle)] border border-[var(--kiri-border)] text-[var(--kiri-muted)] hover:text-[var(--kiri-body)] focus:ring-[var(--kiri-green)]',
      ghost: 'text-[var(--kiri-muted)] hover:text-[var(--kiri-body)] hover:bg-[#ffffff08] focus:ring-[var(--kiri-green)]',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs gap-1.5',
      md: 'px-3 py-2 text-sm gap-2',
      lg: 'px-4 py-2.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';