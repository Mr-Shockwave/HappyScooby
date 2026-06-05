import type { PsychologyAnalysisResult } from "../../butterbase/ai-gateway.js";
import type { HardwareImagePayload } from "../../hardware-bridge/image-poller.js";

/**
 * Mood Aggregator — merges multi-source behavioral signals for RocketRide pipeline.
 *
 * @sponsor RocketRide (orchestrates merged input into pipeline nodes)
 * @connects hardware-bridge/image-poller.ts (10s camera frames)
 * @connects photon/telegram-bot.ts (Telegram text messages)
 * @connects rocketride/nodes/ingestion.ts (first pipeline stage)
 */

/** Telegram message context from Photon webhook. */
export interface TelegramMessageContext {
  userId: string;
  telegramId: string;
  text: string;
  receivedAt: string;
}

/** Unified behavioral input for the RocketRide ingestion node. */
export interface AggregatedMoodInput {
  userId: string;
  latestImage?: HardwareImagePayload;
  latestMessage?: TelegramMessageContext;
  aggregatedAt: string;
}

/** Aggregated mood output ready for XTrace storage and Photon response. */
export interface AggregatedMoodOutput {
  input: AggregatedMoodInput;
  analysis?: PsychologyAnalysisResult;
}

/**
 * Merges the latest hardware image and Telegram text into a single pipeline input.
 * Feeds rocketride/nodes/ingestion.ts for downstream AI processing.
 */
export async function aggregateMoodSignals(
  userId: string,
): Promise<AggregatedMoodOutput> {
  void userId;
  throw new Error("Not implemented: aggregateMoodSignals");
}
