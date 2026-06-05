import type { VisualAnalysisResult } from "../../butterbase/ai-gateway.js";
import type { XTracePayload } from "../../xtrace/types.js";
import type { PhotonPayload, PipelineState } from "../types.js";

/**
 * RocketRide Action Decision Node — prepares XTrace and Photon output payloads.
 *
 * @sponsor RocketRide
 * RocketRide pipeline orchestration final stage: formats distinct output payloads
 * for XTrace memory storage and Photon Telegram delivery.
 *
 * @connects xtrace/memory-manager.ts (consumes xtracePayload via updateXTraceMemory)
 * @connects photon/telegram-bot.ts (consumes photonPayload)
 * @connects butterbase/schema.prisma (MoodSnapshot persistence)
 */

function buildRecommendedMemoryUpdates(state: PipelineState): string[] {
  const psych = state.psychAnalysis;
  const visual = state.visualAnalysis;
  const updates: string[] = [];

  for (const contradiction of psych?.contradictions ?? []) {
    updates.push(
      `Revise prior beliefs in light of contradiction: ${contradiction}. Prioritize visual/behavioral ground truth per XTrace reconciliation policy.`,
    );
  }

  if (visual && psych && visual.dominantEmotion !== "unknown") {
    updates.push(
      `Update emotional baseline: observed dominant expression "${visual.dominantEmotion}" vs. self-reported mood "${psych.currentMood}".`,
    );
  }

  if (updates.length === 0) {
    updates.push(
      "No contradictions detected — append new observed facts to long-term profile.",
    );
  }

  return updates;
}

function buildXTracePayload(state: PipelineState): XTracePayload {
  const psych = state.psychAnalysis;
  const visual = state.visualAnalysis;

  const observedFacts: string[] = [];

  if (psych?.currentMood) {
    observedFacts.push(`User current mood assessed as: ${psych.currentMood}`);
  }
  if (state.rawText) {
    observedFacts.push(`User reported: "${state.rawText}"`);
  }
  if (visual?.dominantEmotion && visual.dominantEmotion !== "unknown") {
    observedFacts.push(
      `Visual ground truth — dominant expression: ${visual.dominantEmotion}`,
    );
  }
  if (visual?.rawAnalysis) {
    observedFacts.push(`Visual observation: ${visual.rawAnalysis}`);
  }

  const visualEvidence: VisualAnalysisResult | Record<string, unknown> =
    visual ?? { note: "No visual data — text-only interaction" };

  const detectedContradictions = (psych?.contradictions ?? []).map((c) => {
    if (visual?.dominantEmotion && visual.dominantEmotion !== "unknown") {
      return `${c} [ground truth: visual "${visual.dominantEmotion}" overrides self-report]`;
    }
    return c;
  });

  return {
    observedFacts,
    visualEvidence,
    detectedContradictions,
    recommendedMemoryUpdates: buildRecommendedMemoryUpdates(state),
    recordedAt: new Date().toISOString(),
  };
}

function buildPhotonPayload(state: PipelineState): PhotonPayload {
  const psych = state.psychAnalysis;

  return {
    userId: state.userId,
    message:
      psych?.photonMessageDraft ??
      "I'm here with you. Let me know how you're feeling when you're ready.",
    recommendedAction: psych?.recommendedAction ?? "continue_monitoring",
    triggerType: state.triggerType,
  };
}

/**
 * Takes final psych analysis and formats xtracePayload + photonPayload on state.
 * Does NOT call XTrace API or send Photon messages — data preparation only.
 */
export async function runActionDecision(
  state: PipelineState,
): Promise<PipelineState> {
  if (!state.psychAnalysis) {
    throw new Error(
      "RocketRide action-decision: psychAnalysis is required before formatting outputs",
    );
  }

  const xtracePayload = buildXTracePayload(state);
  const photonPayload = buildPhotonPayload(state);

  return {
    ...state,
    xtracePayload,
    photonPayload,
    completedStages: [...state.completedStages, "action_decision"],
  };
}
