import { Router, type Request, type Response } from "express";

/**
 * Photon Telegram Bot — webhook handler for incoming Telegram messages.
 *
 * @sponsor Photon
 * @connects TELEGRAM_BOT_TOKEN and PHOTON_API_KEY from environment
 * @connects backend/middleware/consent.ts (Butterbase consent check before analysis)
 * @connects rocketride/nodes/ingestion.ts (feeds Telegram text into pipeline)
 * @connects photon/message-formatter.ts (sends empathetic replies)
 */

/** Minimal Telegram update payload shape. */
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
}

export const telegramRouter = Router();

/**
 * POST /webhook — receive Telegram updates via Photon messaging layer.
 * Stub handler; will integrate Photon SDK and consent middleware.
 */
telegramRouter.post("/webhook", (req: Request, res: Response): void => {
  const update = req.body as TelegramUpdate;

  if (!update?.update_id) {
    res.status(400).json({ error: "Invalid Telegram update payload" });
    return;
  }

  // TODO: verify consent via backend/middleware/consent.ts
  // TODO: forward message text to rocketride/nodes/ingestion.ts
  res.status(202).json({
    received: true,
    updateId: update.update_id,
    sponsor: "Photon",
  });
});
