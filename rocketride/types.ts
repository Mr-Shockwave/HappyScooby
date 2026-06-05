import type {
  PsychologyAnalysisResult,
  VisualAnalysisResult,
} from "../butterbase/ai-gateway.js";
import type { XTracePayload } from "../xtrace/types.js";

export type { XTracePayload } from "../xtrace/types.js";

/**
 * Shared RocketRide pipeline types — state object flowing through all nodes.
 *
 * @sponsor RocketRide
 * RocketRide pipeline orchestration: multimodal behavioral signals are normalized
 * into PipelineState and passed sequentially through ingestion → vision → psych → action.
 */

/** Trigger source for pipeline execution. */
export type PipelineTriggerType = "image" | "text";

/** Empathetic message draft prepared for Photon delivery (Prompt 5). */
export interface PhotonPayload {
  userId: string;
  message: string;
  recommendedAction: string;
  triggerType: PipelineTriggerType;
}

/** Non-fatal stage error recorded during RocketRide pipeline orchestration. */
export interface PipelineStageError {
  stage: string;
  message: string;
  skipped: boolean;
}

/**
 * Central state object passed between all RocketRide pipeline nodes.
 * Each node reads from and returns an updated PipelineState.
 */
export interface PipelineState {
  userId: string;
  triggerType: PipelineTriggerType;
  rawImage?: string;
  rawText?: string;
  visualAnalysis?: VisualAnalysisResult;
  psychAnalysis?: PsychologyAnalysisResult;
  xtraceContext: string;
  xtracePayload?: XTracePayload;
  photonPayload?: PhotonPayload;
  stageErrors: PipelineStageError[];
  completedStages: string[];
}

/** Raw inputs accepted by the ingestion node. */
export interface IngestionInput {
  userId: string;
  imageBase64?: string;
  telegramText?: string;
  triggerType: PipelineTriggerType;
}

/** Payload passed to runPipeline from hardware or Photon triggers. */
export interface PipelineTriggerPayload {
  imageBase64?: string;
  telegramText?: string;
  xtraceContext?: string;
}

/** Creates an empty PipelineState with defaults. */
export function createInitialState(
  userId: string,
  triggerType: PipelineTriggerType,
  xtraceContext = "",
): PipelineState {
  return {
    userId,
    triggerType,
    xtraceContext,
    stageErrors: [],
    completedStages: [],
  };
}
