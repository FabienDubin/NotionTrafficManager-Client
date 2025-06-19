import React, { useState, useEffect } from "react";

// UI Components
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, ExternalLink, Save, X } from "lucide-react";

const TaskSheet = ({ isOpen, onClose, task, users, onTaskUpdate }) => {
  const [formData, setFormData] = useState({
    period: {
      start: "",
      end: "",
    },
    status: "",
    users: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Met à jour le formulaire quand la tâche change
  useEffect(() => {
    if (task) {
      setFormData({
        period: {
          start: task.period?.start
            ? formatDateTimeLocal(task.period.start)
            : "",
          end: task.period?.end ? formatDateTimeLocal(task.period.end) : "",
        },
        status: task.status || "",
        users: task.users || [],
      });
    }
  }, [task]);

  // Formate une date ISO en format datetime-local
  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convertit datetime-local en ISO string
  const formatToISO = (dateTimeLocal) => {
    if (!dateTimeLocal) return null;
    return new Date(dateTimeLocal).toISOString();
  };

  // Gestion des changements de formulaire
  const handlePeriodChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      period: {
        ...prev.period,
        [field]: value,
      },
    }));
  };

  const handleStatusChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      status: value,
    }));
  };

  const handleUserToggle = (userId, checked) => {
    setFormData((prev) => ({
      ...prev,
      users: checked
        ? [...prev.users, userId]
        : prev.users.filter((id) => id !== userId),
    }));
  };

  // Sauvegarde des modifications
  const handleSave = async () => {
    if (!task) return;

    setIsLoading(true);
    try {
      const updates = {};

      // Période de travail
      if (formData.period.start || formData.period.end) {
        updates.period = {
          start: formatToISO(formData.period.start),
          end:
            formatToISO(formData.period.end) ||
            formatToISO(formData.period.start),
        };
      }

      // Statut
      if (formData.status !== task.status) {
        updates.status = formData.status;
      }

      // Utilisateurs
      if (JSON.stringify(formData.users) !== JSON.stringify(task.users)) {
        updates.users = formData.users;
      }

      await onTaskUpdate(task.id, updates);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvre la tâche dans Notion
  const openInNotion = () => {
    if (!task?.url) return;

    // Essaie d'ouvrir l'app native Notion
    const notionAppUrl = `notion://www.notion.so/${task.id}`;
    const notionWebUrl = task.url;

    // Tentative app native, fallback web
    const link = document.createElement("a");
    link.href = notionAppUrl;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Fallback vers le web après un délai
    setTimeout(() => {
      window.open(notionWebUrl, "_blank");
    }, 1000);
  };

  // Statuts disponibles (à adapter selon votre configuration Notion)
  const availableStatuses = [
    "À faire",
    "En cours",
    "En révision",
    "Terminé",
    "En attente",
    "Annulé",
  ];

  if (!task) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span className="truncate">{task.name}</span>
          </SheetTitle>
          <SheetDescription>Modification rapide de la tâche</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Nom de la tâche</Label>
              <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                {task.name}
              </div>
            </div>

            {/* Client et Projet */}
            <div className="grid grid-cols-2 gap-4">
              {task.client && (
                <div>
                  <Label className="text-sm font-medium">Client</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {Array.isArray(task.client)
                        ? task.client[0]
                        : task.client}
                    </Badge>
                  </div>
                </div>
              )}

              {task.projects && task.projects.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Projet</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{task.projects[0]}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Période de travail */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Période de travail</span>
            </Label>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label
                  htmlFor="start-date"
                  className="text-xs text-muted-foreground"
                >
                  Date et heure de début
                </Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={formData.period.start}
                  onChange={(e) => handlePeriodChange("start", e.target.value)}
                />
              </div>

              <div>
                <Label
                  htmlFor="end-date"
                  className="text-xs text-muted-foreground"
                >
                  Date et heure de fin
                </Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={formData.period.end}
                  onChange={(e) => handlePeriodChange("end", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Statut */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Statut</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Utilisateurs assignés */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Utilisateurs assignés</span>
            </Label>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={formData.users.includes(user.id)}
                    onCheckedChange={(checked) =>
                      handleUserToggle(user.id, checked)
                    }
                  />
                  <Label
                    htmlFor={`user-${user.id}`}
                    className="text-sm flex-1 cursor-pointer"
                  >
                    {user.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={openInNotion}
              variant="outline"
              className="w-full"
              disabled={!task.url}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans Notion
            </Button>

            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Sauvegarde..." : "Sauvegarder"}
              </Button>

              <Button onClick={onClose} variant="outline" disabled={isLoading}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskSheet;
