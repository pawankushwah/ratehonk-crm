import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  placeholder?: string;
  error?: string;
  className?: string;
  triggerClassName?: string;
  required?: boolean;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  value,
  onChange,
  onAddNew,
  addNewLabel = 'Add New',
  placeholder = 'Select option',
  error,
  className = '',
  triggerClassName = '',
  required,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // If closed, show selected label. If open, show search term or selected label
  const displayValue = isOpen ? searchTerm : (selectedOption ? selectedOption.label : '');

  const filteredOptions = isFiltering 
    ? (options || []).filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : (options || []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setIsFiltering(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
    setIsFiltering(false);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
      setIsFiltering(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  // Update coordinates whenever the dropdown opens or the window changes
  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const trigger = containerRef.current.querySelector('.select-trigger');
      if (trigger) {
        const updateCoords = () => {
          const rect = trigger.getBoundingClientRect();
          setCoords({
            top: rect.bottom, // Use direct viewport relative for 'fixed'
            left: rect.left,
            width: Math.max(rect.width, 180)
          });
        };
        
        updateCoords();
        window.addEventListener('resize', updateCoords);
        window.addEventListener('scroll', updateCoords, true);
        return () => {
          window.removeEventListener('resize', updateCoords);
          window.removeEventListener('scroll', updateCoords, true);
        };
      }
    }
  }, [isOpen]);

  return (
    <div 
      className={cn("w-full space-y-1.5 relative", className)}
      ref={containerRef}
    >
      {label && (
        <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative group/select">
        <div 
          className={cn(
            "select-trigger w-full h-11 bg-white border border-input-border rounded-xl px-4 flex items-center justify-between transition-all duration-200 hover:border-slate-400 group-focus-within/select:border-primary group-focus-within/select:ring-2 group-focus-within/select:ring-primary/20 shadow-sm dark:bg-slate-950",
            isOpen && 'border-primary ring-2 ring-primary/20 shadow-md',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-text',
            triggerClassName
          )}
          onClick={handleInputClick}
        >
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={displayValue}
            placeholder={placeholder}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsFiltering(true);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              setIsFiltering(false);
            }}
            className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <ChevronDown 
            size={18} 
            className={cn("text-slate-400 shrink-0 transition-transform duration-300", isOpen && 'rotate-180 text-primary')} 
          />
        </div>

        {isOpen && coords.width > 0 && createPortal(
          <div 
            ref={dropdownRef}
            className="fixed rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 origin-top-left"
            style={{ 
              top: `${coords.top + 6}px`, 
              left: `${coords.left}px`, 
              width: `${coords.width}px`,
              zIndex: 9999,
              pointerEvents: 'auto',
              opacity: coords.width > 0 ? 1 : 0,
              visibility: coords.width > 0 ? 'visible' : 'hidden',
            }}
          >
            {/* Add New Button */}
            {onAddNew && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNew();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-b border-slate-100 dark:border-slate-800"
              >
                <Plus size={16} />
                <span className="text-xs font-bold tracking-tight">{addNewLabel}</span>
              </button>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                      value === option.value 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary'
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {value === option.value && <Check size={16} />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-slate-400 text-xs italic">
                  No matches found for "{searchTerm}"
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {error && <p className="text-[11px] font-medium text-red-500 px-1 animate-in fade-in slide-in-from-top-1 duration-200">{error}</p>}
    </div>
  );
};

export default CustomSelect;
