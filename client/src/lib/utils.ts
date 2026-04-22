import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleNumericKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    ".",
    "Decimal",
  ];

  const isCtrlOrCmd = e.ctrlKey || e.metaKey;
  const isAllowedKey = allowedKeys.includes(e.key);
  const isNumber = /^[0-9]$/.test(e.key);
  const isShortcut =
    isCtrlOrCmd && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase());

  if (!isNumber && !isAllowedKey && !isShortcut) {
    e.preventDefault();
  }
}

export function safeParseNumber(value: any, fallback = 0) {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Parse a date string (YYYY-MM-DD) as a local date, not UTC
 * This prevents timezone conversion issues where dates shift by one day
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // If the string is in YYYY-MM-DD format, parse it as local date
  const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    // Create date in local timezone (month is 0-indexed in JavaScript Date)
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback to standard Date parsing for other formats
  return new Date(dateString);
}

/**
 * Format a Date object to YYYY-MM-DD string using local date components
 * This ensures the date doesn't shift due to timezone conversion
 * 
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to YYYY-MM-DDTHH:mm string using local date components
 * 
 * @param date - Date object
 * @returns Date-time string in YYYY-MM-DDTHH:mm format
 */
export function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse a datetime-local string (YYYY-MM-DDTHH:mm) as a local Date object
 * 
 * @param dateTimeString - String in YYYY-MM-DDTHH:mm format
 * @returns Date object
 */
export function parseLocalDateTime(dateTimeString: string): Date {
  if (!dateTimeString) return new Date();
  
  const match = dateTimeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hours, minutes] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
  }
  
  return new Date(dateTimeString);
}
