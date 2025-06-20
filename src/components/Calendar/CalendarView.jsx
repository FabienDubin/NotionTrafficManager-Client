import React, { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Droppable } from "@hello-pangea/dnd";

const CalendarView = ({
  tasks,
  onTaskClick,
  onTaskUpdate,
  onDatesSet,
  onTaskUpdated,
  onDateSelect,
  defaultView = "timeGridWeek",
}) => {
  const calendarRef = useRef(null);

  // Fonction pour mettre à jour un événement spécifique
  const updateEvent = (taskId, updates) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
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
        slotMinTime: "08:00:00",
        slotMaxTime: "20:00:00",
        allDaySlot: true,
      },
      dayGridMonth: {
        titleFormat: { year: "numeric", month: "long" },
        dayMaxEvents: 3,
        moreLinkClick: "popover",
      },
    },
    height: "100%",
    locale: "fr",
    firstDay: 1, // Lundi
    weekends: true,
    editable: true,
    droppable: true,
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

    // Gestion du drop externe
    drop: (info) => {
      // Cette fonction sera appelée quand on drop une tâche depuis la sidebar
      console.log("Task dropped on calendar:", info);
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

  // Styles CSS personnalisés pour les événements
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .fc-event-content-custom {
        padding: 2px 4px;
        font-size: 12px;
        line-height: 1.2;
      }
      
      .fc-event-title-custom {
        font-weight: 600;
        margin-bottom: 1px;
      }
      
      .fc-event-client {
        font-size: 10px;
        opacity: 0.9;
        margin-bottom: 1px;
      }
      
      .fc-event-assignee {
        font-size: 10px;
        opacity: 0.8;
      }
      
      .task-status-terminé,
      .task-status-pas-commencé,
      .task-status-en-cours,
      .task-status-completed,
      .task-status-done,
      .task-status-fini {
        /* Styles par statut */
      }
      
      .task-status-terminé,
      .task-status-completed,
      .task-status-done,
      .task-status-fini {
        opacity: 0.6;
        text-decoration: line-through;
      }
      
      .task-status-pas-commencé {
        opacity: 0.7;
        border-style: dashed;
      }
      
      .task-status-en-cours {
        border-width: 2px;
        box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
      }
      
      .fc-event {
        cursor: pointer;
        border-radius: 4px;
        border-width: 1px;
        transition: all 0.2s ease;
      }
      
      .fc-event:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      .fc-daygrid-event {
        margin: 1px 0;
      }
      
      .fc-timegrid-event {
        border-radius: 3px;
      }
      
      .fc-toolbar {
        margin-bottom: 1rem;
      }
      
      .fc-toolbar-title {
        font-size: 1.5rem;
        font-weight: 600;
      }
      
      .fc-button {
        background-color: hsl(var(--primary));
        border-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
      }
      
      .fc-button:hover {
        background-color: hsl(var(--primary) / 0.9);
        border-color: hsl(var(--primary) / 0.9);
      }
      
      .fc-button-active {
        background-color: hsl(var(--primary) / 0.8);
        border-color: hsl(var(--primary) / 0.8);
      }
      
      .fc-today {
        background-color: hsl(var(--accent) / 0.1) !important;
      }
      
      .fc-day-header {
        background-color: hsl(var(--muted));
        font-weight: 600;
        padding: 8px 0;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Droppable droppableId="calendar-main">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="h-full p-6"
        >
          <FullCalendar ref={calendarRef} {...calendarConfig} />
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default CalendarView;
