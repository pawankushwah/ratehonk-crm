import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function SlidePanel({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-2xl",
}: SlidePanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full bg-white dark:bg-gray-900 z-50",
          "transform transition-transform duration-300 ease-in-out",
          "w-full",
          width,
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-white/60 dark:hover:bg-gray-700"
            data-testid="button-close-slide-panel"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-64px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
}
