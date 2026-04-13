import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn'; // Assuming this exists or I'll create it

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default';
  icon?: LucideIcon;
  loading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', loading = false, leftIcon: LeftIcon, rightIcon: RightIcon, icon: Icon, children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';
    
    const variants = {
      primary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-md hover:shadow-lg shadow-blue-500/20',
      secondary: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50',
      ghost: 'hover:bg-slate-100 hover:text-slate-900 text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-50',
      destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20',
      link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      default: 'h-11 px-6 py-2',
      sm: 'h-9 px-4 text-xs',
      md: 'h-11 px-6',
      lg: 'h-12 px-8 text-lg',
      icon: 'h-10 w-10 p-0',
    };

    const EffectiveIcon = Icon || LeftIcon;

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          EffectiveIcon && <EffectiveIcon className={cn("h-4 w-4", children ? "mr-2" : "")} />
        )}
        {children}
        {!loading && RightIcon && <RightIcon className="ml-2 h-4 w-4" />}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
