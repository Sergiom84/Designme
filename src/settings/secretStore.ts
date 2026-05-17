export const LOCAL_OPENAI_API_KEY_SECRET = 'local-openai.apiKey';

export interface SecretStoreStatus {
  /** True when the desktop secret store is available and encryption is active. */
  ready: boolean;
}

/**
 * Renderer-side wrapper around the Electron `safeStorage` secret store. Falls
 * back to "not ready" in web/dev contexts so callers know the API key cannot
 * be persisted on disk and must stay in memory for the current session only.
 */
export async function getSecretStoreStatus(): Promise<SecretStoreStatus> {
  if (!window.designme?.secretStatus) return { ready: false };
  try {
    return await window.designme.secretStatus();
  } catch {
    return { ready: false };
  }
}

export async function readSecret(key: string): Promise<string | undefined> {
  if (!window.designme?.getSecret) return undefined;
  try {
    const result = await window.designme.getSecret({ key });
    return typeof result.value === 'string' ? result.value : undefined;
  } catch {
    return undefined;
  }
}

export async function writeSecret(key: string, value: string): Promise<boolean> {
  if (!window.designme?.setSecret) return false;
  try {
    const result = await window.designme.setSecret({ key, value });
    return Boolean(result.stored);
  } catch {
    return false;
  }
}

export async function deleteSecret(key: string): Promise<boolean> {
  if (!window.designme?.deleteSecret) return false;
  try {
    const result = await window.designme.deleteSecret({ key });
    return Boolean(result.deleted);
  } catch {
    return false;
  }
}
