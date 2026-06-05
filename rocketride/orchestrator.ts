import {
  getXTraceContext,
  updateXTraceMemory,
} from "../xtrace/memory-manager.js";
import { runActionDecision } from "./nodes/action-decision.js";
import { runIngestion } from "./nodes/ingestion.js";
import { runPsychAnalysis } from "./nodes/psych-analysis.js";
import { runVisionAnalysis } from "./nodes/vision-analysis.js";
import type {
  PipelineState,
  PipelineTriggerPayload,
  PipelineTriggerType,
} from "./types.js";

/**
 * RocketRide Pipeline Orchestrator — core sequential execution engine.
 *
 * @sponsor RocketRide
 * RocketRide pipeline orchestration: meaningfully connects multimodal inputs
 * (hardware images + Telegram text) through Butterbase AI Gateway nodes,
 * with a persistent XTrace self-revising memory loop:
 *
 *   1. READ  — getXTraceContext() injects long-term profile before analysis
 *   2. RUN   — ingestion → vision → psych → action_decision
 *   3. WRITE — updateXTraceMemory() reconciles facts and revises old beliefs
 *
 * This read-analyze-write cycle is the "persistent, self-revising memory loop"
 * required by the XTrace hackathon track.
 *
 * DAG: ingestion → vision_analysis → psych_analysis → action_decision
 *
 * @connects xtrace/memory-manager.ts (XTrace Memory API read/write)
 * @connects hardware-bridge/image-poller.ts (triggerType: 'image')
 * @connects photon/telegram-bot.ts (triggerType: 'text')
 * @connects butterbase/ai-gateway.ts (vision + psych inference)
 */

/**
 * Sequentially executes all 4 RocketRide pipeline nodes with XTrace memory loop.
 *
 * Error handling:
 * - If vision_analysis fails (e.g. no image), gracefully skips to psych_analysis
 *   using text-only data with a placeholder visual context.
 * - Fatal errors from ingestion, psych_analysis, or action_decision propagate.
 */
export async function runPipeline(
  userId: string,
  triggerType: PipelineTriggerType,
  payload: PipelineTriggerPayload,
): Promise<PipelineState> {
  // XTrace READ — fetch long-term profile before pipeline starts
  const xtraceContext =
    payload.xtraceContext ?? (await getXTraceContext(userId));

  // Stage 1: Ingestion — normalize raw multimodal inputs
  let state = await runIngestion({
    userId,
    triggerType,
    imageBase64: payload.imageBase64,
    telegramText: payload.telegramText,
  });

  state = { ...state, xtraceContext };

  // Stage 2: Vision Analysis — skip gracefully if no image or gateway fails
  try {
    state = await runVisionAnalysis(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown vision analysis error";

    state = {
      ...state,
      stageErrors: [
        ...state.stageErrors,
        {
          stage: "vision_analysis",
          message,
          skipped: true,
        },
      ],
    };
  }

  // Stage 3: Psych Analysis — works with or without visual data
  state = await runPsychAnalysis(state);

  // Stage 4: Action Decision — prepare XTrace + Photon payloads
  state = await runActionDecision(state);

  // XTrace WRITE — send interaction data for fact extraction and contradiction reconciliation
  if (state.xtracePayload) {
    await updateXTraceMemory(userId, state.xtracePayload);
  }

  return state;
}
