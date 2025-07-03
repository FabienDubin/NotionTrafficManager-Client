import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronDownIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const BasicDateTimePicker = ({
  date,
  time,
  onDateChange,
  onTimeChange,
  label,
  id,
  disabled = false,
  disableTime = false,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    date ? new Date(date) : new Date()
  );
  const containerRef = useRef(null);

  // Mettre à jour la date sélectionnée quand la prop change
  useEffect(() => {
    if (date) {
      setSelectedDate(new Date(date));
    }
  }, [date]);

  // Fermer le dropdown quand on clique dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Générer les options pour le calendrier
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Jours vides au début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateSelect = (day) => {
    if (!day) return;

    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    );
    setSelectedDate(newDate);
    onDateChange(format(newDate, "yyyy-MM-dd"));
    setOpen(false);
  };

  const handleMonthChange = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const handleYearChange = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(selectedDate.getFullYear() + direction);
    setSelectedDate(newDate);
  };

  const days = generateCalendarDays();
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  return (
    <div ref={containerRef} className="flex flex-col gap-3 w-full">
      <Label htmlFor={id} className="px-1">
        {label}
      </Label>
      <div className="flex gap-2 w-full">
        <div className="relative w-full">
          <Button
            variant="outline"
            id={id}
            className={`w-full justify-between font-normal ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => !disabled && setOpen(!open)}
            disabled={disabled}
          >
            {date ? format(new Date(date), "dd/MM/yyyy") : "Sélectionner"}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>

          {open && (
            <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-64">
              {/* En-tête avec navigation mois/année */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => handleYearChange(-1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ‹‹
                </button>
                <button
                  type="button"
                  onClick={() => handleMonthChange(-1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ‹
                </button>
                <div className="text-sm font-medium">
                  {monthNames[selectedDate.getMonth()]}{" "}
                  {selectedDate.getFullYear()}
                </div>
                <button
                  type="button"
                  onClick={() => handleMonthChange(1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => handleYearChange(1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  ››
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-xs text-gray-500 text-center p-1"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Grille des jours */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`
                      p-1 text-sm text-center rounded hover:bg-gray-100
                      ${!day ? "invisible" : ""}
                      ${
                        day &&
                        date &&
                        new Date(date).getDate() === day &&
                        new Date(date).getMonth() === selectedDate.getMonth() &&
                        new Date(date).getFullYear() ===
                          selectedDate.getFullYear()
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : ""
                      }
                    `}
                    onClick={() => handleDateSelect(day)}
                    disabled={!day}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Input
          type="time"
          step="1"
          value={time || "09:00"}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-24 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          disabled={disabled || disableTime}
        />
      </div>
    </div>
  );
};

export default BasicDateTimePicker;
