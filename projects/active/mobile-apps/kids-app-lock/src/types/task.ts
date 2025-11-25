export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: 'personal', name: 'Personal', color: '#3b82f6', icon: '👤' },
  { id: 'work', name: 'Work', color: '#ef4444', icon: '💼' },
  { id: 'shopping', name: 'Shopping', color: '#10b981', icon: '🛒' },
  { id: 'health', name: 'Health', color: '#8b5cf6', icon: '🏥' },
  { id: 'other', name: 'Other', color: '#6b7280', icon: '📝' }
];