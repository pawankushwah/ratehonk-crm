import * as React from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface AutocompleteOption {
  value: string;
  label: string;
    email?: string;
  phone?: string;
   country?: string;
  state?: string;
  city?: string;
}

interface AutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  suggestions: AutocompleteOption[];
  value: string;
  onValueChange: (value: string) => void;
  emptyText?: string;
  allowCustomValue?: boolean;
  onSearch?: (searchTerm: string) => void;
}

export function AutocompleteInput({
  suggestions,
  value,
  onValueChange,
  emptyText = "No suggestions found.",
  allowCustomValue = false,
  onSearch,
  className,
  ...props
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const justOpenedRef = React.useRef(false);
  const isUserTypingRef = React.useRef(false); // Track if user is actively typing
  const isSelectingRef = React.useRef(false); // Track if user is selecting an item

  // Handle open state changes
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Mark as just opened to prevent immediate closing
      justOpenedRef.current = true;
      // Reset flag after a delay to allow click events to process
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 300);
    } else {
      justOpenedRef.current = false;
    }
  }, []);

  // Find the selected option's label to display
  const selectedOption = React.useMemo(() => {
    if (!value) return null;
    // Try to find by exact match first
    let found = suggestions.find(s => s.value === value);
    // If not found, try string comparison (in case of type mismatch)
    if (!found) {
      found = suggestions.find(s => String(s.value) === String(value));
    }
    return found;
  }, [suggestions, value]);

  // Display label of selected option, or use input value for searching
  // If popover is open:
  //   - If user is typing (inputValue exists), show input value
  //   - If user cleared input (inputValue empty but was typing), show empty (let them search)
  //   - Otherwise, show selected label if available
  // If closed and option found, show label
  // If closed and option not found:
  //   - If allowCustomValue is true, show the actual value (custom input)
  //   - Otherwise, show empty string (will show placeholder)
  // This prevents showing the raw value (ID) when option is not yet loaded
  const displayValue = open
    ? (inputValue || (isUserTypingRef.current ? "" : selectedOption?.label || ""))
    : (selectedOption?.label || (allowCustomValue && value ? value : ""));

  // Filter suggestions based on current input value
  // If onSearch is provided, don't filter locally (API handles filtering)
  // Otherwise, filter locally as before
  const filteredSuggestions = React.useMemo(() => {
    // If onSearch callback is provided, return all suggestions (API handles filtering)
    if (onSearch) {
      return suggestions;
    }
    
    // Otherwise, filter locally
    if (!inputValue || inputValue.trim() === "") return suggestions;
    
    const query = inputValue.toLowerCase();
    return suggestions.filter((suggestion) => 
      suggestion.label.toLowerCase().includes(query)
    );
  }, [suggestions, inputValue, onSearch]);

  const handleSelectSuggestion = (selectedValue: string) => {
    // Mark that we're selecting to prevent blur from clearing input
    isSelectingRef.current = true;
    onValueChange(selectedValue);
    // Clear input value to reset search, but keep the selected label visible
    setInputValue("");
    isUserTypingRef.current = false; // Reset typing flag when selecting
    setOpen(false);
    // Reset selecting flag after a delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Mark that user is actively typing
    isUserTypingRef.current = true;
    
    // Call onSearch callback if provided (for API-based search)
    if (onSearch) {
      onSearch(newValue);
    }
    
    if (!open) {
      handleOpenChange(true);
    }
    
    // If custom values are allowed, update the parent value immediately
    if (allowCustomValue) {
      onValueChange(newValue);
    }
    
    // Reset typing flag after a delay (user stopped typing)
    setTimeout(() => {
      if (newValue === "") {
        isUserTypingRef.current = false;
      }
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Close popover on Escape
    if (e.key === "Escape") {
      handleOpenChange(false);
    }
    // On Enter, if custom values allowed and there's input, use it
    if (e.key === "Enter" && allowCustomValue && inputValue) {
      onValueChange(inputValue);
      setInputValue("");
      handleOpenChange(false);
      e.preventDefault();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Clear input value to allow new search
    setInputValue("");
    // Don't mark as typing yet - wait for user to actually type
    isUserTypingRef.current = false;
    if (suggestions.length > 0) {
      // Mark as just opened before opening
      justOpenedRef.current = true;
      handleOpenChange(true);
      // Reset flag after delay
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 300);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // Prevent the PopoverTrigger from toggling
    e.stopPropagation();
    e.preventDefault();
    // Only clear input value if user is starting a new search
    // Don't clear if there's already a selected value - let them see it first
    if (!value || !selectedOption) {
      setInputValue("");
    }
    if (suggestions.length > 0) {
      // Mark as just opened before opening
      justOpenedRef.current = true;
      handleOpenChange(true);
      // Reset flag after delay
      setTimeout(() => {
        justOpenedRef.current = false;
      }, 300);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              {...props}
              ref={inputRef}
              value={displayValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onClick={handleClick}
              onMouseDown={(e) => {
                // Prevent PopoverTrigger from toggling when clicking input
                e.stopPropagation();
              }}
              onBlur={(e) => {
                // Check if the blur is caused by clicking on a dropdown item
                const relatedTarget = e.relatedTarget as HTMLElement;
                const isClickingOnItem = relatedTarget?.closest('[role="option"]') || 
                                        relatedTarget?.closest('[cmdk-item]') ||
                                        relatedTarget?.closest('[data-radix-popper-content-wrapper]');
                
                // Delay blur handling to allow click events to process first
                setTimeout(() => {
                  // Don't clear if user is selecting an item or clicking on dropdown
                  if (isSelectingRef.current || isClickingOnItem) {
                    return;
                  }
                  // If custom values are allowed and there's input, save it before clearing
                  if (allowCustomValue && inputValue) {
                    onValueChange(inputValue);
                  }
                  // Only clear inputValue if popover is closed (user clicked outside)
                  // If popover is still open, user might be clicking on an item
                  if (!open) {
                    setInputValue("");
                    isUserTypingRef.current = false;
                  }
                }, 250);
              }}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 pl-9 pr-3 py-2 text-sm transition-all",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
              )}
              autoComplete="off"
            />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Prevent closing when clicking on the input field or its container, or if just opened, or if selecting
          if (justOpenedRef.current || isSelectingRef.current) {
            e.preventDefault();
            return;
          }
          const target = e.target as HTMLElement;
          const container = inputRef.current?.closest('.relative');
          // Check if clicking on CommandItem or within PopoverContent
          const isClickingOnItem = target.closest('[role="option"]') || target.closest('[cmdk-item]') || target.closest('[data-radix-popper-content-wrapper]');
          if (isClickingOnItem) {
            e.preventDefault();
            return;
          }
          if (inputRef.current && (
            inputRef.current.contains(target) || 
            target === inputRef.current ||
            (container && container.contains(target))
          )) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on the input field or its container, or if just opened, or if selecting
          if (justOpenedRef.current || isSelectingRef.current) {
            e.preventDefault();
            return;
          }
          const target = e.target as HTMLElement;
          const container = inputRef.current?.closest('.relative');
          // Check if clicking on CommandItem or within PopoverContent
          const isClickingOnItem = target.closest('[role="option"]') || target.closest('[cmdk-item]') || target.closest('[data-radix-popper-content-wrapper]');
          if (isClickingOnItem) {
            e.preventDefault();
            return;
          }
          if (inputRef.current && (
            inputRef.current.contains(target) || 
            target === inputRef.current ||
            (container && container.contains(target))
          )) {
            e.preventDefault();
          }
        }}
      >
        <Command shouldFilter={false} className="bg-transparent">
          <CommandList className="max-h-[300px]">
            {filteredSuggestions.length === 0 && inputValue && (
              <CommandEmpty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyText}
              </CommandEmpty>
            )}
            {filteredSuggestions.length > 0 && (
              <CommandGroup className="p-2">
                {filteredSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.value}
                    value={suggestion.value}
                    onSelect={() => handleSelectSuggestion(suggestion.value)}
                    onMouseDown={() => {
                      // Set selecting flag before blur event fires
                      // This prevents the blur handler from clearing the input
                      isSelectingRef.current = true;
                    }}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-2.5 text-sm",
                      "hover:bg-cyan-50 dark:hover:bg-cyan-950/30",
                      "aria-selected:bg-cyan-100 dark:aria-selected:bg-cyan-900/40",
                      value === suggestion.value && "bg-cyan-50 dark:bg-cyan-950/30"
                    )}
                  >
                    <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                      {suggestion.label}
                    </span>
                    {value === suggestion.value && (
                      <Check className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
