import React, { useState, useMemo } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Filter, GripVertical, Search } from "lucide-react";
import BasicMultiSelectCombobox from "@/components/BasicMultiSelectCombobox";

const CalendarSidebar = ({
  unassignedTasks,
  users,
  clients,
  projects,
  filters,
  onFiltersChange,
  onConfigClick,
  loading,
}) => {
  // État local pour la recherche dans les tâches non assignées
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrer les tâches non assignées selon la recherche
  const filteredUnassignedTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return unassignedTasks;
    }

    const query = searchQuery.toLowerCase().trim();

    return unassignedTasks.filter((task) => {
      // Recherche dans le nom de la tâche
      const taskName = task.name?.toLowerCase() || "";
      if (taskName.includes(query)) return true;

      // Recherche dans le nom du projet
      const projectName = task.projectName?.toLowerCase() || "";
      if (projectName.includes(query)) return true;

      // Recherche dans le nom du client
      const clientName = Array.isArray(task.client)
        ? task.client[0]?.toLowerCase() || ""
        : task.client?.toLowerCase() || "";
      if (clientName.includes(query)) return true;

      return false;
    });
  }, [unassignedTasks, searchQuery]);

  // Filtrer les projets selon le statut (même logique que TaskEditSheet)
  const filteredProjects = useMemo(() => {
    return (
      projects?.filter(
        (project) =>
          project.status === "En cours" || project.status === "New Biz"
      ) || []
    );
  }, [projects]);

  // Gestionnaire pour les changements de filtres
  const handleFilterChange = (filterType, value) => {
    onFiltersChange((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Composant pour une tâche draggable
  const TaskCard = ({ task, index }) => (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-2 cursor-move transition-all duration-200 hover:shadow-md ${
            snapshot.isDragging ? "rotate-1 scale-105 shadow-lg" : ""
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-start space-x-2">
              <div
                {...provided.dragHandleProps}
                className="mt-1 text-muted-foreground hover:text-foreground"
              >
                <GripVertical className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.clientColor || "#6366f1" }}
                  />
                  <span className="font-medium text-sm truncate">
                    {task.name}
                  </span>
                </div>

                <div className="space-y-1">
                  {task.client && (
                    <div className="text-xs text-muted-foreground">
                      Client:{" "}
                      {Array.isArray(task.client)
                        ? task.client[0]
                        : task.client}
                    </div>
                  )}

                  {task.projectName && (
                    <div className="text-xs text-muted-foreground">
                      Projet: {task.projectName}
                    </div>
                  )}

                  {task.status && (
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onConfigClick}
            className="flex items-center"
          >
            <Settings className="h-4 w-4 mr-1" />
            Config
          </Button>
        </div>

        {/* Filtres */}
        <div className="space-y-4">
          {/* Filtre Créatifs */}
          <BasicMultiSelectCombobox
            options={users}
            value={filters.selectedCreatives || []}
            onValueChange={(value) =>
              handleFilterChange("selectedCreatives", value)
            }
            placeholder="Sélectionner des créatifs..."
            label="Créatifs"
          />

          {/* Filtre Clients */}
          <BasicMultiSelectCombobox
            options={clients}
            value={filters.selectedClients || []}
            onValueChange={(value) =>
              handleFilterChange("selectedClients", value)
            }
            placeholder="Sélectionner des clients..."
            label="Clients"
          />

          {/* Filtre Projets */}
          <BasicMultiSelectCombobox
            options={filteredProjects}
            value={filters.selectedProjects || []}
            onValueChange={(value) =>
              handleFilterChange("selectedProjects", value)
            }
            placeholder="Sélectionner des projets..."
            label="Projets"
          />

          {/* Afficher les tâches terminées */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-completed"
              checked={filters.showCompleted || false}
              onCheckedChange={(checked) =>
                handleFilterChange("showCompleted", checked)
              }
            />
            <Label htmlFor="show-completed" className="text-sm cursor-pointer">
              Afficher les tâches terminées
            </Label>
          </div>
        </div>
      </div>

      {/* Tâches non assignées */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-muted-foreground">
            Tâches non assignées ({filteredUnassignedTasks.length}
            {searchQuery &&
              unassignedTasks.length !== filteredUnassignedTasks.length &&
              ` sur ${unassignedTasks.length}`}
            )
          </h3>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, projet ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        <Droppable droppableId="unassigned-tasks">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 overflow-y-auto flex-1 ${
                snapshot.isDraggingOver ? "bg-accent/20 rounded-lg" : ""
              }`}
            >
              {filteredUnassignedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-sm">
                    {searchQuery
                      ? "Aucune tâche trouvée pour cette recherche"
                      : "Aucune tâche non assignée"}
                  </div>
                </div>
              ) : (
                filteredUnassignedTasks.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} />
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      {/* Footer avec indicateur de chargement */}
      {loading && (
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Synchronisation...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSidebar;
