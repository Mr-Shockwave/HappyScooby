import type { PsychAnalysisResult } from "../../butterbase/ai-gateway.js";
import { formatEmpatheticResponse } from "../../photon/message-formatter.js";
import type { PipelineNode } from "./types.js";

/**
 * RocketRide Action Decision Node — decides Telegram response and XTrace update.
 *
 * @sponsor RocketRide (orchestration)
 * @connects photon/message-formatter.ts (empathetic Telegram reply)
 * @connects xtrace/memory-manager.ts (long-term pattern storage)
 * @connects butterbase/schema.prisma (MoodSnapshot persistence)
 */

/** Final pipeline output with action decisions. */
export interface ActionDecisionOutput {
  telegramMessage: string;
  moodSnapshot: {
    currentMood: string;
    contradictions: string[];
  };
  xtraceUpdated: boolean;
}

export const actionDecisionNode: PipelineNode<
  PsychAnalysisResult,
  ActionDecisionOutput
> = {
  id: "action-decision",
  description: "Decide Telegram response and update XTrace behavioral memory",

  async execute(input: PsychAnalysisResult): Promise<ActionDecisionOutput> {
    void input;
    throw new Error("Not implemented: actionDecisionNode.execute");
  },
};

// Re-export formatter for type connectivity; used when action-decision is implemented.
export { formatEmpatheticResponse };
