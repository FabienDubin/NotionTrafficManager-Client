import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Filter, GripVertical } from "lucide-react";

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
  // Gestionnaire pour les changements de filtres
  const handleFilterChange = (filterType, value) => {
    onFiltersChange((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Gestionnaire pour les filtres multi-select
  const handleMultiSelectChange = (filterType, value, checked) => {
    onFiltersChange((prev) => {
      const currentValues = prev[filterType] || [];
      if (checked) {
        return {
          ...prev,
          [filterType]: [...currentValues, value],
        };
      } else {
        return {
          ...prev,
          [filterType]: currentValues.filter((v) => v !== value),
        };
      }
    });
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
          <div>
            <Label className="text-sm font-medium mb-2 block">Créatifs</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`creative-${user.id}`}
                    checked={
                      filters.selectedCreatives?.includes(user.name) || false
                    }
                    onCheckedChange={(checked) =>
                      handleMultiSelectChange(
                        "selectedCreatives",
                        user.name,
                        checked
                      )
                    }
                  />
                  <Label
                    htmlFor={`creative-${user.id}`}
                    className="text-sm cursor-pointer truncate flex-1"
                  >
                    {user.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtre Clients */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Client</Label>
            <Select
              value={filters.selectedClients?.[0] || "all"}
              onValueChange={(value) =>
                handleFilterChange(
                  "selectedClients",
                  value === "all" ? [] : [value]
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.name}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre Projets */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Projet</Label>
            <Select
              value={filters.selectedProjects?.[0] || "all"}
              onValueChange={(value) =>
                handleFilterChange(
                  "selectedProjects",
                  value === "all" ? [] : [value]
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les projets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.name}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
      <div className="flex-1 p-6 overflow-hidden">
        <h3 className="font-medium mb-3 text-muted-foreground">
          Tâches non assignées ({unassignedTasks.length})
        </h3>

        <Droppable droppableId="unassigned-tasks">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 overflow-y-auto h-full ${
                snapshot.isDraggingOver ? "bg-accent/20 rounded-lg" : ""
              }`}
            >
              {unassignedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-sm">Aucune tâche non assignée</div>
                </div>
              ) : (
                unassignedTasks.map((task, index) => (
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
