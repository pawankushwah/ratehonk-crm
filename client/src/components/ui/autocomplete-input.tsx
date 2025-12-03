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
}

export function AutocompleteInput({
  suggestions,
  value,
  onValueChange,
  emptyText = "No suggestions found.",
  allowCustomValue = false,
  className,
  ...props
}: AutocompleteInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const justOpenedRef = React.useRef(false);

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
  // If popover is open, show input value for searching
  // If closed and option found, show label
  // If closed and option not found:
  //   - If allowCustomValue is true, show the actual value (custom input)
  //   - Otherwise, show empty string (will show placeholder)
  // This prevents showing the raw value (ID) when option is not yet loaded
  const displayValue = open 
    ? inputValue 
    : (selectedOption?.label || (allowCustomValue && value ? value : ""));

  // Filter suggestions based on current input value
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue || inputValue.trim() === "") return suggestions;
    
    const query = inputValue.toLowerCase();
    return suggestions.filter((suggestion) => 
      suggestion.label.toLowerCase().includes(query)
    );
  }, [suggestions, inputValue]);

  const handleSelectSuggestion = (selectedValue: string) => {
    onValueChange(selectedValue);
    setInputValue("");
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (!open) {
      handleOpenChange(true);
    }
    
    // If custom values are allowed, update the parent value immediately
    if (allowCustomValue) {
      onValueChange(newValue);
    }
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
    setInputValue("");
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
    setInputValue("");
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
              onBlur={() => {
                // Delay blur handling to allow click events to process first
                setTimeout(() => {
                  // If custom values are allowed and there's input, save it before clearing
                  if (allowCustomValue && inputValue) {
                    onValueChange(inputValue);
                  }
                  setInputValue("");
                }, 200);
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
          // Prevent closing when clicking on the input field or its container, or if just opened
          if (justOpenedRef.current) {
            e.preventDefault();
            return;
          }
          const target = e.target as HTMLElement;
          const container = inputRef.current?.closest('.relative');
          if (inputRef.current && (
            inputRef.current.contains(target) || 
            target === inputRef.current ||
            (container && container.contains(target))
          )) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on the input field or its container, or if just opened
          if (justOpenedRef.current) {
            e.preventDefault();
            return;
          }
          const target = e.target as HTMLElement;
          const container = inputRef.current?.closest('.relative');
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
