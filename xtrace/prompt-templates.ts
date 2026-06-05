/**
 * @deprecated Import from xtrace/prompts.ts instead.
 * Re-exports for backward compatibility.
 */
export {
  CONTRADICTION_RESOLUTION_PROMPT,
  EXTRACTION_PROMPT,
} from "./prompts.js";

import { EXTRACTION_PROMPT } from "./prompts.js";

/** @deprecated Use EXTRACTION_PROMPT from xtrace/prompts.ts */
export const PATTERN_EXTRACTION_PROMPT = EXTRACTION_PROMPT;

/** @deprecated Use getXTraceContext from xtrace/memory-manager.ts */
export const MEMORY_CONTEXT_PROMPT = `Given the user's behavioral history stored in XTrace memory,
provide relevant context that may explain the current mood state.
Highlight any patterns that connect past contradictions to present signals.`;
