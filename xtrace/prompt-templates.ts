/**
 * XTrace Prompt Templates — engineered prompts for behavioral memory extraction.
 *
 * @sponsor XTrace
 * @connects xtrace/memory-manager.ts (used when storing and resolving patterns)
 * @connects rocketride/nodes/psych-analysis.ts (contradiction context enrichment)
 */

/** Prompt for extracting long-term behavioral patterns from mood history. */
export const PATTERN_EXTRACTION_PROMPT = `You are a behavioral archaeologist analyzing longitudinal mood data.
Given a series of mood snapshots, identify recurring behavioral patterns.
Focus on emotional trajectories, trigger-response cycles, and temporal rhythms.
Return structured patterns with confidence scores.`;

/** Prompt for resolving contradictions between stated mood and observed behavior. */
export const CONTRADICTION_RESOLUTION_PROMPT = `You are analyzing a contradiction between a user's self-reported mood
and their observed behavioral signals (facial expressions, message tone).
Given the contradiction and historical context, provide a compassionate
explanation of the discrepancy without making clinical diagnoses.`;

/** Prompt for enriching psych analysis with long-term memory context. */
export const MEMORY_CONTEXT_PROMPT = `Given the user's behavioral history stored in XTrace memory,
provide relevant context that may explain the current mood state.
Highlight any patterns that connect past contradictions to present signals.`;
