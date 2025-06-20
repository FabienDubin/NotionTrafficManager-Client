import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HexColorPicker } from "react-colorful";
import { Save, Palette } from "lucide-react";

const ConfigurationModal = ({
  open,
  onOpenChange,
  clients,
  clientColors,
  preferences,
  onSavePreferences,
  onSaveClientColors,
}) => {
  const [localClientColors, setLocalClientColors] = useState({});
  const [visibleProperties, setVisibleProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Propriétés disponibles pour l'affichage
  const availableProperties = [
    { id: "name", label: "Nom de la tâche" },
    { id: "client", label: "Client" },
    { id: "status", label: "Statut" },
    { id: "assignee", label: "Assigné à" },
    { id: "project", label: "Projet" },
    { id: "dueDate", label: "Date d'échéance" },
  ];

  // Initialiser les données locales
  useEffect(() => {
    if (open) {
      // Initialiser les couleurs clients
      const colorsMap = {};
      clients.forEach((client) => {
        const existingColor = clientColors.find(
          (cc) => cc.clientName === client.name
        );
        colorsMap[client.name] = existingColor?.color || "#6366f1";
      });
      setLocalClientColors(colorsMap);

      // Initialiser les propriétés visibles
      setVisibleProperties(
        preferences?.visibleProperties || [
          "name",
          "client",
          "status",
          "assignee",
        ]
      );
    }
  }, [open, clients, clientColors, preferences]);

  // Gestionnaire pour les changements de couleur
  const handleColorChange = (clientName, color) => {
    setLocalClientColors((prev) => ({
      ...prev,
      [clientName]: color,
    }));
  };

  // Gestionnaire pour les propriétés visibles
  const handlePropertyToggle = (propertyId, checked) => {
    setVisibleProperties((prev) => {
      if (checked) {
        return [...prev, propertyId];
      } else {
        return prev.filter((id) => id !== propertyId);
      }
    });
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    setLoading(true);
    try {
      // Sauvegarder les couleurs clients
      const clientColorsData = Object.entries(localClientColors).map(
        ([clientName, color]) => ({
          clientId:
            clients.find((c) => c.name === clientName)?.id || clientName,
          clientName,
          color,
        })
      );

      await onSaveClientColors(clientColorsData);

      // Sauvegarder les préférences utilisateur
      await onSavePreferences({
        visibleProperties,
        defaultView: preferences?.defaultView || "timeGridWeek",
        filterPreferences: preferences?.filterPreferences || {},
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving configuration:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Configuration de l'affichage</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Couleurs par client */}
          <div>
            <h3 className="font-medium mb-4">Couleurs par client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client) => (
                <div key={client.id} className="space-y-2">
                  <Label className="text-sm font-medium">{client.name}</Label>
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-200"
                      style={{
                        backgroundColor:
                          localClientColors[client.name] || "#6366f1",
                      }}
                    />
                    <div className="flex-1">
                      <HexColorPicker
                        color={localClientColors[client.name] || "#6366f1"}
                        onChange={(color) =>
                          handleColorChange(client.name, color)
                        }
                        style={{ width: "100%", height: "120px" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Propriétés visibles */}
          <div>
            <h3 className="font-medium mb-4">
              Propriétés visibles dans les tuiles
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {availableProperties.map((property) => (
                <div key={property.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={property.id}
                    checked={visibleProperties.includes(property.id)}
                    onCheckedChange={(checked) =>
                      handlePropertyToggle(property.id, checked)
                    }
                  />
                  <Label
                    htmlFor={property.id}
                    className="text-sm cursor-pointer"
                  >
                    {property.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationModal;
