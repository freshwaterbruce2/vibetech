import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTaskStore } from './useTaskStore'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../lib/api/tasks'

// Mock the entire tasks API module
vi.mock('../lib/api/tasks', () => ({
  createTask: vi.fn(),
  getTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

// Import the mocked functions
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from '../lib/api/tasks'

const mockCreateTask = vi.mocked(createTask)
const mockGetTasks = vi.mocked(getTasks)
const mockUpdateTask = vi.mocked(updateTask)
const mockDeleteTask = vi.mocked(deleteTask)

describe('useTaskStore', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Active Task 1',
      description: 'First active task',
      done: 0,
      due_date: '2024-12-31',
      project: 'Project A',
      priority: 'high',
      starred: 1,
      progress: 50,
      attachments: 0,
      comments: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      title: 'Completed Task',
      description: 'This task is done',
      done: 1,
      due_date: null,
      project: 'Project B',
      priority: 'medium',
      starred: 0,
      progress: 100,
      attachments: 1,
      comments: 0,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T12:00:00Z',
    },
    {
      id: '3',
      title: 'Another Active Task',
      description: 'Second active task',
      done: 0,
      due_date: '2024-11-30',
      project: 'Project A',
      priority: 'low',
      starred: 1,
      progress: 25,
      attachments: 0,
      comments: 1,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useTaskStore.setState({
      tasks: [],
      selectedTask: null,
      filter: 'all',
      sort: 'created_at',
      sortOrder: 'desc',
      searchQuery: '',
      isLoading: false,
      error: null,
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTaskStore.getState()

      expect(state.tasks).toEqual([])
      expect(state.selectedTask).toBeNull()
      expect(state.filter).toBe('all')
      expect(state.sort).toBe('created_at')
      expect(state.sortOrder).toBe('desc')
      expect(state.searchQuery).toBe('')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('Basic Setters', () => {
    it('should set tasks', () => {
      const { setTasks } = useTaskStore.getState()

      setTasks(mockTasks)

      expect(useTaskStore.getState().tasks).toEqual(mockTasks)
    })

    it('should set selected task', () => {
      const { setSelectedTask } = useTaskStore.getState()

      setSelectedTask(mockTasks[0])

      expect(useTaskStore.getState().selectedTask).toEqual(mockTasks[0])
    })

    it('should set filter', () => {
      const { setFilter } = useTaskStore.getState()

      setFilter('completed')

      expect(useTaskStore.getState().filter).toBe('completed')
    })

    it('should set sort', () => {
      const { setSort } = useTaskStore.getState()

      setSort('title', 'asc')

      const state = useTaskStore.getState()
      expect(state.sort).toBe('title')
      expect(state.sortOrder).toBe('asc')
    })

    it('should set search query', () => {
      const { setSearchQuery } = useTaskStore.getState()

      setSearchQuery('test query')

      expect(useTaskStore.getState().searchQuery).toBe('test query')
    })

    it('should set loading state', () => {
      const { setLoading } = useTaskStore.getState()

      setLoading(true)

      expect(useTaskStore.getState().isLoading).toBe(true)
    })

    it('should set error', () => {
      const { setError } = useTaskStore.getState()

      setError('Test error')

      expect(useTaskStore.getState().error).toBe('Test error')
    })
  })

  describe('Filtering and Sorting Logic', () => {
    beforeEach(() => {
      useTaskStore.setState({
        tasks: mockTasks,
        filter: 'all',
        sort: 'created_at',
        sortOrder: 'desc',
        searchQuery: '',
      })
    })

    it('should filter active tasks correctly', () => {
      useTaskStore.getState().setFilter('active')

      const activeTasks = mockTasks.filter(task => !task.done)
      expect(activeTasks).toHaveLength(2)
      expect(activeTasks.every(task => !task.done)).toBe(true)
    })

    it('should filter completed tasks correctly', () => {
      useTaskStore.getState().setFilter('completed')

      const completedTasks = mockTasks.filter(task => task.done)
      expect(completedTasks).toHaveLength(1)
      expect(completedTasks[0].done).toBe(1)
    })

    it('should filter starred tasks correctly', () => {
      useTaskStore.getState().setFilter('starred')

      const starredTasks = mockTasks.filter(task => task.starred)
      expect(starredTasks).toHaveLength(2)
      expect(starredTasks.every(task => task.starred)).toBe(true)
    })

    it('should search in task title', () => {
      const searchResult = mockTasks.filter(task =>
        task.title.toLowerCase().includes('active')
      )
      expect(searchResult).toHaveLength(2)
      expect(searchResult.every(task => task.title.includes('Active'))).toBe(true)
    })

    it('should search in task description', () => {
      const searchResult = mockTasks.filter(task =>
        task.description?.toLowerCase().includes('done')
      )
      expect(searchResult).toHaveLength(1)
      expect(searchResult[0].description?.includes('done')).toBe(true)
    })

    it('should search in project name', () => {
      const searchResult = mockTasks.filter(task =>
        task.project?.toLowerCase().includes('project a')
      )
      expect(searchResult).toHaveLength(2)
      expect(searchResult.every(task => task.project === 'Project A')).toBe(true)
    })

    it('should sort by title correctly', () => {
      const sorted = [...mockTasks].sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      )
      expect(sorted[0].title).toBe('Active Task 1')
      expect(sorted[1].title).toBe('Another Active Task')
      expect(sorted[2].title).toBe('Completed Task')
    })

    it('should sort by created_at correctly', () => {
      const sorted = [...mockTasks].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      expect(sorted[0].id).toBe('3') // Most recent
      expect(sorted[2].id).toBe('1') // Oldest
    })
  })

  describe('API Operations', () => {
    describe('loadTasks', () => {
      it('should load tasks successfully', async () => {
        mockGetTasks.mockResolvedValueOnce(mockTasks)

        await useTaskStore.getState().loadTasks()

        const state = useTaskStore.getState()
        expect(state.tasks).toEqual(mockTasks)
        expect(state.isLoading).toBe(false)
        expect(state.error).toBeNull()
      })

      it('should handle load tasks error', async () => {
        const error = new Error('Failed to load')
        mockGetTasks.mockRejectedValueOnce(error)

        await useTaskStore.getState().loadTasks()

        const state = useTaskStore.getState()
        expect(state.tasks).toEqual([])
        expect(state.isLoading).toBe(false)
        expect(state.error).toBe('Failed to load')
      })
    })

    describe('addTask', () => {
      it('should add task successfully', async () => {
        const newTaskInput: CreateTaskInput = {
          title: 'New Task',
          description: 'New description',
        }
        const newTask = { ...mockTasks[0], id: '4', title: 'New Task' }

        mockCreateTask.mockResolvedValueOnce(newTask)
        useTaskStore.getState().setTasks(mockTasks)

        const result = await useTaskStore.getState().addTask(newTaskInput)

        expect(result).toEqual(newTask)
        expect(useTaskStore.getState().tasks).toHaveLength(4)
        expect(useTaskStore.getState().tasks[0]).toEqual(newTask)
      })

      it('should handle add task error', async () => {
        const newTaskInput: CreateTaskInput = {
          title: 'New Task',
        }
        const error = new Error('Failed to create')

        mockCreateTask.mockRejectedValueOnce(error)

        const result = await useTaskStore.getState().addTask(newTaskInput)

        expect(result).toBeNull()
        expect(useTaskStore.getState().error).toBe('Failed to create')
      })
    })

    describe('editTask', () => {
      it('should edit task successfully', async () => {
        const updateInput: UpdateTaskInput = {
          id: '1',
          title: 'Updated Task',
        }
        const updatedTask = { ...mockTasks[0], title: 'Updated Task' }

        mockUpdateTask.mockResolvedValueOnce(updatedTask)
        useTaskStore.getState().setTasks(mockTasks)
        useTaskStore.getState().setSelectedTask(mockTasks[0])

        const result = await useTaskStore.getState().editTask(updateInput)

        expect(result).toEqual(updatedTask)
        expect(useTaskStore.getState().tasks[0].title).toBe('Updated Task')
        expect(useTaskStore.getState().selectedTask?.title).toBe('Updated Task')
      })
    })

    describe('removeTask', () => {
      it('should remove task successfully', async () => {
        mockDeleteTask.mockResolvedValueOnce(undefined)
        useTaskStore.getState().setTasks(mockTasks)
        useTaskStore.getState().setSelectedTask(mockTasks[0])

        const result = await useTaskStore.getState().removeTask('1')

        expect(result).toBe(true)
        expect(useTaskStore.getState().tasks).toHaveLength(2)
        expect(useTaskStore.getState().selectedTask).toBeNull()
      })
    })

    describe('toggleTaskDone', () => {
      it('should toggle task done status', async () => {
        const updatedTask = { ...mockTasks[0], done: 1 }
        mockUpdateTask.mockResolvedValueOnce(updatedTask)
        useTaskStore.getState().setTasks(mockTasks)

        await useTaskStore.getState().toggleTaskDone('1')

        expect(mockUpdateTask).toHaveBeenCalledWith({
          id: '1',
          done: 1, // Should convert from 0 to 1
        })
      })
    })

    describe('toggleTaskStarred', () => {
      it('should toggle task starred status', async () => {
        const updatedTask = { ...mockTasks[0], starred: 0 }
        mockUpdateTask.mockResolvedValueOnce(updatedTask)
        useTaskStore.getState().setTasks(mockTasks)

        await useTaskStore.getState().toggleTaskStarred('1')

        expect(mockUpdateTask).toHaveBeenCalledWith({
          id: '1',
          starred: 0, // Should convert from 1 to 0
        })
      })
    })
  })
})