import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

class CalendarService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/calendar`,
      withCredentials: true,
    });

    // Automatically set JWT token on the request headers for every request
    this.api.interceptors.request.use((config) => {
      // Retrieve the JWT token from the local storage
      const storedToken = localStorage.getItem("authToken");

      if (storedToken) {
        config.headers = { Authorization: `Bearer ${storedToken}` };
      }

      return config;
    });
  }

  // Récupérer les tâches pour une période
  async getTasks(startDate, endDate) {
    try {
      const response = await this.api.get("/tasks", {
        params: {
          start: startDate,
          end: endDate,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw this.handleError(error);
    }
  }

  // Récupérer les tâches non assignées
  async getUnassignedTasks() {
    try {
      const response = await this.api.get("/unassigned-tasks");
      return response.data;
    } catch (error) {
      console.error("Error fetching unassigned tasks:", error);
      throw this.handleError(error);
    }
  }

  // Créer une nouvelle tâche
  async createTask(taskData) {
    try {
      const response = await this.api.post("/tasks", taskData);
      return response.data;
    } catch (error) {
      console.error("Error creating task:", error);
      throw this.handleError(error);
    }
  }

  // Mettre à jour une tâche
  async updateTask(taskId, updates) {
    try {
      const response = await this.api.patch(`/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      console.error("Error updating task:", error);
      throw this.handleError(error);
    }
  }

  // Supprimer une tâche
  async deleteTask(taskId) {
    try {
      const response = await this.api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw this.handleError(error);
    }
  }

  // Récupérer les utilisateurs/créatifs
  async getUsers() {
    try {
      const response = await this.api.get("/users");
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw this.handleError(error);
    }
  }

  // Récupérer les clients
  async getClients() {
    try {
      const response = await this.api.get("/clients");
      return response.data;
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw this.handleError(error);
    }
  }

  // Récupérer les projets
  async getProjects() {
    try {
      const response = await this.api.get("/projects");
      return response.data;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw this.handleError(error);
    }
  }

  // Récupérer les options de statut
  async getStatusOptions() {
    try {
      const response = await this.api.get("/status-options");
      return response.data;
    } catch (error) {
      console.error("Error fetching status options:", error);
      throw this.handleError(error);
    }
  }

  // Récupérer les préférences utilisateur
  async getUserPreferences() {
    try {
      const response = await this.api.get("/preferences");
      return response.data;
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      throw this.handleError(error);
    }
  }

  // Sauvegarder les préférences utilisateur
  async saveUserPreferences(preferences) {
    try {
      const response = await this.api.patch("/preferences", preferences);
      return response.data;
    } catch (error) {
      console.error("Error saving user preferences:", error);
      throw this.handleError(error);
    }
  }

  // Récupérer les couleurs des clients
  async getClientColors() {
    try {
      const response = await this.api.get("/client-colors");
      return response.data;
    } catch (error) {
      console.error("Error fetching client colors:", error);
      throw this.handleError(error);
    }
  }

  // Sauvegarder les couleurs des clients
  async saveClientColors(clientColors) {
    try {
      const response = await this.api.patch("/client-colors", clientColors);
      return response.data;
    } catch (error) {
      console.error("Error saving client colors:", error);
      throw this.handleError(error);
    }
  }

  // Filtrer les tâches
  async filterTasks(tasks, filters) {
    try {
      const response = await this.api.post("/tasks/filter", {
        tasks,
        filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error filtering tasks:", error);
      throw this.handleError(error);
    }
  }

  // Gestion des erreurs
  handleError(error) {
    if (error.response) {
      // Erreur de réponse du serveur
      return new Error(
        error.response.data?.message || "Erreur lors de la requête"
      );
    } else if (error.request) {
      // Erreur de réseau
      return new Error("Erreur de connexion au serveur");
    } else {
      // Autre erreur
      return new Error(error.message || "Une erreur inattendue s'est produite");
    }
  }
}

export default new CalendarService();
