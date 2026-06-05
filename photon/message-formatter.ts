import type { PsychAnalysisResult } from "../butterbase/ai-gateway.js";

/**
 * Photon Message Formatter — produces empathetic plain-text Telegram responses.
 *
 * @sponsor Photon
 * @connects rocketride/nodes/action-decision.ts (formats the final reply)
 * @connects photon/telegram-bot.ts (delivers formatted message to user)
 */

/** Options for tailoring the empathetic response. */
export interface MessageFormatOptions {
  includeContradictions?: boolean;
  maxLength?: number;
}

/**
 * Formats a psych analysis result into a native plain-text empathetic Telegram message.
 * Ensures bug-free, non-markdown responses suitable for Telegram delivery via Photon.
 */
export function formatEmpatheticResponse(
  analysis: PsychAnalysisResult,
  options?: MessageFormatOptions,
): string {
  void analysis;
  void options;
  throw new Error("Not implemented: formatEmpatheticResponse");
}
