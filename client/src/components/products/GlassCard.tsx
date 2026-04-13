import React from 'react';
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', hoverable = false }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "bg-white border border-slate-200 shadow-sm rounded-3xl",
          hoverable && "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

export default GlassCard;
