import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import multer from "multer";

/**
 * Hardware Bridge — receives camera frames from the robot-dog Android phone.
 *
 * The Android client POSTs images every ~10 seconds to POST /api/hardware/image.
 * Frames flow into rocketride/nodes/ingestion.ts → GPT-4o Vision → Claude psych analysis.
 *
 * @connects rocketride/nodes/ingestion.ts (merges with Telegram text)
 * @connects butterbase/storage.ts (encrypts raw frames)
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
 * - `multipart/form-data` with field `image` (file upload)
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

    const capturedAt =
      jsonBody.capturedAt ?? new Date().toISOString();

    const response: ImageIngestResponse = {
      received: true,
      receiptId: randomUUID(),
      source: hasFile ? "multipart" : "base64",
      capturedAt,
    };

    // TODO: forward to rocketride/nodes/ingestion.ts and butterbase/storage.ts
    res.status(202).json(response);
  },
);
