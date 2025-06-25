import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Building, Save, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import BasicDateTimePicker from "@/components/BasicDateTimePicker";
import BasicCombobox from "@/components/BasicCombobox";
import BasicMultiSelectCombobox from "@/components/BasicMultiSelectCombobox";

const TaskEditSheet = ({
  task,
  users,
  projects,
  statusOptions,
  open,
  onOpenChange,
  onSave,
  onClose,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    status: "",
    assignedUsers: [],
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Filtrer les projets selon le statut
  const filteredProjects =
    projects?.filter(
      (project) => project.status === "En cours" || project.status === "New Biz"
    ) || [];

  // Obtenir le projet sélectionné
  const selectedProject = filteredProjects.find(
    (project) => project.id === formData.projectId
  );

  // Mettre à jour le formulaire quand la tâche change
  useEffect(() => {
    if (task) {
      const startDateTime = task.workPeriod?.start || task.start || "";
      const endDateTime = task.workPeriod?.end || task.end || "";

      // Séparer date et heure
      const startDate = startDateTime ? startDateTime.split("T")[0] : "";
      const startTime = startDateTime
        ? startDateTime.split("T")[1]?.substring(0, 5)
        : "09:00";
      const endDate = endDateTime ? endDateTime.split("T")[0] : "";
      const endTime = endDateTime
        ? endDateTime.split("T")[1]?.substring(0, 5)
        : "18:00";

      setFormData({
        name: task.name || "",
        projectId: task.project?.[0] || "",
        startDate,
        startTime,
        endDate,
        endTime,
        status: task.status || "",
        assignedUsers: task.assignedUsers || [],
        notes: task.commentaire || task.notes || "",
      });
    }
  }, [task]);

  // Réinitialiser l'état du dialog quand la sheet se ferme
  useEffect(() => {
    if (!open) {
      setIsDeleteDialogOpen(false);
      setIsEditingName(false);
      setIsEditingProject(false);
      setLoading(false);
    }
  }, [open]);

  // Calculer la durée initiale en minutes
  const calculateInitialDuration = () => {
    if (!task?.workPeriod?.start || !task?.workPeriod?.end) return null;

    const start = new Date(task.workPeriod.start);
    const end = new Date(task.workPeriod.end);
    return end.getTime() - start.getTime(); // durée en millisecondes
  };

  const initialDuration = calculateInitialDuration();

  // Fonction utilitaire pour créer une date sécurisée
  const createSafeDate = (dateStr, timeStr) => {
    try {
      if (!dateStr) return null;
      const time = timeStr || "09:00";
      const dateTime = `${dateStr}T${time}:00`;
      const date = new Date(dateTime);

      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch (error) {
      console.error("Error creating date:", error);
      return null;
    }
  };

  // Gestionnaire pour les changements de formulaire avec logique de dates
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Si on change la date de début, ajuster la date de fin selon la durée initiale
      if (field === "startDate" && initialDuration && value) {
        const newStartDateTime = createSafeDate(
          value,
          prev.startTime || "09:00"
        );

        if (newStartDateTime) {
          const newEndDateTime = new Date(
            newStartDateTime.getTime() + initialDuration
          );

          if (!isNaN(newEndDateTime.getTime())) {
            newData.endDate = newEndDateTime.toISOString().split("T")[0];
            newData.endTime = newEndDateTime.toTimeString().substring(0, 5);
          }
        }
      }

      // Si on change l'heure de début, ajuster l'heure de fin selon la durée initiale
      if (field === "startTime" && initialDuration && value && prev.startDate) {
        const newStartDateTime = createSafeDate(prev.startDate, value);

        if (newStartDateTime) {
          const newEndDateTime = new Date(
            newStartDateTime.getTime() + initialDuration
          );

          if (!isNaN(newEndDateTime.getTime())) {
            newData.endDate = newEndDateTime.toISOString().split("T")[0];
            newData.endTime = newEndDateTime.toTimeString().substring(0, 5);
          }
        }
      }

      return newData;
    });
  };

  // Fonction de validation des dates
  const validateDates = () => {
    if (!formData.startDate || !formData.endDate) {
      return {
        isValid: false,
        message: "Les dates de début et de fin sont requises.",
      };
    }

    const startDateTime = createSafeDate(
      formData.startDate,
      formData.startTime
    );
    const endDateTime = createSafeDate(formData.endDate, formData.endTime);

    if (!startDateTime || !endDateTime) {
      return { isValid: false, message: "Format de date invalide." };
    }

    if (endDateTime <= startDateTime) {
      return {
        isValid: false,
        message:
          "La date et heure de fin doivent être postérieures à la date et heure de début.",
      };
    }

    return { isValid: true };
  };

  // Gestionnaire pour la sauvegarde avec UX optimisée
  const handleSave = async () => {
    if (!task) return;

    // Validation supplémentaire pour les nouvelles tâches
    if (task.isNew || task.id === "new") {
      if (!formData.name.trim()) {
        toast({
          title: "Erreur de validation",
          description: "Le nom de la tâche est obligatoire.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.projectId) {
        toast({
          title: "Erreur de validation",
          description: "Le projet est obligatoire.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validation des dates avant sauvegarde
    const validation = validateDates();
    if (!validation.isValid) {
      toast({
        title: "Erreur de validation",
        description: validation.message,
        variant: "destructive",
      });
      return; // Garder la sheet ouverte pour permettre la correction
    }

    // Combiner date et heure avec validation et fuseau horaire local
    const createLocalISOString = (dateStr, timeStr) => {
      if (!dateStr) return null;
      const time = timeStr || "09:00";

      // Créer une date locale sans conversion de fuseau horaire
      const localDate = new Date(`${dateStr}T${time}:00`);

      // Ajuster pour le fuseau horaire local pour éviter les décalages
      const timezoneOffset = localDate.getTimezoneOffset() * 60000;
      const localISOTime = new Date(localDate.getTime() - timezoneOffset);

      return localISOTime.toISOString();
    };

    const startDateTime = createLocalISOString(
      formData.startDate,
      formData.startTime
    );
    const endDateTime = createLocalISOString(
      formData.endDate,
      formData.endTime
    );

    const updates = {
      name: formData.name,
      projectId: formData.projectId,
      startDate: startDateTime,
      endDate: endDateTime,
      status: formData.status,
      assignedUsers: formData.assignedUsers,
      notes: formData.notes,
    };

    // Fermer immédiatement la sheet pour une UX fluide
    onClose();

    // Toast de progression
    toast({
      title: "Sauvegarde en cours...",
      description: "Synchronisation avec Notion",
    });

    try {
      // Sauvegarde en arrière-plan avec la nouvelle fonction optimisée
      await onSave(task.id, updates, {
        showProgressToast: false, // Déjà affiché ci-dessus
        showSuccessToast: true,
      });

      // Toast de succès géré par la fonction onSave
    } catch (error) {
      console.error("Error saving task:", error);

      // En cas d'erreur, proposer de réouvrir la sheet
      const isNewTask = task.isNew || task.id === "new";
      toast({
        title: isNewTask ? "Erreur de création" : "Erreur de sauvegarde",
        description: isNewTask
          ? "Une erreur est survenue lors de la création. Voulez-vous réessayer ?"
          : "Une erreur est survenue lors de la sauvegarde. Voulez-vous réessayer ?",
        variant: "destructive",
        action: {
          label: "Réessayer",
          onClick: () => {
            // Réouvrir la sheet avec les données du formulaire
            onOpenChange(true);
          },
        },
      });
    }
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (statusName) => {
    const status = statusOptions.find((s) => s.name === statusName);
    if (!status) return "bg-gray-500";

    // Mapping des couleurs Notion vers les classes Tailwind
    const colorMap = {
      gray: "bg-gray-500",
      brown: "bg-amber-600",
      orange: "bg-orange-500",
      yellow: "bg-yellow-500",
      green: "bg-green-500",
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      pink: "bg-pink-500",
      red: "bg-red-500",
      default: "bg-gray-500",
    };

    return colorMap[status.color] || colorMap.default;
  };

  // Gestionnaire pour la suppression avec UX optimisée
  const handleDelete = async () => {
    if (!task || !onDelete) return;

    // Ne pas permettre la suppression des nouvelles tâches
    if (task.isNew || task.id === "new") {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer une tâche non sauvegardée.",
        variant: "destructive",
      });
      return;
    }

    // Fermer immédiatement la sheet pour une UX fluide
    onClose();

    // Toast de progression
    toast({
      title: "Suppression en cours...",
      description: "Synchronisation avec Notion",
    });

    try {
      // Suppression en arrière-plan avec la fonction optimisée
      await onDelete(task.id, {
        showProgressToast: false, // Déjà affiché ci-dessus
        showSuccessToast: true,
      });

      // Toast de succès géré par la fonction onDelete
    } catch (error) {
      console.error("Error deleting task:", error);

      // En cas d'erreur, proposer de réouvrir la sheet
      toast({
        title: "Erreur de suppression",
        description:
          "Une erreur est survenue lors de la suppression. Voulez-vous réessayer ?",
        variant: "destructive",
        action: {
          label: "Réessayer",
          onClick: () => {
            // Réouvrir la sheet avec les données du formulaire
            onOpenChange(true);
          },
        },
      });
    }
  };

  // Gestionnaire pour fermer la sheet en cliquant dehors
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      // Fermer sans sauvegarder
      onClose();
    }
    onOpenChange(newOpen);
  };
  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: task.clientColor || "#6366f1" }}
            />
            {isEditingName ? (
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingName(false);
                  }
                }}
                className="flex-1"
                autoFocus
                placeholder="Nom de la nouvelle tâche"
              />
            ) : (
              <span
                className="truncate cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                onClick={() => setIsEditingName(true)}
              >
                {formData.name ||
                  (task.isNew || task.id === "new"
                    ? "Nouvelle tâche"
                    : "Nom de la tâche")}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Formulaire d'édition */}
          <div className="space-y-4">
            {/* Projet */}
            <div>
              <Label>Projet</Label>
              {isEditingProject ? (
                <BasicCombobox
                  options={filteredProjects}
                  value={formData.projectId}
                  onValueChange={(value) => {
                    handleInputChange("projectId", value);
                    setIsEditingProject(false);
                  }}
                  placeholder="Sélectionner un projet"
                  label=""
                />
              ) : (
                <div
                  className="flex items-center space-x-2 mt-1 p-2 border rounded-md cursor-pointer hover:bg-gray-100"
                  onClick={() => setIsEditingProject(true)}
                >
                  <span className="font-medium">
                    {selectedProject?.name || "Sélectionner un projet"}
                  </span>
                </div>
              )}
            </div>

            {/* Client - affiché seulement si un projet est sélectionné */}
            {selectedProject && (
              <div>
                <Label>Client</Label>
                <div className="flex items-center space-x-2 mt-1 p-2 border rounded-md bg-gray-50">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {Array.isArray(selectedProject.client)
                      ? selectedProject.client[0]
                      : selectedProject.client || "Non défini"}
                  </span>
                </div>
              </div>
            )}

            {/* Assigné à */}
            <BasicMultiSelectCombobox
              options={users}
              value={formData.assignedUsers}
              onValueChange={(value) =>
                handleInputChange("assignedUsers", value)
              }
              placeholder="Sélectionner des utilisateurs"
              label="Assigné à"
            />

            {/* Dates avec heure - sur deux lignes distinctes (heures disabled) */}
            <div className="space-y-4">
              <BasicDateTimePicker
                date={formData.startDate}
                time={formData.startTime}
                onDateChange={(date) => handleInputChange("startDate", date)}
                onTimeChange={(time) => handleInputChange("startTime", time)}
                label="Date de début"
                id="start-datetime"
                disableTime={true}
              />

              <BasicDateTimePicker
                date={formData.endDate}
                time={formData.endTime}
                onDateChange={(date) => handleInputChange("endDate", date)}
                onTimeChange={(time) => handleInputChange("endTime", time)}
                label="Date de fin"
                id="end-datetime"
                disableTime={true}
              />
            </div>

            {/* Statut */}
            <div>
              <Label>Statut de la tâche</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.id} value={status.name}>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(
                            status.name
                          )}`}
                        />
                        <span>{status.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Ajouter des commentaires..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Créé le:</span>
              <span>
                {task.createdTime
                  ? format(new Date(task.createdTime), "dd MMMM yyyy à HH:mm", {
                      locale: fr,
                    })
                  : "Non défini"}
              </span>
            </div>

            {task.lastEditedTime && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Modifié le:</span>
                <span>
                  {format(
                    new Date(task.lastEditedTime),
                    "dd MMMM yyyy à HH:mm",
                    { locale: fr }
                  )}
                </span>
              </div>
            )}

            {task.billedDays && (
              <div className="flex items-center space-x-2">
                <span>Jours facturés:</span>
                <Badge variant="outline">{task.billedDays}</Badge>
              </div>
            )}

            {task.spentDays && (
              <div className="flex items-center space-x-2">
                <span>Jours passés:</span>
                <Badge variant="outline">{task.spentDays}</Badge>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3 pt-4 border-t">
            {/* Boutons principaux */}
            <div className="flex space-x-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>

              <Button variant="outline" onClick={onClose} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </div>

            {/* Bouton de suppression - seulement pour les tâches existantes */}
            {!task.isNew && task.id !== "new" && onDelete && (
              <div className="flex justify-center pt-2 border-t border-gray-100">
                <AlertDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer la tâche
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Confirmer la suppression
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer cette tâche ?
                        <br />
                        <strong>"{formData.name || task.name}"</strong>
                        <br />
                        <br />
                        Cette action est définitive et supprimera la tâche du
                        calendrier et de la base de données Notion.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setIsDeleteDialogOpen(false);
                          handleDelete();
                        }}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TaskEditSheet;
