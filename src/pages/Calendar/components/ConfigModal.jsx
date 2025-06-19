import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

// UI Components
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

const ConfigModal = ({
  isOpen,
  onClose,
  clients,
  clientColors,
  userPreferences,
  onClientColorsUpdate,
  onPreferencesUpdate,
}) => {
  const [localClientColors, setLocalClientColors] = useState({});
  const [localPreferences, setLocalPreferences] = useState({
    visibleTaskProperties: {
      showProjects: false,
      showClient: false,
      showEtat: false,
    },
  });
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialise les états locaux quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setLocalClientColors({ ...clientColors });
      setLocalPreferences({ ...userPreferences });
    }
  }, [isOpen, clientColors, userPreferences]);

  // Gestion du changement de couleur
  const handleColorChange = (clientName, color) => {
    setLocalClientColors((prev) => ({
      ...prev,
      [clientName]: color,
    }));
  };

  // Gestion du changement de préférences
  const handlePreferenceChange = (property, checked) => {
    setLocalPreferences((prev) => ({
      ...prev,
      visibleTaskProperties: {
        ...prev.visibleTaskProperties,
        [property]: checked,
      },
    }));
  };

  // Génère une couleur aléatoire
  const generateRandomColor = () => {
    const colors = [
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
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Génère des couleurs aléatoires pour tous les clients
  const generateAllRandomColors = () => {
    const newColors = {};
    clients.forEach((client) => {
      newColors[client.name] = generateRandomColor();
    });
    setLocalClientColors(newColors);
  };

  // Réinitialise les couleurs
  const resetColors = () => {
    setLocalClientColors({ ...clientColors });
  };

  // Réinitialise les préférences
  const resetPreferences = () => {
    setLocalPreferences({ ...userPreferences });
  };

  // Sauvegarde les modifications
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        onClientColorsUpdate(localClientColors),
        onPreferencesUpdate(localPreferences),
      ]);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ferme le color picker
  const closeColorPicker = () => {
    setActiveColorPicker(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Configuration du calendrier</span>
          </DialogTitle>
          <DialogDescription>
            Personnalisez l'affichage et les couleurs du calendrier
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="colors" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colors" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Couleurs</span>
            </TabsTrigger>
            <TabsTrigger
              value="display"
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Affichage</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Couleurs */}
          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Couleurs des clients
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAllRandomColors}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Aléatoire
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetColors}>
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {clients.map((client) => {
                      const currentColor =
                        localClientColors[client.name] || "#3498DB";
                      const isPickerOpen = activeColorPicker === client.name;

                      return (
                        <div key={client.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-6 h-6 rounded border-2 border-gray-200 cursor-pointer"
                                style={{ backgroundColor: currentColor }}
                                onClick={() =>
                                  setActiveColorPicker(
                                    isPickerOpen ? null : client.name
                                  )
                                }
                              />
                              <Label className="font-medium">
                                {client.name}
                              </Label>
                            </div>
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: currentColor + "20",
                                color: currentColor,
                              }}
                            >
                              {currentColor}
                            </Badge>
                          </div>

                          {isPickerOpen && (
                            <div className="relative">
                              <div
                                className="fixed inset-0 z-10"
                                onClick={closeColorPicker}
                              />
                              <div className="absolute z-20 mt-2">
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
          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Propriétés des tâches
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetPreferences}>
                    Réinitialiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Choisissez les propriétés à afficher sur les tuiles de
                    tâches dans le calendrier et la sidebar.
                  </div>

                  <div className="space-y-4">
                    {/* Propriétés toujours visibles */}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Toujours visibles
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2 opacity-50">
                          <Checkbox checked disabled />
                          <Label className="text-sm">Nom de la tâche</Label>
                        </div>
                        <div className="flex items-center space-x-2 opacity-50">
                          <Checkbox checked disabled />
                          <Label className="text-sm">
                            Utilisateurs assignés
                          </Label>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Propriétés optionnelles */}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Propriétés optionnelles
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-projects"
                            checked={
                              localPreferences.visibleTaskProperties
                                .showProjects
                            }
                            onCheckedChange={(checked) =>
                              handlePreferenceChange("showProjects", checked)
                            }
                          />
                          <Label htmlFor="show-projects" className="text-sm">
                            Projets
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-client"
                            checked={
                              localPreferences.visibleTaskProperties.showClient
                            }
                            onCheckedChange={(checked) =>
                              handlePreferenceChange("showClient", checked)
                            }
                          />
                          <Label htmlFor="show-client" className="text-sm">
                            Client
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-etat"
                            checked={
                              localPreferences.visibleTaskProperties.showEtat
                            }
                            onCheckedChange={(checked) =>
                              handlePreferenceChange("showEtat", checked)
                            }
                          />
                          <Label htmlFor="show-etat" className="text-sm">
                            État de la tâche
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigModal;
