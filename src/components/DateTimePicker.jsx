import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";
import { format } from "date-fns";

const DateTimePicker = ({
  date,
  time,
  onDateChange,
  onTimeChange,
  label,
  id,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={id} className="px-1">
        {label}
      </Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={id}
              className="w-32 justify-between font-normal"
            >
              {date ? format(new Date(date), "dd/MM/yyyy") : "Sélectionner"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date ? new Date(date) : undefined}
              captionLayout="dropdown"
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  onDateChange(format(selectedDate, "yyyy-MM-dd"));
                  setOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          step="1"
          value={time || "09:00"}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-24 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
};

export default DateTimePicker;
