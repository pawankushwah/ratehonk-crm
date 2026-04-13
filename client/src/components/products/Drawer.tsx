import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  widthClassName?: string;
  size?: 'default' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '7xl' | 'full' | 'content' | 'none';
}

const Drawer: React.FC<DrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  side = 'right', 
  widthClassName = '',
  size
}) => {
  // If no size is specified but widthClassName is provided, default size to 'none' 
  // to avoid media query conflicts from the default 'sm:max-w-sm'
  const resolvedSize = size || (widthClassName ? 'none' : 'default');

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side={side} 
        size={resolvedSize}
        className={cn(
          "p-0 flex flex-col w-full h-full bg-white opacity-100 border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] z-[100] backdrop-blur-none",
          widthClassName
        )}
      >
        <SheetHeader className="p-6 border-b bg-white opacity-100 sticky top-0 z-10">
          <SheetTitle className="text-xl font-bold text-[#0F172A]">{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-white opacity-100">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Drawer;
