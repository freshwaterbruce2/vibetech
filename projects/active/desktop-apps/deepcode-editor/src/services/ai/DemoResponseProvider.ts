import {
  AICodeCompletion,
  AICodeGenerationRequest,
  AICodeGenerationResponse,
  AIContextRequest,
  AIResponse,
} from '../../types';

/**
 * Provides demo responses when no real API key is available
 */
export class DemoResponseProvider {
  static getContextualResponse(request: AIContextRequest): AIResponse {
    const query = request.userQuery.toLowerCase();

    // Check if this is a task planning request (expects JSON output)
    if (query.includes('output format (json)') || query.includes('available actions:')) {
      return this.getTaskPlanResponse(request);
    }

    if (query.includes('react') || query.includes('component')) {
      return this.getReactComponentResponse();
    }

    if (query.includes('typescript') || query.includes('interface')) {
      return this.getTypeScriptResponse();
    }

    if (query.includes('test') || query.includes('jest') || query.includes('vitest')) {
      return this.getTestResponse();
    }

    if (query.includes('hook') || query.includes('usestate') || query.includes('useeffect')) {
      return this.getReactHookResponse();
    }

    if (query.includes('function') || query.includes('arrow')) {
      return this.getFunctionResponse();
    }

    // Default response
    return {
      content: `I understand you're working on: "${request.userQuery}"

Here's a general approach:

1. **Plan your solution** - Break down the problem into smaller steps
2. **Choose the right tools** - Consider the technologies and patterns that fit
3. **Write clean code** - Focus on readability and maintainability
4. **Test your implementation** - Ensure it works as expected

${request.workspaceContext ? `Based on your project context (${request.workspaceContext.languages.join(', ')}), ` : ''}I'd be happy to help you implement this. Could you provide more specific details about what you'd like to build?`,
      metadata: {
        model: 'demo',
        tokens: 50,
        processing_time: 100,
      },
    };
  }

  static getCodeCompletion(
    code: string,
    _language: string,
    position: { line: number; column: number }
  ): AICodeCompletion[] {
    // Simple demo completions based on common patterns
    if (code.includes('console.')) {
      return [
        {
          text: 'log()',
          range: {
            startLineNumber: position.line,
            startColumn: position.column,
            endLineNumber: position.line,
            endColumn: position.column,
          },
          confidence: 0.9,
        },
      ];
    }

    if (code.includes('useState')) {
      return [
        {
          text: '(initialValue)',
          range: {
            startLineNumber: position.line,
            startColumn: position.column,
            endLineNumber: position.line,
            endColumn: position.column,
          },
          confidence: 0.85,
        },
      ];
    }

    if (code.includes('function ') || code.includes('const ')) {
      return [
        {
          text: '() => {\n  // Implementation here\n  return null\n}',
          range: {
            startLineNumber: position.line,
            startColumn: position.column,
            endLineNumber: position.line,
            endColumn: position.column,
          },
          confidence: 0.8,
        },
      ];
    }

    return [
      {
        text: '// Add your code here',
        range: {
          startLineNumber: position.line,
          startColumn: position.column,
          endLineNumber: position.line,
          endColumn: position.column,
        },
        confidence: 0.5,
      },
    ];
  }

  static getCodeGenerationResponse(request: AICodeGenerationRequest): AICodeGenerationResponse {
    return {
      code: `// Generated code based on: ${request.prompt}
const generatedFunction = () => {
  // Implementation here
  return 'Generated result'
}

export default generatedFunction`,
      language: 'typescript',
      explanation: `This is a demo implementation for "${request.prompt}". In a real scenario, I would analyze your requirements and generate appropriate code.`,
    };
  }

  private static getReactComponentResponse(): AIResponse {
    return {
      content: `Here's a React component example:

\`\`\`jsx
import React, { useState } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // API call here
      console.log('Login attempt:', { email, password })
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

export default LoginForm
\`\`\`

This component includes:
- State management with useState
- Form handling
- Loading states
- Basic validation
- Proper accessibility with labels`,
      metadata: {
        model: 'demo',
        tokens: 150,
        processing_time: 200,
      },
    };
  }

  private static getTypeScriptResponse(): AIResponse {
    return {
      content: `Here's a TypeScript interface and implementation example:

\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
  createdAt: Date
  updatedAt: Date
}

interface UserService {
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>
  getUserById(id: string): Promise<User | null>
  updateUser(id: string, updates: Partial<User>): Promise<User>
  deleteUser(id: string): Promise<boolean>
}

class UserServiceImpl implements UserService {
  private users: Map<string, User> = new Map()

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.users.set(user.id, user)
    return user
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const existingUser = this.users.get(id)
    if (!existingUser) {
      throw new Error('User not found')
    }

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date()
    }

    this.users.set(id, updatedUser)
    return updatedUser
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id)
  }
}
\`\`\`

This demonstrates:
- Interface definitions with union types
- Generic types and utility types (Omit, Partial)
- Class implementation of interfaces
- Async/await patterns
- Error handling`,
      metadata: {
        model: 'demo',
        tokens: 180,
        processing_time: 250,
      },
    };
  }

  private static getTestResponse(): AIResponse {
    return {
      content: `Here's a comprehensive test example:

\`\`\`typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with email and password fields', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should call onSubmit with form data when submitted', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} />)
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should show loading state when submitting', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<LoginForm onSubmit={mockOnSubmit} />)
    
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    expect(screen.getByText(/logging in/i)).toBeInTheDocument()
  })
})
\`\`\`

This test covers:
- Component rendering
- User interactions
- Form submission
- Loading states
- Mocking functions
- Async testing patterns`,
      metadata: {
        model: 'demo',
        tokens: 120,
        processing_time: 180,
      },
    };
  }

  private static getReactHookResponse(): AIResponse {
    return {
      content: `Here's a custom React hook example:

\`\`\`typescript
import { useState, useEffect, useCallback } from 'react'

interface UseApiOptions<T> {
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = [],
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(options.initialData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetcher()
      setData(result)
      options.onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}

// Usage example
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, refetch } = useApi(
    () => fetch(\`/api/users/\${userId}\`).then(res => res.json()),
    [userId],
    {
      onError: (error) => console.error('Failed to load user:', error)
    }
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!user) return <div>No user found</div>

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}
\`\`\`

This hook provides:
- Generic type support
- Loading and error states
- Automatic refetching
- Dependency tracking
- Success/error callbacks`,
      metadata: {
        model: 'demo',
        tokens: 160,
        processing_time: 220,
      },
    };
  }

  private static getFunctionResponse(): AIResponse {
    return {
      content: `Here are function examples with different patterns:

\`\`\`typescript
// Arrow function with type annotations
const processData = <T>(
  data: T[],
  predicate: (item: T) => boolean,
  transform: (item: T) => T
): T[] => {
  return data
    .filter(predicate)
    .map(transform)
}

// Traditional function with overloads
function formatValue(value: string): string
function formatValue(value: number): string
function formatValue(value: boolean): string
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return value.trim().toLowerCase()
  }
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return value ? 'yes' : 'no'
}

// Async function with error handling
const fetchWithRetry = async (
  url: string,
  maxRetries: number = 3
): Promise<Response> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`)
      }
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      if (attempt === maxRetries) {
        throw lastError
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  throw lastError!
}

// Higher-order function
const createValidator = <T>(
  rules: Array<(value: T) => string | null>
) => {
  return (value: T): string[] => {
    return rules
      .map(rule => rule(value))
      .filter((error): error is string => error !== null)
  }
}

// Usage examples
const emailValidator = createValidator<string>([
  (email) => email.includes('@') ? null : 'Must contain @',
  (email) => email.length > 5 ? null : 'Too short'
])

const errors = emailValidator('test@example.com')
console.log(errors) // []
\`\`\`

These examples show:
- Generic functions
- Function overloads
- Async/await patterns
- Error handling
- Higher-order functions
- Type guards`,
      metadata: {
        model: 'demo',
        tokens: 200,
        processing_time: 300,
      },
    };
  }

  private static getTaskPlanResponse(request: AIContextRequest): AIResponse {
    // Extract the user request from the planning prompt
    const userRequestMatch = request.userQuery.match(/USER REQUEST: (.+?)(?:\n|$)/);
    const userRequest = userRequestMatch ? userRequestMatch[1] : 'Complete the task';

    // Extract workspace root
    const workspaceRootMatch = request.userQuery.match(/- Root: (.+?)(?:\n|$)/);
    const workspaceRoot = workspaceRootMatch ? workspaceRootMatch[1] : '/';

    // Determine appropriate steps based on the request
    let steps = [];

    if (userRequest.toLowerCase().includes('review') || userRequest.toLowerCase().includes('analyze')) {
      steps = [
        {
          order: 1,
          title: 'Read project structure',
          description: `Analyze the directory structure of ${workspaceRoot}`,
          action: {
            type: 'search_codebase',
            params: {
              workspaceRoot: workspaceRoot,
              pattern: '*',
              includeFiles: true,
              includeDirs: true
            }
          },
          requiresApproval: false,
          maxRetries: 3
        },
        {
          order: 2,
          title: 'Analyze key files',
          description: 'Review package.json, tsconfig.json, and main entry points',
          action: {
            type: 'analyze_code',
            params: {
              workspaceRoot: workspaceRoot,
              files: ['package.json', 'tsconfig.json', 'src/index.tsx', 'src/App.tsx']
            }
          },
          requiresApproval: false,
          maxRetries: 3
        },
        {
          order: 3,
          title: 'Generate analysis report',
          description: 'Create a comprehensive report of findings',
          action: {
            type: 'write_file',
            params: {
              filePath: `${workspaceRoot}/ANALYSIS_REPORT.md`,
              content: '# Project Analysis Report\n\n*Analysis will be generated here*'
            }
          },
          requiresApproval: true,
          maxRetries: 3
        }
      ];
    } else if (userRequest.toLowerCase().includes('create') || userRequest.toLowerCase().includes('new')) {
      steps = [
        {
          order: 1,
          title: 'Create new file',
          description: `Create the requested file in ${workspaceRoot}`,
          action: {
            type: 'write_file',
            params: {
              filePath: `${workspaceRoot}/new-file.tsx`,
              content: '// New file created by Agent Mode'
            }
          },
          requiresApproval: true,
          maxRetries: 3
        }
      ];
    } else if (userRequest.toLowerCase().includes('fix') || userRequest.toLowerCase().includes('bug')) {
      steps = [
        {
          order: 1,
          title: 'Identify the issue',
          description: 'Search codebase for potential issues',
          action: {
            type: 'search_codebase',
            params: {
              workspaceRoot: workspaceRoot,
              pattern: 'TODO|FIXME|BUG|ERROR',
            }
          },
          requiresApproval: false,
          maxRetries: 3
        },
        {
          order: 2,
          title: 'Apply fix',
          description: 'Modify the identified files to fix the issue',
          action: {
            type: 'edit_file',
            params: {
              filePath: `${workspaceRoot}/src/buggy-file.tsx`,
              oldText: '// Old code',
              newText: '// Fixed code'
            }
          },
          requiresApproval: true,
          maxRetries: 3
        }
      ];
    } else {
      // Generic task
      steps = [
        {
          order: 1,
          title: 'Execute task',
          description: userRequest,
          action: {
            type: 'custom',
            params: {
              userRequest: userRequest
            }
          },
          requiresApproval: true,
          maxRetries: 3
        }
      ];
    }

    const taskPlan = {
      title: userRequest,
      description: `Demo mode: Task plan for "${userRequest}"`,
      reasoning: 'This is a demo task plan. In production mode with a real AI API key, the agent would generate context-aware steps based on your actual codebase.',
      steps: steps,
      warnings: [
        'Demo mode active - using simulated task planning',
        'Configure an AI API key in Settings for real autonomous capabilities'
      ]
    };

    return {
      content: JSON.stringify(taskPlan, null, 2),
      metadata: {
        model: 'demo',
        tokens: 100,
        processing_time: 150,
      },
    };
  }
}
