/**
 * Bridges Express Telegram webhooks into the Spectrum messages stream.
 */

export interface BridgedTelegramMessage {
  messageId: string;
  senderId: string;
  chatId: string;
  text: string;
  timestamp: Date;
}

const queue: BridgedTelegramMessage[] = [];
let pendingResolve: ((message: BridgedTelegramMessage) => void) | null = null;

export function pushBridgedMessage(message: BridgedTelegramMessage): void {
  if (pendingResolve) {
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve(message);
    return;
  }

  queue.push(message);
}

export async function* iterateTelegramUpdates(): AsyncGenerator<BridgedTelegramMessage> {
  while (true) {
    if (queue.length > 0) {
      yield queue.shift()!;
      continue;
    }

    yield await new Promise<BridgedTelegramMessage>((resolve) => {
      pendingResolve = resolve;
    });
  }
}
