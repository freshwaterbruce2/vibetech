import { invoke } from '@tauri-apps/api/core';

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  done: number;
  due_date?: string | null;
  project?: string | null;
  priority?: string | null;
  starred: number;
  progress: number;
  attachments: number;
  comments: number;
  created_at: string;
  updated_at: string;
};

export type CreateTaskInput = {
  id?: string;
  title: string;
  description?: string;
  due_date?: string;
  project?: string;
  priority?: string;
};

export type UpdateTaskInput = Partial<
  Omit<Task, 'created_at' | 'updated_at' | 'attachments' | 'comments'>
> & {
  id: string;
};

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return invoke<Task>('create_task', { input });
}

export async function getTask(id: string): Promise<Task> {
  return invoke<Task>('get_task', { id });
}

export async function getTasks(): Promise<Task[]> {
  return invoke<Task[]>('get_tasks');
}

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
  return invoke<Task>('update_task', { input });
}

export async function deleteTask(id: string): Promise<void> {
  return invoke('delete_task', { id });
}