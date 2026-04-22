import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, options, placeholder = 'Select...', value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="block text-xs font-semibold text-[var(--kiri-muted)] uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full flex items-center justify-between gap-2
              bg-[var(--kiri-bg)] border rounded-lg px-3 py-2 text-sm
              text-[var(--kiri-body)]
              focus:outline-none transition-colors
              border-[var(--kiri-border)] focus:border-[var(--kiri-green)]
              ${className}
            `}
          >
            <span className="flex items-center gap-2">
              {selectedOption?.icon}
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown size={14} className={`text-[var(--kiri-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-[var(--kiri-surface)] border border-[var(--kiri-border)] rounded-lg shadow-xl overflow-hidden">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between gap-2 px-3 py-2 text-sm
                    text-left transition-colors
                    ${option.value === value 
                      ? 'bg-[var(--kiri-green)]/15 text-[var(--kiri-green)]' 
                      : 'text-[var(--kiri-body)] hover:bg-[#ffffff08]'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                  {option.value === value && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';