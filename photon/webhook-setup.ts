/**
 * Photon Webhook Setup — Telegram webhook registration on server startup.
 *
 * @sponsor Photon
 * Registers the Photon Telegram webhook endpoint with the Telegram Bot API
 * via setWebhook. Call once when the Express server starts.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";

export interface WebhookSetupResult {
  success: boolean;
  webhookUrl: string;
  description?: string;
}

interface TelegramSetWebhookResponse {
  ok: boolean;
  description?: string;
  result?: boolean;
}

/**
 * Registers the Telegram webhook pointing to this server's Photon endpoint.
 *
 * @param serverUrl - Public base URL (e.g. https://your-app.example.com)
 * @returns Result of the setWebhook call
 */
export async function setupTelegramWebhook(
  serverUrl: string,
): Promise<WebhookSetupResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Photon webhook setup: TELEGRAM_BOT_TOKEN is not configured");
  }

  const base = serverUrl.replace(/\/$/, "");
  const webhookUrl = `${base}/photon/telegram/webhook`;

  const response = await fetch(
    `${TELEGRAM_API_BASE}/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    },
  );

  const body = (await response.json()) as TelegramSetWebhookResponse;

  return {
    success: body.ok,
    webhookUrl,
    description: body.description,
  };
}
