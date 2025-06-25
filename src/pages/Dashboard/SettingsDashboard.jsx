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
import { useToast } from "../../hooks/use-toast";
import settingsService from "../../services/settings.service";
import IsAdmin from "../../components/IsAdmin";
import NotionDatabaseInput from "../../components/NotionDatabaseInput";

const SettingsDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);
  const [existingConfig, setExistingConfig] = useState(null);
  const [formData, setFormData] = useState({
    notionApiKey: "",
    databaseIds: {
      users: "",
      clients: "",
      projects: "",
      trafic: "",
    },
  });

  // Charger la configuration existante et le statut
  useEffect(() => {
    loadConfigData();
  }, []);

  const loadConfigData = async () => {
    try {
      setLoading(true);

      // Charger le statut de configuration
      const statusResponse = await settingsService.getConfigStatus();
      setConfigStatus(statusResponse.status);

      // Charger la configuration existante si elle existe
      try {
        const configResponse = await settingsService.getNotionConfig();
        if (configResponse.config) {
          setExistingConfig(configResponse.config);
          setFormData({
            notionApiKey: "", // Ne pas pré-remplir pour des raisons de sécurité
            databaseIds: configResponse.config.databaseIds,
          });
        }
      } catch (error) {
        // Pas de configuration existante, c'est normal
        console.log("No existing config found");
      }
    } catch (error) {
      console.error("Error loading config data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      toast({
        title: "Erreur",
        description:
          "Veuillez remplir tous les champs avant de tester la connexion",
        variant: "destructive",
      });
      return;
    }

    try {
      setTesting(true);
      const result = await settingsService.testNotionConnection(formData);

      if (result.success) {
        toast({
          title: "Connexion réussie",
          description: result.message,
        });
      } else {
        toast({
          title: "Échec de la connexion",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Impossible de tester la connexion Notion",
        variant: "destructive",
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
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
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

      toast({
        title: "Configuration sauvegardée",
        description: result.message,
      });

      // Recharger les données
      await loadConfigData();

      // Vider le champ API Key pour des raisons de sécurité
      setFormData((prev) => ({
        ...prev,
        notionApiKey: "",
      }));
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description:
          error.response?.data?.message ||
          "Impossible de sauvegarder la configuration",
        variant: "destructive",
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
                Configuration Notion
              </CardTitle>
              <CardDescription>
                Configurez les identifiants Notion pour l'application. Ces
                informations seront stockées de manière sécurisée en base de
                données.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  onClick={saveConfiguration}
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
                      {existingConfig ? "Mettre à jour" : "Sauvegarder"}
                    </>
                  )}
                </Button>
              </div>

              {/* Configuration existante */}
              {existingConfig && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Configuration actuelle</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Clé API : {existingConfig.notionApiKey}</p>
                    <p>
                      Dernière mise à jour :{" "}
                      {new Date(existingConfig.updatedAt).toLocaleString(
                        "fr-FR"
                      )}
                    </p>
                    <p>
                      Créée par : {existingConfig.createdBy?.firstName}{" "}
                      {existingConfig.createdBy?.lastName}
                    </p>
                  </div>
                </div>
              )}
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
