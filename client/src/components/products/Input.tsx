import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelRight?: React.ReactNode;
  icon?: LucideIcon;
  error?: string;
  rightElement?: React.ReactNode;
  wrapperClassName?: string;
  inputClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelRight, icon: Icon, error, rightElement, className, wrapperClassName, inputClassName, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={cn("w-full space-y-1.5", wrapperClassName)}>
        {(label || labelRight) && (
          <div className="flex items-center justify-between px-0.5">
            {label && (
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">
                {label}
              </label>
            )}
            {labelRight && (
              <div className="text-xs font-medium text-primary">
                {labelRight}
              </div>
            )}
          </div>
        )}
        
        <div className={cn("relative group transition-all duration-200", className)}>
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
              <Icon size={18} />
            </div>
          )}
          
          <input
            type={inputType}
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-xl border border-input-border bg-white px-4 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-500 shadow-sm hover:border-slate-400 dark:hover:border-slate-600",
              Icon && "pl-11",
              (isPassword || rightElement) && "pr-11",
              error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
              inputClassName
            )}
            {...props}
          />
          
          {(rightElement || isPassword) && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
              {isPassword ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              ) : (
                rightElement
              )}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-[11px] font-medium text-red-500 px-1 animate-in fade-in slide-in-from-top-1 duration-200">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
