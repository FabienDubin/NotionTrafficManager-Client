/**
 * Utilitaires pour Notion
 */

/**
 * Extrait l'ID d'une base de données Notion à partir d'une URL ou d'un ID direct
 * @param {string} input - L'URL ou l'ID de la base de données
 * @returns {object} - { success: boolean, id: string|null, error: string|null }
 */
export const extractNotionDatabaseId = (input) => {
  if (!input || typeof input !== "string") {
    return { success: false, id: null, error: "Input vide ou invalide" };
  }

  // Nettoyer l'input
  const cleanInput = input.trim();

  // Regex pour un UUID Notion (avec ou sans tirets)
  const uuidRegex =
    /^[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i;

  // Regex pour extraire l'ID d'une URL Notion
  const urlRegexes = [
    // URLs avec slug (chemin) + UUID
    /https?:\/\/(?:www\.)?notion\.so\/[^/]+\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    /https?:\/\/(?:www\.)?notion\.so\/[^/]+\/([a-f0-9]{32})/i,
    // URLs directes
    /https?:\/\/(?:www\.)?notion\.so\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    /https?:\/\/(?:www\.)?notion\.so\/([a-f0-9]{32})/i,
    // Workspaces custom
    /https?:\/\/[^.]+\.notion\.site\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    /https?:\/\/[^.]+\.notion\.site\/([a-f0-9]{32})/i,
  ];

  // Vérifier si c'est déjà un ID valide
  if (uuidRegex.test(cleanInput)) {
    // Normaliser l'ID avec des tirets
    const normalizedId = normalizeNotionId(cleanInput);
    return { success: true, id: normalizedId, error: null };
  }

  // Essayer d'extraire l'ID d'une URL
  for (const regex of urlRegexes) {
    const match = cleanInput.match(regex);
    if (match && match[1]) {
      const extractedId = match[1];
      // Normaliser l'ID avec des tirets
      const normalizedId = normalizeNotionId(extractedId);
      return { success: true, id: normalizedId, error: null };
    }
  }

  return {
    success: false,
    id: null,
    error: "Format non reconnu. Utilisez un ID ou une URL Notion valide.",
  };
};

/**
 * Normalise un ID Notion pour avoir le format avec tirets
 * @param {string} id - L'ID à normaliser
 * @returns {string} - L'ID normalisé avec tirets
 */
export const normalizeNotionId = (id) => {
  // Supprimer tous les tirets existants
  const cleanId = id.replace(/-/g, "");

  // Ajouter les tirets au bon endroit: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  if (cleanId.length === 32) {
    return `${cleanId.slice(0, 8)}-${cleanId.slice(8, 12)}-${cleanId.slice(
      12,
      16
    )}-${cleanId.slice(16, 20)}-${cleanId.slice(20, 32)}`;
  }

  return id; // Retourner l'original si la longueur n'est pas correcte
};

/**
 * Valide si un ID Notion est au bon format
 * @param {string} id - L'ID à valider
 * @returns {boolean} - true si l'ID est valide
 */
export const isValidNotionId = (id) => {
  if (!id || typeof id !== "string") return false;

  const uuidRegex =
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  return uuidRegex.test(id);
};
