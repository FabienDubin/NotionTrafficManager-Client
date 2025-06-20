import React, { useState, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useCalendar } from "../hooks/useCalendar";
import CalendarView from "../components/Calendar/CalendarView";
import CalendarSidebar from "../components/Calendar/CalendarSidebar";
import TaskEditSheet from "../components/Calendar/TaskEditSheet";
import ConfigurationModal from "../components/Calendar/ConfigurationModal";
import { Skeleton } from "@/components/ui/skeleton";

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
    updateTask,
    savePreferences,
    saveClientColors,
    reloadCalendar,
  } = useCalendar();

  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [calendarUpdateEvent, setCalendarUpdateEvent] = useState(null);

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
    async (taskId, updates) => {
      try {
        await updateTask(taskId, updates, calendarUpdateEvent);
        // Ne plus fermer automatiquement la sheet ici
        // La fermeture est maintenant gérée dans TaskEditSheet
      } catch (error) {
        console.error("Error updating task:", error);
        // Re-throw l'erreur pour que TaskEditSheet puisse la gérer
        throw error;
      }
    },
    [updateTask, calendarUpdateEvent]
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

  // Gestionnaire pour le drag & drop
  const handleDragEnd = useCallback(
    async (result) => {
      const { destination, source, draggableId } = result;

      // Pas de destination = drop annulé
      if (!destination) return;

      // Même position = pas de changement
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      // Si on drop sur le calendrier
      if (destination.droppableId.startsWith("calendar-")) {
        const dateStr = destination.droppableId.replace("calendar-", "");
        const task = unassignedTasks.find((t) => t.id === draggableId);

        if (task) {
          try {
            await updateTask(draggableId, {
              startDate: dateStr,
              endDate: dateStr,
            });
          } catch (error) {
            console.error("Error updating task date:", error);
          }
        }
      }
    },
    [unassignedTasks, updateTask]
  );

  // Gestionnaire pour la sélection de zone dans le calendrier (création de nouvelle tâche)
  const handleDateSelect = useCallback((selectInfo) => {
    console.log("📅 Creating new task from date selection:", selectInfo);

    // Créer une tâche temporaire avec les dates sélectionnées
    const newTask = {
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

    setSelectedTask(newTask);
    setIsTaskSheetOpen(true);
  }, []);

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

  // Gestionnaire pour la sauvegarde (création ou mise à jour)
  const handleTaskSaveOrCreate = useCallback(
    async (taskId, updates) => {
      try {
        if (taskId === "new") {
          // Nouvelle tâche - utiliser createTask
          return await handleTaskCreate(updates);
        } else {
          // Tâche existante - utiliser updateTask
          await updateTask(taskId, updates, calendarUpdateEvent);
        }
      } catch (error) {
        console.error("Error saving/creating task:", error);
        throw error;
      }
    },
    [handleTaskCreate, updateTask, calendarUpdateEvent]
  );

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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <CalendarSidebar
          unassignedTasks={unassignedTasks}
          users={users}
          clients={clients}
          projects={projects}
          filters={filters}
          onFiltersChange={setFilters}
          onConfigClick={() => setIsConfigModalOpen(true)}
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
      </div>
    </DragDropContext>
  );
};

export default Calendar;
