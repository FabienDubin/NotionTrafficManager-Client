import React, { useState, useCallback } from "react";
import { useCalendar } from "../hooks/useCalendar";
import CalendarView from "../components/Calendar/CalendarView";
import CalendarSidebar from "../components/Calendar/CalendarSidebar";
import TaskEditSheet from "../components/Calendar/TaskEditSheet";
import ConfigurationModal from "../components/Calendar/ConfigurationModal";
import ProjectSelectionModal from "../components/Calendar/ProjectSelectionModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import calendarService from "../services/calendar.service";

const Calendar = () => {
  const {
    tasks,
    unassignedTasks,
    users,
    clients,
    projects,
    statusOptions,
    preferences,
    clientColors,
    loading,
    updating,
    initialLoading,
    error,
    filters,
    setFilters,
    loadTasksForPeriod,
    createTask,
    createTaskOptimistic, // Nouvelle fonction pour création optimisée
    updateTask,
    updateTaskOptimistic, // Nouvelle fonction pour UX optimisée
    deleteTask, // Nouvelle fonction pour suppression optimisée
    savePreferences,
    saveClientColors,
    reloadCalendar,
    loadUnassignedTasks,
    // Fonctions pour manipuler directement l'état des tâches
    addTaskToCalendar,
    removeTaskFromCalendar,
    updateTaskInCalendar,
  } = useCalendar();

  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [calendarUpdateEvent, setCalendarUpdateEvent] = useState(null);

  // États pour la modal de sélection de projet
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState(null);
  const [filteredProjectsForModal, setFilteredProjectsForModal] = useState([]);

  const { toast } = useToast();

  // Gestionnaire pour l'ouverture du sheet d'édition
  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
    setIsTaskSheetOpen(true);
  }, []);

  // Gestionnaire pour la fermeture du sheet
  const handleTaskSheetClose = useCallback(() => {
    setIsTaskSheetOpen(false);
    setSelectedTask(null);
  }, []);

  // Gestionnaire pour recevoir la fonction de mise à jour du calendrier
  const handleCalendarUpdateEvent = useCallback((updateEventFn) => {
    setCalendarUpdateEvent(() => updateEventFn);
  }, []);

  // Gestionnaire pour la sauvegarde des modifications de tâche depuis le sheet
  const handleTaskSave = useCallback(
    async (taskId, updates, options = {}) => {
      try {
        // Utiliser updateTaskOptimistic pour une UX fluide
        await updateTaskOptimistic(
          taskId,
          updates,
          calendarUpdateEvent,
          options
        );
        // Ne plus fermer automatiquement la sheet ici
        // La fermeture est maintenant gérée dans TaskEditSheet
      } catch (error) {
        console.error("Error updating task:", error);
        // Re-throw l'erreur pour que TaskEditSheet puisse la gérer
        throw error;
      }
    },
    [updateTaskOptimistic, calendarUpdateEvent]
  );

  // Gestionnaire pour la mise à jour des tâches depuis le calendrier (drag & drop)
  const handleTaskUpdate = useCallback(
    async (taskId, updates) => {
      try {
        return await updateTask(taskId, updates);
      } catch (error) {
        console.error("Error updating task:", error);
        throw error; // Re-throw pour que CalendarView puisse gérer l'erreur
      }
    },
    [updateTask]
  );

  // Gestionnaire pour le drop de tâches depuis la sidebar vers le calendrier
  const handleTaskDrop = useCallback(
    async (task, dropInfo) => {
      try {
        console.log("🔄 Updating task from drop:", {
          taskId: task.id,
          dropInfo,
        });

        // 1. Retirer immédiatement de la sidebar (mise à jour optimiste locale)
        setLocalUnassignedTasks((prev) => prev.filter((t) => t.id !== task.id));

        // 2. Auto-assignation selon les filtres créatifs
        const selectedCreativeIds = filters.selectedCreatives || [];
        let assignedUsers = task.assignedUsers || [];

        if (selectedCreativeIds.length > 0) {
          assignedUsers = [...selectedCreativeIds];
          console.log(
            "🎯 Auto-assigning dropped task to filtered creatives:",
            selectedCreativeIds
          );

          // Afficher un toast informatif
          const creativeNames = selectedCreativeIds
            .map((id) => {
              const user = users.find((u) => u.id === id);
              return user ? user.name : id;
            })
            .join(", ");

          toast({
            title: "Assignation automatique",
            description: `Tâche assignée automatiquement à ${creativeNames}`,
          });
        }

        // 3. Créer la tâche mise à jour avec les nouvelles dates et assignations
        const updatedTaskData = {
          ...task,
          start: dropInfo.startDate,
          end: dropInfo.endDate,
          workPeriod: {
            start: dropInfo.startDate,
            end: dropInfo.endDate,
          },
          assignedUsers,
        };

        // 4. Ajouter immédiatement la tâche à l'état des tâches du calendrier
        // CECI EST CRUCIAL : la tâche doit être visible immédiatement
        addTaskToCalendar(updatedTaskData);

        console.log("✅ Task added to calendar state immediately");

        // 5. Synchroniser avec le serveur en arrière-plan (appel API direct)
        const response = await calendarService.updateTask(task.id, {
          startDate: dropInfo.startDate,
          endDate: dropInfo.endDate,
          workPeriod: {
            start: dropInfo.startDate,
            end: dropInfo.endDate,
          },
          assignedUsers,
        });

        console.log("✅ Task updated successfully on server:", response);

        // 6. Mettre à jour avec les données enrichies du serveur si disponibles
        if (response.data && response.data.id) {
          updateTaskInCalendar(task.id, {
            ...updatedTaskData,
            ...response.data,
          });
        }

        // 7. Recharger les tâches non assignées pour synchroniser
        loadUnassignedTasks().catch((error) => {
          console.warn("⚠️ Failed to reload unassigned tasks:", error);
        });

        return response.data || updatedTaskData;
      } catch (error) {
        console.error("❌ Error updating task from drop:", error);

        // Rollback complet en cas d'erreur
        // 1. Remettre la tâche dans la sidebar
        setLocalUnassignedTasks((prev) => [...prev, task]);

        // 2. Retirer la tâche du calendrier si elle y était
        removeTaskFromCalendar(task.id);

        // Re-throw l'erreur pour que CalendarView puisse faire son rollback
        throw error;
      }
    },
    [
      addTaskToCalendar,
      updateTaskInCalendar,
      removeTaskFromCalendar,
      loadUnassignedTasks,
      filters,
      users,
      toast,
    ]
  );

  // Gestionnaire pour la gestion des tâches non assignées avec synchronisation améliorée
  const [localUnassignedTasks, setLocalUnassignedTasks] = useState([]);

  // Synchroniser les tâches non assignées avec l'état global
  React.useEffect(() => {
    setLocalUnassignedTasks(unassignedTasks);
    console.log("🔄 Synchronizing unassigned tasks:", unassignedTasks.length);
  }, [unassignedTasks]);

  // Gestionnaire pour la sélection de zone dans le calendrier (création de nouvelle tâche)
  const handleDateSelect = useCallback(
    (selectInfo) => {
      console.log("📅 Creating new task from date selection:", selectInfo);

      // Filtrer les projets actifs selon les filtres
      const filteredProjects = projects.filter(
        (project) =>
          project.status === "En cours" || project.status === "New Biz"
      );

      const selectedProjectIds = filters.selectedProjects || [];
      const selectedCreativeIds = filters.selectedCreatives || [];

      // Créer une tâche temporaire avec les dates sélectionnées
      const baseTask = {
        id: "new", // ID temporaire pour identifier une nouvelle tâche
        name: "",
        projectId: "",
        startDate: selectInfo.startDate.split("T")[0],
        startTime: selectInfo.allDay
          ? "09:00"
          : selectInfo.startDate.split("T")[1]?.substring(0, 5) || "09:00",
        endDate: selectInfo.endDate.split("T")[0],
        endTime: selectInfo.allDay
          ? "18:00"
          : selectInfo.endDate.split("T")[1]?.substring(0, 5) || "18:00",
        status: "Pas commencé",
        assignedUsers: [],
        notes: "",
        workPeriod: {
          start: selectInfo.startDate,
          end: selectInfo.endDate,
        },
        isNew: true, // Flag pour identifier une nouvelle tâche
      };

      // Auto-assignation selon les filtres
      if (selectedCreativeIds.length > 0) {
        baseTask.assignedUsers = [...selectedCreativeIds];
        console.log(
          "🎯 Auto-assigning to filtered creatives:",
          selectedCreativeIds
        );
      }

      // Gestion des projets filtrés
      if (selectedProjectIds.length === 0) {
        // Aucun projet filtré - ouvrir directement le sheet
        setSelectedTask(baseTask);
        setIsTaskSheetOpen(true);
      } else if (selectedProjectIds.length === 1) {
        console.log(selectedProjectIds);
        // Un seul projet filtré - auto-assigner
        const selectedProject = filteredProjects.find(
          (p) => p.id === selectedProjectIds[0]
        );

        if (selectedProject) {
          baseTask.projectId = selectedProject.id;

          console.log(
            "🎯 Auto-assigning to filtered project:",
            selectedProject.name
          );
        }

        setSelectedTask(baseTask);
        setIsTaskSheetOpen(true);
      } else {
        // Plusieurs projets filtrés - ouvrir la modal de sélection
        const projectsToSelect = filteredProjects.filter((p) =>
          selectedProjectIds.includes(p.id)
        );

        if (projectsToSelect.length > 1) {
          console.log("📋 Multiple projects filtered, opening selection modal");
          setPendingTaskData(baseTask);
          setFilteredProjectsForModal(projectsToSelect);
          setIsProjectModalOpen(true);
        } else {
          // Fallback si un seul projet reste après filtrage
          if (projectsToSelect.length === 1) {
            baseTask.projectId = projectsToSelect[0].id;
          }
          setSelectedTask(baseTask);
          setIsTaskSheetOpen(true);
        }
      }
    },
    [filters, projects]
  );

  // Gestionnaire pour la création de nouvelles tâches
  const handleTaskCreate = useCallback(
    async (taskData) => {
      try {
        console.log("🔄 Creating new task:", taskData);
        const newTask = await createTask(taskData);
        console.log("✅ New task created successfully:", newTask);
        return newTask;
      } catch (error) {
        console.error("Error creating task:", error);
        throw error;
      }
    },
    [createTask]
  );

  // Gestionnaire pour la sauvegarde (création ou mise à jour) avec UX optimisée
  const handleTaskSaveOrCreate = useCallback(
    async (taskId, updates, options = {}) => {
      try {
        if (taskId === "new") {
          // Nouvelle tâche - utiliser createTaskOptimistic pour UX fluide
          return await createTaskOptimistic(
            updates,
            calendarUpdateEvent,
            options
          );
        } else {
          // Tâche existante - utiliser updateTaskOptimistic pour UX fluide
          await updateTaskOptimistic(
            taskId,
            updates,
            calendarUpdateEvent,
            options
          );
        }
      } catch (error) {
        console.error("Error saving/creating task:", error);
        throw error;
      }
    },
    [createTaskOptimistic, updateTaskOptimistic, calendarUpdateEvent]
  );

  // Gestionnaire pour la suppression de tâche avec UX optimisée
  const handleTaskDelete = useCallback(
    async (taskId, options = {}) => {
      try {
        console.log("🗑️ Deleting task from Calendar:", taskId);

        // Utiliser deleteTask pour une UX fluide avec suppression optimiste
        await deleteTask(taskId, options);

        console.log("✅ Task deleted successfully from Calendar");
      } catch (error) {
        console.error("Error deleting task:", error);
        // Re-throw l'erreur pour que TaskEditSheet puisse la gérer
        throw error;
      }
    },
    [deleteTask]
  );

  // Gestionnaires pour la modal de sélection de projet
  const handleProjectSelect = useCallback(
    (selectedProject) => {
      if (pendingTaskData) {
        const taskWithProject = {
          ...pendingTaskData,
          projectId: selectedProject.id,
        };

        console.log("📋 Project selected from modal:", selectedProject.name);
        setSelectedTask(taskWithProject);
        setIsTaskSheetOpen(true);
        setIsProjectModalOpen(false);
        setPendingTaskData(null);
        setFilteredProjectsForModal([]);
      }
    },
    [pendingTaskData]
  );

  const handleProjectModalCancel = useCallback(() => {
    console.log("📋 Project selection cancelled");
    setIsProjectModalOpen(false);
    setPendingTaskData(null);
    setFilteredProjectsForModal([]);
  }, []);

  // Gestionnaire pour les changements de période du calendrier
  const handleDatesSet = useCallback(
    (dateInfo) => {
      const startDate = dateInfo.start.toISOString().split("T")[0];
      const endDate = dateInfo.end.toISOString().split("T")[0];
      loadTasksForPeriod(startDate, endDate);
    },
    [loadTasksForPeriod]
  );

  // Affichage du skeleton pendant le chargement initial
  if (initialLoading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar skeleton */}
        <div className="w-80 border-r bg-background p-6 space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>

        {/* Calendar skeleton */}
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-destructive">
            Erreur de chargement
          </h2>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <CalendarSidebar
        unassignedTasks={localUnassignedTasks}
        users={users}
        clients={clients}
        projects={projects}
        statusOptions={statusOptions}
        filters={filters}
        onFiltersChange={setFilters}
        onConfigClick={() => setIsConfigModalOpen(true)}
        onTaskUpdate={handleTaskUpdate}
        onUnassignedTasksChange={setLocalUnassignedTasks}
        loading={loading}
      />

      {/* Zone principale du calendrier */}
      <div className="flex-1 relative">
        {/* Overlay de chargement - seulement pour loading, pas updating */}
        {loading && !updating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                Chargement des tâches...
              </p>
            </div>
          </div>
        )}

        {/* Indicateur discret de sauvegarde */}
        {updating && (
          <div className="absolute top-4 right-4 z-40 bg-white/90 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center space-x-2 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-gray-700">Sauvegarde...</span>
            </div>
          </div>
        )}

        {/* Calendrier */}
        <CalendarView
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
          onDatesSet={handleDatesSet}
          onTaskUpdated={handleCalendarUpdateEvent}
          onDateSelect={handleDateSelect}
          onTaskDrop={handleTaskDrop}
          defaultView={preferences?.defaultView || "timeGridWeek"}
        />
      </div>

      {/* Sheet d'édition de tâche */}
      <TaskEditSheet
        task={selectedTask}
        users={users}
        projects={projects}
        statusOptions={statusOptions}
        open={isTaskSheetOpen}
        onOpenChange={setIsTaskSheetOpen}
        onSave={handleTaskSaveOrCreate}
        onClose={handleTaskSheetClose}
        onDelete={handleTaskDelete}
      />

      {/* Modal de configuration */}
      <ConfigurationModal
        open={isConfigModalOpen}
        onOpenChange={setIsConfigModalOpen}
        clients={clients}
        clientColors={clientColors}
        preferences={preferences}
        onSavePreferences={savePreferences}
        onSaveClientColors={saveClientColors}
        onClose={reloadCalendar}
      />

      {/* Modal de sélection de projet */}
      <ProjectSelectionModal
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
        projects={filteredProjectsForModal}
        onProjectSelect={handleProjectSelect}
        onCancel={handleProjectModalCancel}
      />
    </div>
  );
};

export default Calendar;
