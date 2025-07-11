import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Filter,
  Search,
  Bug,
  ChevronDown,
  SquareUserRound,
  CalendarCheck,
  Clapperboard,
  Palette,
  Pencil,
  Users,
} from "lucide-react";
import BasicMultiSelectCombobox from "@/components/BasicMultiSelectCombobox";
import TaskCard from "./TaskCard";
import TaskEditSheet from "./TaskEditSheet";
import BugReportModal from "@/components/BugReportModal";

const CalendarSidebar = ({
  unassignedTasks,
  users,
  clients,
  projects,
  statusOptions,
  teams,
  filters,
  onFiltersChange,
  onConfigClick,
  onTaskUpdate,
  onUnassignedTasksChange,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState("unassignedTasks");

  const isTaskUnassigned = (task) => {
    const hasNoWorkPeriod =
      !task.workPeriod || !task.workPeriod.start || !task.workPeriod.end;
    return hasNoWorkPeriod;
  };

  const handleTaskClick = (task) => {
    setEditingTask(task);
    setIsEditSheetOpen(true);
  };

  const handleTaskSave = async (taskId, updates) => {
    try {
      await onTaskUpdate(taskId, updates);
      const updatedTask = { ...editingTask, ...updates };
      if (!isTaskUnassigned(updatedTask)) {
        removeTaskWithAnimation(taskId);
      }
      setIsEditSheetOpen(false);
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const removeTaskWithAnimation = (taskId) => {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.classList.add("task-card-exit");
      setTimeout(() => {
        onUnassignedTasksChange((prev) =>
          prev.filter((task) => task.id !== taskId)
        );
      }, 300);
    }
  };

  const filteredUnassignedTasks = useMemo(() => {
    if (!searchQuery.trim()) return unassignedTasks;
    const query = searchQuery.toLowerCase().trim();
    return unassignedTasks.filter((task) => {
      const name = task.name?.toLowerCase() || "";
      const project = task.projectName?.toLowerCase() || "";
      const client = Array.isArray(task.client)
        ? task.client[0]?.toLowerCase() || ""
        : task.client?.toLowerCase() || "";
      return (
        name.includes(query) ||
        project.includes(query) ||
        client.includes(query)
      );
    });
  }, [unassignedTasks, searchQuery]);

  const filteredProjects = useMemo(() => {
    return (
      projects?.filter(
        (project) =>
          project.status === "En cours" || project.status === "New Biz"
      ) || []
    );
  }, [projects]);

  // Filtrer les utilisateurs par équipe sélectionnée
  const filteredUsers = useMemo(() => {
    if (!filters.selectedTeams?.length) {
      return users; // Aucune équipe sélectionnée = tous les utilisateurs
    }

    return users.filter((user) => {
      const userTeamIds = user.team || [];
      return filters.selectedTeams.some((teamName) => {
        const team = teams.find((t) => t.name === teamName);
        return team && userTeamIds.includes(team.id);
      });
    });
  }, [users, filters.selectedTeams, teams]);

  // Nettoyer les créatifs sélectionnés qui ne font plus partie des équipes filtrées
  useEffect(() => {
    if (
      filters.selectedTeams?.length > 0 &&
      filters.selectedCreatives?.length > 0
    ) {
      const validCreatives = filters.selectedCreatives.filter((creativeId) =>
        filteredUsers.some((user) => user.id === creativeId)
      );

      if (validCreatives.length !== filters.selectedCreatives.length) {
        handleFilterChange("selectedCreatives", validCreatives);
      }
    }
  }, [filters.selectedTeams, filteredUsers, filters.selectedCreatives]);

  const handleFilterChange = (filterType, value) => {
    onFiltersChange((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  return (
    <div className="w-80 border-r bg-background flex flex-col h-screen">
      {/* Filtres - Section compacte */}
      <div className="p-4 border-b space-y-4 flex-shrink-0">
        {/* Filtres Équipe */}
        <div className="flex items-center gap-2 font-medium text-muted-foreground mb-2">
          <Users className="h-4 w-4" />
          Équipes
        </div>
        <div className="flex gap-2 mb-4">
          <Button
            variant={
              filters.selectedTeams?.includes("Prod") ? "default" : "outline"
            }
            size="sm"
            onClick={() => {
              const current = filters.selectedTeams || [];
              const next = current.includes("Prod")
                ? current.filter((t) => t !== "Prod")
                : [...current, "Prod"];
              handleFilterChange("selectedTeams", next);
            }}
            className="flex items-center"
            type="button"
          >
            <Clapperboard className="h-4 w-4" />
          </Button>
          <Button
            variant={
              filters.selectedTeams?.includes("Créa") ? "default" : "outline"
            }
            size="sm"
            onClick={() => {
              const current = filters.selectedTeams || [];
              const next = current.includes("Créa")
                ? current.filter((t) => t !== "Créa")
                : [...current, "Créa"];
              handleFilterChange("selectedTeams", next);
            }}
            className="flex items-center"
            type="button"
          >
            <Palette className="h-4 w-4" />
          </Button>
          <Button
            variant={
              filters.selectedTeams?.includes("Édito") ? "default" : "outline"
            }
            size="sm"
            onClick={() => {
              const current = filters.selectedTeams || [];
              const next = current.includes("Édito")
                ? current.filter((t) => t !== "Édito")
                : [...current, "Édito"];
              handleFilterChange("selectedTeams", next);
            }}
            className="flex items-center"
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        {/* Filtres Personnes */}
        <div className="flex items-center gap-2 font-medium text-muted-foreground">
          <SquareUserRound className="h-4 w-4" />
          Personnes
        </div>
        <BasicMultiSelectCombobox
          options={filteredUsers}
          value={filters.selectedCreatives || []}
          onValueChange={(value) =>
            handleFilterChange("selectedCreatives", value)
          }
          placeholder="Sélectionner des créatifs..."
        />
      </div>

      <div className="flex flex-col flex-grow overflow-hidden w-full gap-6">
        <Tabs
          defaultValue="unassignedTasks"
          className="flex flex-col flex-grow overflow-hidden w-full"
        >
          <TabsList className="px-4 py-2 flex gap-2 mx-8 mt-3">
            <TabsTrigger
              value="advanced-filters"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </TabsTrigger>
            <TabsTrigger
              value="unassignedTasks"
              className="flex items-center gap-2"
            >
              <CalendarCheck className="h-4 w-4" />
              Tâches NA ({filteredUnassignedTasks.length}
              {searchQuery &&
                unassignedTasks.length !== filteredUnassignedTasks.length &&
                ` sur ${unassignedTasks.length}`}
              )
            </TabsTrigger>
          </TabsList>

          {/* Filtres avancés */}
          <TabsContent
            value="advanced-filters"
            className="flex-1 overflow-y-auto px-6 pb-4"
          >
            <div className="space-y-4">
              <BasicMultiSelectCombobox
                options={clients}
                value={filters.selectedClients || []}
                onValueChange={(value) =>
                  handleFilterChange("selectedClients", value)
                }
                placeholder="Sélectionner des clients..."
                label="Clients"
              />
              <BasicMultiSelectCombobox
                options={filteredProjects}
                value={filters.selectedProjects || []}
                onValueChange={(value) =>
                  handleFilterChange("selectedProjects", value)
                }
                placeholder="Sélectionner des projets..."
                label="Projets"
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-completed"
                  checked={filters.showCompleted ?? true}
                  onCheckedChange={(checked) =>
                    handleFilterChange("showCompleted", checked)
                  }
                />
                <Label
                  htmlFor="show-completed"
                  className="text-sm cursor-pointer"
                >
                  Afficher les tâches terminées
                </Label>
              </div>
            </div>
          </TabsContent>

          {/* Tâches non assignées */}
          <TabsContent
            value="unassignedTasks"
            className="flex-1 overflow-hidden p-0"
          >
            <div className="flex flex-col h-full pb-12 overflow-hidden">
              {/* Search */}
              <div className="p-2">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, projet ou client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              {/* Scrollable zone */}
              <div className="flex-1 overflow-y-auto px-2 pb-10 space-y-2 min-h-0">
                {filteredUnassignedTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchQuery
                      ? "Aucune tâche trouvée pour cette recherche"
                      : "Aucune tâche non assignée"}
                  </div>
                ) : (
                  filteredUnassignedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onTaskClick={handleTaskClick}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer sticky */}
      <div className="p-4 border-t bg-background sticky bottom-0 z-50">
        <div className="flex justify-between items-center">
          <BugReportModal
            trigger={
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-sm"
              >
                <Bug className="w-4 h-4 text-red-500" />
                Signaler un bug
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onConfigClick}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            Config
          </Button>
        </div>
      </div>

      {/* Edition de tâche */}
      <TaskEditSheet
        task={editingTask}
        users={users}
        projects={projects}
        statusOptions={statusOptions}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onSave={handleTaskSave}
        onClose={() => setIsEditSheetOpen(false)}
      />
    </div>
  );
};

export default CalendarSidebar;
