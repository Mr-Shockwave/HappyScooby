import {
  CONTRADICTION_RESOLUTION_PROMPT,
  EXTRACTION_PROMPT,
} from "./prompts.js";
import type {
  XTraceContextResponse,
  XTraceMemoryUpdateRequest,
  XTraceMemoryUpdateResponse,
  XTracePayload,
  XTraceUserProfile,
} from "./types.js";

/**
 * XTrace Memory Manager — wrapper for the XTrace hosted Memory API.
 *
 * @sponsor XTrace
 * Integrates with the XTrace Memory API for durable fact storage and
 * automatic contradiction reconciliation (self-revising memory loop).
 *
 * MVP: HTTP calls are mocked with an in-memory store, structured identically
 * to the production REST API for easy swap-in.
 *
 * @connects rocketride/orchestrator.ts (read context before, write after pipeline)
 * @connects xtrace/prompts.ts (extraction + reconciliation prompts)
 */

const XTRACE_DEFAULT_URL = "https://api.xtrace.ai";

/** In-memory MVP store simulating XTrace hosted memory per user. */
const userProfiles = new Map<string, XTraceUserProfile>();

function getXTraceConfig(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env.XTRACE_API_KEY;
  if (!apiKey) {
    throw new Error("XTrace Memory API: XTRACE_API_KEY is not configured");
  }
  return {
    apiKey,
    baseUrl: process.env.XTRACE_API_URL ?? XTRACE_DEFAULT_URL,
  };
}

function createDefaultProfile(userId: string): XTraceUserProfile {
  return {
    userId,
    psychologicalProfile:
      "New user — no long-term psychological profile established yet.",
    emotionalBaselines: [],
    knownPreferences: [],
    behavioralMasks: [],
    revisedBeliefs: [],
    lastUpdatedAt: new Date().toISOString(),
  };
}

function formatContextString(profile: XTraceUserProfile): string {
  const sections = [
    `## XTrace Long-Term Profile (user: ${profile.userId})`,
    `Psychological profile: ${profile.psychologicalProfile}`,
  ];

  if (profile.emotionalBaselines.length > 0) {
    sections.push(
      `Emotional baselines: ${profile.emotionalBaselines.join("; ")}`,
    );
  }

  if (profile.knownPreferences.length > 0) {
    sections.push(`Known preferences: ${profile.knownPreferences.join("; ")}`);
  }

  if (profile.behavioralMasks.length > 0) {
    sections.push(
      `Behavioral masks (text vs. observed contradictions): ${profile.behavioralMasks.join("; ")}`,
    );
  }

  if (profile.revisedBeliefs.length > 0) {
    sections.push(
      `Recently revised beliefs: ${profile.revisedBeliefs.join("; ")}`,
    );
  }

  return sections.join("\n");
}

/**
 * Applies contradiction reconciliation rules to update the in-memory profile.
 * Uses CONTRADICTION_RESOLUTION_PROMPT logic: visual/behavioral data is ground truth.
 */
function reconcileProfile(
  profile: XTraceUserProfile,
  payload: XTracePayload,
): XTraceUserProfile {
  const updated = { ...profile };

  for (const fact of payload.observedFacts) {
    if (
      fact.toLowerCase().includes("prefers") ||
      fact.toLowerCase().includes("preference")
    ) {
      if (!updated.knownPreferences.includes(fact)) {
        updated.knownPreferences.push(fact);
      }
    } else if (
      fact.toLowerCase().includes("baseline") ||
      fact.toLowerCase().includes("mood")
    ) {
      if (!updated.emotionalBaselines.includes(fact)) {
        updated.emotionalBaselines.push(fact);
      }
    }
  }

  for (const contradiction of payload.detectedContradictions) {
    const maskEntry = `behavioral_mask: ${contradiction}`;
    if (!updated.behavioralMasks.includes(maskEntry)) {
      updated.behavioralMasks.push(maskEntry);
    }
  }

  for (const revision of payload.recommendedMemoryUpdates) {
    if (!updated.revisedBeliefs.includes(revision)) {
      updated.revisedBeliefs.push(revision);
    }
  }

  if (payload.detectedContradictions.length > 0) {
    updated.psychologicalProfile =
      "Profile includes behavioral masks — user may report emotions that differ from observed expressions. Prioritize visual/behavioral ground truth per XTrace reconciliation policy.";
  }

  updated.lastUpdatedAt = new Date().toISOString();
  return updated;
}

/**
 * Mock GET /v1/users/{userId}/memory/context
 * Fetches the user's long-term psychological profile from the XTrace Memory API.
 * Returns a formatted string for injection into the RocketRide pipeline.
 */
export async function getXTraceContext(userId: string): Promise<string> {
  const { apiKey, baseUrl } = getXTraceConfig();
  const url = `${baseUrl}/v1/users/${userId}/memory/context`;

  // MVP: mock HTTP — production swaps this block for real fetch()
  void url;
  void apiKey;

  let profile = userProfiles.get(userId);
  if (!profile) {
    profile = createDefaultProfile(userId);
    userProfiles.set(userId, profile);
  }

  const response: XTraceContextResponse = {
    userId,
    profile,
    formattedContext: formatContextString(profile),
  };

  return response.formattedContext;
}

/**
 * Mock POST /v1/users/{userId}/memory/interactions
 * Sends new interaction data to the XTrace Memory API for fact extraction
 * and contradiction reconciliation (self-revising memory).
 */
export async function updateXTraceMemory(
  userId: string,
  xtracePayload: XTracePayload,
): Promise<XTraceMemoryUpdateResponse> {
  const { apiKey, baseUrl } = getXTraceConfig();
  const url = `${baseUrl}/v1/users/${userId}/memory/interactions`;

  const requestBody: XTraceMemoryUpdateRequest = {
    userId,
    payload: xtracePayload,
    extractionPrompt: EXTRACTION_PROMPT,
    reconciliationPrompt: CONTRADICTION_RESOLUTION_PROMPT,
  };

  // MVP: mock HTTP — production swaps this block for:
  // await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(requestBody) })
  void url;
  void apiKey;
  void requestBody;

  let profile = userProfiles.get(userId) ?? createDefaultProfile(userId);
  profile = reconcileProfile(profile, xtracePayload);
  userProfiles.set(userId, profile);

  const behavioralMasksRecorded = xtracePayload.detectedContradictions.map(
    (c) => `behavioral_mask: ${c}`,
  );

  return {
    userId,
    memoryId: `xtrace_mem_${userId}_${Date.now()}`,
    revisedBeliefs: xtracePayload.recommendedMemoryUpdates,
    behavioralMasksRecorded,
    updatedAt: profile.lastUpdatedAt,
  };
}
