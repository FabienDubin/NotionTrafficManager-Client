import React, { useState, useEffect } from "react";
import {
  Settings,
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { toast } from "sonner";
import settingsService from "../../services/settings.service";
import IsAdmin from "../../components/IsAdmin";
import NotionDatabaseInput from "../../components/NotionDatabaseInput";

const SettingsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);

  // Nouvelle gestion multi-config
  const [configs, setConfigs] = useState([]); // Liste de toutes les configs
  const [selectedConfigId, setSelectedConfigId] = useState(
    () => localStorage.getItem("selectedNotionConfigId") || ""
  );
  const [formData, setFormData] = useState({
    name: "",
    notionApiKey: "",
    databaseIds: {
      users: "",
      clients: "",
      projects: "",
      trafic: "",
    },
  });
  const [editMode, setEditMode] = useState(false); // true = édition, false = création
  const [editingConfigId, setEditingConfigId] = useState(null);

  // Charger toutes les configs et le statut au montage
  useEffect(() => {
    loadAllConfigs();
    loadConfigStatus();
  }, []);

  // Charger toutes les configs
  const loadAllConfigs = async () => {
    try {
      setLoading(true);
      const res = await settingsService.getAllNotionConfigs();
      setConfigs(res.configs || []);
      // Si aucune config sélectionnée, prendre la première active
      if (!selectedConfigId && res.configs?.length) {
        const active = res.configs.find((c) => c.isActive) || res.configs[0];
        setSelectedConfigId(active._id);
        localStorage.setItem("selectedNotionConfigId", active._id);
      }
    } catch (error) {
      toast("Erreur", {
        description: "Impossible de charger les configurations",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger le statut de configuration (DB vs ENV)
  const loadConfigStatus = async () => {
    try {
      const statusResponse = await settingsService.getConfigStatus();
      setConfigStatus(statusResponse.status);
    } catch (error) {
      setConfigStatus(null);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith("databaseIds.")) {
      const dbField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        databaseIds: {
          ...prev.databaseIds,
          [dbField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const testConnection = async () => {
    if (
      !formData.notionApiKey ||
      !formData.databaseIds.users ||
      !formData.databaseIds.clients ||
      !formData.databaseIds.projects ||
      !formData.databaseIds.trafic
    ) {
      toast("Erreur", {
        description:
          "Veuillez remplir tous les champs avant de tester la connexion",
        variant: "error",
      });
      return;
    }

    try {
      setTesting(true);
      const result = await settingsService.testNotionConnection(formData);

      if (result.success) {
        toast("Connexion réussie", {
          description: result.message,
          variant: "success",
        });
      } else {
        toast("Échec de la connexion", {
          description: result.message,
          variant: "error",
        });
      }
    } catch (error) {
      toast("Erreur de test", {
        description: "Impossible de tester la connexion Notion",
        variant: "error",
      });
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = async () => {
    if (
      !formData.notionApiKey ||
      !formData.databaseIds.users ||
      !formData.databaseIds.clients ||
      !formData.databaseIds.projects ||
      !formData.databaseIds.trafic
    ) {
      toast("Erreur", {
        description: "Veuillez remplir tous les champs",
        variant: "error",
      });
      return;
    }

    try {
      setLoading(true);

      let result;
      if (existingConfig) {
        result = await settingsService.updateNotionConfig(formData);
      } else {
        result = await settingsService.saveNotionConfig(formData);
      }

      toast("Configuration sauvegardée", {
        description: result.message,
        variant: "success",
      });

      // Recharger les données
      await loadConfigData();

      // Vider le champ API Key pour des raisons de sécurité
      setFormData((prev) => ({
        ...prev,
        notionApiKey: "",
      }));
    } catch (error) {
      toast("Erreur de sauvegarde", {
        description:
          error.response?.data?.message ||
          "Impossible de sauvegarder la configuration",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !configStatus) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Configuration</h1>
            <p className="text-muted-foreground">
              Gérez la configuration Notion de l'application
            </p>
          </div>
        </div>

        {/* Liste des configurations */}
        <Card>
          <CardHeader>
            <CardTitle>Configurations enregistrées</CardTitle>
            <CardDescription>
              Sélectionnez la configuration à utiliser pour l'application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configs.length === 0 ? (
              <div className="text-muted-foreground">
                Aucune configuration enregistrée.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2">Nom</th>
                    <th className="text-left py-2">Dernière maj</th>
                    <th className="text-left py-2">Statut</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr
                      key={config._id}
                      className={
                        selectedConfigId === config._id ? "bg-blue-50" : ""
                      }
                    >
                      <td className="py-2 font-medium">
                        {config.name || (
                          <span className="italic text-gray-400">Sans nom</span>
                        )}
                      </td>
                      <td className="py-2">
                        {config.updatedAt
                          ? new Date(config.updatedAt).toLocaleString("fr-FR")
                          : "-"}
                      </td>
                      <td className="py-2">
                        {config.isActive ? (
                          <span className="text-green-600 font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="text-gray-400">Inactive</span>
                        )}
                        {selectedConfigId === config._id && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            Sélectionnée
                          </span>
                        )}
                      </td>
                      <td className="py-2 flex gap-2">
                        <Button
                          size="sm"
                          variant={
                            selectedConfigId === config._id
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            setSelectedConfigId(config._id);
                            localStorage.setItem(
                              "selectedNotionConfigId",
                              config._id
                            );
                          }}
                        >
                          Utiliser
                        </Button>
                        <Button
                          size="sm"
                          variant={config.isActive ? "default" : "outline"}
                          disabled={config.isActive}
                          onClick={async () => {
                            try {
                              setLoading(true);
                              await settingsService.activateNotionConfig(
                                config._id
                              );
                              toast("Configuration activée", {
                                description: `La configuration "${config.name}" est maintenant active.`,
                                variant: "success",
                              });
                              await loadAllConfigs();
                            } catch (error) {
                              toast("Erreur", {
                                description:
                                  "Impossible d'activer la configuration",
                                variant: "error",
                              });
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          Activer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditMode(true);
                            setEditingConfigId(config._id);
                            setFormData({
                              name: config.name || "",
                              notionApiKey: "",
                              databaseIds: {
                                users: config.databaseIds?.users || "",
                                clients: config.databaseIds?.clients || "",
                                projects: config.databaseIds?.projects || "",
                                trafic: config.databaseIds?.trafic || "",
                              },
                            });
                          }}
                        >
                          Éditer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (
                              window.confirm(
                                `Supprimer la configuration "${config.name}" ?`
                              )
                            ) {
                              try {
                                setLoading(true);
                                await settingsService.deleteNotionConfig(
                                  config._id
                                );
                                toast("Configuration supprimée", {
                                  description: `La configuration "${config.name}" a été supprimée.`,
                                  variant: "success",
                                });
                                await loadAllConfigs();
                                // Si la config supprimée était sélectionnée, reset
                                if (selectedConfigId === config._id) {
                                  setSelectedConfigId("");
                                  localStorage.removeItem(
                                    "selectedNotionConfigId"
                                  );
                                }
                              } catch (error) {
                                toast("Erreur", {
                                  description:
                                    "Impossible de supprimer la configuration",
                                  variant: "error",
                                });
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Statut de configuration */}
        {configStatus && (
          <Alert
            className={
              configStatus.usingFallback
                ? "border-orange-200 bg-orange-50"
                : "border-green-200 bg-green-50"
            }
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                configStatus.usingFallback
                  ? "text-orange-600"
                  : "text-green-600"
              }`}
            />
            <AlertDescription
              className={
                configStatus.usingFallback
                  ? "text-orange-800"
                  : "text-green-800"
              }
            >
              {configStatus.usingFallback
                ? "⚠️ Configuration actuelle : Variables d'environnement (.env). Configurez une base de données pour plus de flexibilité."
                : "✅ Configuration actuelle : Base de données. Configuration centralisée active."}
            </AlertDescription>
          </Alert>
        )}

        <IsAdmin>
          {/* Formulaire de configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {editMode
                  ? "Modifier la configuration"
                  : "Nouvelle configuration"}
              </CardTitle>
              <CardDescription>
                {editMode
                  ? "Modifiez la configuration sélectionnée puis sauvegardez."
                  : "Créez une nouvelle configuration Notion pour l'application. Ces informations seront stockées de manière sécurisée en base de données."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nom de la configuration */}
              <div className="space-y-2">
                <Label htmlFor="configName">Nom de la configuration</Label>
                <Input
                  id="configName"
                  type="text"
                  placeholder="Nom (ex: Production, Test, Client X...)"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">Clé API Notion</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="secret_..."
                  value={formData.notionApiKey}
                  onChange={(e) =>
                    handleInputChange("notionApiKey", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Votre clé API Notion.{" "}
                  <a
                    href="https://www.notion.com/fr/help/create-integrations-with-the-notion-api"
                    target="_blank"
                    className="text-blue-500 underline"
                  >
                    En savoir plus...
                  </a>
                </p>
              </div>

              {/* Database IDs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NotionDatabaseInput
                  id="usersDb"
                  label="Base de données Utilisateurs"
                  placeholder="URL ou ID de la base utilisateurs"
                  value={formData.databaseIds.users}
                  onChange={(value) =>
                    handleInputChange("databaseIds.users", value)
                  }
                />

                <NotionDatabaseInput
                  id="clientsDb"
                  label="Base de données Clients"
                  placeholder="URL ou ID de la base clients"
                  value={formData.databaseIds.clients}
                  onChange={(value) =>
                    handleInputChange("databaseIds.clients", value)
                  }
                />

                <NotionDatabaseInput
                  id="projectsDb"
                  label="Base de données Projets"
                  placeholder="URL ou ID de la base projets"
                  value={formData.databaseIds.projects}
                  onChange={(value) =>
                    handleInputChange("databaseIds.projects", value)
                  }
                />

                <NotionDatabaseInput
                  id="traficDb"
                  label="Base de données Trafic"
                  placeholder="URL ou ID de la base trafic"
                  value={formData.databaseIds.trafic}
                  onChange={(value) =>
                    handleInputChange("databaseIds.trafic", value)
                  }
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={testConnection}
                  variant="outline"
                  disabled={testing || loading}
                >
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Tester la connexion
                    </>
                  )}
                </Button>

                <Button
                  onClick={async () => {
                    if (
                      !formData.name ||
                      !formData.notionApiKey ||
                      !formData.databaseIds.users ||
                      !formData.databaseIds.clients ||
                      !formData.databaseIds.projects ||
                      !formData.databaseIds.trafic
                    ) {
                      toast("Erreur", {
                        description: "Veuillez remplir tous les champs",
                        variant: "error",
                      });
                      return;
                    }
                    try {
                      setLoading(true);
                      if (editMode && editingConfigId) {
                        await settingsService.updateNotionConfigById(
                          editingConfigId,
                          formData
                        );
                        toast("Configuration modifiée", {
                          description: "La configuration a été mise à jour.",
                          variant: "success",
                        });
                      } else {
                        await settingsService.createNotionConfig(formData);
                        toast("Configuration créée", {
                          description: "Nouvelle configuration enregistrée.",
                          variant: "success",
                        });
                      }
                      setFormData({
                        name: "",
                        notionApiKey: "",
                        databaseIds: {
                          users: "",
                          clients: "",
                          projects: "",
                          trafic: "",
                        },
                      });
                      setEditMode(false);
                      setEditingConfigId(null);
                      await loadAllConfigs();
                    } catch (error) {
                      toast("Erreur", {
                        description:
                          "Impossible d'enregistrer la configuration",
                        variant: "error",
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || testing}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      {editMode ? "Mettre à jour" : "Sauvegarder"}
                    </>
                  )}
                </Button>
                {editMode && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setEditingConfigId(null);
                      setFormData({
                        name: "",
                        notionApiKey: "",
                        databaseIds: {
                          users: "",
                          clients: "",
                          projects: "",
                          trafic: "",
                        },
                      });
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>

              {/* Message d'aide */}
              <div className="pt-4 text-xs text-muted-foreground">
                Les configurations sont stockées de façon sécurisée. Pour
                modifier une configuration existante, cliquez sur "Éditer" dans
                la liste ci-dessus.
              </div>
            </CardContent>
          </Card>
        </IsAdmin>

        {/* Message pour les non-admins */}
        <div className="block">
          <IsAdmin
            fallback={
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Seuls les administrateurs peuvent modifier la configuration
                  Notion.
                </AlertDescription>
              </Alert>
            }
          >
            <div></div>
          </IsAdmin>
        </div>
      </div>
    </div>
  );
};

export default SettingsDashboard;
