/**
 * Photon (Spectrum) credential helpers.
 *
 * Photon dashboard provides a project ID + project secret pair — not a single API key.
 */

export interface PhotonConfig {
  projectId: string;
  projectSecret: string;
  botToken: string;
}

/** True when a value is missing or still a template placeholder from .env.example. */
export function isPlaceholderEnvValue(value: string | undefined): boolean {
  if (!value?.trim()) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith("your_") ||
    normalized.includes("your-public-server") ||
    normalized.endsWith(".example.com")
  );
}

export function isValidPublicServerUrl(value: string | undefined): boolean {
  if (isPlaceholderEnvValue(value)) {
    return false;
  }

  try {
    const url = new URL(value!.trim());
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function getPhotonConfig(): PhotonConfig | null {
  const projectId = process.env.PHOTON_PROJECT_ID?.trim();
  const projectSecret = process.env.PHOTON_PROJECT_SECRET?.trim();
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!projectId || !projectSecret || !botToken) {
    return null;
  }

  if (
    isPlaceholderEnvValue(projectId) ||
    isPlaceholderEnvValue(projectSecret) ||
    isPlaceholderEnvValue(botToken)
  ) {
    return null;
  }

  if (!/^[0-9a-f-]{36}$/i.test(projectId)) {
    return null;
  }

  return { projectId, projectSecret, botToken };
}

export function isPhotonConfigured(): boolean {
  return getPhotonConfig() !== null;
}
