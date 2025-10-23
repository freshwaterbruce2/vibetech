import { useState } from 'react'
import './App.css'

interface Task {
  id: string
  title: string
  completed: boolean
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Learn React', completed: true },
    { id: '2', title: 'Build an app', completed: false }
  ])
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle,
        completed: false
      }
      setTasks([...tasks, newTask])
      setNewTaskTitle('')
    }
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
      </header>
      
      <div className="task-input">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <button onClick={addTask}>Add Task</button>
      </div>

      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span className="task-title">{task.title}</span>
            <button 
              className="delete-btn"
              onClick={() => deleteTask(task.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="stats">
        Total: {tasks.length} | Completed: {tasks.filter(t => t.completed).length} | 
        Pending: {tasks.filter(t => !t.completed).length}
      </div>
    </div>
  )
}

export default App