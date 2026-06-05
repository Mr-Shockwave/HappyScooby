import {
  analyzePsychology,
  type VisualAnalysisResult,
} from "../../butterbase/ai-gateway.js";
import type { PipelineState } from "../types.js";

/**
 * RocketRide Psych Analysis Node — Claude 3.5 mood and contradiction detection.
 *
 * @sponsor RocketRide
 * RocketRide pipeline orchestration stage 3: synthesizes visual data, Telegram text,
 * and XTrace history context through Butterbase analyzePsychology.
 *
 * @connects butterbase/ai-gateway.ts → analyzePsychology (Claude 3.5 Sonnet)
 * @connects xtrace/memory-manager.ts (xtraceContext placeholder — wired in Prompt 4)
 * @connects rocketride/nodes/action-decision.ts (downstream stage)
 */

/** Placeholder visual result used when vision stage was skipped (text-only path). */
const TEXT_ONLY_VISUAL_PLACEHOLDER: VisualAnalysisResult = {
  emotions: [],
  dominantEmotion: "unknown",
  rawAnalysis:
    "No visual data available. Analysis based on Telegram text and XTrace context only.",
};

/**
 * Combines visual data, telegram text, and xtraceContext; calls Butterbase gateway.
 * Gracefully handles missing visualAnalysis by using a text-only placeholder.
 */
export async function runPsychAnalysis(
  state: PipelineState,
): Promise<PipelineState> {
  const visualData = state.visualAnalysis ?? TEXT_ONLY_VISUAL_PLACEHOLDER;
  const textInput = state.rawText ?? "";

  const psychAnalysis = await analyzePsychology(
    visualData,
    textInput,
    state.xtraceContext,
  );

  return {
    ...state,
    psychAnalysis,
    completedStages: [...state.completedStages, "psych_analysis"],
  };
}
