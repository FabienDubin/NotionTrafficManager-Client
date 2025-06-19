// CalendarView.jsx
import React, { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

const CalendarView = ({
  events,
  onViewChange,
  onEventClick,
  onTaskDrop,
  loading,
  viewType = "dayGridMonth",
}) => {
  const calendarRef = useRef(null);

  const handleDrop = (info) => {
    const taskId = info.draggedEl.dataset.taskId;
    if (!taskId) return;
    const newPeriod = {
      start: info.date.toISOString(),
      end: info.date.toISOString(),
    };
    onTaskDrop(taskId, newPeriod);
  };

  const handleEventResize = (info) => {
    const taskId = info.event.id;
    const newPeriod = {
      start: info.event.start.toISOString(),
      end: info.event.end
        ? info.event.end.toISOString()
        : info.event.start.toISOString(),
    };
    onTaskDrop(taskId, newPeriod);
  };

  const handleEventDrop = (info) => {
    const taskId = info.event.id;
    const newPeriod = {
      start: info.event.start.toISOString(),
      end: info.event.end
        ? info.event.end.toISOString()
        : info.event.start.toISOString(),
    };
    onTaskDrop(taskId, newPeriod);
  };

  const navigateCalendar = (direction) => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;
    if (direction === "prev") calendarApi.prev();
    else if (direction === "next") calendarApi.next();
    else if (direction === "today") calendarApi.today();
  };

  const changeView = (newViewType) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && calendarApi.view?.type !== newViewType) {
      calendarApi.changeView(newViewType);
    }
  };

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && calendarApi.view?.type !== viewType) {
      calendarApi.changeView(viewType);
    }
  }, [viewType]);

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const { task, users, client, status } = event.extendedProps;
    return (
      <div className="p-1 text-xs overflow-hidden">
        <div className="font-medium truncate">{event.title}</div>
        {users && users.length > 0 && (
          <div className="text-xs opacity-90 truncate">{users.join(", ")}</div>
        )}
        {client && <div className="text-xs opacity-75 truncate">{client}</div>}
        {status && <div className="text-xs opacity-75">{status}</div>}
      </div>
    );
  };

  if (loading && events.length === 0) {
    console.log("loading");
    return (
      <Card className="h-full p-4 animate-pulse">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateCalendar("prev")}
          >
            {" "}
            <ChevronLeft className="h-4 w-4" />{" "}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateCalendar("today")}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateCalendar("next")}
          >
            {" "}
            <ChevronRight className="h-4 w-4" />{" "}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeView("dayGridMonth")}
          >
            {" "}
            <Calendar className="h-4 w-4 mr-1" /> Mois{" "}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeView("timeGridWeek")}
          >
            {" "}
            <Clock className="h-4 w-4 mr-1" /> Semaine{" "}
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={false}
          events={events}
          eventContent={renderEventContent}
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          height="100%"
          locale="fr"
          firstDay={1}
          initialView={viewType}
          datesSet={onViewChange}
          eventClick={onEventClick}
          drop={handleDrop}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
          dayHeaderClassNames="text-sm font-medium text-muted-foreground"
          views={{
            dayGridMonth: { dayMaxEventRows: 3 },
            timeGridWeek: {
              slotMinTime: "08:00:00",
              slotMaxTime: "20:00:00",
              allDaySlot: true,
            },
          }}
        />
      </div>
    </Card>
  );
};

export default CalendarView;
