import { useState, useCallback, useRef } from "react";
import calendarService from "../services/calendar.service";

const useTasksCache = () => {
  const [cache, setCache] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(new Set());

  const getCacheKey = (start, end) => `${start}_${end}`;

  const getTasksWithCache = useCallback(
    async (start, end, preload = true, viewType = "month") => {
      const cacheKey = getCacheKey(start, end);

      // Vérifie le cache local d'abord
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      // Évite les requêtes multiples pour la même période
      if (loadingRef.current.has(cacheKey)) {
        // Attend que la requête en cours se termine
        return new Promise((resolve) => {
          const checkCache = () => {
            if (cache.has(cacheKey)) {
              resolve(cache.get(cacheKey));
            } else if (!loadingRef.current.has(cacheKey)) {
              resolve([]);
            } else {
              setTimeout(checkCache, 100);
            }
          };
          checkCache();
        });
      }

      loadingRef.current.add(cacheKey);
      setLoading(true);

      try {
        const tasks = await calendarService.getTasksInPeriod(
          start,
          end,
          preload,
          viewType
        );

        // Met en cache localement
        setCache((prev) => new Map(prev).set(cacheKey, tasks));

        return tasks;
      } catch (error) {
        console.error("Erreur lors du chargement des tâches:", error);
        return [];
      } finally {
        loadingRef.current.delete(cacheKey);
        setLoading(false);
      }
    },
    [cache]
  );

  const getUnassignedTasksWithCache = useCallback(async () => {
    const cacheKey = "unassigned_tasks";

    // Vérifie le cache local d'abord
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    // Évite les requêtes multiples
    if (loadingRef.current.has(cacheKey)) {
      return new Promise((resolve) => {
        const checkCache = () => {
          if (cache.has(cacheKey)) {
            resolve(cache.get(cacheKey));
          } else if (!loadingRef.current.has(cacheKey)) {
            resolve([]);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    loadingRef.current.add(cacheKey);
    setLoading(true);

    try {
      const tasks = await calendarService.getUnassignedTasks();

      // Met en cache localement
      setCache((prev) => new Map(prev).set(cacheKey, tasks));

      return tasks;
    } catch (error) {
      console.error(
        "Erreur lors du chargement des tâches non assignées:",
        error
      );
      return [];
    } finally {
      loadingRef.current.delete(cacheKey);
      setLoading(false);
    }
  }, [cache]);

  const invalidateCache = useCallback(() => {
    setCache(new Map());
    loadingRef.current.clear();
  }, []);

  const invalidateUnassignedCache = useCallback(() => {
    setCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete("unassigned_tasks");
      return newCache;
    });
  }, []);

  const invalidatePeriodCache = useCallback((start, end) => {
    const cacheKey = getCacheKey(start, end);
    setCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(cacheKey);
      return newCache;
    });
  }, []);

  // Précharge les périodes adjacentes en arrière-plan
  const preloadAdjacentPeriods = useCallback(
    async (currentStart, currentEnd, viewType = "month") => {
      const adjacentPeriods = getAdjacentPeriods(
        currentStart,
        currentEnd,
        viewType
      );

      // Précharge en parallèle sans attendre
      adjacentPeriods.forEach((period) => {
        // Ne précharge que si pas déjà en cache
        const cacheKey = getCacheKey(period.start, period.end);
        if (!cache.has(cacheKey) && !loadingRef.current.has(cacheKey)) {
          getTasksWithCache(period.start, period.end, false, viewType).catch(
            (error) => {
              console.warn("Erreur lors du préchargement:", error);
            }
          );
        }
      });
    },
    [cache, getTasksWithCache]
  );

  return {
    getTasksWithCache,
    getUnassignedTasksWithCache,
    loading,
    invalidateCache,
    invalidateUnassignedCache,
    invalidatePeriodCache,
    preloadAdjacentPeriods,
  };
};

// Utilitaire pour calculer les périodes adjacentes
const getAdjacentPeriods = (currentStart, currentEnd, viewType) => {
  const start = new Date(currentStart);
  const end = new Date(currentEnd);
  const periods = [];

  if (viewType === "month") {
    // Mois précédent
    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 1);
    const prevEnd = new Date(end);
    prevEnd.setMonth(prevEnd.getMonth() - 1);

    // Mois suivant
    const nextStart = new Date(start);
    nextStart.setMonth(nextStart.getMonth() + 1);
    const nextEnd = new Date(end);
    nextEnd.setMonth(nextEnd.getMonth() + 1);

    periods.push(
      { start: prevStart.toISOString(), end: prevEnd.toISOString() },
      { start: nextStart.toISOString(), end: nextEnd.toISOString() }
    );
  } else if (viewType === "week") {
    // 2 semaines précédentes
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 14);
    const prevEnd = new Date(end);
    prevEnd.setDate(prevEnd.getDate() - 14);

    // 2 semaines suivantes
    const nextStart = new Date(start);
    nextStart.setDate(nextStart.getDate() + 14);
    const nextEnd = new Date(end);
    nextEnd.setDate(nextEnd.getDate() + 14);

    periods.push(
      { start: prevStart.toISOString(), end: prevEnd.toISOString() },
      { start: nextStart.toISOString(), end: nextEnd.toISOString() }
    );
  }

  return periods;
};

export default useTasksCache;
