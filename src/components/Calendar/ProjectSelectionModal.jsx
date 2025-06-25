import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";

const ProjectSelectionModal = ({
  open,
  onOpenChange,
  projects,
  onProjectSelect,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sélection de projet</DialogTitle>
          <DialogDescription>
            Plusieurs projets sont sélectionnés dans les filtres. Choisissez le
            projet pour cette nouvelle tâche.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {projects.map((project) => (
            <Button
              key={project.id}
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => onProjectSelect(project)}
            >
              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium">{project.name}</div>
                  {project.client && (
                    <div className="text-sm text-muted-foreground">
                      Client:{" "}
                      {Array.isArray(project.client)
                        ? project.client[0]
                        : project.client}
                    </div>
                  )}
                  {project.status && (
                    <div className="text-xs text-muted-foreground">
                      Statut: {project.status}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSelectionModal;
