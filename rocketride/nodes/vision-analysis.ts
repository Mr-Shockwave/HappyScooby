import {
  routeToVisionModel,
  type VisionAnalysisInput,
  type VisionAnalysisResult,
} from "../../butterbase/ai-gateway.js";
import type { IngestionOutput } from "./ingestion.js";
import type { PipelineNode } from "./types.js";

/**
 * RocketRide Vision Analysis Node — GPT-4o facial expression extraction.
 *
 * @sponsor RocketRide (orchestration) + Butterbase (AI gateway routing)
 * @connects butterbase/ai-gateway.ts → OpenAI GPT-4o Vision (OPENAI_API_KEY)
 * @connects rocketride/nodes/psych-analysis.ts (downstream stage)
 */

export const visionAnalysisNode: PipelineNode<
  IngestionOutput,
  VisionAnalysisResult
> = {
  id: "vision-analysis",
  description: "Extract facial expressions via GPT-4o Vision through Butterbase AI gateway",

  async execute(input: IngestionOutput): Promise<VisionAnalysisResult> {
    const frame = input.aggregated.latestImage;
    if (!frame) {
      throw new Error("vision-analysis requires a camera frame from ingestion");
    }

    const visionInput: VisionAnalysisInput = {
      imageBase64: frame.imageBase64,
      userId: input.aggregated.userId,
      capturedAt: frame.capturedAt ?? new Date().toISOString(),
    };

    return routeToVisionModel(visionInput);
  },
};
