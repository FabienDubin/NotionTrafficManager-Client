import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { debounce, throttle } from "lodash";
import calendarService from "../services/calendar.service";
import { toast } from "sonner";

export const useCalendar = () => {
  const abortController = useRef(null);

  const [state, setState] = useState({
    tasks: [],
    unassignedTasks: [],
    users: [],
    clients: [],
    projects: [],
    statusOptions: [],
    teams: [], // Ajout des équipes
    preferences: null,
    clientColors: [],
    loading: false,
    updating: false,
    initialLoading: true,
    error: null,
    cache: new Map(),
  });

  const defaultFilters = {
    selectedCreatives: [],
    selectedClients: [],
    selectedProjects: [],
    selectedTeams: [], // Ajout du filtre équipe
    showCompleted: true,
  };

  const [filters, setFilters] = useState(defaultFilters);

  // Ajout : pour accès facile aux équipes sélectionnées
  const selectedTeams = filters.selectedTeams || [];

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

          toast("🚨 Erreur", {
            description: "Impossible de charger les tâches",
            variant: "error",
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
      toast("🚨 Erreur", {
        description: "Impossible de charger les tâches non assignées",
        variant: "error",
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

        toast("Succès", {
          description: "Nouvelle tâche créée avec succès",
          variant: "success",
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

        toast("🚨 Erreur", {
          description: `Impossible de créer la tâche: ${error.message}`,
          variant: "error",
        });

        throw error;
      }
    },
    [cacheManager, toast]
  );

  // Créer une nouvelle tâche avec UX optimisée (affichage immédiat)
  const createTaskOptimistic = useCallback(
    async (taskData, calendarUpdateFn, options = {}) => {
      console.log("🔄 Starting optimistic task creation:", taskData);

      const { showSuccessToast = true, showProgressToast = true } = options;

      // Générer un ID temporaire pour la nouvelle tâche
      const tempId = `temp-${Date.now()}`;
      let tempTask = null;
      let calendarUpdated = false;

      // Toast de progression si demandé
      if (showProgressToast) {
        toast("Création en cours...", {
          description: "📡 Synchronisation avec Notion",
        });
      }

      try {
        // Créer la tâche temporaire pour affichage immédiat
        tempTask = {
          id: tempId,
          name: taskData.name,
          title: taskData.name,
          start: taskData.startDate,
          end: taskData.endDate,
          workPeriod: {
            start: taskData.startDate,
            end: taskData.endDate,
          },
          status: taskData.status || "Pas commencé",
          assignedUsers: taskData.assignedUsers || [],
          assignedUsersNames: taskData.assignedUsers
            ? taskData.assignedUsers.map((userId) => {
                const user = state.users.find((u) => u.id === userId);
                return user ? user.name : userId;
              })
            : [],
          project: taskData.projectId ? [taskData.projectId] : [],
          projectName: taskData.projectId
            ? state.projects.find((p) => p.id === taskData.projectId)?.name
            : "",
          client: taskData.projectId
            ? state.projects.find((p) => p.id === taskData.projectId)?.client
            : "",
          clientColor: taskData.projectId
            ? (() => {
                const project = state.projects.find(
                  (p) => p.id === taskData.projectId
                );
                if (project && project.client) {
                  const clientName = Array.isArray(project.client)
                    ? project.client[0]
                    : project.client;
                  const resolvedClientName =
                    state.clients.find((c) => c.id === clientName)?.name ||
                    clientName;
                  const clientColor = state.clientColors.find(
                    (cc) => cc.clientName === resolvedClientName
                  );
                  return clientColor?.color || "#6366f1";
                }
                return "#6366f1";
              })()
            : "#6366f1",
          notes: taskData.notes || "",
          commentaire: taskData.notes || "",
          _saving: true, // Marquer comme en cours de sauvegarde
          _isTemp: true, // Marquer comme temporaire
        };

        // Ajouter immédiatement la tâche à l'état local
        setState((prev) => ({
          ...prev,
          tasks: [...prev.tasks, tempTask],
        }));

        // Mettre à jour FullCalendar si la fonction est disponible
        if (calendarUpdateFn) {
          const calendarEvent = {
            id: tempId,
            title: tempTask.name,
            start: tempTask.start,
            end: tempTask.end,
            backgroundColor: tempTask.clientColor,
            borderColor: tempTask.clientColor,
            textColor: "#ffffff",
            extendedProps: {
              originalTask: tempTask,
            },
          };

          calendarUpdated = calendarUpdateFn(calendarEvent);
          console.log("📅 Temporary task added to calendar:", {
            tempId,
            success: calendarUpdated,
          });
        }

        console.log("✅ Temporary task added to state immediately:", tempId);

        // Appel API en arrière-plan
        console.log("📡 Calling API to create task in Notion (background)...");
        const response = await calendarService.createTask(taskData);
        console.log("✅ API call successful:", response);

        const newTask = response.data;

        // Remplacer la tâche temporaire par la vraie tâche
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (task.id === tempId) {
              const finalTask = {
                ...newTask,
                _saving: false,
                _isTemp: false,
              };
              delete finalTask._saving;
              delete finalTask._isTemp;
              return finalTask;
            }
            return task;
          }),
        }));

        // Mettre à jour FullCalendar avec les vraies données
        if (calendarUpdateFn && newTask) {
          calendarUpdateFn({
            oldId: tempId,
            newId: newTask.id,
            title: newTask.name || newTask.title,
            backgroundColor: newTask.clientColor,
            borderColor: newTask.clientColor,
            extendedProps: {
              originalTask: newTask,
            },
          });
          console.log("📅 Calendar updated with real task data:", newTask.id);
        }

        // Invalider le cache
        cacheManager.clear();

        if (showSuccessToast) {
          toast("Succès", {
            description: "Nouvelle tâche créée avec succès 😎",
          });
        }

        console.log("✅ Task creation completed successfully:", newTask.id);
        return newTask;
      } catch (error) {
        console.error("❌ Error creating task:", error);

        // Rollback : supprimer la tâche temporaire
        if (tempTask) {
          console.log("🔄 Rolling back temporary task due to error");
          setState((prev) => ({
            ...prev,
            tasks: prev.tasks.filter((task) => task.id !== tempId),
          }));

          // Rollback calendar si nécessaire
          if (calendarUpdated && calendarUpdateFn) {
            calendarUpdateFn({ removeId: tempId });
          }
        }

        toast("Erreur de création", {
          description: `Impossible de créer la tâche: ${error.message}`,
          variant: "error",
        });

        throw error;
      }
    },
    [
      cacheManager,
      toast,
      state.users,
      state.projects,
      state.clients,
      state.clientColors,
    ]
  );

  // Mettre à jour une tâche avec UX optimisée (fermeture immédiate)
  const updateTaskOptimistic = useCallback(
    async (taskId, updates, calendarUpdateFn, options = {}) => {
      console.log("🔄 Starting optimistic task update:", { taskId, updates });

      const { showSuccessToast = true, showProgressToast = true } = options;

      // Sauvegarder l'état original pour le rollback
      let originalTask = null;
      let calendarUpdated = false;

      // Toast de progression si demandé
      if (showProgressToast) {
        toast("Sauvegarde en cours...", {
          description: "📡 Synchronisation avec Notion",
        });
      }

      try {
        // Mise à jour optimiste immédiate
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

          // Appliquer TOUJOURS les changements de dates immédiatement (correction problèmes 2 & 3)
          if (updates.startDate || updates.endDate || updates.workPeriod) {
            if (updates.workPeriod) {
              // Drag & drop / redimensionnement
              mergedTask.start = updates.workPeriod.start;
              mergedTask.end = updates.workPeriod.end;
              mergedTask.workPeriod = updates.workPeriod;
              console.log("🎯 Applying drag & drop date update immediately");
            } else {
              // TaskEditSheet - appliquer TOUJOURS immédiatement avec les dates exactes
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
              console.log(
                "📅 Applying TaskEditSheet date update immediately:",
                {
                  startDate: updates.startDate,
                  endDate: updates.endDate,
                  mergedStart: mergedTask.start,
                  mergedEnd: mergedTask.end,
                }
              );
            }
          }

          if (updates.status !== undefined) {
            mergedTask.status = updates.status;
          }

          if (updates.notes !== undefined) {
            mergedTask.notes = updates.notes;
            mergedTask.commentaire = updates.notes;
          }

          if (updates.projectId !== undefined) {
            mergedTask.project = [updates.projectId];
          }

          if (updates.assignedUsers !== undefined) {
            mergedTask.assignedUsers = updates.assignedUsers;

            // 🔁 Recalculer les noms des utilisateurs assignés
            mergedTask.assignedUsersNames = updates.assignedUsers.map(
              (userId) => {
                const user = prev.users.find((u) => u.id === userId);
                return user ? user.name : userId;
              }
            );
          }

          // Marquer la tâche comme en cours de sauvegarde
          mergedTask._saving = true;

          updatedTasks[taskIndex] = mergedTask;

          console.log("✅ Task updated locally (optimistic):", {
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
        // MAIS seulement si nécessaire pour éviter les décalages temporaires
        if (calendarUpdateFn) {
          const calendarUpdates = {};
          let needsCalendarUpdate = false;

          if (updates.name !== undefined) {
            calendarUpdates.title = updates.name;
            needsCalendarUpdate = true;
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
                  needsCalendarUpdate = true;
                }
              }
              return prev;
            });
          }

          // Appliquer TOUJOURS les changements de dates à FullCalendar immédiatement
          if (updates.workPeriod) {
            // Drag & drop / redimensionnement
            calendarUpdates.start = updates.workPeriod.start;
            calendarUpdates.end = updates.workPeriod.end;
            needsCalendarUpdate = true;
            console.log("🎯 Updating FullCalendar for drag & drop operation");
          } else if (updates.startDate || updates.endDate) {
            // TaskEditSheet - appliquer TOUJOURS immédiatement
            calendarUpdates.start = updates.startDate || originalTask?.start;
            calendarUpdates.end = updates.endDate || originalTask?.end;
            needsCalendarUpdate = true;
            console.log(
              "📅 Updating FullCalendar for TaskEditSheet immediately"
            );
          }

          // Gérer les changements d'assignation immédiatement
          if (updates.assignedUsers !== undefined) {
            needsCalendarUpdate = true;
            console.log("👥 Updating FullCalendar for assignedUsers change");
          }

          // Mettre à jour les propriétés étendues pour l'affichage
          if (needsCalendarUpdate) {
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
          } else {
            console.log("📅 No calendar update needed - no visual changes");
          }
        }

        // Appel API en arrière-plan (non bloquant)
        console.log("📡 Calling API to sync with Notion (background)...");
        const response = await calendarService.updateTask(taskId, updates);
        console.log("✅ API call successful:", response);

        const updatedTask = response.data;

        // Finaliser la mise à jour avec les données du serveur
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (task.id === taskId) {
              const finalTask =
                updatedTask && updatedTask.id
                  ? { ...task, ...updatedTask }
                  : task;

              // Retirer le flag de sauvegarde
              delete finalTask._saving;
              return finalTask;
            }
            return task;
          }),
        }));

        // Si la tâche était non assignée et maintenant assignée, recharger les tâches non assignées
        if (updates.workPeriod || updates.startDate || updates.endDate) {
          console.log("🔄 Task assigned, reloading unassigned tasks");
          loadUnassignedTasks().catch((error) => {
            console.warn("⚠️ Failed to reload unassigned tasks:", error);
          });
        }

        // Invalidation sélective du cache au lieu de clear() complet
        const cacheKeysToInvalidate = [];
        if (updates.startDate || updates.endDate || updates.workPeriod) {
          // Invalider seulement les caches de tâches qui pourraient être affectés
          const startDate = updates.startDate || updates.workPeriod?.start;
          const endDate = updates.endDate || updates.workPeriod?.end;
          if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Invalider la semaine de la nouvelle période
            const weekStart = new Date(start);
            weekStart.setDate(start.getDate() - start.getDay() + 1);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const cacheKey = `tasks-${weekStart.toISOString().split("T")[0]}-${
              weekEnd.toISOString().split("T")[0]
            }`;
            cacheKeysToInvalidate.push(cacheKey);
          }
        }

        // Invalider seulement les clés nécessaires
        cacheKeysToInvalidate.forEach((key) => {
          if (cacheManager.cache.has(key)) {
            cacheManager.cache.delete(key);
            console.log("🗑️ Invalidated cache key:", key);
          }
        });

        if (showSuccessToast) {
          toast("Succès", {
            description: "Tâche sauvegardée avec succès 🥳",
            variant: "success",
          });
        }

        return updatedTask || originalTask;
      } catch (error) {
        console.error("❌ Error updating task:", error);

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

        toast("🚨 Erreur de sauvegarde", {
          description: `Impossible de sauvegarder: ${error.message}`,
          variant: "error",
        });

        throw error;
      }
    },
    [cacheManager, toast, loadUnassignedTasks]
  );

  // Version throttled pour la compatibilité (drag & drop, etc.)
  const throttledUpdateTask = throttle(updateTaskOptimistic, 1000);

  // Supprimer une tâche avec UX simplifiée (pas de suppression optimiste)
  const deleteTask = useCallback(
    async (taskId, options = {}) => {
      console.log("🗑️ Starting task deletion:", taskId);

      const { showSuccessToast = true, showProgressToast = false } = options;

      // Toast de progression si demandé
      if (showProgressToast) {
        toast("Suppression en cours...", {
          description: "📡 Synchronisation avec Notion",
        });
      }

      try {
        // Appel API direct SANS suppression optimiste pour éviter les conflits d'état
        console.log("📡 Calling API to delete task in Notion...");
        await calendarService.deleteTask(taskId);
        console.log("✅ API call successful - task deleted");

        // Suppression de l'état local seulement APRÈS succès de l'API
        setState((prev) => {
          const updatedTasks = prev.tasks.filter((task) => task.id !== taskId);
          console.log("✅ Task removed from state after API success:", taskId);

          return {
            ...prev,
            tasks: updatedTasks,
          };
        });

        // Recharger les tâches non assignées au cas où la tâche supprimée était assignée
        loadUnassignedTasks().catch((error) => {
          console.warn("⚠️ Failed to reload unassigned tasks:", error);
        });

        // Invalidation simple du cache
        cacheManager.clear();
        console.log("🗑️ Cache cleared after task deletion");

        if (showSuccessToast) {
          toast("Succès", {
            description: "Tâche supprimée avec succès",
            variant: "success",
          });
        }

        console.log("✅ Task deletion completed successfully:", taskId);
        return true;
      } catch (error) {
        console.error("❌ Error deleting task:", error);

        // Pas de rollback nécessaire car pas de suppression optimiste
        toast("🚨 Erreur de suppression", {
          description: `Impossible de supprimer la tâche: ${error.message}`,
          variant: "error",
        });

        throw error;
      }
    },
    [cacheManager, toast, loadUnassignedTasks]
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
        teamsRes,
        preferencesRes,
        colorsRes,
      ] = await Promise.all([
        calendarService.getUsers(),
        calendarService.getClients(),
        calendarService.getProjects(),
        calendarService.getStatusOptions(),
        calendarService.getTeams(),
        calendarService.getUserPreferences(),
        calendarService.getClientColors(),
      ]);

      console.log("✅ Reference data loaded:", {
        users: usersRes.data?.length,
        clients: clientsRes.data?.length,
        projects: projectsRes.data?.length,
        statusOptions: statusRes.data?.length,
        teams: teamsRes.data?.length,
        preferences: !!preferencesRes.data,
        clientColors: colorsRes.data?.length,
      });

      setState((prev) => ({
        ...prev,
        users: usersRes.data || [],
        clients: clientsRes.data || [],
        projects: projectsRes.data || [],
        statusOptions: statusRes.data || [],
        teams: teamsRes.data || [],
        preferences: preferencesRes.data,
        clientColors: colorsRes.data || [],
        initialLoading: false,
      }));

      // Appliquer les filtres des préférences
      if (preferencesRes.data?.filterPreferences) {
        const merged = {
          ...defaultFilters,
          ...preferencesRes.data.filterPreferences,
        };

        if (typeof merged.showCompleted !== "boolean") {
          merged.showCompleted = true;
        }

        setFilters(merged);
        console.log("📦 Filters loaded:", merged);
        console.log("filters:", merged);
      }
    } catch (error) {
      console.error("❌ Error loading reference data:", error);
      setState((prev) => ({
        ...prev,
        initialLoading: false,
        error: error.message,
      }));
      toast("🚨 Erreur", {
        description: "Impossible de charger les données de référence",
        variant: "error",
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

        toast("Youhou 🥳", {
          description: "Préférences sauvegardées",
          variant: "success",
        });
      } catch (error) {
        console.error("Error saving preferences:", error);
        toast("🚨 Erreur", {
          description: "Impossible de sauvegarder les préférences",
          variant: "error",
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

        toast("Youhou 🥳", {
          description: "Couleurs sauvegardées",
          variant: "success",
        });
      } catch (error) {
        console.error("Error saving client colors:", error);
        toast("🚨 Erreur", {
          description: "Impossible de sauvegarder les couleurs",
          variant: "error",
        });
      }
    },
    [cacheManager, toast]
  );

  // Filtrer les tâches
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((task) => {
      const taskUserIds = Array.isArray(task.assignedUsers)
        ? task.assignedUsers
        : [task.assignedUsers].filter(Boolean);

      // 1. Filtre par équipes (intersection logique ET avec filtre personnes si activé)
      if (selectedTeams.length > 0) {
        // Trouver les users de la tâche
        const taskUsers = state.users.filter((user) =>
          taskUserIds.includes(user.id)
        );

        // Vérifier si au moins un user appartient à une équipe sélectionnée
        const hasUserFromSelectedTeams = taskUsers.some((user) => {
          // Récupérer les IDs d'équipe de l'utilisateur (user.team est un tableau d'IDs)
          const userTeamIds = user.team || [];

          // Vérifier si l'une des équipes sélectionnées correspond
          return selectedTeams.some((teamName) => {
            // Trouver l'ID de l'équipe correspondant au nom
            const team = state.teams.find((t) => t.name === teamName);
            return team && userTeamIds.includes(team.id);
          });
        });

        if (!hasUserFromSelectedTeams) return false;
      }

      // 2. Filtre par créatifs (indépendant)
      if (filters.selectedCreatives.length > 0) {
        const hasMatchingCreative = taskUserIds.some((userId) =>
          filters.selectedCreatives.includes(userId)
        );
        if (!hasMatchingCreative) return false;
      }

      // 3. Filtre par clients (utilise maintenant les IDs)
      if (filters.selectedClients.length > 0) {
        // Trouver l'ID du client de la tâche
        const taskClientName = Array.isArray(task.client)
          ? task.client[0]
          : task.client;

        const taskClientId = state.clients.find(
          (client) => client.name === taskClientName
        )?.id;

        if (!taskClientId || !filters.selectedClients.includes(taskClientId)) {
          return false;
        }
      }

      // 4. Filtre par projets (utilise maintenant les IDs)
      if (filters.selectedProjects.length > 0) {
        const taskProjectIds = Array.isArray(task.project)
          ? task.project
          : [task.project].filter(Boolean);

        const hasMatchingProject = taskProjectIds.some((projectId) =>
          filters.selectedProjects.includes(projectId)
        );

        if (!hasMatchingProject) return false;
      }

      // 5. Filtre tâches terminées
      if (!filters.showCompleted) {
        const completedStatuses = ["Terminé", "Completed", "Done", "Fini"];
        if (completedStatuses.includes(task.status)) return false;
      }

      return true;
    });
  }, [
    state.tasks,
    filters,
    state.clients,
    state.users,
    state.teams,
    selectedTeams,
  ]);

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

  // Fonction pour recharger le calendrier (tâches + données de référence)
  const reloadCalendar = useCallback(async () => {
    console.log("🔄 Reloading calendar data...");

    // Vider le cache pour forcer le rechargement
    cacheManager.clear();

    // Recharger les données de référence
    await loadReferenceData();

    // Recharger les tâches non assignées
    await loadUnassignedTasks();

    // Recharger les tâches pour la période courante
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

    const startDate = startOfWeek.toISOString().split("T")[0];
    const endDate = endOfWeek.toISOString().split("T")[0];

    await loadTasksForPeriod(startDate, endDate);

    console.log("✅ Calendar data reloaded");
  }, [
    cacheManager,
    loadReferenceData,
    loadUnassignedTasks,
    loadTasksForPeriod,
  ]);

  // Fonction pour ajouter une tâche directement au calendrier
  const addTaskToCalendar = useCallback((task) => {
    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));
    console.log("✅ Task added to calendar state:", task.id);
  }, []);

  // Fonction pour retirer une tâche du calendrier
  const removeTaskFromCalendar = useCallback((taskId) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
    console.log("✅ Task removed from calendar state:", taskId);
  }, []);

  // Fonction pour mettre à jour une tâche dans le calendrier
  const updateTaskInCalendar = useCallback((taskId, updates) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
    console.log("✅ Task updated in calendar state:", taskId, updates);
  }, []);

  // Vérifier les chevauchements de tâches
  const checkTaskOverlap = useCallback(async (assignedUsers, startDate, endDate, excludeTaskId) => {
    try {
      console.log("🔍 Checking task overlap:", {
        assignedUsers,
        startDate,
        endDate,
        excludeTaskId,
      });

      const response = await calendarService.checkTaskOverlap({
        assignedUsers,
        startDate,
        endDate,
        excludeTaskId,
      });

      console.log("🔍 Overlap check result:", response.data);

      return response.data;
    } catch (error) {
      console.error("❌ Error checking task overlap:", error);
      toast("🚨 Erreur", {
        description: "Impossible de vérifier les chevauchements",
        variant: "error",
      });
      return { hasConflicts: false, conflictMessage: "", conflicts: [] };
    }
  }, []);

  return {
    // État
    tasks: filteredTasks,
    unassignedTasks: state.unassignedTasks,
    users: state.users,
    clients: state.clients,
    projects: state.projects,
    statusOptions: state.statusOptions,
    teams: state.teams,
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
    createTaskOptimistic, // Nouvelle fonction pour création optimisée
    updateTask: throttledUpdateTask,
    updateTaskOptimistic, // Nouvelle fonction pour UX optimisée
    deleteTask, // Nouvelle fonction pour suppression optimisée
    savePreferences,
    saveClientColors,
    loadUnassignedTasks,
    reloadCalendar,

    // Manipulation directe des tâches
    addTaskToCalendar,
    removeTaskFromCalendar,
    updateTaskInCalendar,

    // Vérification des chevauchements
    checkTaskOverlap,

    // Utilitaires
    clearCache: cacheManager.clear,
  };
};
