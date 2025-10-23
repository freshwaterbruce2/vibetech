import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from '../lib/api/tasks';
import {
  createTask,
  getTask,
  getTasks,
  updateTask,
  deleteTask
} from '../lib/api/tasks';

export type TaskFilter = 'all' | 'active' | 'completed' | 'starred';
export type TaskSort = 'created_at' | 'updated_at' | 'title' | 'due_date' | 'priority';
export type SortOrder = 'asc' | 'desc';

interface TaskState {
  // State
  tasks: Task[];
  selectedTask: Task | null;
  filter: TaskFilter;
  sort: TaskSort;
  sortOrder: SortOrder;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Computed getters
  filteredTasks: Task[];

  // Actions
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setFilter: (filter: TaskFilter) => void;
  setSort: (sort: TaskSort, order?: SortOrder) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API operations
  loadTasks: () => Promise<void>;
  loadTask: (id: string) => Promise<Task | null>;
  addTask: (input: CreateTaskInput) => Promise<Task | null>;
  editTask: (input: UpdateTaskInput) => Promise<Task | null>;
  removeTask: (id: string) => Promise<boolean>;
  toggleTaskDone: (id: string) => Promise<void>;
  toggleTaskStarred: (id: string) => Promise<void>;
}

const filterTasks = (tasks: Task[], filter: TaskFilter, searchQuery: string): Task[] => {
  let filtered = tasks;

  // Apply filter
  switch (filter) {
    case 'active':
      filtered = filtered.filter(task => !task.done);
      break;
    case 'completed':
      filtered = filtered.filter(task => task.done);
      break;
    case 'starred':
      filtered = filtered.filter(task => task.starred);
      break;
    case 'all':
    default:
      // No filter
      break;
  }

  // Apply search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query)) ||
      (task.project && task.project.toLowerCase().includes(query))
    );
  }

  return filtered;
};

const sortTasks = (tasks: Task[], sort: TaskSort, order: SortOrder): Task[] => {
  return [...tasks].sort((a, b) => {
    let aVal: string | Date;
    let bVal: string | Date;

    switch (sort) {
      case 'title':
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
        break;
      case 'due_date':
        aVal = a.due_date || '';
        bVal = b.due_date || '';
        break;
      case 'priority':
        aVal = a.priority || '';
        bVal = b.priority || '';
        break;
      case 'updated_at':
        aVal = new Date(a.updated_at);
        bVal = new Date(b.updated_at);
        break;
      case 'created_at':
      default:
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
        break;
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tasks: [],
      selectedTask: null,
      filter: 'all',
      sort: 'created_at',
      sortOrder: 'desc',
      searchQuery: '',
      isLoading: false,
      error: null,

      // Computed getter
      get filteredTasks() {
        const { tasks, filter, searchQuery, sort, sortOrder } = get();
        const filtered = filterTasks(tasks, filter, searchQuery);
        return sortTasks(filtered, sort, sortOrder);
      },

      // Basic setters
      setTasks: (tasks) => set({ tasks }, false, 'setTasks'),

      setSelectedTask: (task) => set({ selectedTask: task }, false, 'setSelectedTask'),

      setFilter: (filter) => set({ filter }, false, 'setFilter'),

      setSort: (sort, order) => set({
        sort,
        sortOrder: order || get().sortOrder
      }, false, 'setSort'),

      setSearchQuery: (searchQuery) => set({ searchQuery }, false, 'setSearchQuery'),

      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setError: (error) => set({ error }, false, 'setError'),

      // API operations
      loadTasks: async () => {
        const { setLoading, setError, setTasks } = get();

        try {
          setLoading(true);
          setError(null);
          const tasks = await getTasks();
          setTasks(tasks);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to load tasks';
          setError(errorMsg);
          console.error('Failed to load tasks:', error);
        } finally {
          setLoading(false);
        }
      },

      loadTask: async (id: string) => {
        const { setError } = get();

        try {
          setError(null);
          const task = await getTask(id);
          return task;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to load task';
          setError(errorMsg);
          console.error('Failed to load task:', error);
          return null;
        }
      },

      addTask: async (input: CreateTaskInput) => {
        const { setError, tasks, setTasks } = get();

        try {
          setError(null);
          const newTask = await createTask(input);
          setTasks([newTask, ...tasks]);
          return newTask;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to create task';
          setError(errorMsg);
          console.error('Failed to create task:', error);
          return null;
        }
      },

      editTask: async (input: UpdateTaskInput) => {
        const { setError, tasks, setTasks, selectedTask, setSelectedTask } = get();

        try {
          setError(null);
          const updatedTask = await updateTask(input);

          // Update tasks array
          const updatedTasks = tasks.map(task =>
            task.id === updatedTask.id ? updatedTask : task
          );
          setTasks(updatedTasks);

          // Update selected task if it's the one being edited
          if (selectedTask && selectedTask.id === updatedTask.id) {
            setSelectedTask(updatedTask);
          }

          return updatedTask;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to update task';
          setError(errorMsg);
          console.error('Failed to update task:', error);
          return null;
        }
      },

      removeTask: async (id: string) => {
        const { setError, tasks, setTasks, selectedTask, setSelectedTask } = get();

        try {
          setError(null);
          await deleteTask(id);

          // Remove from tasks array
          const updatedTasks = tasks.filter(task => task.id !== id);
          setTasks(updatedTasks);

          // Clear selected task if it was the deleted one
          if (selectedTask && selectedTask.id === id) {
            setSelectedTask(null);
          }

          return true;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to delete task';
          setError(errorMsg);
          console.error('Failed to delete task:', error);
          return false;
        }
      },

      toggleTaskDone: async (id: string) => {
        const { tasks, editTask } = get();
        const task = tasks.find(t => t.id === id);

        if (task) {
          await editTask({
            id,
            done: task.done ? 0 : 1
          });
        }
      },

      toggleTaskStarred: async (id: string) => {
        const { tasks, editTask } = get();
        const task = tasks.find(t => t.id === id);

        if (task) {
          await editTask({
            id,
            starred: task.starred ? 0 : 1
          });
        }
      },
    }),
    {
      name: 'task-store',
    }
  )
);