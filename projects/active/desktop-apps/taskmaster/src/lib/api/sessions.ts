import { invoke } from '@tauri-apps/api/core';

export type Session = {
  id: string;
  task_id?: string | null;
  start_at: string;
  end_at?: string | null;
  notes?: string | null;
  quality_rating?: number | null;
};

export type CreateSessionInput = {
  task_id?: string;
  notes?: string;
};

export type EndSessionInput = {
  notes?: string;
  quality_rating?: number;
};

export async function startSession(input: CreateSessionInput): Promise<Session> {
  return invoke<Session>('start_session', { input });
}

export async function endSession(id: string, input: EndSessionInput): Promise<Session> {
  return invoke<Session>('end_session', { id, input });
}

export async function getSessions(taskId?: string): Promise<Session[]> {
  return invoke<Session[]>('get_sessions', { taskId });
}