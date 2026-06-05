/**
 * Butterbase AI Gateway — routes inference requests to sponsor LLM providers.
 *
 * @sponsor Butterbase
 * @connects rocketride/nodes/vision-analysis.ts → OpenAI GPT-4o Vision (OPENAI_API_KEY)
 * @connects rocketride/nodes/psych-analysis.ts → Anthropic Claude 3.5 Sonnet (ANTHROPIC_API_KEY)
 */

/** Input for GPT-4o Vision facial expression extraction. */
export interface VisionAnalysisInput {
  imageBase64: string;
  userId: string;
  capturedAt: string;
}

/** Structured facial expression output from GPT-4o Vision. */
export interface VisionAnalysisResult {
  expressions: string[];
  confidence: number;
  rawDescription: string;
}

/** Input for Claude 3.5 Sonnet psychological analysis. */
export interface PsychAnalysisInput {
  visionResult: VisionAnalysisResult;
  telegramContext?: string;
  userId: string;
}

/** Mood and contradiction output from Claude 3.5 Sonnet. */
export interface PsychAnalysisResult {
  currentMood: string;
  contradictions: string[];
  reasoning: string;
}

/**
 * Routes image data to OpenAI GPT-4o Vision for facial expression extraction.
 * Uses OPENAI_API_KEY from environment.
 */
export async function routeToVisionModel(
  input: VisionAnalysisInput,
): Promise<VisionAnalysisResult> {
  void input;
  throw new Error("Not implemented: routeToVisionModel");
}

/**
 * Routes vision output to Anthropic Claude 3.5 Sonnet for mood and contradiction analysis.
 * Uses ANTHROPIC_API_KEY from environment.
 */
export async function routeToPsychAnalysis(
  input: PsychAnalysisInput,
): Promise<PsychAnalysisResult> {
  void input;
  throw new Error("Not implemented: routeToPsychAnalysis");
}
