import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Filter,
  GripVertical,
  Calendar,
  User,
  Building,
} from "lucide-react";

// Composant pour une tâche draggable
const TaskCard = ({ task, index, clientColors, userPreferences }) => {
  const clientName = Array.isArray(task.client) ? task.client[0] : task.client;
  const clientColor = clientColors[clientName] || "#3498DB";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-2 cursor-move transition-all ${
            snapshot.isDragging ? "shadow-lg rotate-2" : "hover:shadow-md"
          }`}
          data-task-id={task.id}
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
                {/* Nom de la tâche */}
                <div className="font-medium text-sm truncate mb-1">
                  {task.name}
                </div>

                {/* Utilisateurs (toujours visible) */}
                {task.users && task.users.length > 0 && (
                  <div className="flex items-center space-x-1 mb-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {task.users.join(", ")}
                    </span>
                  </div>
                )}

                {/* Projets (optionnel) */}
                {userPreferences.visibleTaskProperties.showProjects &&
                  task.projects &&
                  task.projects.length > 0 && (
                    <div className="flex items-center space-x-1 mb-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {task.projects.join(", ")}
                      </span>
                    </div>
                  )}

                {/* Client (optionnel) */}
                {userPreferences.visibleTaskProperties.showClient &&
                  clientName && (
                    <div className="flex items-center space-x-1 mb-1">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: clientColor + "20",
                          color: clientColor,
                        }}
                      >
                        {clientName}
                      </Badge>
                    </div>
                  )}

                {/* État (optionnel) */}
                {userPreferences.visibleTaskProperties.showEtat &&
                  task.status && (
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

const TaskSidebar = ({
  unassignedTasks,
  users,
  clients,
  projects,
  filters,
  onFiltersChange,
  onTaskDrop,
  clientColors,
  userPreferences,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filtrage des tâches
  const filteredTasks = useMemo(() => {
    return unassignedTasks.filter((task) => {
      // Filtre par terme de recherche
      if (
        searchTerm &&
        !task.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Filtre par utilisateurs
      if (filters.users.length > 0) {
        const taskUsers = task.users || [];
        const hasMatchingUser = filters.users.some((userId) =>
          taskUsers.includes(userId)
        );
        if (!hasMatchingUser) return false;
      }

      // Filtre par client
      if (filters.client) {
        const taskClient = Array.isArray(task.client)
          ? task.client[0]
          : task.client;
        if (taskClient !== filters.client) return false;
      }

      // Filtre par projet
      if (filters.project) {
        const taskProjects = task.projects || [];
        if (!taskProjects.includes(filters.project)) return false;
      }

      return true;
    });
  }, [unassignedTasks, searchTerm, filters]);

  // Gestion du drag & drop
  const handleDragEnd = (result) => {
    // Le drag & drop vers le calendrier est géré par FullCalendar
    // Ici on ne gère que le réordonnancement dans la liste (optionnel)
  };

  // Gestion des filtres
  const handleUserFilterChange = (userId, checked) => {
    const newUsers = checked
      ? [...filters.users, userId]
      : filters.users.filter((id) => id !== userId);

    onFiltersChange({ ...filters, users: newUsers });
  };

  const handleClientFilterChange = (clientId) => {
    onFiltersChange({
      ...filters,
      client: clientId === filters.client ? "" : clientId,
    });
  };

  const handleProjectFilterChange = (projectId) => {
    onFiltersChange({
      ...filters,
      project: projectId === filters.project ? "" : projectId,
    });
  };

  const clearFilters = () => {
    onFiltersChange({ users: [], client: "", project: "" });
    setSearchTerm("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header avec recherche */}
      <div className="p-4 border-b">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tâches non assignées</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="p-4 border-b bg-muted/50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Filtres</Label>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Effacer
              </Button>
            </div>

            {/* Filtre utilisateurs */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Utilisateurs
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={filters.users.includes(user.id)}
                      onCheckedChange={(checked) =>
                        handleUserFilterChange(user.id, checked)
                      }
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="text-sm truncate flex-1"
                    >
                      {user.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtre clients */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Client
              </Label>
              <Select
                value={filters.client}
                onValueChange={handleClientFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre projets */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Projet
              </Label>
              <Select
                value={filters.project}
                onValueChange={handleProjectFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les projets</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.name}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Liste des tâches */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune tâche non assignée</p>
                {(searchTerm ||
                  filters.users.length > 0 ||
                  filters.client ||
                  filters.project) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Effacer les filtres
                  </Button>
                )}
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="unassigned-tasks">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2"
                    >
                      {filteredTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          clientColors={clientColors}
                          userPreferences={userPreferences}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer avec compteur */}
      <div className="p-4 border-t bg-muted/50">
        <div className="text-xs text-muted-foreground text-center">
          {filteredTasks.length} tâche{filteredTasks.length !== 1 ? "s" : ""}
          {filteredTasks.length !== unassignedTasks.length &&
            ` sur ${unassignedTasks.length}`}
        </div>
      </div>
    </div>
  );
};

export default TaskSidebar;
