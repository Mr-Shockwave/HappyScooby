import type { AggregatedMoodInput } from "../../backend/services/mood-aggregator.js";
import type { HardwareImagePayload } from "../../hardware-bridge/image-poller.js";
import type { PipelineNode } from "./types.js";

/**
 * RocketRide Ingestion Node — merges multi-source behavioral signals.
 *
 * @sponsor RocketRide
 * @connects photon/telegram-bot.ts (Telegram text input)
 * @connects hardware-bridge/image-poller.ts (10s Android camera frames)
 * @connects rocketride/nodes/vision-analysis.ts (downstream stage)
 */

/** Raw inputs collected before pipeline merge. */
export interface IngestionInput {
  userId: string;
  telegramText?: string;
  cameraFrame?: HardwareImagePayload;
}

/** Merged payload passed to vision-analysis node. */
export interface IngestionOutput {
  aggregated: AggregatedMoodInput;
}

export const ingestionNode: PipelineNode<IngestionInput, IngestionOutput> = {
  id: "ingestion",
  description: "Merge Photon Telegram text with hardware-bridge camera frames",

  async execute(input: IngestionInput): Promise<IngestionOutput> {
    void input;
    throw new Error("Not implemented: ingestionNode.execute");
  },
};
