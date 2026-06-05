/**
 * Photon Spectrum bot — Telegram provider with the canonical app.messages loop.
 *
 * @sponsor Photon
 */

import { Spectrum } from "spectrum-ts";
import { getPhotonConfig, isPhotonConfigured } from "./config.js";
import {
  handleIncomingMessage,
  PIPELINE_ERROR_MESSAGE,
} from "./message-handler.js";
import { telegram } from "./telegram-platform.js";

export { isPhotonConfigured };

let spectrumBotPromise: Promise<void> | null = null;

/**
 * Starts the Spectrum Telegram bot loop:
 *
 *   for await (const [space, message] of app.messages) { ... }
 */
export function startSpectrumBot(): Promise<void> {
  if (!spectrumBotPromise) {
    spectrumBotPromise = runSpectrumBot().catch((error) => {
      spectrumBotPromise = null;
      throw error;
    });
  }

  return spectrumBotPromise;
}

async function runSpectrumBot(): Promise<void> {
  const config = getPhotonConfig();
  if (!config) {
    return;
  }

  const app = await Spectrum({
    projectId: config.projectId,
    projectSecret: config.projectSecret,
    providers: [telegram.config({ botToken: config.botToken })],
  });

  console.log("Photon Spectrum bot listening on app.messages (Telegram)");

  for await (const [space, message] of app.messages) {
    try {
      if (message.content.type !== "text" || !message.sender?.id) {
        continue;
      }

      const reply = await handleIncomingMessage({
        telegramId: message.sender.id,
        chatId: Number(space.id),
        text: message.content.text,
      });

      await space.send(reply);
    } catch (error) {
      console.error("Photon Spectrum message error:", error);
      await space.send(PIPELINE_ERROR_MESSAGE);
    }
  }
}
