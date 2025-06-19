import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/auth.context";
import useTasksCache from "@/hooks/useTasksCache";
import calendarService from "@/services/calendar.service";
import preferencesService from "@/services/preferences.service";

// Composants
import CalendarView from "./Calendar/components/CalendarView";
import TaskSidebar from "./Calendar/components/TaskSidebar";
import TaskSheet from "./Calendar/components/TaskSheet";
import ConfigModal from "./Calendar/components/ConfigModal";

// UI Components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";

const CalendarPage = () => {
  const { user } = useContext(AuthContext);

  // Cache des tâches
  const {
    getTasksWithCache,
    getUnassignedTasksWithCache,
    loading,
    invalidateCache,
    invalidateUnassignedCache,
    preloadAdjacentPeriods,
  } = useTasksCache();

  // États principaux
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [unassignedTasks, setUnassignedTasks] = useState([]);
  const [currentViewInfo, setCurrentViewInfo] = useState(null);
  const [currentViewType, setCurrentViewType] = useState("dayGridMonth");

  // Données de référence
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clientColors, setClientColors] = useState({});
  const [userPreferences, setUserPreferences] = useState({
    visibleTaskProperties: {
      showProjects: false,
      showClient: false,
      showEtat: false,
    },
  });

  // États UI
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    users: [],
    client: "",
    project: "",
  });

  // Chargement initial des données de référence
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [usersData, clientsData, projectsData] = await Promise.all([
          calendarService.getUsers(),
          calendarService.getClients(),
          calendarService.getProjects(),
        ]);

        setUsers(usersData);
        setClients(clientsData);
        setProjects(projectsData);

        // Génère des couleurs pour les nouveaux clients
        await preferencesService.generateClientColors(clientsData);

        // Charge les couleurs des clients
        const clientColorsData = await preferencesService.getClientColors();
        const clientColorsObject =
          preferencesService.clientColorsArrayToObject(clientColorsData);
        setClientColors(clientColorsObject);

        // Charge les préférences utilisateur
        if (user?._id) {
          const preferences = await preferencesService.getUserPreferences(
            user._id
          );
          setUserPreferences(preferences);
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données de référence:",
          error
        );
      }
    };

    loadReferenceData();
  }, [user]);

  // Charge les tâches non assignées
  useEffect(() => {
    const loadUnassignedTasks = async () => {
      try {
        const tasks = await getUnassignedTasksWithCache();
        setUnassignedTasks(tasks);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des tâches non assignées:",
          error
        );
      }
    };

    loadUnassignedTasks();
  }, [getUnassignedTasksWithCache]);

  // Charge les tâches pour la période visible du calendrier
  const loadTasksForPeriod = async (viewInfo) => {
    if (!viewInfo) return;

    try {
      const { start, end } = viewInfo;
      const viewTypeMap = {
        dayGridMonth: "month",
        timeGridWeek: "week",
        timeGridDay: "day",
      };
      const viewType = viewTypeMap[currentViewType] || "month";

      const tasks = await getTasksWithCache(
        start.toISOString(),
        end.toISOString(),
        true, // Préchargement activé
        viewType
      );

      setCalendarTasks(tasks);
      setCurrentViewInfo(viewInfo);

      // Précharge les périodes adjacentes après un délai
      setTimeout(() => {
        preloadAdjacentPeriods(
          start.toISOString(),
          end.toISOString(),
          viewType
        );
      }, 1000);
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
    }
  };

  // Gestion du changement de vue du calendrier
  const handleViewChange = (viewInfo) => {
    setCurrentViewType(viewInfo.view.type);
    loadTasksForPeriod(viewInfo);
  };

  // Gestion du clic sur un événement du calendrier
  const handleEventClick = (eventInfo) => {
    const task = eventInfo.event.extendedProps.task;
    setSelectedTask(task);
    setIsTaskSheetOpen(true);
  };

  // Gestion du drag & drop d'une tâche
  const handleTaskDrop = async (taskId, newPeriod) => {
    try {
      // Mise à jour optimiste de l'UI
      setCalendarTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, period: newPeriod } : task
        )
      );

      // Supprime la tâche des non assignées si elle y était
      setUnassignedTasks((prev) => prev.filter((task) => task.id !== taskId));

      // Synchronisation avec l'API
      await calendarService.updateTask(taskId, { period: newPeriod });

      // Invalide le cache pour forcer le rechargement
      invalidateCache();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      // Recharge les données en cas d'erreur
      if (currentViewInfo) {
        loadTasksForPeriod(currentViewInfo);
      }
    }
  };

  // Gestion de la mise à jour d'une tâche
  const handleTaskUpdate = async (taskId, updates) => {
    try {
      await calendarService.updateTask(taskId, updates);

      // Invalide le cache et recharge
      invalidateCache();
      invalidateUnassignedCache();

      if (currentViewInfo) {
        loadTasksForPeriod(currentViewInfo);
      }

      // Recharge les tâches non assignées
      const unassignedTasks = await getUnassignedTasksWithCache();
      setUnassignedTasks(unassignedTasks);

      setIsTaskSheetOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
    }
  };

  // Gestion de la mise à jour des préférences
  const handlePreferencesUpdate = async (newPreferences) => {
    try {
      if (user?._id) {
        await preferencesService.updateUserPreferences(
          user._id,
          newPreferences
        );
        setUserPreferences(newPreferences);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des préférences:", error);
    }
  };

  // Gestion de la mise à jour des couleurs clients
  const handleClientColorsUpdate = async (newClientColors) => {
    try {
      const clientColorsArray = preferencesService.clientColorsObjectToArray(
        newClientColors,
        clients
      );
      await preferencesService.updateClientColors(clientColorsArray);
      setClientColors(newClientColors);
    } catch (error) {
      console.error("Erreur lors de la mise à jour des couleurs:", error);
    }
  };

  // Transforme les tâches en événements pour FullCalendar
  const calendarEvents = calendarService.tasksToEvents(
    calendarTasks,
    clientColors
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Calendrier de Trafic</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des tâches créatives
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConfigModalOpen(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configuration
        </Button>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar gauche */}
        <div className="w-80 border-r bg-background">
          <TaskSidebar
            unassignedTasks={unassignedTasks}
            users={users}
            clients={clients}
            projects={projects}
            filters={filters}
            onFiltersChange={setFilters}
            onTaskDrop={handleTaskDrop}
            clientColors={clientColors}
            userPreferences={userPreferences}
          />
        </div>

        <Separator orientation="vertical" />

        {/* Zone calendrier */}
        <div className="flex-1">
          <CalendarView
            events={calendarEvents}
            onViewChange={handleViewChange}
            onEventClick={handleEventClick}
            onTaskDrop={handleTaskDrop}
            loading={loading}
            viewType={currentViewType}
          />
        </div>
      </div>

      {/* Sheet d'édition de tâche */}
      <TaskSheet
        isOpen={isTaskSheetOpen}
        onClose={() => setIsTaskSheetOpen(false)}
        task={selectedTask}
        users={users}
        onTaskUpdate={handleTaskUpdate}
      />

      {/* Modal de configuration */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        clients={clients}
        clientColors={clientColors}
        userPreferences={userPreferences}
        onClientColorsUpdate={handleClientColorsUpdate}
        onPreferencesUpdate={handlePreferencesUpdate}
      />
    </div>
  );
};

export default CalendarPage;
