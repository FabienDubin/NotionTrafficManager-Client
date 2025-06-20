import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const BasicMultiSelectCombobox = ({
  options = [],
  value = [],
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

  const selectedOptions = normalizedOptions.filter((option) =>
    value.includes(option.id)
  );

  const handleSelect = (option) => {
    const newValue = value.includes(option.id)
      ? value.filter((id) => id !== option.id)
      : [...value, option.id];
    onValueChange(newValue);
  };

  const handleRemove = (optionId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const newValue = value.filter((id) => id !== optionId);
    onValueChange(newValue);
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
        className={`w-full justify-between ${
          label ? "mt-1" : ""
        } min-h-[40px] h-auto`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <Badge
                key={option.id}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {option.name}
                <button
                  type="button"
                  className="h-3 w-3 cursor-pointer hover:bg-gray-300 rounded flex items-center justify-center"
                  onClick={(e) => handleRemove(option.id, e)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
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
                    value.includes(option.id) ? "bg-blue-50 text-blue-900" : ""
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option.id) ? "opacity-100" : "opacity-0"
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

export default BasicMultiSelectCombobox;
