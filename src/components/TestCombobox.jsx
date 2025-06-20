import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const TestCombobox = ({
  options = [],
  value,
  onValueChange,
  placeholder,
  label,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Normaliser les options
  const normalizedOptions = options.map((option) => ({
    id: option.id || option._id || option.value,
    name: option.name || option.title || option.label || option.toString(),
  }));

  // Filtrer les options selon le terme de recherche
  const filteredOptions = normalizedOptions.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = normalizedOptions.find(
    (option) => option.id === value || option.name === value
  );

  const handleSelect = (option) => {
    onValueChange(option.id || option.name);
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <div>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${label ? "mt-1" : ""}`}
          >
            {selectedOption ? selectedOption.name : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <div className="flex flex-col">
            <div className="p-2 border-b">
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Aucun résultat trouvé.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      value === option.id || value === option.name
                        ? "bg-accent text-accent-foreground"
                        : ""
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id || value === option.name
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TestCombobox;
