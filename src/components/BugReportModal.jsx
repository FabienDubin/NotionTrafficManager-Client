import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Bug, Upload, X, AlertTriangle, Image, Trash2 } from "lucide-react";

// Components UI
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Services
import bugReportService from "@/services/bugReport.service";

const BugReportModal = ({ trigger, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    screenshots: [],
  });
  const [errors, setErrors] = useState({});
  // Configuration du drag & drop
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      // Gestion des fichiers rejetés
      if (rejectedFiles.length > 0) {
        const rejectedReasons = rejectedFiles.map((file) => {
          const errors = file.errors.map((error) => {
            switch (error.code) {
              case "file-too-large":
                return "Fichier trop volumineux (max 10MB)";
              case "file-invalid-type":
                return "Type de fichier non supporté";
              default:
                return error.message;
            }
          });
          return `${file.file.name}: ${errors.join(", ")}`;
        });

        toast("Fichiers rejetés", {
          description: rejectedReasons.join("\n"),
          variant: "error",
        });
      }

      // Ajout des fichiers acceptés
      if (acceptedFiles.length > 0) {
        setFormData((prev) => {
          const newScreenshots = [...prev.screenshots, ...acceptedFiles];
          // Limiter à 5 screenshots maximum
          if (newScreenshots.length > 5) {
            toast("Limite atteinte", {
              description: "Maximum 5 screenshots autorisés",
              variant: "error",
            });
            return { ...prev, screenshots: newScreenshots.slice(0, 5) };
          }
          return { ...prev, screenshots: newScreenshots };
        });
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  // Suppression d'un screenshot
  const removeScreenshot = (index) => {
    setFormData((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    } else if (formData.title.length > 200) {
      newErrors.title = "Le titre ne peut pas dépasser 200 caractères";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    } else if (formData.description.length > 2000) {
      newErrors.description =
        "La description ne peut pas dépasser 2000 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await bugReportService.createBugReport({
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        screenshots: formData.screenshots,
        currentUrl: window.location.href,
        userAgent: navigator.userAgent,
      });

      toast("Bug signalé avec succès", {
        description:
          "Votre rapport de bug a été envoyé. Merci pour votre contribution !",
        variant: "success",
      });

      // Reset du formulaire
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        screenshots: [],
      });
      setErrors({});
      setIsOpen(false);

      // Callback de succès
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du bug report:", error);
      toast("Erreur", {
        description: error.message || "Impossible d'envoyer le rapport de bug",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion des changements de formulaire
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Supprimer l'erreur si le champ devient valide
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Bug className="w-4 h-4 mr-2" />
            Signaler un bug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            Signaler un bug
          </DialogTitle>
          <DialogDescription>
            Décrivez le problème rencontré et ajoutez des captures d'écran si
            nécessaire. Votre rapport nous aidera à améliorer l'application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre du bug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Résumé court du problème..."
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={errors.title ? "border-red-500" : ""}
              maxLength={200}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.title.length}/200 caractères
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description détaillée <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème en détail : que s'est-il passé ? Comment reproduire le bug ? Quel était le comportement attendu ?"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`min-h-[120px] ${
                errors.description ? "border-red-500" : ""
              }`}
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.description.length}/2000 caractères
            </p>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Faible
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Moyenne
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Élevée
                  </div>
                </SelectItem>
                <SelectItem value="critical">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Critique
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zone de drag & drop pour screenshots */}
          <div className="space-y-2">
            <Label>Screenshots (optionnel)</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              {isDragActive ? (
                <p className="text-blue-600">Déposez les fichiers ici...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-1">
                    Glissez-déposez vos captures d'écran ici
                  </p>
                  <p className="text-sm text-gray-500">
                    ou cliquez pour sélectionner (max 5 fichiers, 10MB chacun)
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Formats supportés: JPG, PNG, WebP
                  </p>
                </div>
              )}
            </div>

            {/* Aperçu des screenshots */}
            {formData.screenshots.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {formData.screenshots.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeScreenshot(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 right-1">
                      <Badge variant="secondary" className="text-xs truncate">
                        <Image className="w-3 h-3 mr-1" />
                        {file.name}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informations automatiques */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Informations techniques (ajoutées automatiquement)
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>URL:</strong> {window.location.href}
              </p>
              <p>
                <strong>Navigateur:</strong>{" "}
                {navigator.userAgent.split(" ").slice(0, 3).join(" ")}...
              </p>
              <p>
                <strong>Date:</strong> {new Date().toLocaleString("fr-FR")}
              </p>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4 mr-2" />
                  Signaler le bug
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BugReportModal;
