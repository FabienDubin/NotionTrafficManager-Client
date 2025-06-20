import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { debounce, throttle } from "lodash";
import calendarService from "../services/calendar.service";
import { useToast } from "./use-toast";

export const useCalendar = () => {
  const { toast } = useToast();
  const abortController = useRef(null);

  const [state, setState] = useState({
    tasks: [],
    unassignedTasks: [],
    users: [],
    clients: [],
    projects: [],
    statusOptions: [],
    preferences: null,
    clientColors: [],
    loading: false,
    updating: false,
    initialLoading: true,
    error: null,
    cache: new Map(),
  });

  const [filters, setFilters] = useState({
    selectedCreatives: [],
    selectedClients: [],
    selectedProjects: [],
    showCompleted: false,
  });

  // Cache avec TTL (5 minutes)
  const cacheManager = useMemo(
    () => ({
      cache: new Map(),
      ttl: 5 * 60 * 1000, // 5 minutes

      set(key, value) {
        this.cache.set(key, {
          data: value,
          timestamp: Date.now(),
        });
      },

      get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.ttl) {
          this.cache.delete(key);
          return null;
        }

        return item.data;
      },

      clear() {
        this.cache.clear();
      },
    }),
    []
  );

  // Charger les tâches pour une période donnée
  const loadTasksForPeriod = useCallback(
    async (startDate, endDate) => {
      const cacheKey = `tasks-${startDate}-${endDate}`;

      // Vérifier le cache d'abord
      const cachedTasks = cacheManager.get(cacheKey);
      if (cachedTasks) {
        setState((prev) => ({ ...prev, tasks: cachedTasks }));
        return;
      }

      // Annuler les requêtes en cours
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await calendarService.getTasks(startDate, endDate);
        const tasks = response.data || [];

        // Mettre en cache
        cacheManager.set(cacheKey, tasks);

        setState((prev) => ({
          ...prev,
          tasks,
          loading: false,
          initialLoading: false,
        }));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error loading tasks:", error);
          setState((prev) => ({
            ...prev,
            loading: false,
            initialLoading: false,
            error: error.message,
          }));

          toast({
            title: "Erreur",
            description: "Impossible de charger les tâches",
            variant: "destructive",
          });
        }
      }
    },
    [cacheManager, toast]
  );

  // Version debounced pour éviter les appels multiples
  const debouncedLoadTasks = useMemo(
    () => debounce(loadTasksForPeriod, 300),
    [loadTasksForPeriod]
  );

  // Charger les tâches non assignées
  const loadUnassignedTasks = useCallback(async () => {
    console.log("🔄 Loading unassigned tasks...");
    try {
      const response = await calendarService.getUnassignedTasks();
      const unassignedTasks = response.data || [];

      console.log("✅ Unassigned tasks loaded:", unassignedTasks.length);
      setState((prev) => ({ ...prev, unassignedTasks }));
    } catch (error) {
      console.error("❌ Error loading unassigned tasks:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches non assignées",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Créer une nouvelle tâche
  const createTask = useCallback(
    async (taskData) => {
      console.log("🔄 Creating new task:", taskData);

      try {
        // Activer l'indicateur de mise à jour
        setState((prev) => ({ ...prev, updating: true }));

        // Appel API pour créer la tâche
        console.log("📡 Calling API to create task in Notion...");
        const response = await calendarService.createTask(taskData);
        console.log("✅ Task creation API call successful:", response);

        const newTask = response.data;

        // Ajouter la nouvelle tâche à la liste
        setState((prev) => ({
          ...prev,
          tasks: [...prev.tasks, newTask],
        }));

        // Invalider le cache pour les prochains chargements
        cacheManager.clear();

        // Désactiver l'indicateur de mise à jour
        setState((prev) => ({ ...prev, updating: false }));

        toast({
          title: "Succès",
          description: "Nouvelle tâche créée avec succès",
        });

        return newTask;
      } catch (error) {
        console.error("❌ Error creating task:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          taskData,
        });

        // Désactiver l'indicateur de mise à jour en cas d'erreur
        setState((prev) => ({ ...prev, updating: false }));

        toast({
          title: "Erreur",
          description: `Impossible de créer la tâche: ${error.message}`,
          variant: "destructive",
        });

        throw error;
      }
    },
    [cacheManager, toast]
  );

  // Mettre à jour une tâche
  const throttledUpdateTask = throttle(
    async (taskId, updates, calendarUpdateFn) => {
      console.log("🔄 Starting throttled task update:", { taskId, updates });

      // Sauvegarder l'état original pour le rollback
      let originalTask = null;
      let calendarUpdated = false;

      try {
        // Activer l'indicateur de mise à jour
        setState((prev) => ({ ...prev, updating: true }));

        // Mise à jour optimiste simplifiée : le serveur renvoie les données enrichies
        setState((prev) => {
          const taskIndex = prev.tasks.findIndex((task) => task.id === taskId);
          if (taskIndex === -1) return prev;

          originalTask = prev.tasks[taskIndex];
          const updatedTasks = [...prev.tasks];
          const mergedTask = { ...originalTask };

          // Appliquer les mises à jour de base pour l'affichage immédiat
          if (updates.name !== undefined) {
            mergedTask.name = updates.name;
            mergedTask.title = updates.name;
          }

          if (updates.startDate || updates.endDate || updates.workPeriod) {
            if (updates.workPeriod) {
              mergedTask.start = updates.workPeriod.start;
              mergedTask.end = updates.workPeriod.end;
              mergedTask.workPeriod = updates.workPeriod;
            } else {
              if (updates.startDate) {
                mergedTask.start = updates.startDate;
                mergedTask.workPeriod = {
                  ...mergedTask.workPeriod,
                  start: updates.startDate,
                };
              }
              if (updates.endDate) {
                mergedTask.end = updates.endDate;
                mergedTask.workPeriod = {
                  ...mergedTask.workPeriod,
                  end: updates.endDate,
                };
              }
            }
          }

          if (updates.status !== undefined) {
            mergedTask.status = updates.status;
          }

          if (updates.notes !== undefined) {
            mergedTask.notes = updates.notes;
            mergedTask.commentaire = updates.notes;
          }

          updatedTasks[taskIndex] = mergedTask;

          console.log("✅ Task updated locally (simplified):", {
            taskId,
            oldTask: originalTask,
            newTask: mergedTask,
            updates,
          });

          return {
            ...prev,
            tasks: updatedTasks,
          };
        });

        // Mettre à jour directement l'événement dans FullCalendar si la fonction est disponible
        if (calendarUpdateFn) {
          const calendarUpdates = {};

          if (updates.name !== undefined) {
            calendarUpdates.title = updates.name;
          }

          if (updates.projectId !== undefined) {
            // Trouver le projet et sa couleur
            setState((prev) => {
              const project = prev.projects.find(
                (p) => p.id === updates.projectId
              );
              if (project && project.client) {
                const clientName = Array.isArray(project.client)
                  ? project.client[0]
                  : project.client;
                const resolvedClientName =
                  prev.clients.find((c) => c.id === clientName)?.name ||
                  clientName;
                const clientColor = prev.clientColors.find(
                  (cc) => cc.clientName === resolvedClientName
                );

                if (clientColor) {
                  calendarUpdates.backgroundColor = clientColor.color;
                }
              }
              return prev;
            });
          }

          if (updates.startDate || updates.endDate) {
            calendarUpdates.start = updates.startDate;
            calendarUpdates.end = updates.endDate;
          }

          if (updates.workPeriod) {
            calendarUpdates.start = updates.workPeriod.start;
            calendarUpdates.end = updates.workPeriod.end;
          }

          // Mettre à jour les propriétés étendues pour l'affichage
          calendarUpdates.extendedProps = {};
          setState((prev) => {
            const task = prev.tasks.find((t) => t.id === taskId);
            if (task) {
              calendarUpdates.extendedProps = {
                ...task,
                client: task.client,
                assignedUsersNames: task.assignedUsersNames,
              };
            }
            return prev;
          });

          calendarUpdated = calendarUpdateFn(taskId, calendarUpdates);
          console.log("📅 Calendar event updated directly:", {
            taskId,
            calendarUpdates,
            success: calendarUpdated,
          });
        }

        // Appel API en arrière-plan avec logs détaillés
        console.log("📡 Calling API to sync with Notion...");
        const response = await calendarService.updateTask(taskId, updates);
        console.log("✅ API call successful:", response);

        const updatedTask = response.data;

        // Remplacer complètement par les données enrichies du serveur
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === taskId ? updatedTask : task
          ),
        }));

        // Invalider le cache pour les prochains chargements
        cacheManager.clear();

        // Désactiver l'indicateur de mise à jour
        setState((prev) => ({ ...prev, updating: false }));

        toast({
          title: "Succès",
          description: "Tâche mise à jour avec succès",
        });

        return updatedTask;
      } catch (error) {
        console.error("❌ Error updating task:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          taskId,
          updates,
        });

        // Revert optimistic update en cas d'erreur
        if (originalTask) {
          console.log("🔄 Reverting optimistic update due to error");
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.map((task) =>
              task.id === taskId ? originalTask : task
            ),
          }));

          // Revert calendar update if it was applied
          if (calendarUpdated && calendarUpdateFn) {
            calendarUpdateFn(taskId, {
              title: originalTask.name,
              backgroundColor: originalTask.clientColor,
              start: originalTask.start,
              end: originalTask.end,
              extendedProps: originalTask,
            });
          }
        }

        // Désactiver l'indicateur de mise à jour en cas d'erreur
        setState((prev) => ({ ...prev, updating: false }));

        toast({
          title: "Erreur",
          description: `Impossible de mettre à jour la tâche: ${error.message}`,
          variant: "destructive",
        });

        throw error;
      } finally {
        // S'assurer que l'indicateur est désactivé dans tous les cas
        setState((prev) => ({ ...prev, updating: false }));
      }
    },
    1000
  );

  // Charger les données de référence
  const loadReferenceData = useCallback(async () => {
    console.log("🔄 Loading reference data...");
    try {
      const [
        usersRes,
        clientsRes,
        projectsRes,
        statusRes,
        preferencesRes,
        colorsRes,
      ] = await Promise.all([
        calendarService.getUsers(),
        calendarService.getClients(),
        calendarService.getProjects(),
        calendarService.getStatusOptions(),
        calendarService.getUserPreferences(),
        calendarService.getClientColors(),
      ]);

      console.log("✅ Reference data loaded:", {
        users: usersRes.data?.length,
        clients: clientsRes.data?.length,
        projects: projectsRes.data?.length,
        statusOptions: statusRes.data?.length,
        preferences: !!preferencesRes.data,
        clientColors: colorsRes.data?.length,
      });

      setState((prev) => ({
        ...prev,
        users: usersRes.data || [],
        clients: clientsRes.data || [],
        projects: projectsRes.data || [],
        statusOptions: statusRes.data || [],
        preferences: preferencesRes.data,
        clientColors: colorsRes.data || [],
        initialLoading: false,
      }));

      // Appliquer les filtres des préférences
      if (preferencesRes.data?.filterPreferences) {
        setFilters(preferencesRes.data.filterPreferences);
      }
    } catch (error) {
      console.error("❌ Error loading reference data:", error);
      setState((prev) => ({
        ...prev,
        initialLoading: false,
        error: error.message,
      }));
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de référence",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Sauvegarder les préférences utilisateur
  const savePreferences = useCallback(
    async (preferences) => {
      try {
        const response = await calendarService.saveUserPreferences(preferences);

        setState((prev) => ({
          ...prev,
          preferences: response.data,
        }));

        toast({
          title: "Succès",
          description: "Préférences sauvegardées",
        });
      } catch (error) {
        console.error("Error saving preferences:", error);
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les préférences",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Sauvegarder les couleurs des clients
  const saveClientColors = useCallback(
    async (clientColors) => {
      try {
        const response = await calendarService.saveClientColors(clientColors);

        setState((prev) => ({
          ...prev,
          clientColors: response.data,
        }));

        // Invalider le cache des tâches pour recharger avec les nouvelles couleurs
        cacheManager.clear();

        toast({
          title: "Succès",
          description: "Couleurs sauvegardées",
        });
      } catch (error) {
        console.error("Error saving client colors:", error);
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les couleurs",
          variant: "destructive",
        });
      }
    },
    [cacheManager, toast]
  );

  // Filtrer les tâches
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((task) => {
      // Filtre par créatifs
      if (filters.selectedCreatives.length > 0) {
        const taskCreatives = Array.isArray(task.assignedUsersNames)
          ? task.assignedUsersNames
          : [task.assignedUsersNames].filter(Boolean);

        const hasMatchingCreative = taskCreatives.some((creative) => {
          // Vérifier correspondance exacte
          if (filters.selectedCreatives.includes(creative)) {
            return true;
          }

          // Vérifier si le nom sélectionné est contenu dans le nom de la tâche
          return filters.selectedCreatives.some((selectedName) => {
            if (
              typeof creative === "string" &&
              typeof selectedName === "string"
            ) {
              return (
                creative.toLowerCase().includes(selectedName.toLowerCase()) ||
                selectedName.toLowerCase().includes(creative.toLowerCase())
              );
            }
            return false;
          });
        });

        if (!hasMatchingCreative) return false;
      }

      // Filtre par clients
      if (filters.selectedClients.length > 0) {
        const taskClient = Array.isArray(task.client)
          ? task.client[0]
          : task.client;

        if (!filters.selectedClients.includes(taskClient)) return false;
      }

      // Filtre par projets
      if (filters.selectedProjects.length > 0) {
        if (!filters.selectedProjects.includes(task.projectName)) return false;
      }

      // Filtre tâches terminées
      if (!filters.showCompleted) {
        const completedStatuses = ["Terminé", "Completed", "Done", "Fini"];
        if (completedStatuses.includes(task.status)) return false;
      }

      return true;
    });
  }, [state.tasks, filters]);

  // Charger les données initiales
  useEffect(() => {
    loadReferenceData();
    loadUnassignedTasks();

    // Charger les tâches pour la semaine courante
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

    const startDate = startOfWeek.toISOString().split("T")[0];
    const endDate = endOfWeek.toISOString().split("T")[0];

    console.log("🗓️ Loading initial tasks for current week:", {
      startDate,
      endDate,
    });
    loadTasksForPeriod(startDate, endDate);
  }, [loadReferenceData, loadUnassignedTasks, loadTasksForPeriod]);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      cacheManager.clear();
    };
  }, [cacheManager]);

  return {
    // État
    tasks: filteredTasks,
    unassignedTasks: state.unassignedTasks,
    users: state.users,
    clients: state.clients,
    projects: state.projects,
    statusOptions: state.statusOptions,
    preferences: state.preferences,
    clientColors: state.clientColors,
    loading: state.loading,
    updating: state.updating,
    initialLoading: state.initialLoading,
    error: state.error,

    // Filtres
    filters,
    setFilters,

    // Actions
    loadTasksForPeriod: debouncedLoadTasks,
    createTask,
    updateTask: throttledUpdateTask,
    savePreferences,
    saveClientColors,
    loadUnassignedTasks,

    // Utilitaires
    clearCache: cacheManager.clear,
  };
};
