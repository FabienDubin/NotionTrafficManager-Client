import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Palette, Eye, Save, RotateCcw } from "lucide-react";

const ConfigurationModal = ({
  open,
  onOpenChange,
  clients,
  clientColors,
  preferences,
  onSavePreferences,
  onSaveClientColors,
  onClose,
}) => {
  const [localClientColors, setLocalClientColors] = useState({});
  const [visibleProperties, setVisibleProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState(null);

  const availableProperties = [
    { id: "client", label: "Client" },
    { id: "status", label: "Statut" },
    { id: "assignee", label: "Assigné à" },
    { id: "project", label: "Projet" },
    { id: "dueDate", label: "Date d'échéance" },
  ];

  useEffect(() => {
    if (open) {
      const colorsMap = {};
      clients.forEach((client) => {
        const existingColor = clientColors.find(
          (cc) => cc.clientName === client.name
        );
        colorsMap[client.name] = existingColor?.color || "#6366f1";
      });
      setLocalClientColors(colorsMap);
      setVisibleProperties(preferences?.visibleProperties || []);
    }
  }, [open, clients, clientColors, preferences]);

  const handleColorChange = (clientName, color) => {
    setLocalClientColors((prev) => ({
      ...prev,
      [clientName]: color,
    }));
  };

  const handlePropertyToggle = (propertyId, checked) => {
    setVisibleProperties((prev) =>
      checked ? [...prev, propertyId] : prev.filter((id) => id !== propertyId)
    );
  };

  const generateRandomColor = () => {
    const palette = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#F39C12",
      "#E74C3C",
      "#9B59B6",
      "#3498DB",
      "#2ECC71",
      "#F1C40F",
      "#E67E22",
      "#1ABC9C",
      "#34495E",
      "#FF7675",
      "#74B9FF",
      "#00B894",
      "#FDCB6E",
      "#6C5CE7",
    ];
    return palette[Math.floor(Math.random() * palette.length)];
  };

  const generateAllRandomColors = () => {
    const newColors = {};
    clients.forEach((client) => {
      newColors[client.name] = generateRandomColor();
    });
    setLocalClientColors(newColors);
  };

  const resetColors = () => {
    const reset = {};
    clients.forEach((client) => {
      const existingColor = clientColors.find(
        (cc) => cc.clientName === client.name
      );
      reset[client.name] = existingColor?.color || "#6366f1";
    });
    setLocalClientColors(reset);
  };

  const resetPreferences = () => {
    setVisibleProperties(preferences?.visibleProperties || []);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const clientColorsData = Object.entries(localClientColors).map(
        ([clientName, color]) => ({
          clientId:
            clients.find((c) => c.name === clientName)?.id || clientName,
          clientName,
          color,
        })
      );
      await onSaveClientColors(clientColorsData);

      await onSavePreferences({
        visibleProperties,
        defaultView: preferences?.defaultView || "timeGridWeek",
        filterPreferences: preferences?.filterPreferences || {},
      });

      onOpenChange(false);
      // Déclencher le rechargement du calendrier après fermeture
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Erreur de sauvegarde :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Déclencher le rechargement du calendrier même en cas d'annulation
    // pour s'assurer que les données sont à jour
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Configuration du calendrier</span>
          </DialogTitle>
          <DialogDescription>
            Personnalisez les couleurs et les champs visibles
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="colors">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colors">
              <Palette className="h-4 w-4 mr-1" /> Couleurs
            </TabsTrigger>
            <TabsTrigger value="display">
              <Eye className="h-4 w-4 mr-1" /> Affichage
            </TabsTrigger>
          </TabsList>

          {/* Onglet Couleurs */}
          <TabsContent value="colors" className="mt-4">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Couleurs des clients</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateAllRandomColors}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" /> Aléatoire
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetColors}>
                    Réinitialiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 pr-2">
                  <div className="space-y-4">
                    {clients.map((client) => {
                      const currentColor =
                        localClientColors[client.name] || "#6366f1";
                      const isPickerOpen = activeColorPicker === client.name;
                      return (
                        <div key={client.id}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-6 h-6 rounded border cursor-pointer"
                                style={{ backgroundColor: currentColor }}
                                onClick={() =>
                                  setActiveColorPicker((prev) =>
                                    prev === client.name ? null : client.name
                                  )
                                }
                              />
                              <Label>{client.name}</Label>
                            </div>
                            <Badge
                              style={{
                                backgroundColor: currentColor + "20",
                                color: currentColor,
                              }}
                              variant="secondary"
                            >
                              {currentColor}
                            </Badge>
                          </div>
                          {isPickerOpen && (
                            <div className="relative z-20 mt-2">
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveColorPicker(null)}
                              />
                              <div className="absolute z-20">
                                <HexColorPicker
                                  color={currentColor}
                                  onChange={(color) =>
                                    handleColorChange(client.name, color)
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Affichage */}
          <TabsContent value="display" className="mt-4">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Propriétés affichées</CardTitle>
                <Button variant="ghost" size="sm" onClick={resetPreferences}>
                  Réinitialiser
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  Choisissez les champs visibles sur les tuiles de tâches.
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 opacity-50">
                    <Checkbox checked disabled />
                    <Label className="text-sm">Nom de la tâche</Label>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <Checkbox checked disabled />
                    <Label className="text-sm">Utilisateurs assignés</Label>
                  </div>
                  <Separator className="my-2" />
                  {availableProperties.map((property) => (
                    <div key={property.id} className="flex items-center gap-2">
                      <Checkbox
                        id={property.id}
                        checked={visibleProperties.includes(property.id)}
                        onCheckedChange={(checked) =>
                          handlePropertyToggle(property.id, checked)
                        }
                      />
                      <Label htmlFor={property.id} className="text-sm">
                        {property.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
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
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationModal;
