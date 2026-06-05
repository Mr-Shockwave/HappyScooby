/**
 * Butterbase Encrypted Storage — handles sensitive visual and text data at rest.
 *
 * @sponsor Butterbase
 * @connects MoodSnapshot.encryptedDataRef in schema.prisma
 * @connects hardware-bridge/image-poller.ts (stores raw camera frames)
 * @connects xtrace/memory-manager.ts (references encrypted behavioral artifacts)
 */

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

/**
 * Encrypts and stores sensitive visual/text data via Butterbase.
 * Returns a reference ID stored in MoodSnapshot.encryptedDataRef.
 *
 * Uses BUTTERBASE_API_KEY and BUTTERBASE_PROJECT_ID from environment.
 */
export async function storeEncryptedVisualData(
  payload: EncryptedStoragePayload,
): Promise<EncryptedStorageRef> {
  void payload;
  throw new Error("Not implemented: storeEncryptedVisualData");
}
