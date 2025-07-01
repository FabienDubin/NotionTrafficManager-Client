import React, { useRef, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import "@/styles/calendar.css";

const CalendarView = ({
  tasks,
  onTaskClick,
  onTaskUpdate,
  onDatesSet,
  onTaskUpdated,
  onDateSelect,
  onTaskDrop,
  defaultView = "timeGridWeek",
}) => {
  const calendarRef = useRef(null);

  // Fonction pour mettre à jour un événement spécifique ou gérer les opérations spéciales
  const updateEvent = (taskIdOrEvent, updates) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();

      // Gestion des opérations spéciales pour createTaskOptimistic
      if (typeof taskIdOrEvent === "object" && taskIdOrEvent.id) {
        // Ajouter un nouvel événement temporaire
        const newEvent = calendarApi.addEvent(taskIdOrEvent);
        console.log(
          "✅ Temporary event added to FullCalendar:",
          taskIdOrEvent.id
        );
        return true;
      }

      // Gestion des mises à jour d'ID (remplacement d'événement temporaire)
      if (updates && updates.oldId && updates.newId) {
        const oldEvent = calendarApi.getEventById(updates.oldId);
        if (oldEvent) {
          oldEvent.remove();
          const newEventData = {
            id: updates.newId,
            title: updates.title || oldEvent.title,
            start: oldEvent.start,
            end: oldEvent.end,
            backgroundColor:
              updates.backgroundColor || oldEvent.backgroundColor,
            borderColor: updates.borderColor || oldEvent.borderColor,
            textColor: updates.textColor || oldEvent.textColor,
            extendedProps: updates.extendedProps || oldEvent.extendedProps,
          };
          calendarApi.addEvent(newEventData);
          console.log(
            "✅ Event ID updated in FullCalendar:",
            updates.oldId,
            "→",
            updates.newId
          );
          return true;
        }
        return false;
      }

      // Gestion de la suppression d'événement
      if (updates && updates.removeId) {
        const event = calendarApi.getEventById(updates.removeId);
        if (event) {
          event.remove();
          console.log("✅ Event removed from FullCalendar:", updates.removeId);
          return true;
        }
        return false;
      }

      // Gestion normale des mises à jour d'événement existant
      const taskId = taskIdOrEvent;
      const event = calendarApi.getEventById(taskId);

      if (event) {
        // Mettre à jour les propriétés de l'événement
        if (updates.title !== undefined) {
          event.setProp("title", updates.title);
        }

        if (updates.backgroundColor !== undefined) {
          event.setProp("backgroundColor", updates.backgroundColor);
          event.setProp("borderColor", updates.backgroundColor);
        }

        if (updates.start !== undefined || updates.end !== undefined) {
          event.setDates(
            updates.start || event.start,
            updates.end || event.end
          );
        }

        // Mettre à jour les propriétés étendues
        if (updates.extendedProps) {
          event.setExtendedProp("originalTask", {
            ...event.extendedProps.originalTask,
            ...updates.extendedProps,
          });
        }

        console.log("✅ Event updated directly in FullCalendar:", {
          taskId,
          updates,
        });
        return true;
      }
    }
    return false;
  };

  // Exposer la fonction updateEvent via onTaskUpdated
  React.useEffect(() => {
    if (onTaskUpdated) {
      onTaskUpdated(updateEvent);
    }
  }, [onTaskUpdated]);

  // Initialiser Draggable pour les TaskCards externes
  useEffect(() => {
    console.log("🎯 Initializing Draggable for external TaskCards");

    // Initialiser Draggable sur tous les éléments .task-card
    const draggableInstance = new Draggable(document.body, {
      itemSelector: ".task-card",
      eventData: function (eventEl) {
        // Récupérer les données de la tâche depuis l'attribut data-task
        try {
          const taskData = JSON.parse(eventEl.dataset.task || "{}");
          console.log("🎯 Draggable eventData:", taskData);

          return {
            title: taskData.name || "Tâche sans nom",
            duration: "02:00:00", // 2 heures par défaut
            backgroundColor: taskData.clientColor || "#6366f1",
            borderColor: taskData.clientColor || "#6366f1",
            textColor: "#ffffff",
            create: true, // IMPORTANT: Permet à FullCalendar de créer l'événement
            extendedProps: {
              originalTask: taskData,
            },
          };
        } catch (error) {
          console.error("❌ Error parsing task data for Draggable:", error);
          return {
            title: "Erreur de données",
            duration: "02:00:00",
            create: true,
          };
        }
      },
    });

    console.log("✅ Draggable initialized:", draggableInstance);

    // Cleanup function
    return () => {
      if (draggableInstance) {
        draggableInstance.destroy();
        console.log("🧹 Draggable destroyed");
      }
    };
  }, []); // Exécuter une seule fois au montage

  // Fonction pour arrondir à l'heure la plus proche (créneaux de 15 minutes)
  const roundToQuarterHour = (date) => {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    const remainder = minutes % 15;

    if (remainder !== 0) {
      rounded.setMinutes(minutes - remainder);
    }
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);

    return rounded;
  };

  // Configuration FullCalendar
  const calendarConfig = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: defaultView,
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "timeGridWeek,dayGridMonth",
    },
    views: {
      timeGridWeek: {
        titleFormat: { year: "numeric", month: "short", day: "numeric" },
        slotMinTime: "09:00:00",
        slotMaxTime: "20:00:00",
        slotDuration: "00:15:00", // Créneaux de 15 minutes
        snapDuration: "00:15:00", // Alignement sur 15 minutes
        slotLabelInterval: "01:00:00", // Labels d'heure toutes les heures
        allDaySlot: true,
      },
      dayGridMonth: {
        titleFormat: { year: "numeric", month: "long" },
        dayMaxEvents: 3,
        moreLinkClick: "popover",
      },
    },
    height: "95%",
    locale: "fr",
    firstDay: 1, // Lundi
    weekends: true,
    editable: true,
    droppable: true, // Permettre le drop externe
    dropAccept: ".task-card", // Accepter seulement nos TaskCard
    eventResizableFromStart: true,
    eventDurationEditable: true,
    eventStartEditable: true,
    selectable: true, // Permettre la sélection de zones
    selectMirror: true, // Afficher un aperçu pendant la sélection

    // Événements
    events: tasks.map((task) => ({
      id: task.id,
      title: task.title || task.name,
      start: task.start || task.workPeriod?.start,
      end: task.end || task.workPeriod?.end,
      backgroundColor: task.clientColor || "#6366f1",
      borderColor: task.clientColor || "#6366f1",
      textColor: "#ffffff",
      extendedProps: {
        ...task.extendedProps,
        originalTask: task,
      },
    })),

    // Gestionnaires d'événements
    eventClick: (info) => {
      info.jsEvent.preventDefault();
      const task = info.event.extendedProps.originalTask;
      if (onTaskClick) {
        onTaskClick(task);
      }
    },

    datesSet: (dateInfo) => {
      if (onDatesSet) {
        onDatesSet(dateInfo);
      }
    },

    eventDidMount: (info) => {
      // Personnaliser l'affichage des événements
      const { event } = info;
      const { originalTask } = event.extendedProps;

      // Ajouter des informations supplémentaires
      if (originalTask) {
        const element = info.el;

        // Forcer l'application des couleurs avec des variables CSS
        const backgroundColor =
          event.backgroundColor || originalTask.clientColor || "#6366f1";
        const borderColor =
          event.borderColor || originalTask.clientColor || "#6366f1";

        element.style.setProperty("--event-bg-color", backgroundColor);
        element.style.setProperty("--event-border-color", borderColor);
        element.style.backgroundColor = backgroundColor;
        element.style.borderColor = borderColor;
        element.style.color = "#ffffff";

        // Ajouter une classe CSS personnalisée selon le statut
        if (originalTask.status) {
          const statusClass = `task-status-${originalTask.status
            .toLowerCase()
            .replace(/\s+/g, "-")}`;
          element.classList.add(statusClass);
        }

        // Tooltip avec informations détaillées
        element.title = [
          originalTask.name,
          originalTask.client
            ? `Client: ${
                Array.isArray(originalTask.client)
                  ? originalTask.client[0]
                  : originalTask.client
              }`
            : "",
          originalTask.assignedUsersNames
            ? `Assigné à: ${
                Array.isArray(originalTask.assignedUsersNames)
                  ? originalTask.assignedUsersNames.join(", ")
                  : originalTask.assignedUsersNames
              }`
            : "",
          originalTask.status ? `Statut: ${originalTask.status}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    },

    // Gestion du déplacement d'événements (drag & drop)
    eventDrop: (info) => {
      const { event } = info;
      const originalTask = event.extendedProps.originalTask;

      if (onTaskUpdate && originalTask) {
        const updates = {
          workPeriod: {
            start: event.start.toISOString(),
            end: event.end
              ? event.end.toISOString()
              : event.start.toISOString(),
          },
        };

        console.log("📅 Task moved:", {
          taskId: originalTask.id,
          newStart: event.start,
          newEnd: event.end,
          updates,
        });

        onTaskUpdate(originalTask.id, updates).catch((error) => {
          console.error("Failed to update task:", error);
          // Revenir à la position précédente en cas d'erreur
          info.revert();
        });
      }
    },

    // Gestion du redimensionnement d'événements
    eventResize: (info) => {
      const { event } = info;
      const originalTask = event.extendedProps.originalTask;

      if (onTaskUpdate && originalTask) {
        const updates = {
          workPeriod: {
            start: event.start.toISOString(),
            end: event.end
              ? event.end.toISOString()
              : event.start.toISOString(),
          },
        };

        console.log("📏 Task resized:", {
          taskId: originalTask.id,
          newStart: event.start,
          newEnd: event.end,
          updates,
        });

        onTaskUpdate(originalTask.id, updates).catch((error) => {
          console.error("Failed to update task:", error);
          // Revenir à la taille précédente en cas d'erreur
          info.revert();
        });
      }
    },

    // Gestion de la sélection de zone pour créer une nouvelle tâche
    select: (selectInfo) => {
      console.log("📅 Date range selected:", {
        start: selectInfo.start,
        end: selectInfo.end,
        allDay: selectInfo.allDay,
      });

      if (onDateSelect) {
        onDateSelect({
          startDate: selectInfo.start.toISOString(),
          endDate: selectInfo.end.toISOString(),
          allDay: selectInfo.allDay,
        });
      }

      // Désélectionner après traitement
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.unselect();
      }
    },

    // Gestionnaire FullCalendar pour les événements créés par drop externe
    eventReceive: (info) => {
      console.log("📅 FullCalendar eventReceive:", { info });

      // L'événement a été créé automatiquement par FullCalendar
      const event = info.event;
      const taskData = event.extendedProps.originalTask;

      if (!taskData || !taskData.id) {
        console.error("❌ No task data found in received event");
        event.remove();
        return;
      }

      // Calculer les dates avec alignement 15min
      const startDate = roundToQuarterHour(event.start);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2h

      // Mettre à jour l'événement avec les dates arrondies
      event.setDates(startDate, endDate);

      // Mettre à jour les propriétés étendues avec les nouvelles dates
      event.setExtendedProp("originalTask", {
        ...taskData,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        workPeriod: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });

      console.log("🕐 FullCalendar eventReceive times:", {
        original: event.start,
        rounded: startDate,
        end: endDate,
      });

      console.log(
        "✅ Event received and adjusted by FullCalendar - KEEPING EVENT VISIBLE"
      );

      // NE PAS SUPPRIMER L'ÉVÉNEMENT - le laisser visible pendant la synchronisation
      // Synchroniser avec le serveur en arrière-plan
      if (onTaskDrop) {
        onTaskDrop(taskData, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }).catch((error) => {
          console.error(
            "❌ FullCalendar eventReceive server sync failed, rolling back:",
            error
          );
          // Rollback en cas d'erreur - MAINTENANT on supprime
          event.remove();
          // Le toast d'erreur sera géré par le composant parent
        });
      }
    },

    // Style des événements
    eventContent: (arg) => {
      const { event } = arg;
      const { originalTask } = event.extendedProps;

      return {
        html: `
          <div class="fc-event-content-custom">
            <div class="fc-event-title-custom">${event.title}</div>
            ${
              originalTask?.client
                ? `<div class="fc-event-client">${
                    Array.isArray(originalTask.client)
                      ? originalTask.client[0]
                      : originalTask.client
                  }</div>`
                : ""
            }
            ${
              originalTask?.assignedUsersNames
                ? `<div class="fc-event-assignee">${
                    Array.isArray(originalTask.assignedUsersNames)
                      ? originalTask.assignedUsersNames.join(", ")
                      : originalTask.assignedUsersNames
                  }</div>`
                : ""
            }
          </div>
        `,
      };
    },

    // Personnalisation des boutons
    customButtons: {
      // Bouton pour actualiser
      refresh: {
        text: "Actualiser",
        click: () => {
          if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            const currentRange = calendarApi.view.currentRange;
            if (onDatesSet) {
              onDatesSet({
                start: currentRange.start,
                end: currentRange.end,
              });
            }
          }
        },
      },
    },
  };

  return (
    <div className="h-full p-4 pb-10">
      <FullCalendar ref={calendarRef} {...calendarConfig} />
    </div>
  );
};

export default CalendarView;
