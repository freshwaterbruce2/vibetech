import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockInvoke } from '../../test/setup'
import {
  createTask,
  getTask,
  getTasks,
  updateTask,
  deleteTask,
  type Task,
  type CreateTaskInput,
  type UpdateTaskInput,
} from './tasks'

describe('Tasks API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test description',
    done: 0,
    due_date: '2024-12-31',
    project: 'Test Project',
    priority: 'high',
    starred: 0,
    progress: 50,
    attachments: 0,
    comments: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('createTask', () => {
    it('should create a task with required fields', async () => {
      const input: CreateTaskInput = {
        title: 'New Task',
        description: 'New description',
      }

      mockInvoke.mockResolvedValueOnce(mockTask)

      const result = await createTask(input)

      expect(mockInvoke).toHaveBeenCalledWith('create_task', { input })
      expect(result).toEqual(mockTask)
    })

    it('should create a task with all optional fields', async () => {
      const input: CreateTaskInput = {
        id: 'custom-id',
        title: 'New Task',
        description: 'New description',
        due_date: '2024-12-31',
        project: 'Test Project',
        priority: 'high',
      }

      mockInvoke.mockResolvedValueOnce(mockTask)

      const result = await createTask(input)

      expect(mockInvoke).toHaveBeenCalledWith('create_task', { input })
      expect(result).toEqual(mockTask)
    })

    it('should handle creation errors', async () => {
      const input: CreateTaskInput = {
        title: 'New Task',
      }

      const error = new Error('Failed to create task')
      mockInvoke.mockRejectedValueOnce(error)

      await expect(createTask(input)).rejects.toThrow('Failed to create task')
    })
  })

  describe('getTask', () => {
    it('should retrieve a task by id', async () => {
      mockInvoke.mockResolvedValueOnce(mockTask)

      const result = await getTask('1')

      expect(mockInvoke).toHaveBeenCalledWith('get_task', { id: '1' })
      expect(result).toEqual(mockTask)
    })

    it('should handle retrieval errors', async () => {
      const error = new Error('Task not found')
      mockInvoke.mockRejectedValueOnce(error)

      await expect(getTask('invalid-id')).rejects.toThrow('Task not found')
    })
  })

  describe('getTasks', () => {
    it('should retrieve all tasks', async () => {
      const tasks = [mockTask, { ...mockTask, id: '2', title: 'Task 2' }]
      mockInvoke.mockResolvedValueOnce(tasks)

      const result = await getTasks()

      expect(mockInvoke).toHaveBeenCalledWith('get_tasks')
      expect(result).toEqual(tasks)
    })

    it('should return empty array when no tasks exist', async () => {
      mockInvoke.mockResolvedValueOnce([])

      const result = await getTasks()

      expect(result).toEqual([])
    })
  })

  describe('updateTask', () => {
    it('should update a task with partial data', async () => {
      const input: UpdateTaskInput = {
        id: '1',
        title: 'Updated Task',
        done: 1,
      }

      const updatedTask = { ...mockTask, title: 'Updated Task', done: 1 }
      mockInvoke.mockResolvedValueOnce(updatedTask)

      const result = await updateTask(input)

      expect(mockInvoke).toHaveBeenCalledWith('update_task', { input })
      expect(result).toEqual(updatedTask)
    })

    it('should update task progress', async () => {
      const input: UpdateTaskInput = {
        id: '1',
        progress: 75,
      }

      const updatedTask = { ...mockTask, progress: 75 }
      mockInvoke.mockResolvedValueOnce(updatedTask)

      const result = await updateTask(input)

      expect(result.progress).toBe(75)
    })

    it('should update task starred status', async () => {
      const input: UpdateTaskInput = {
        id: '1',
        starred: 1,
      }

      const updatedTask = { ...mockTask, starred: 1 }
      mockInvoke.mockResolvedValueOnce(updatedTask)

      const result = await updateTask(input)

      expect(result.starred).toBe(1)
    })

    it('should handle update errors', async () => {
      const input: UpdateTaskInput = {
        id: 'invalid-id',
        title: 'Updated Task',
      }

      const error = new Error('Task not found')
      mockInvoke.mockRejectedValueOnce(error)

      await expect(updateTask(input)).rejects.toThrow('Task not found')
    })
  })

  describe('deleteTask', () => {
    it('should delete a task by id', async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await deleteTask('1')

      expect(mockInvoke).toHaveBeenCalledWith('delete_task', { id: '1' })
    })

    it('should handle deletion errors', async () => {
      const error = new Error('Task not found')
      mockInvoke.mockRejectedValueOnce(error)

      await expect(deleteTask('invalid-id')).rejects.toThrow('Task not found')
    })
  })
})