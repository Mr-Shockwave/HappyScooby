import type { NextFunction, Request, Response } from "express";

/**
 * Butterbase consent verification middleware.
 *
 * @sponsor Butterbase
 * @connects User.consentGiven in butterbase/schema.prisma
 * @connects ConsentLog audit trail for GDPR compliance
 * @connects photon/telegram-bot.ts (blocks analysis until consent is granted)
 */

/** Extended request with authenticated user context. */
export interface ConsentRequest extends Request {
  userId?: string;
  telegramId?: string;
}

/**
 * Express middleware that verifies the user has granted behavioral analysis consent.
 * Queries Butterbase User model via Prisma before allowing protected routes.
 */
export function requireConsent(
  req: ConsentRequest,
  res: Response,
  next: NextFunction,
): void {
  void req;
  // Stub: will query Prisma User.consentGiven once DB layer is wired
  res.status(501).json({
    error: "Not implemented: requireConsent middleware",
    sponsor: "Butterbase",
  });
  void next;
}
