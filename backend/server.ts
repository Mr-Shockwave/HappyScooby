import "dotenv/config";
import cors from "cors";
import express from "express";
import { registerRoutes } from "./controllers/index.js";

/**
 * Behavioral Archaeologist — main Express server entry point.
 *
 * Mounts routes for all four hackathon sponsors:
 * - Butterbase: consent middleware + Prisma DB (via butterbase/)
 * - RocketRide: pipeline nodes (via rocketride/)
 * - XTrace: memory layer (via xtrace/)
 * - Photon: Telegram webhooks (via photon/)
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

app.listen(PORT, () => {
  console.log(`Behavioral Archaeologist server running on port ${PORT}`);
});
