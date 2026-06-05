import {
  createInitialState,
  type IngestionInput,
  type PipelineState,
} from "../types.js";

/**
 * RocketRide Ingestion Node — normalizes multimodal raw inputs into PipelineState.
 *
 * @sponsor RocketRide
 * RocketRide pipeline orchestration entry point: merges hardware image polling
 * and Photon Telegram webhook text into a unified state object.
 *
 * @connects hardware-bridge/image-poller.ts (imageBase64 from 10s camera frames)
 * @connects photon/telegram-bot.ts (telegramText from webhook)
 * @connects rocketride/nodes/vision-analysis.ts (downstream stage)
 */

/**
 * Accepts raw multimodal inputs and normalizes them into PipelineState.
 * At least one of imageBase64 or telegramText should be provided.
 */
export async function runIngestion(input: IngestionInput): Promise<PipelineState> {
  const state = createInitialState(input.userId, input.triggerType);

  if (input.imageBase64) {
    state.rawImage = input.imageBase64;
  }

  if (input.telegramText) {
    state.rawText = input.telegramText;
  }

  if (!state.rawImage && !state.rawText) {
    throw new Error(
      "RocketRide ingestion: at least one of imageBase64 or telegramText is required",
    );
  }

  state.completedStages.push("ingestion");
  return state;
}
