import "dotenv/config";
import cors from "cors";
import express from "express";
import { registerRoutes } from "./controllers/index.js";
import { getDbMode } from "../butterbase/client.js";
import { startSpectrumBot } from "../photon/spectrum-app.js";
import { isPhotonConfigured, isValidPublicServerUrl } from "../photon/config.js";
import { setupTelegramWebhook } from "../photon/webhook-setup.js";

/**
 * Behavioral Archaeologist — main Express server entry point.
 *
 * Mounts routes for all four hackathon sponsors:
 * - Butterbase: consent middleware + Prisma DB (via butterbase/)
 * - RocketRide: pipeline nodes (via rocketride/)
 * - XTrace: memory layer (via xtrace/)
 * - Photon: Telegram webhooks (via photon/) — user's ONLY interface
 *
 * Hardware bridge image ingestion is mounted at /api/hardware.
 */

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "behavioral-archaeologist",
    sponsors: ["Butterbase", "RocketRide", "XTrace", "Photon"],
    butterbase: {
      appId: process.env.BUTTERBASE_PROJECT_ID ?? null,
      dbMode: getDbMode(),
      frontendUrl: "https://happyscooby.butterbase.dev",
    },
  });
});

registerRoutes(app);

app.listen(PORT, async () => {
  console.log(`Behavioral Archaeologist server running on port ${PORT}`);

  if (isPhotonConfigured()) {
    void startSpectrumBot().catch((error) => {
      console.error("Photon Spectrum bot failed:", error);
    });
  } else if (process.env.PHOTON_PROJECT_ID || process.env.PHOTON_PROJECT_SECRET) {
    console.warn(
      "Photon Spectrum bot skipped — save real PHOTON_PROJECT_ID and PHOTON_PROJECT_SECRET in .env (not placeholder values).",
    );
  } else {
    console.log(
      "Photon Spectrum bot skipped — set PHOTON_PROJECT_ID, PHOTON_PROJECT_SECRET, and TELEGRAM_BOT_TOKEN to enable",
    );
  }

  const publicUrl = process.env.SERVER_PUBLIC_URL;
  if (isValidPublicServerUrl(publicUrl) && process.env.TELEGRAM_BOT_TOKEN) {
    try {
      const result = await setupTelegramWebhook(publicUrl as string);
      if (result.success) {
        console.log(`Photon Telegram webhook registered: ${result.webhookUrl}`);
      } else {
        console.warn(
          `Photon webhook registration failed: ${result.description ?? "unknown error"}`,
        );
      }
    } catch (error) {
      console.warn("Photon webhook setup skipped:", error);
    }
  } else if (publicUrl) {
    console.log(
      "Photon webhook setup skipped — set SERVER_PUBLIC_URL to a real public HTTPS URL (e.g. an ngrok URL), not the .env.example placeholder.",
    );
  } else {
    console.log(
      "Photon webhook setup skipped — set SERVER_PUBLIC_URL and TELEGRAM_BOT_TOKEN to enable",
    );
  }
});
