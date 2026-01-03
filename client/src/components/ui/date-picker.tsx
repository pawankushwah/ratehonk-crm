import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date",
  className 
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(
    value ? new Date(value) : new Date()
  )

  React.useEffect(() => {
    if (value) {
      const newDate = new Date(value)
      setDate(newDate)
      setMonth(newDate) // Set the calendar month to the selected date's month
    } else {
      setMonth(new Date()) // Default to current month if no date selected
    }
  }, [value])

  // Update month when popover opens to show the selected date's month
  React.useEffect(() => {
    if (open && date) {
      setMonth(date)
    } else if (open && !date) {
      setMonth(new Date())
    }
  }, [open, date])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setMonth(selectedDate) // Update month to the selected date
      if (onChange) {
        onChange(format(selectedDate, "yyyy-MM-dd"))
      }
    }
    // Auto-close the popover after date selection
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-10 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all focus:ring-2 focus:ring-cyan-500 focus:border-transparent",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
          {date ? <span className="text-sm">{format(date, "PPP")}</span> : <span className="text-sm">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
