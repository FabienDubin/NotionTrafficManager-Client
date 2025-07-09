import React, { useState, useEffect } from "react";
import {
  Bug,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";

// Components UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Services
import bugReportService, {
  BugReportService,
} from "@/services/bugReport.service";

const BugReportsDashboard = () => {
  const [bugReports, setBugReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedBugReport, setSelectedBugReport] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({});

  // Chargement des données
  useEffect(() => {
    loadBugReports();
    loadStats();
  }, [filters]);

  const loadBugReports = async () => {
    try {
      setLoading(true);
      const response = await bugReportService.getAllBugReports(filters);
      setBugReports(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Erreur lors du chargement des bug reports:", error);
      toast("Erreur", {
        description: "Impossible de charger les bug reports",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await bugReportService.getBugReportStats();
      setStats(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  // Gestion des filtres
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset à la première page
    }));
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      handleFilterChange("search", e.target.value);
    }
  };

  // Gestion de la pagination
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Ouverture du modal de détail
  const openDetailModal = async (bugReport) => {
    try {
      const response = await bugReportService.getBugReportById(bugReport._id);
      setSelectedBugReport(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast("Erreur", {
        description: "Impossible de charger les détails du bug report",
        variant: "error",
      });
    }
  };

  // Ouverture du modal d'édition
  const openEditModal = (bugReport) => {
    setSelectedBugReport(bugReport);
    setEditFormData({
      status: bugReport.status,
      priority: bugReport.priority,
      adminNotes: bugReport.adminNotes || "",
    });
    setIsEditModalOpen(true);
  };

  // Mise à jour d'un bug report
  const handleUpdateBugReport = async () => {
    try {
      await bugReportService.updateBugReport(
        selectedBugReport._id,
        editFormData
      );
      toast("Succès", {
        description: "Bug report mis à jour avec succès",
        variant: "success",
      });
      setIsEditModalOpen(false);
      loadBugReports();
    } catch (error) {
      toast("Erreur", {
        description: "Impossible de mettre à jour le bug report",
        variant: "error",
      });
    }
  };

  // Suppression d'un bug report
  const handleDeleteBugReport = async (id) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce bug report ?")) {
      return;
    }

    try {
      await bugReportService.deleteBugReport(id);
      toast("Succès", {
        description: "Bug report supprimé avec succès",
        variant: "success",
      });
      loadBugReports();
    } catch (error) {
      toast("Erreur", {
        description: "Impossible de supprimer le bug report",
        variant: "error",
      });
    }
  };

  // Helpers pour l'affichage
  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "closed":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority) => {
    return (
      BugReportService.PRIORITY_COLORS[priority] || "bg-gray-100 text-gray-800"
    );
  };

  const getBugStatusColor = (status) => {
    return (
      BugReportService.STATUS_COLORS[status] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="w-8 h-8 text-red-500" />
            Bug Reports
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des rapports de bugs soumis par les utilisateurs
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recent || 0} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.byStatus?.open || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.byStatus?.["in-progress"] || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.byStatus?.resolved || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Rechercher par titre ou description..."
                onKeyDown={handleSearch}
                className="w-full"
              />
            </div>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                handleFilterChange("status", value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in-progress">En cours</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.priority || "all"}
              onValueChange={(value) =>
                handleFilterChange("priority", value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des bug reports */}
      <Card>
        <CardHeader>
          <CardTitle>Bug Reports ({pagination.totalItems || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Screenshots</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bugReports.map((bugReport) => (
                    <TableRow key={bugReport._id}>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="truncate" title={bugReport.title}>
                          {bugReport.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            {bugReport.userInfo.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getBugStatusColor(bugReport.status)}>
                          {getStatusIcon(bugReport.status)}
                          <span className="ml-1">{bugReport.statusLabel}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(bugReport.priority)}>
                          {bugReport.priorityLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(bugReport.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {bugReport.screenshots.length > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <ImageIcon className="w-4 h-4" />
                            {bugReport.screenshots.length}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailModal(bugReport)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(bugReport)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBugReport(bugReport._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-600">
                    Page {pagination.currentPage} sur {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de détail */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-500" />
              Détails du Bug Report
            </DialogTitle>
          </DialogHeader>
          {selectedBugReport && (
            <div className="space-y-6">
              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Titre</Label>
                  <p className="text-sm mt-1">{selectedBugReport.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Utilisateur</Label>
                  <p className="text-sm mt-1">
                    {selectedBugReport.userInfo.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <div className="mt-1">
                    <Badge
                      className={getBugStatusColor(selectedBugReport.status)}
                    >
                      {selectedBugReport.statusLabel}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priorité</Label>
                  <div className="mt-1">
                    <Badge
                      className={getPriorityColor(selectedBugReport.priority)}
                    >
                      {selectedBugReport.priorityLabel}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedBugReport.description}
                  </p>
                </div>
              </div>

              {/* Screenshots */}
              {selectedBugReport.screenshots.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Screenshots</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {selectedBugReport.screenshots.map((url, index) => (
                      <div
                        key={index}
                        className="aspect-video bg-gray-100 rounded-lg overflow-hidden border"
                      >
                        <img
                          src={url}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => window.open(url, "_blank")}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations techniques */}
              <div>
                <Label className="text-sm font-medium">
                  Informations techniques
                </Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                  <p>
                    <strong>URL:</strong>{" "}
                    {selectedBugReport.userInfo.currentUrl}
                  </p>
                  <p>
                    <strong>Navigateur:</strong>{" "}
                    {selectedBugReport.userInfo.userAgent}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedBugReport.createdAt).toLocaleString(
                      "fr-FR"
                    )}
                  </p>
                </div>
              </div>

              {/* Notes admin */}
              {selectedBugReport.adminNotes && (
                <div>
                  <Label className="text-sm font-medium">
                    Notes administrateur
                  </Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedBugReport.adminNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le Bug Report</DialogTitle>
            <DialogDescription>
              Mettre à jour le statut, la priorité et ajouter des notes
              administrateur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in-progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={editFormData.priority}
                onValueChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adminNotes">Notes administrateur</Label>
              <Textarea
                id="adminNotes"
                placeholder="Ajouter des notes internes..."
                value={editFormData.adminNotes}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    adminNotes: e.target.value,
                  }))
                }
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleUpdateBugReport}>Sauvegarder</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BugReportsDashboard;
