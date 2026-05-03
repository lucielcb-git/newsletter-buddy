export const SAVE_SETTINGS_URL = "https://agentllcb.app.n8n.cloud/webhook/onboarding";
export const FETCH_SETTINGS_URL = "https://agentllcb.app.n8n.cloud/webhook/fetch-settings";

export const DEFAULT_COMPANY_NAME = "Test";

export interface Settings {
  companyName: string;
  keywords: string;
  tone: string;
  testEmail: string;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LocalAsset {
  name: string;
  dataUrl: string; // base64 data URL kept locally
  type: string;
  size: number;
}

export interface LocalAssets {
  logo?: LocalAsset | null;
  styleGuide?: LocalAsset | null;
}

const ASSETS_KEY_PREFIX = "newsletter-studio:assets:";
export const assetsStorageKey = (companyName: string) =>
  `${ASSETS_KEY_PREFIX}${companyName.trim().toLowerCase() || DEFAULT_COMPANY_NAME.toLowerCase()}`;

export function loadLocalAssets(companyName: string): LocalAssets {
  try {
    const raw = localStorage.getItem(assetsStorageKey(companyName));
    if (!raw) return {};
    return JSON.parse(raw) as LocalAssets;
  } catch {
    return {};
  }
}

export function saveLocalAssets(companyName: string, assets: LocalAssets) {
  try {
    localStorage.setItem(assetsStorageKey(companyName), JSON.stringify(assets));
  } catch (err) {
    console.error("Failed to persist local assets", err);
  }
}

const TEST_EMAIL_KEY_PREFIX = "newsletter-studio:testEmail:";
const testEmailKey = (companyName: string) =>
  `${TEST_EMAIL_KEY_PREFIX}${companyName.trim().toLowerCase() || DEFAULT_COMPANY_NAME.toLowerCase()}`;

export function loadCachedTestEmail(companyName: string): string {
  try {
    return localStorage.getItem(testEmailKey(companyName)) ?? "";
  } catch {
    return "";
  }
}

export function cacheTestEmail(companyName: string, email: string) {
  try {
    localStorage.setItem(testEmailKey(companyName), email);
  } catch (err) {
    console.error("Failed to cache test email", err);
  }
}

export function fileToAsset(file: File): Promise<LocalAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        dataUrl: String(reader.result ?? ""),
        type: file.type,
        size: file.size,
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function tryParseJson<T = any>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export async function fetchSettings(companyName: string): Promise<Settings | null> {
  const url = `${FETCH_SETTINGS_URL}?companyName=${encodeURIComponent(companyName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch settings failed: ${res.status}`);
  const text = await res.text();
  if (!text) return null;
  let data: any = tryParseJson(text);
  if (data === null) return null;
  if (Array.isArray(data)) data = data[0] ?? null;
  if (!data || typeof data !== "object") return null;

  // Unwrap common n8n wrappers
  const inner = data.json ?? data.data ?? data.body ?? data;

  const companyNameOut =
    inner.companyName ?? inner.company_name ?? data.companyName ?? companyName;
  const keywords = inner.keywords ?? data.keywords ?? "";
  const tone = inner.tone ?? data.tone ?? "";
  const testEmail = inner.testEmail ?? inner.test_email ?? data.testEmail ?? data.test_email ?? "";

  if (!companyNameOut && !keywords && !tone && !testEmail) return null;

  return {
    companyName: String(companyNameOut ?? companyName),
    keywords: String(keywords ?? ""),
    tone: String(tone ?? ""),
    testEmail: String(testEmail ?? ""),
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const res = await fetch(SAVE_SETTINGS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: settings.companyName,
      keywords: settings.keywords,
      tone: settings.tone,
      testEmail: settings.testEmail,
    }),
  });
  if (!res.ok) throw new Error(`Save settings failed: ${res.status}`);
}
