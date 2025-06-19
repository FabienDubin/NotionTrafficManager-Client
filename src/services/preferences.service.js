import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

class PreferencesService {
  // Récupère les préférences d'un utilisateur
  async getUserPreferences(userId) {
    try {
      const response = await axios.get(`${API_URL}/api/preferences/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des préférences:", error);
      throw error;
    }
  }

  // Met à jour les préférences d'un utilisateur
  async updateUserPreferences(userId, preferences) {
    try {
      const response = await axios.patch(
        `${API_URL}/api/preferences/${userId}`,
        {
          visibleTaskProperties: preferences.visibleTaskProperties,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour des préférences:", error);
      throw error;
    }
  }

  // Récupère toutes les couleurs des clients
  async getClientColors() {
    try {
      const response = await axios.get(
        `${API_URL}/api/preferences/client-colors`
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des couleurs clients:",
        error
      );
      throw error;
    }
  }

  // Met à jour les couleurs des clients
  async updateClientColors(clientColors) {
    try {
      const response = await axios.patch(
        `${API_URL}/api/preferences/client-colors`,
        {
          clientColors,
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour des couleurs clients:",
        error
      );
      throw error;
    }
  }

  // Génère des couleurs aléatoires pour les nouveaux clients
  async generateClientColors(clients) {
    try {
      const response = await axios.post(
        `${API_URL}/api/preferences/client-colors/generate`,
        {
          clients,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la génération des couleurs:", error);
      throw error;
    }
  }

  // Transforme le tableau de couleurs en objet pour un accès rapide
  clientColorsArrayToObject(clientColorsArray) {
    const clientColorsObject = {};
    clientColorsArray.forEach((item) => {
      clientColorsObject[item.clientName] = item.color;
    });
    return clientColorsObject;
  }

  // Transforme l'objet de couleurs en tableau pour l'API
  clientColorsObjectToArray(clientColorsObject, clientsData) {
    return Object.entries(clientColorsObject).map(([clientName, color]) => {
      const client = clientsData.find((c) => c.name === clientName);
      return {
        clientId: client?.id || clientName,
        clientName,
        color,
      };
    });
  }
}

// Instance singleton
const preferencesService = new PreferencesService();

export default preferencesService;
