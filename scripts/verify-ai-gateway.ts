#!/usr/bin/env tsx
import "dotenv/config";
import { analyzePsychology } from "../butterbase/ai-gateway.js";

async function main(): Promise<void> {
  const result = await analyzePsychology(
    {
      emotions: [],
      dominantEmotion: "unknown",
      rawAnalysis: "No visual data — text-only test",
    },
    "I feel anxious but I told my friends I'm fine",
    "New user — no long-term profile yet.",
  );

  console.log(JSON.stringify(result, null, 2));
  console.log("AI gateway psych analysis OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
