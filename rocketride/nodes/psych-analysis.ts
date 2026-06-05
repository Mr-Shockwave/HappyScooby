import {
  routeToPsychAnalysis,
  type PsychAnalysisInput,
  type PsychAnalysisResult,
  type VisionAnalysisResult,
} from "../../butterbase/ai-gateway.js";
import type { IngestionOutput } from "./ingestion.js";
import type { PipelineNode } from "./types.js";

/**
 * RocketRide Psych Analysis Node — Claude 3.5 mood and contradiction detection.
 *
 * @sponsor RocketRide (orchestration) + Butterbase (AI gateway routing)
 * @connects butterbase/ai-gateway.ts → Anthropic Claude 3.5 Sonnet (ANTHROPIC_API_KEY)
 * @connects rocketride/nodes/action-decision.ts (downstream stage)
 */

/** Combined input from vision analysis and original ingestion context. */
export interface PsychAnalysisNodeInput {
  visionResult: VisionAnalysisResult;
  ingestion: IngestionOutput;
}

export const psychAnalysisNode: PipelineNode<
  PsychAnalysisNodeInput,
  PsychAnalysisResult
> = {
  id: "psych-analysis",
  description:
    "Detect mood and contradictions via Claude 3.5 Sonnet through Butterbase AI gateway",

  async execute(input: PsychAnalysisNodeInput): Promise<PsychAnalysisResult> {
    const psychInput: PsychAnalysisInput = {
      visionResult: input.visionResult,
      telegramContext: input.ingestion.aggregated.latestMessage?.text,
      userId: input.ingestion.aggregated.userId,
    };

    return routeToPsychAnalysis(psychInput);
  },
};
