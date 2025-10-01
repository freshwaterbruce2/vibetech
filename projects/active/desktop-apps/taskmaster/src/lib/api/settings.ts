import { invoke } from '@tauri-apps/api/core';

export async function saveSetting(key: string, value: string): Promise<void> {
  return invoke<void>('save_setting', { key, value });
}

export async function getSetting(key: string): Promise<string | null> {
  return invoke<string | null>('get_setting', { key });
}