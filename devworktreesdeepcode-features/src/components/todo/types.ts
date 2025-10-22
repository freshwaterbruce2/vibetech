
export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
};

export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoCategory = string;
