import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

class BugReportService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/bug-reports`,
      withCredentials: true,
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }
      return config;
    });
  }

  async createBugReport(bugReportData) {
    try {
      const formData = new FormData();
      formData.append("title", bugReportData.title);
      formData.append("description", bugReportData.description);
      formData.append("priority", bugReportData.priority || "medium");
      formData.append(
        "currentUrl",
        bugReportData.currentUrl || window.location.href
      );
      formData.append(
        "userAgent",
        bugReportData.userAgent || navigator.userAgent
      );

      if (bugReportData.screenshots?.length > 0) {
        bugReportData.screenshots.forEach((file) => {
          formData.append("screenshots", file);
        });
      }

      const response = await this.api.post("/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du bug report:", error);
      throw this.handleError(error);
    }
  }

  async getMyBugReports(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await this.api.get(`/my?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des bug reports:", error);
      throw this.handleError(error);
    }
  }

  async getAllBugReports(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await this.api.get(`/?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des bug reports:", error);
      throw this.handleError(error);
    }
  }

  async getBugReportById(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du bug report:", error);
      throw this.handleError(error);
    }
  }

  async updateBugReport(id, updateData) {
    try {
      const response = await this.api.patch(`/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du bug report:", error);
      throw this.handleError(error);
    }
  }

  async deleteBugReport(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la suppression du bug report:", error);
      throw this.handleError(error);
    }
  }

  async getBugReportStats() {
    try {
      const response = await this.api.get(`/stats`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return new Error(
        error.response.data?.message || "Erreur lors de la requête"
      );
    } else if (error.request) {
      return new Error("Erreur de connexion au serveur");
    } else {
      return new Error(error.message || "Une erreur inattendue s'est produite");
    }
  }
}

// ✅ Propriétés statiques définies après la classe pour compatibilité maximale
BugReportService.STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in-progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

BugReportService.STATUS_LABELS = {
  open: "Ouvert",
  "in-progress": "En cours",
  resolved: "Résolu",
  closed: "Fermé",
};

BugReportService.PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

BugReportService.PRIORITY_LABELS = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

BugReportService.PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-red-200 text-red-900",
};

BugReportService.STATUS_COLORS = {
  open: "bg-red-100 text-red-800",
  "in-progress": "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default new BugReportService();
export { BugReportService }; // 👈 À importer dans ton composant pour accéder aux constantes
