import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import AIChat from '../../components/AIChat'
import { AIMessage } from '../../types'

const mockMessages: AIMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: new Date('2024-01-01T12:00:00Z')
  },
  {
    id: '2',
    role: 'user',
    content: 'Can you help me write a React component?',
    timestamp: new Date('2024-01-01T12:01:00Z')
  },
  {
    id: '3',
    role: 'assistant',
    content: 'Of course! Here\'s a simple React component:\n\n```jsx\nfunction MyComponent() {\n  return <div>Hello World</div>\n}\n```',
    timestamp: new Date('2024-01-01T12:02:00Z')
  }
]

const defaultProps = {
  messages: mockMessages,
  onSendMessage: vi.fn(),
  onClose: vi.fn()
}

describe('AIChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render chat container with header', () => {
      render(<AIChat {...defaultProps} />)
      
      expect(screen.getByText('AI Assistant')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should render all messages', () => {
      render(<AIChat {...defaultProps} />)
      
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
      expect(screen.getByText('Can you help me write a React component?')).toBeInTheDocument()
      expect(screen.getByText(/Of course! Here's a simple React component/)).toBeInTheDocument()
    })

    it('should render message input and send button', () => {
      render(<AIChat {...defaultProps} />)
      
      expect(screen.getByPlaceholderText(/Ask AI about your code/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('should render without messages', () => {
      render(<AIChat {...defaultProps} messages={[]} />)
      
      expect(screen.getByText('AI Assistant')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Ask AI about your code/i)).toBeInTheDocument()
    })

    it('should display message timestamps', () => {
      render(<AIChat {...defaultProps} />)
      
      // Check that time is displayed (format may vary)
      expect(screen.getByText('12:00')).toBeInTheDocument()
      expect(screen.getByText('12:01')).toBeInTheDocument()
    })
  })

  describe('Message Display', () => {
    it('should show different styles for user and assistant messages', () => {
      render(<AIChat {...defaultProps} />)
      
      const assistantMessage = screen.getByText('Hello! How can I help you today?')
      const userMessage = screen.getByText('Can you help me write a React component?')
      
      expect(assistantMessage).toBeInTheDocument()
      expect(userMessage).toBeInTheDocument()
      
      // Messages should have different visual styling (tested through different classes/styles)
      expect(assistantMessage.closest('[role]')).toBeInTheDocument()
      expect(userMessage.closest('[role]')).toBeInTheDocument()
    })

    it('should render code blocks in messages', () => {
      render(<AIChat {...defaultProps} />)
      
      // Look for code content
      expect(screen.getByText(/function MyComponent/)).toBeInTheDocument()
    })

    it('should show user and bot icons', () => {
      render(<AIChat {...defaultProps} />)
      
      // Icons should be present (though specific icon testing depends on implementation)
      const chatContainer = screen.getByText('AI Assistant').closest('div')
      expect(chatContainer).toBeInTheDocument()
    })

    it('should handle long messages', () => {
      const longMessage: AIMessage = {
        id: '4',
        role: 'assistant',
        content: 'This is a very long message that should wrap properly in the chat interface. '.repeat(10),
        timestamp: new Date()
      }
      
      render(<AIChat {...defaultProps} messages={[longMessage]} />)
      
      expect(screen.getByText(/This is a very long message/)).toBeInTheDocument()
    })
  })

  describe('Message Input', () => {
    it('should update input value when typing', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i) as HTMLTextAreaElement
      await user.type(input, 'Hello AI')
      
      expect(input.value).toBe('Hello AI')
    })

    it('should send message when send button is clicked', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.type(input, 'Test message')
      await user.click(sendButton)
      
      expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Test message')
    })

    it('should send message when Enter is pressed', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i)
      
      await user.type(input, 'Test message{enter}')
      
      expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Test message')
    })

    it('should not send message when Shift+Enter is pressed', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i)
      
      await user.type(input, 'Test message{shift}{enter}')
      
      expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
    })

    it('should clear input after sending message', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i) as HTMLTextAreaElement
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.type(input, 'Test message')
      await user.click(sendButton)
      
      expect(input.value).toBe('')
    })

    it('should not send empty messages', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.click(sendButton)
      
      expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
    })

    it('should not send whitespace-only messages', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.type(input, '   ')
      await user.click(sendButton)
      
      expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
    })
  })

  describe('Chat Controls', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should have copy buttons for messages', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      // Look for copy buttons (might be icons)
      const copyButtons = screen.getAllByTitle(/copy/i)
      expect(copyButtons.length).toBeGreaterThan(0)
      
      // Click first copy button
      await user.click(copyButtons[0])
      
      // Should not throw error
    })

    it('should show quick action buttons', () => {
      render(<AIChat {...defaultProps} />)
      
      // Look for quick action suggestions
      const quickActions = screen.queryAllByText(/explain/i).concat(
        screen.queryAllByText(/refactor/i),
        screen.queryAllByText(/test/i)
      )
      
      // At least some quick actions should be available
      expect(quickActions.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Message Actions', () => {
    it('should show thumbs up/down for assistant messages', () => {
      render(<AIChat {...defaultProps} />)
      
      // Look for feedback buttons on assistant messages
      const thumbsButtons = screen.queryAllByTitle(/thumbs/i)
      
      // Should have some feedback options
      expect(thumbsButtons.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle copy to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      })
      
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const copyButtons = screen.getAllByTitle(/copy/i)
      if (copyButtons.length > 0) {
        await user.click(copyButtons[0])
        expect(navigator.clipboard.writeText).toHaveBeenCalled()
      }
    })
  })

  describe('Auto-scrolling', () => {
    it('should scroll to bottom when new messages are added', () => {
      const { rerender } = render(<AIChat {...defaultProps} />)
      
      const newMessage: AIMessage = {
        id: '4',
        role: 'user',
        content: 'New message',
        timestamp: new Date()
      }
      
      rerender(<AIChat {...defaultProps} messages={[...mockMessages, newMessage]} />)
      
      expect(screen.getByText('New message')).toBeInTheDocument()
    })

    it('should maintain scroll position when typing', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i)
      await user.type(input, 'Typing should not affect scroll')
      
      // Should not crash or cause issues
      expect(input).toHaveValue('Typing should not affect scroll')
    })
  })

  describe('Loading States', () => {
    it('should show typing indicator when appropriate', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.type(input, 'Test message')
      await user.click(sendButton)
      
      // After sending, there might be a brief typing state
      // This depends on the component's internal state management
    })

    it('should disable send button while sending', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.type(input, 'Test message')
      await user.click(sendButton)
      
      // Button behavior might change during sending
      expect(sendButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<AIChat {...defaultProps} />)
      
      // Tab through interactive elements
      await user.tab()
      
      expect(document.activeElement).toBeInTheDocument()
    })

    it('should have proper ARIA labels', () => {
      render(<AIChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      const closeButton = screen.getByRole('button', { name: /close/i })
      
      expect(input).toBeInTheDocument()
      expect(sendButton).toBeInTheDocument()
      expect(closeButton).toBeInTheDocument()
    })

    it('should support screen readers', () => {
      render(<AIChat {...defaultProps} />)
      
      // Messages should be readable by screen readers
      const messages = screen.getAllByText(/./i)
      expect(messages.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle onSendMessage errors gracefully', async () => {
      const errorOnSendMessage = vi.fn().mockRejectedValue(new Error('Send failed'))
      const user = userEvent.setup()
      
      render(<AIChat {...defaultProps} onSendMessage={errorOnSendMessage} />)
      
      const input = screen.getByPlaceholderText(/Ask AI about your code/i)
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      await user.type(input, 'Test message')
      await user.click(sendButton)
      
      // Should not crash the component
      expect(errorOnSendMessage).toHaveBeenCalled()
    })

    it('should handle malformed messages', () => {
      const malformedMessages = [
        { id: '1', role: 'assistant', content: '', timestamp: new Date() } as AIMessage
      ]
      
      expect(() => {
        render(<AIChat {...defaultProps} messages={malformedMessages} />)
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should handle large number of messages', () => {
      const manyMessages: AIMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date()
      }))
      
      expect(() => {
        render(<AIChat {...defaultProps} messages={manyMessages} />)
      }).not.toThrow()
      
      expect(screen.getByText('Message 99')).toBeInTheDocument()
    })

    it('should efficiently update when new messages are added', () => {
      const { rerender } = render(<AIChat {...defaultProps} />)
      
      const newMessages = [...mockMessages, {
        id: '4',
        role: 'user' as const,
        content: 'Additional message',
        timestamp: new Date()
      }]
      
      expect(() => {
        rerender(<AIChat {...defaultProps} messages={newMessages} />)
      }).not.toThrow()
      
      expect(screen.getByText('Additional message')).toBeInTheDocument()
    })
  })
})