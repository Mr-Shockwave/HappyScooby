import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../butterbase/client.js";

const CONSENT_REQUIRED_MESSAGE =
  "Consent required. Please reply 'I CONSENT' in Telegram to begin.";

/** Extended request with Butterbase user context after consent verification. */
export interface ConsentRequest extends Request {
  userId?: string;
  telegramId?: string;
}

/**
 * Extracts telegramId from request headers or body.
 * Priority: x-telegram-id header → body.telegramId → body.message.from.id
 */
function extractTelegramId(req: ConsentRequest): string | undefined {
  const headerId = req.headers["x-telegram-id"];
  if (typeof headerId === "string" && headerId.length > 0) {
    return headerId;
  }

  const body = req.body as Record<string, unknown> | undefined;
  if (!body) {
    return undefined;
  }

  if (typeof body.telegramId === "string" && body.telegramId.length > 0) {
    return body.telegramId;
  }

  const message = body.message as Record<string, unknown> | undefined;
  const from = message?.from as Record<string, unknown> | undefined;
  if (from?.id !== undefined && from.id !== null) {
    return String(from.id);
  }

  return undefined;
}

/**
 * Butterbase consent verification middleware.
 *
 * @sponsor Butterbase
 * Queries the Butterbase Prisma User model to verify consentGiven === true
 * before allowing behavioral analysis on protected routes.
 *
 * @connects User.consentGiven in butterbase/schema.prisma
 * @connects ConsentLog audit trail for GDPR compliance
 * @connects photon/telegram-bot.ts (blocks analysis until consent is granted)
 */
export async function requireConsent(
  req: ConsentRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const telegramId = extractTelegramId(req);

    if (!telegramId) {
      res.status(400).json({ error: "telegramId is required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user?.consentGiven) {
      res.status(403).json({ error: CONSENT_REQUIRED_MESSAGE });
      return;
    }

    req.userId = user.id;
    req.telegramId = user.telegramId;
    next();
  } catch (error) {
    console.error("Butterbase consent middleware error:", error);
    res.status(500).json({
      error: "Internal server error during Butterbase consent verification",
    });
  }
}
