import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string }[];
  error?: string;
  placeholder?: string;
  selectClassName?: string;
}

const Select = ({ label, options, error, placeholder, className = '', selectClassName = '', ...props }: SelectProps) => {
  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label && (
        <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-tighter px-0.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        <select
          className={cn(
            "flex h-11 w-full rounded-xl border border-input-border bg-white px-4 py-2 text-sm ring-offset-white appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 dark:bg-slate-950 dark:ring-offset-slate-950 shadow-sm hover:border-slate-400 dark:hover:border-slate-600",
            error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
            selectClassName
          )}
          {...props}
        >
          <option value="" disabled className="bg-white dark:bg-slate-900">{placeholder || 'Select option'}</option>
          {options?.map((option) => (
            <option 
              key={option.value} 
              value={option.value} 
              className="bg-white dark:bg-slate-900 py-2"
            >
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
          <ChevronDown size={18} />
        </div>
      </div>
      
      {error && (
        <p className="text-[11px] font-medium text-red-500 px-1 animate-in fade-in slide-in-from-top-1 duration-200">{error}</p>
      )}
    </div>
  );
};

export default Select;
