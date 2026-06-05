#!/usr/bin/env tsx
/**
 * Smoke test: Butterbase REST Data API for happyscooby app.
 * Run: npx tsx scripts/verify-butterbase.ts
 */
import "dotenv/config";
import {
  findUserByTelegramId,
  upsertUser,
  deleteUserByTelegramId,
} from "../butterbase/data-api.js";
import { getDbMode } from "../butterbase/client.js";

const TEST_TELEGRAM_ID = `verify-butterbase-${Date.now()}`;

async function main(): Promise<void> {
  console.log(`DB mode: ${getDbMode()}`);
  console.log(`App: ${process.env.BUTTERBASE_PROJECT_ID}`);
  console.log(`API: ${process.env.BUTTERBASE_API_URL ?? "https://api.butterbase.ai"}`);

  const created = await upsertUser(TEST_TELEGRAM_ID);
  console.log("Created user:", created.id);

  const found = await findUserByTelegramId(TEST_TELEGRAM_ID);
  if (!found || found.id !== created.id) {
    throw new Error("User round-trip failed");
  }
  console.log("User round-trip OK");

  await deleteUserByTelegramId(TEST_TELEGRAM_ID);
  console.log("Cleanup OK");
  console.log("Butterbase connection verified.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
