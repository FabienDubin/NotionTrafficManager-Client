import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

class CalendarService {
  // Récupère les tâches non assignées
  async getUnassignedTasks() {
    try {
      const response = await axios.get(
        `${API_URL}/api/calendar/tasks/unassigned`
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des tâches non assignées:",
        error
      );
      throw error;
    }
  }

  // Récupère les tâches dans une période avec préchargement optionnel
  async getTasksInPeriod(
    startDate,
    endDate,
    preload = false,
    viewType = "month"
  ) {
    try {
      const params = {
        start: startDate,
        end: endDate,
        preload: preload.toString(),
        viewType,
      };

      const response = await axios.get(`${API_URL}/api/calendar/tasks/period`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des tâches par période:",
        error
      );
      throw error;
    }
  }

  // Met à jour une tâche
  async updateTask(taskId, updates) {
    try {
      const response = await axios.patch(
        `${API_URL}/api/calendar/tasks/${taskId}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      throw error;
    }
  }

  // Récupère la liste des utilisateurs
  async getUsers() {
    try {
      const response = await axios.get(`${API_URL}/api/calendar/users`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      throw error;
    }
  }

  // Récupère la liste des clients
  async getClients() {
    try {
      const response = await axios.get(`${API_URL}/api/calendar/clients`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      throw error;
    }
  }

  // Récupère la liste des projets
  async getProjects() {
    try {
      const response = await axios.get(`${API_URL}/api/calendar/projects`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des projets:", error);
      throw error;
    }
  }

  // Transforme une tâche en événement FullCalendar
  taskToEvent(task, clientColors = {}) {
    if (!task.period || !task.period.start) {
      return null;
    }

    // Récupère la couleur du client
    const clientName = Array.isArray(task.client)
      ? task.client[0]
      : task.client;
    const clientColor = clientColors[clientName] || "#3498DB";

    return {
      id: task.id,
      title: task.name,
      start: task.period.start,
      end: task.period.end,
      backgroundColor: clientColor,
      borderColor: clientColor,
      textColor: "#FFFFFF",
      extendedProps: {
        task: task,
        users: task.users || [],
        projects: task.projects || [],
        client: clientName,
        status: task.status,
        url: task.url,
      },
    };
  }

  // Transforme une liste de tâches en événements FullCalendar
  tasksToEvents(tasks, clientColors = {}) {
    return tasks
      .map((task) => this.taskToEvent(task, clientColors))
      .filter((event) => event !== null);
  }
}

// Instance singleton
const calendarService = new CalendarService();

export default calendarService;
