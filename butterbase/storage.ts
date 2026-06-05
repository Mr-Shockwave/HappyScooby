/**
 * Butterbase Secure Storage — encrypted handling of sensitive behavioral data.
 *
 * @sponsor Butterbase
 * Maps to Butterbase's secure file storage API for encrypted at-rest persistence.
 * Hackathon MVP uses mock base64+salt encryption with an in-memory store.
 *
 * @connects MoodSnapshot.encryptedDataRef in schema.prisma
 * @connects hardware-bridge/image-poller.ts (stores raw camera frames)
 * @connects xtrace/memory-manager.ts (references encrypted behavioral artifacts)
 */

/** In-memory MVP store simulating Butterbase encrypted file storage. */
const encryptedStore = new Map<string, string>();

/** Payload to encrypt and store via Butterbase storage API. */
export interface EncryptedStoragePayload {
  userId: string;
  dataType: "image" | "text" | "analysis";
  content: string;
  capturedAt: string;
}

/** Reference returned after successful encrypted storage. */
export interface EncryptedStorageRef {
  refId: string;
  storedAt: string;
}

function getStorageSalt(): string {
  return process.env.BUTTERBASE_API_KEY ?? "butterbase-mvp-salt";
}

function mockEncrypt(data: string): string {
  const salted = `${getStorageSalt()}:${data}`;
  return Buffer.from(salted, "utf-8").toString("base64");
}

/**
 * Stores sensitive data via Butterbase secure storage (MVP mock).
 * Stringifies the payload, applies base64+salt encryption, and returns a unique ref
 * suitable for MoodSnapshot.encryptedDataRef.
 */
export async function storeSensitiveData(
  userId: string,
  rawData: unknown,
): Promise<string> {
  const serialized = JSON.stringify(rawData);
  const encrypted = mockEncrypt(serialized);
  const ref = `enc_${userId}_${Date.now()}`;

  encryptedStore.set(ref, encrypted);
  return ref;
}

/**
 * Retrieves mock-encrypted data by reference (MVP helper for downstream modules).
 */
export async function retrieveSensitiveData(ref: string): Promise<unknown> {
  const encrypted = encryptedStore.get(ref);
  if (!encrypted) {
    throw new Error(`Butterbase Secure Storage: reference not found: ${ref}`);
  }

  const salted = Buffer.from(encrypted, "base64").toString("utf-8");
  const prefix = `${getStorageSalt()}:`;
  const json = salted.startsWith(prefix)
    ? salted.slice(prefix.length)
    : salted;

  return JSON.parse(json) as unknown;
}

/**
 * @deprecated Use storeSensitiveData instead.
 */
export async function storeEncryptedVisualData(
  payload: EncryptedStoragePayload,
): Promise<EncryptedStorageRef> {
  const refId = await storeSensitiveData(payload.userId, payload);
  return {
    refId,
    storedAt: new Date().toISOString(),
  };
}
