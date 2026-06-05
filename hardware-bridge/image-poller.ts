import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import { analyzeVisuals, type EmotionName } from "../butterbase/ai-gateway.js";

/**
 * Hardware Bridge — receives camera frames from the robot-dog Android phone.
 *
 * The Android client POSTs images every ~7 seconds to POST /api/hardware/image
 * and polls GET /api/hardware/mood for the latest analysed emotion.
 *
 * Frames are analysed via GPT-4o Vision (butterbase/ai-gateway.ts → analyzeVisuals),
 * and the dominant emotion is cached per device so the phone can react with sound.
 *
 * @connects butterbase/ai-gateway.ts (GPT-4o Vision routing)
 */

/** JSON body payload for base64 image ingestion. */
export interface HardwareImagePayload {
  imageBase64: string;
  deviceId?: string;
  capturedAt?: string;
}

/** Successful image ingestion response. */
export interface ImageIngestResponse {
  received: true;
  receiptId: string;
  source: "base64" | "multipart";
  capturedAt: string;
}

/** Latest analysed mood for a device. */
interface DeviceMood {
  mood: EmotionName;
  capturedAt: string;
}

/** In-memory cache of the latest mood per deviceId. */
const latestMoodByDevice = new Map<string, DeviceMood>();

/**
 * Records the latest analysed mood for a device so GET /mood can return it.
 * Exported so the RocketRide pipeline can also push results here if wired up.
 */
export function recordDeviceMood(
  deviceId: string,
  mood: EmotionName,
  capturedAt: string,
): void {
  latestMoodByDevice.set(deviceId, { mood, capturedAt });
}

/**
 * Maps the six detectable emotions down to the four the dog-face node reacts
 * to, so the phone always has a sound to play. `unknown`/unmappable returns null.
 */
function toReactableMood(emotion: string): EmotionName | null {
  switch (emotion) {
    case "happiness":
    case "sadness":
    case "fear":
    case "anger":
      return emotion;
    case "surprise":
      return "fear";
    case "disgust":
      return "anger";
    default:
      return null;
  }
}

/**
 * Runs GPT-4o Vision on a frame and caches the dominant emotion for the device.
 * Fire-and-forget: failures (e.g. missing BUTTERBASE_API_KEY) are logged, never
 * thrown, so the upload acknowledgement is unaffected.
 */
/** Max attempts for the vision call (GPT-4o occasionally returns non-JSON). */
const VISION_MAX_ATTEMPTS = 3;

async function analyseAndRecord(
  deviceId: string,
  imageBase64: string,
  capturedAt: string,
): Promise<void> {
  for (let attempt = 1; attempt <= VISION_MAX_ATTEMPTS; attempt++) {
    try {
      const visual = await analyzeVisuals(imageBase64);
      const mood = toReactableMood(visual.dominantEmotion);
      if (mood) {
        recordDeviceMood(deviceId, mood, capturedAt);
        console.log(
          `[hardware] device=${deviceId} mood=${mood} (dominant=${visual.dominantEmotion})`,
        );
      } else {
        console.log(
          `[hardware] device=${deviceId} dominant=${visual.dominantEmotion} — no reactable mood`,
        );
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[hardware] vision attempt ${attempt}/${VISION_MAX_ATTEMPTS} failed for device=${deviceId}: ${message}`,
      );
      // Retry only transient parse failures; auth/config errors won't recover.
      if (attempt === VISION_MAX_ATTEMPTS || !message.includes("parse JSON")) {
        return;
      }
    }
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

export const imagePollerRouter = Router();

/**
 * POST /image — receive a camera frame from the Android phone.
 *
 * Accepts:
 * - `application/json` with `{ imageBase64, deviceId?, capturedAt? }`
 * - `multipart/form-data` with field `image` (file upload) + optional `deviceId`
 *
 * Responds 202 immediately and analyses the frame asynchronously; the result is
 * fetched via GET /mood.
 */
imagePollerRouter.post(
  "/image",
  upload.single("image"),
  (req: Request, res: Response): void => {
    const jsonBody = req.body as Partial<HardwareImagePayload>;
    const hasBase64 =
      typeof jsonBody.imageBase64 === "string" &&
      jsonBody.imageBase64.length > 0;
    const hasFile = req.file !== undefined;

    if (!hasBase64 && !hasFile) {
      res.status(400).json({
        error: "Missing image data. Provide imageBase64 (JSON) or image (multipart).",
      });
      return;
    }

    const capturedAt = jsonBody.capturedAt ?? new Date().toISOString();
    const deviceId =
      (typeof req.body?.deviceId === "string" && req.body.deviceId) ||
      "unknown-device";

    const response: ImageIngestResponse = {
      received: true,
      receiptId: randomUUID(),
      source: hasFile ? "multipart" : "base64",
      capturedAt,
    };

    // Kick off analysis without blocking the acknowledgement.
    const imageBase64 = hasFile
      ? req.file!.buffer.toString("base64")
      : (jsonBody.imageBase64 as string);
    void analyseAndRecord(deviceId, imageBase64, capturedAt);

    res.status(202).json(response);
  },
);

/**
 * GET /mood?deviceId=android-01 — latest analysed mood for the device.
 *
 * Returns {status:"success", mood, capturedAt} once an analysis exists, or
 * {status:"pending"} before the first frame has been analysed.
 */
imagePollerRouter.get("/mood", (req: Request, res: Response): void => {
  const deviceId = String(req.query.deviceId ?? "");
  const latest = deviceId ? latestMoodByDevice.get(deviceId) : undefined;
  if (!latest) {
    res.status(200).json({ status: "pending" });
    return;
  }
  res.status(200).json({
    status: "success",
    mood: latest.mood,
    capturedAt: latest.capturedAt,
  });
});
