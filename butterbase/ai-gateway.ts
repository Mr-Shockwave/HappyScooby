/**
 * Butterbase AI Model Gateway — unified inference routing through Butterbase.
 *
 * @sponsor Butterbase
 * Routes all LLM calls through Butterbase's OpenAI-compatible API at
 * POST /v1/{app_id}/chat/completions using BUTTERBASE_API_KEY and BUTTERBASE_PROJECT_ID.
 *
 * @connects rocketride/nodes/vision-analysis.ts → analyzeVisuals (GPT-4o Vision)
 * @connects rocketride/nodes/psych-analysis.ts → analyzePsychology (Claude Sonnet 4.6)
 */

const BUTTERBASE_DEFAULT_URL = "https://api.butterbase.ai";
const VISION_MODEL = "openai/gpt-4o";
const PSYCH_MODEL = "anthropic/claude-sonnet-4.6";

const EMOTION_VALUES = [
  "happiness",
  "sadness",
  "fear",
  "anger",
  "surprise",
  "disgust",
] as const;

export type EmotionName = (typeof EMOTION_VALUES)[number];

/** A single detected emotion with confidence and observed facial markers. */
export interface DetectedEmotion {
  emotion: EmotionName;
  confidence: number;
  markers: string;
}

/** Structured output from GPT-4o Vision facial expression analysis. */
export interface VisualAnalysisResult {
  emotions: DetectedEmotion[];
  dominantEmotion: string;
  rawAnalysis: string;
}

/** Structured output from Claude Sonnet 4.6 psychological synthesis. */
export interface PsychologyAnalysisResult {
  currentMood: string;
  contradictions: string[];
  recommendedAction: string;
  photonMessageDraft: string;
}

/** @deprecated Use PsychologyAnalysisResult */
export type PsychAnalysisResult = PsychologyAnalysisResult;

/** @deprecated Use VisualAnalysisInput pattern via analyzeVisuals */
export interface VisionAnalysisInput {
  imageBase64: string;
  userId: string;
  capturedAt: string;
}

/** @deprecated Legacy shape — use VisualAnalysisResult from analyzeVisuals */
export interface VisionAnalysisResult {
  expressions: string[];
  confidence: number;
  rawDescription: string;
}

/** @deprecated Use analyzePsychology parameters directly */
export interface PsychAnalysisInput {
  visionResult: VisionAnalysisResult;
  telegramContext?: string;
  userId: string;
}

type ChatRole = "system" | "user" | "assistant";

type TextContent = { type: "text"; text: string };
type ImageContent = {
  type: "image_url";
  image_url: { url: string };
};

type MessageContent = string | Array<TextContent | ImageContent>;

interface ChatMessage {
  role: ChatRole;
  content: MessageContent;
}

interface ButterbaseChatOptions {
  temperature?: number;
  maxTokens?: number;
}

interface ButterbaseChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

const VISUAL_SYSTEM_PROMPT = `You are a facial expression analyst for the Behavioral Archaeologist AI system powered by Butterbase.
Analyze the provided image and detect these specific facial markers:
- Happiness: Duchenne smile (genuine smile with crinkling around the eyes)
- Sadness: dropped lip corners, downturned mouth
- Fear: widened eyes, raised eyebrows
- Anger: clenched jaw, tightened lips
- Surprise: raised eyebrows, open mouth
- Disgust: wrinkled nose, raised upper lip

Respond with ONLY valid JSON in this exact shape:
{
  "emotions": [
    { "emotion": "happiness", "confidence": 0.0, "markers": "description of observed markers" }
  ],
  "dominantEmotion": "happiness",
  "rawAnalysis": "brief overall analysis"
}
Include all six emotions even if confidence is low. Confidence must be between 0 and 1.`;

const PSYCH_SYSTEM_PROMPT = `You are a behavioral psychologist AI for the Behavioral Archaeologist system powered by Butterbase.
Synthesize visual expression data, user text messages, and historical behavioral context.
Detect mood contradictions between what the user says and what their expressions suggest.

Respond with ONLY valid JSON in this exact shape:
{
  "currentMood": "string describing overall mood",
  "contradictions": ["array of detected contradictions"],
  "recommendedAction": "string describing recommended next action",
  "photonMessageDraft": "empathetic plain-text message draft for Telegram delivery via Photon"
}
Do not include markdown, code fences, or any text outside the JSON object.`;

function getButterbaseConfig(): { apiKey: string; projectId: string; baseUrl: string } {
  const apiKey = process.env.BUTTERBASE_API_KEY;
  const projectId = process.env.BUTTERBASE_PROJECT_ID;

  if (!apiKey) {
    throw new Error("Butterbase AI Gateway: BUTTERBASE_API_KEY is not configured");
  }
  if (!projectId) {
    throw new Error("Butterbase AI Gateway: BUTTERBASE_PROJECT_ID is not configured");
  }

  return {
    apiKey,
    projectId,
    baseUrl: process.env.BUTTERBASE_API_URL ?? BUTTERBASE_DEFAULT_URL,
  };
}

function extractJsonFromContent(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  // Be lenient when the model wraps the JSON in prose (e.g. "Here is the
  // analysis: { ... }"): slice from the first '{' to the last '}'.
  if (!trimmed.startsWith("{")) {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first !== -1 && last > first) {
      return trimmed.slice(first, last + 1);
    }
  }
  return trimmed;
}

function parseJsonContent<T>(content: string, context: string): T {
  try {
    return JSON.parse(extractJsonFromContent(content)) as T;
  } catch {
    throw new Error(
      `Butterbase AI Gateway: failed to parse JSON response for ${context}`,
    );
  }
}

function isEmotionName(value: string): value is EmotionName {
  return (EMOTION_VALUES as readonly string[]).includes(value);
}

function validateVisualResult(data: unknown): VisualAnalysisResult {
  if (!data || typeof data !== "object") {
    throw new Error("Butterbase AI Gateway: invalid visual analysis response shape");
  }

  const result = data as Record<string, unknown>;

  if (!Array.isArray(result.emotions)) {
    throw new Error("Butterbase AI Gateway: visual analysis missing emotions array");
  }

  const emotions: DetectedEmotion[] = result.emotions.map((entry) => {
    if (!entry || typeof entry !== "object") {
      throw new Error("Butterbase AI Gateway: invalid emotion entry");
    }
    const emotion = entry as Record<string, unknown>;
    const name = String(emotion.emotion ?? "");
    if (!isEmotionName(name)) {
      throw new Error(`Butterbase AI Gateway: unknown emotion "${name}"`);
    }
    return {
      emotion: name,
      confidence: Number(emotion.confidence ?? 0),
      markers: String(emotion.markers ?? ""),
    };
  });

  return {
    emotions,
    dominantEmotion: String(result.dominantEmotion ?? "unknown"),
    rawAnalysis: String(result.rawAnalysis ?? ""),
  };
}

function validatePsychResult(data: unknown): PsychologyAnalysisResult {
  if (!data || typeof data !== "object") {
    throw new Error("Butterbase AI Gateway: invalid psychology analysis response shape");
  }

  const result = data as Record<string, unknown>;

  return {
    currentMood: String(result.currentMood ?? ""),
    contradictions: Array.isArray(result.contradictions)
      ? result.contradictions.map(String)
      : [],
    recommendedAction: String(result.recommendedAction ?? ""),
    photonMessageDraft: String(result.photonMessageDraft ?? ""),
  };
}

/**
 * Calls the Butterbase unified AI gateway chat completions endpoint.
 */
async function callButterbaseChat(
  model: string,
  messages: ChatMessage[],
  options?: ButterbaseChatOptions,
): Promise<string> {
  const { apiKey, projectId, baseUrl } = getButterbaseConfig();
  const url = `${baseUrl}/v1/${projectId}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 1024,
      stream: false,
    }),
  });

  const body = (await response.json()) as ButterbaseChatResponse;

  if (!response.ok) {
    const code = body.error?.code;
    const type = body.error?.type;
    const detail = body.error?.message ?? `HTTP ${response.status}`;
    const suffix = code ? ` [${code}]` : type ? ` (${type})` : "";
    throw new Error(
      `Butterbase AI Gateway: ${detail}${suffix} (model=${model}, status=${response.status})`,
    );
  }

  const content = body.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Butterbase AI Gateway: empty response content");
  }

  return content;
}

/**
 * Analyzes facial expressions via Butterbase AI Gateway using GPT-4o Vision.
 * Detects Happiness, Sadness, Fear, Anger, Surprise, and Disgust with confidence scores.
 */
export async function analyzeVisuals(
  imageBase64: string,
): Promise<VisualAnalysisResult> {
  const content = await callButterbaseChat(VISION_MODEL, [
    { role: "system", content: VISUAL_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Analyze the facial expressions in this image. Return only the JSON object.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
          },
        },
      ],
    },
  ]);

  const parsed = parseJsonContent<unknown>(content, "visual analysis");
  return validateVisualResult(parsed);
}

/**
 * Synthesizes visual data, user text, and historical context via Butterbase AI Gateway
 * using Claude Sonnet 4.6. Returns mood, contradictions, and a Photon message draft.
 */
export async function analyzePsychology(
  visualData: VisualAnalysisResult,
  textInput: string,
  historyContext: string,
): Promise<PsychologyAnalysisResult> {
  const userPrompt = [
    "Visual expression data:",
    JSON.stringify(visualData, null, 2),
    "",
    "User text message:",
    textInput || "(no text provided)",
    "",
    "Historical behavioral context:",
    historyContext || "(no history available)",
    "",
    "Synthesize these inputs and return only the JSON object.",
  ].join("\n");

  const content = await callButterbaseChat(PSYCH_MODEL, [
    { role: "system", content: PSYCH_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);

  const parsed = parseJsonContent<unknown>(content, "psychology analysis");
  return validatePsychResult(parsed);
}

/**
 * @deprecated Use analyzeVisuals instead.
 */
export async function routeToVisionModel(
  input: VisionAnalysisInput,
): Promise<VisionAnalysisResult> {
  const result = await analyzeVisuals(input.imageBase64);
  return {
    expressions: result.emotions.map((e) => e.emotion),
    confidence: result.emotions[0]?.confidence ?? 0,
    rawDescription: result.rawAnalysis,
  };
}

/**
 * @deprecated Use analyzePsychology instead.
 */
export async function routeToPsychAnalysis(
  input: PsychAnalysisInput,
): Promise<PsychAnalysisResult> {
  const visualData: VisualAnalysisResult = {
    emotions: input.visionResult.expressions.map((emotion) => ({
      emotion: isEmotionName(emotion) ? emotion : "surprise",
      confidence: input.visionResult.confidence,
      markers: input.visionResult.rawDescription,
    })),
    dominantEmotion: input.visionResult.expressions[0] ?? "unknown",
    rawAnalysis: input.visionResult.rawDescription,
  };

  return analyzePsychology(
    visualData,
    input.telegramContext ?? "",
    "",
  );
}
