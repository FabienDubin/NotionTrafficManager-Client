import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

class SettingsService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/settings`,
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

  // Récupérer la configuration Notion stockée en DB (config active)
  async getNotionConfig() {
    try {
      const response = await this.api.get("/notion-config");
      return response.data;
    } catch (error) {
      console.error("Error fetching Notion config:", error);
      throw this.handleError(error);
    }
  }

  // Lister toutes les configurations Notion
  async getAllNotionConfigs() {
    try {
      const response = await this.api.get("/notion-configs");
      return response.data;
    } catch (error) {
      console.error("Error fetching all Notion configs:", error);
      throw this.handleError(error);
    }
  }

  // Récupérer une configuration Notion par ID
  async getNotionConfigById(configId) {
    try {
      const response = await this.api.get(`/notion-config/${configId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching Notion config by ID:", error);
      throw this.handleError(error);
    }
  }

  // Créer une nouvelle configuration Notion
  async createNotionConfig(configData) {
    try {
      const response = await this.api.post("/notion-config", configData);
      return response.data;
    } catch (error) {
      console.error("Error creating Notion config:", error);
      throw this.handleError(error);
    }
  }

  // Mettre à jour une configuration Notion par ID
  async updateNotionConfigById(configId, configData) {
    try {
      const response = await this.api.put(
        `/notion-config/${configId}`,
        configData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating Notion config by ID:", error);
      throw this.handleError(error);
    }
  }

  // Activer une configuration Notion par ID
  async activateNotionConfig(configId) {
    try {
      const response = await this.api.patch(
        `/notion-config/${configId}/activate`
      );
      return response.data;
    } catch (error) {
      console.error("Error activating Notion config:", error);
      throw this.handleError(error);
    }
  }

  // Supprimer une configuration Notion par ID
  async deleteNotionConfig(configId) {
    try {
      const response = await this.api.delete(`/notion-config/${configId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting Notion config:", error);
      throw this.handleError(error);
    }
  }

  // Sauvegarder une nouvelle configuration Notion
  async saveNotionConfig(configData) {
    try {
      const response = await this.api.post("/notion-config", configData);
      return response.data;
    } catch (error) {
      console.error("Error saving Notion config:", error);
      throw this.handleError(error);
    }
  }

  // Mettre à jour la configuration Notion existante
  async updateNotionConfig(configData) {
    try {
      const response = await this.api.put("/notion-config", configData);
      return response.data;
    } catch (error) {
      console.error("Error updating Notion config:", error);
      throw this.handleError(error);
    }
  }

  // Tester la connexion Notion
  async testNotionConnection(configData) {
    try {
      const response = await this.api.post("/test-connection", configData);
      return response.data;
    } catch (error) {
      console.error("Error testing Notion connection:", error);
      throw this.handleError(error);
    }
  }

  // Récupérer le statut de la configuration (DB vs ENV)
  async getConfigStatus() {
    try {
      const response = await this.api.get("/config-status");
      return response.data;
    } catch (error) {
      console.error("Error fetching config status:", error);
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

export default new SettingsService();
