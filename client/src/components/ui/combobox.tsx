import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedOption = options.find((option) => option.value === value);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    
    const query = searchQuery.toLowerCase();
    return options.filter((option) => 
      option.label.toLowerCase().includes(query) || 
      option.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm transition-all",
            "hover:bg-gray-50 dark:hover:bg-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-gray-500 dark:text-gray-400",
            value && "text-gray-900 dark:text-gray-100",
            className
          )}
        >
          <span className="flex items-center gap-2 flex-1 text-left truncate">
            {selectedOption?.icon}
            {selectedOption?.label || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} className="bg-transparent">
          <div className="border-b border-gray-200 dark:border-gray-700 px-3 py-2">
            <CommandInput 
              placeholder={searchPlaceholder} 
              className="h-8 border-0 bg-transparent focus:ring-0 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <CommandList className="max-h-[300px] p-2">
            {filteredOptions.length === 0 && (
              <CommandEmpty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyText}
              </CommandEmpty>
            )}
            {filteredOptions.length > 0 && (
              <CommandGroup className="p-0">
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-2.5 text-sm",
                      "hover:bg-cyan-50 dark:hover:bg-cyan-950/30",
                      "aria-selected:bg-cyan-100 dark:aria-selected:bg-cyan-900/40",
                      value === option.value && "bg-cyan-50 dark:bg-cyan-950/30"
                    )}
                  >
                    <span className="flex items-center gap-2 flex-1 font-medium text-gray-900 dark:text-gray-100">
                      {option.icon}
                      {option.label}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-cyan-600 dark:text-cyan-400",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
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
