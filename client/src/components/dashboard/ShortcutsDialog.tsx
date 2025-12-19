import React from "react";
import { useLocation } from "wouter";

interface ShortcutsDialogProps {
  children: React.ReactNode;
}

export function ShortcutsDialog({ children }: ShortcutsDialogProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation("/shortcuts");
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  );
}
