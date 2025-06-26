export function getRecaptchaKey() {
  return import.meta.env.VITE_RECAPTCHA_SITE_KEY;
}

const FALLBACK_IMG =
  import.meta.env.VITE_FALLBACK_IMG ||
  "https://storagemercedescla01.blob.core.windows.net/profiles/ChatGPT%20Image%20May%2028,%202025,%2011_35_00%20PM.png";
export { FALLBACK_IMG };

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://notiontrafficmanager-server-fggza5grhwdfayc0.francecentral-01.azurewebsites.net";
export { API_URL };

const DEFAULT_PASS = import.meta.env.VITE_DEFAULT_PASS || "pass123";
export { DEFAULT_PASS };
