import "dotenv/config";
import cors from "cors";
import express from "express";
import { registerRoutes } from "./controllers/index.js";
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
  });
});

registerRoutes(app);

app.listen(PORT, async () => {
  console.log(`Behavioral Archaeologist server running on port ${PORT}`);

  const publicUrl = process.env.SERVER_PUBLIC_URL;
  if (publicUrl && process.env.TELEGRAM_BOT_TOKEN) {
    try {
      const result = await setupTelegramWebhook(publicUrl);
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
  } else {
    console.log(
      "Photon webhook setup skipped — set SERVER_PUBLIC_URL and TELEGRAM_BOT_TOKEN to enable",
    );
  }
});
