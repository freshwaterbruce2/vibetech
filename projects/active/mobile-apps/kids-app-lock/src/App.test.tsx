import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the task manager', () => {
    render(<App />)
    expect(screen.getByText('Task Manager')).toBeInTheDocument()
  })

  it('adds a new task', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('Add a new task...')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'Test Task' } })
    fireEvent.click(addButton)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('toggles task completion', () => {
    render(<App />)
    const checkbox = screen.getAllByRole('checkbox')[0]
    
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('deletes a task', () => {
    render(<App />)
    const deleteButtons = screen.getAllByText('Delete')
    const initialTaskCount = screen.getAllByRole('checkbox').length
    
    fireEvent.click(deleteButtons[0])
    expect(screen.getAllByRole('checkbox').length).toBe(initialTaskCount - 1)
  })
})