import React, { forwardRef, useRef, useEffect } from 'react';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className = '', orientation = 'vertical' }, _ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const element = scrollRef.current;
      if (!element) return;

      const handleWheel = (e: WheelEvent) => {
        if (orientation === 'vertical') {
          if (e.deltaY !== 0) {
            e.preventDefault();
            element.scrollTop += e.deltaY;
          }
        } else if (orientation === 'horizontal') {
          if (e.deltaX !== 0) {
            e.preventDefault();
            element.scrollLeft += e.deltaX;
          }
        }
      };

      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => element.removeEventListener('wheel', handleWheel);
    }, [orientation]);

    return (
      <div
        ref={scrollRef}
        className={`overflow-auto custom-scrollbar ${className}`}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`bg-[var(--kiri-surface)] border border-[var(--kiri-border)] rounded-lg ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-[var(--kiri-surface)] text-[var(--kiri-muted)]',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/20',
    info: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-white/20 border-t-white rounded-full animate-spin ${className}`} />
  );
}

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`} 
      />
    );
  }

  return (
    <div className={`rounded-full bg-[var(--kiri-surface)] border border-[var(--kiri-border)] flex items-center justify-center font-medium text-[var(--kiri-muted)] ${sizeClasses[size]} ${className}`}>
      {fallback?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className = '' }: DividerProps) {
  if (label) {
    return (
      <div className={`flex items-center gap-3 text-xs text-[var(--kiri-muted)] ${className}`}>
        <div className="flex-1 h-px bg-[var(--kiri-border)]" />
        {label}
        <div className="flex-1 h-px bg-[var(--kiri-border)]" />
      </div>
    );
  }

  return <div className={`h-px bg-[var(--kiri-border)] ${className}`} />;
}