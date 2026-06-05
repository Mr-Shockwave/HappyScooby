/**
 * Butterbase REST Data API client — server-side CRUD via platform API key.
 *
 * Used when DATABASE_URL is not configured for direct Postgres (Prisma).
 * Authenticates as butterbase_service (bypasses RLS).
 */

const DEFAULT_API_URL = "https://api.butterbase.ai";

export interface DbUser {
  id: string;
  telegramId: string;
  consentGiven: boolean;
  createdAt: string;
}

function getConfig(): { apiKey: string; appId: string; baseUrl: string } {
  const apiKey = process.env.BUTTERBASE_API_KEY;
  const appId = process.env.BUTTERBASE_PROJECT_ID;
  if (!apiKey) {
    throw new Error("Butterbase Data API: BUTTERBASE_API_KEY is not configured");
  }
  if (!appId) {
    throw new Error("Butterbase Data API: BUTTERBASE_PROJECT_ID is not configured");
  }
  return {
    apiKey,
    appId,
    baseUrl: process.env.BUTTERBASE_API_URL ?? DEFAULT_API_URL,
  };
}

function createId(): string {
  return crypto.randomUUID();
}

function mapUser(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    telegramId: String(row.telegram_id),
    consentGiven: Boolean(row.consent_given),
    createdAt: String(row.created_at),
  };
}

async function dataRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { apiKey, appId, baseUrl } = getConfig();
  const url = `${baseUrl}/v1/${appId}${path}`;
  const hasBody = options.body !== undefined && options.body !== null;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    const message =
      body.error?.message ?? `Butterbase Data API failed (${response.status})`;
    throw new Error(`Butterbase Data API: ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function findUserByTelegramId(
  telegramId: string,
): Promise<DbUser | null> {
  const rows = await dataRequest<Record<string, unknown>[]>(
    `/user?telegram_id=eq.${encodeURIComponent(telegramId)}&limit=1`,
  );
  const row = rows[0];
  return row ? mapUser(row) : null;
}

export async function createUser(telegramId: string): Promise<DbUser> {
  const row = await dataRequest<Record<string, unknown>>("/user", {
    method: "POST",
    body: JSON.stringify({
      id: createId(),
      telegram_id: telegramId,
      consent_given: false,
    }),
  });
  return mapUser(row);
}

export async function upsertUser(telegramId: string): Promise<DbUser> {
  const existing = await findUserByTelegramId(telegramId);
  if (existing) {
    return existing;
  }
  return createUser(telegramId);
}

export async function updateUser(
  id: string,
  data: Partial<Pick<DbUser, "consentGiven">>,
): Promise<DbUser> {
  const patch: Record<string, unknown> = {};
  if (data.consentGiven !== undefined) {
    patch.consent_given = data.consentGiven;
  }
  const row = await dataRequest<Record<string, unknown>>(`/user/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return mapUser(row);
}

export async function createConsentLog(
  userId: string,
  action: "GRANTED" | "REVOKED",
): Promise<void> {
  await dataRequest("/consent_log", {
    method: "POST",
    body: JSON.stringify({
      id: createId(),
      user_id: userId,
      action,
    }),
  });
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function deleteUserByTelegramId(telegramId: string): Promise<void> {
  const user = await findUserByTelegramId(telegramId);
  if (!user) {
    return;
  }
  if (!isUuid(user.id)) {
    console.warn(
      `Butterbase Data API: skipping delete for non-UUID id "${user.id}" (legacy row)`,
    );
    return;
  }
  await dataRequest(`/user/${user.id}`, { method: "DELETE" });
}
