import React, { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DateSelectorProps {
  checkIn: Date | undefined
  checkOut: Date | undefined
  onDateChange: (checkIn: Date, checkOut: Date) => void
  minDate?: Date
  maxDate?: Date
  className?: string
}

const DateSelector: React.FC<DateSelectorProps> = ({
  checkIn,
  checkOut,
  onDateChange,
  minDate = startOfDay(new Date()),
  maxDate = addDays(new Date(), 365),
  className
}) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: checkIn,
    to: checkOut,
  })

  const handleSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate)

    if (selectedDate?.from && selectedDate?.to) {
      onDateChange(selectedDate.from, selectedDate.to)
    } else if (selectedDate?.from && !selectedDate?.to) {
      // Auto-select next day if only check-in is selected
      const nextDay = addDays(selectedDate.from, 1)
      const autoCheckOut = isAfter(nextDay, maxDate) ? maxDate : nextDay
      setDate({ from: selectedDate.from, to: autoCheckOut })
      onDateChange(selectedDate.from, autoCheckOut)
    }
  }

  const isDateDisabled = (date: Date) => {
    return isBefore(date, minDate) || isAfter(date, maxDate)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Select Dates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick check-in and check-out dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleSelect}
                numberOfMonths={2}
                disabled={isDateDisabled}
              />
            </PopoverContent>
          </Popover>

          {/* Quick Date Options */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = startOfDay(new Date())
                const tomorrow = addDays(today, 1)
                setDate({ from: today, to: tomorrow })
                onDateChange(today, tomorrow)
              }}
            >
              Tonight
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = startOfDay(new Date())
                const dayAfterTomorrow = addDays(today, 2)
                setDate({ from: today, to: dayAfterTomorrow })
                onDateChange(today, dayAfterTomorrow)
              }}
            >
              2 Nights
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextWeekend = addDays(startOfDay(new Date()), 5) // Friday
                const endWeekend = addDays(nextWeekend, 2) // Sunday
                setDate({ from: nextWeekend, to: endWeekend })
                onDateChange(nextWeekend, endWeekend)
              }}
            >
              Weekend
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = startOfDay(new Date())
                const oneWeek = addDays(today, 7)
                setDate({ from: today, to: oneWeek })
                onDateChange(today, oneWeek)
              }}
            >
              1 Week
            </Button>
          </div>

          {/* Date Summary */}
          {date?.from && date?.to && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-900">
                Your stay: {format(date.from, 'EEEE, MMMM dd')} - {format(date.to, 'EEEE, MMMM dd')}
              </div>
              <div className="text-sm text-blue-700">
                {Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))} night(s)
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default DateSelector