import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Database } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { extractNotionDatabaseId, isValidNotionId } from "../lib/notionUtils";

const NotionDatabaseInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [validationState, setValidationState] = useState({
    isValid: false,
    error: null,
    extractedId: null,
  });

  // Valider l'input avec un délai pour éviter trop de validations
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!inputValue.trim()) {
        setValidationState({
          isValid: false,
          error: null,
          extractedId: null,
        });
        return;
      }

      const result = extractNotionDatabaseId(inputValue);

      if (result.success) {
        setValidationState({
          isValid: true,
          error: null,
          extractedId: result.id,
        });

        // Mettre à jour la valeur parent avec l'ID extrait
        if (onChange && result.id !== value) {
          onChange(result.id);
        }
      } else {
        setValidationState({
          isValid: false,
          error: result.error,
          extractedId: null,
        });
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [inputValue, onChange, value]);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value !== inputValue && value !== validationState.extractedId) {
      setInputValue(value || "");
    }
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  const getInputClassName = () => {
    let baseClass = className;

    if (inputValue.trim()) {
      if (validationState.isValid) {
        baseClass += " border-green-500 focus:border-green-500";
      } else if (validationState.error) {
        baseClass += " border-red-500 focus:border-red-500";
      }
    }

    return baseClass;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          className={getInputClassName()}
        />

        {/* Icône de validation */}
        {inputValue.trim() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validationState.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : validationState.error ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
        )}
      </div>

      {/* Messages d'aide */}
      <div className="text-sm space-y-1">
        {validationState.isValid && validationState.extractedId && (
          <div className="flex items-center gap-2 text-green-600">
            <Database className="h-3 w-3" />
            <span>ID extrait : {validationState.extractedId}</span>
          </div>
        )}

        {validationState.error && (
          <div className="text-red-600">{validationState.error}</div>
        )}

        {!inputValue.trim() && (
          <div className="text-muted-foreground">
            Collez l'URL ou l'ID de la base de données Notion
          </div>
        )}
      </div>
    </div>
  );
};

export default NotionDatabaseInput;
