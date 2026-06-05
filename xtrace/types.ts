import type { VisualAnalysisResult } from "../butterbase/ai-gateway.js";

/**
 * XTrace Memory API — typed request/response schemas.
 *
 * @sponsor XTrace
 * Defines the exact JSON payload sent to the XTrace hosted memory platform
 * for fact extraction and contradiction reconciliation.
 */

/** Payload sent to XTrace Memory API after each pipeline interaction. */
export interface XTracePayload {
  /** Durable psychological facts observed in this interaction. */
  observedFacts: string[];
  /** Raw GPT-4o vision output used as behavioral ground truth. */
  visualEvidence: VisualAnalysisResult | Record<string, unknown>;
  /** Contradictions between self-report and observed behavior. */
  detectedContradictions: string[];
  /** Instructions for XTrace on which old beliefs to revise. */
  recommendedMemoryUpdates: string[];
  /** ISO timestamp of when this interaction was recorded. */
  recordedAt: string;
}

/** Long-term profile stored per user in XTrace (MVP in-memory mock). */
export interface XTraceUserProfile {
  userId: string;
  psychologicalProfile: string;
  emotionalBaselines: string[];
  knownPreferences: string[];
  behavioralMasks: string[];
  revisedBeliefs: string[];
  lastUpdatedAt: string;
}

/** GET /v1/users/{userId}/memory/context — XTrace Memory API response shape. */
export interface XTraceContextResponse {
  userId: string;
  profile: XTraceUserProfile;
  formattedContext: string;
}

/** POST /v1/users/{userId}/memory/interactions — XTrace Memory API request body. */
export interface XTraceMemoryUpdateRequest {
  userId: string;
  payload: XTracePayload;
  extractionPrompt: string;
  reconciliationPrompt: string;
}

/** POST /v1/users/{userId}/memory/interactions — XTrace Memory API response shape. */
export interface XTraceMemoryUpdateResponse {
  userId: string;
  memoryId: string;
  revisedBeliefs: string[];
  behavioralMasksRecorded: string[];
  updatedAt: string;
}
