import { analyzeVisuals } from "../../butterbase/ai-gateway.js";
import type { PipelineState } from "../types.js";

/**
 * RocketRide Vision Analysis Node — GPT-4o facial expression extraction.
 *
 * @sponsor RocketRide
 * RocketRide pipeline orchestration stage 2: routes camera frames through
 * the Butterbase AI Gateway (analyzeVisuals) and attaches VisualAnalysisResult.
 *
 * @connects butterbase/ai-gateway.ts → analyzeVisuals (GPT-4o Vision)
 * @connects rocketride/nodes/psych-analysis.ts (downstream stage)
 */

/**
 * If rawImage exists in state, calls Butterbase analyzeVisuals and attaches result.
 * Throws if no image is present — the orchestrator catches this and skips gracefully.
 */
export async function runVisionAnalysis(
  state: PipelineState,
): Promise<PipelineState> {
  if (!state.rawImage) {
    throw new Error(
      "RocketRide vision-analysis: no image in state — stage skipped by orchestrator",
    );
  }

  const visualAnalysis = await analyzeVisuals(state.rawImage);

  return {
    ...state,
    visualAnalysis,
    completedStages: [...state.completedStages, "vision_analysis"],
  };
}
