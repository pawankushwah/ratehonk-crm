import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleNumericKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End', '.', 'Decimal'
  ];
  
  const isCtrlOrCmd = e.ctrlKey || e.metaKey;
  const isAllowedKey = allowedKeys.includes(e.key);
  const isNumber = /^[0-9]$/.test(e.key);
  const isShortcut = isCtrlOrCmd && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase());
  
  if (!isNumber && !isAllowedKey && !isShortcut) {
    e.preventDefault();
  }
}
