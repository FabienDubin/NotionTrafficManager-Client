import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const BasicCombobox = ({
  options = [],
  value,
  onValueChange,
  placeholder,
  label,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

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

  return (
    <div ref={containerRef} className="relative">
      {label && <Label>{label}</Label>}
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={`w-full justify-between ${label ? "mt-1" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {selectedOption ? selectedOption.name : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b">
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-gray-500">
                Aucun résultat trouvé.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100",
                    value === option.id || value === option.name
                      ? "bg-blue-50 text-blue-900"
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
      )}
    </div>
  );
};

export default BasicCombobox;
