import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

const TaskCard = ({ task, onTaskClick }) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleCardClick = (e) => {
    // Éviter le clic si on clique sur le grip ou si on est en train de draguer
    if (e.target.closest(".grip-handle") || isDragging) {
      return;
    }
    onTaskClick(task);
  };

  return (
    <Card
      className={`task-card mb-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isDragging ? "opacity-50 scale-95 rotate-2 shadow-lg" : ""
      }`}
      onClick={handleCardClick}
      data-task-id={task.id}
      data-task={JSON.stringify(task)}
      data-dragging={isDragging}
    >
      <CardContent className="p-3">
        <div className="flex items-start space-x-2">
          <div className="grip-handle mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.clientColor || "#6366f1" }}
              />
              <span className="font-medium text-sm truncate">{task.name}</span>
            </div>

            <div className="space-y-1">
              {task.client && (
                <div className="text-xs text-muted-foreground">
                  Client:{" "}
                  {Array.isArray(task.client) ? task.client[0] : task.client}
                </div>
              )}

              {task.projectName && (
                <div className="text-xs text-muted-foreground">
                  Projet: {task.projectName}
                </div>
              )}
              {task.assignedUsersNames.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Assignée à:{" "}
                  <span className="font-semibold italic">
                    {task.assignedUsersNames.join(", ")}
                  </span>
                </div>
              )}

              {task.status && (
                <Badge
                  variant="outline"
                  className="text-xs flex items-center gap-1 w-2/3 mt-4 rounded-full"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      task.status === "Pas commencé"
                        ? "bg-gray-400"
                        : task.status === "En cours"
                        ? "bg-blue-500"
                        : task.status === "Terminé"
                        ? "bg-green-500"
                        : "bg-muted"
                    }`}
                  ></span>
                  {task.status}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
