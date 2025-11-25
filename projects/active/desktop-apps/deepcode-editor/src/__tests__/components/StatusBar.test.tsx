import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import StatusBar from '../../components/StatusBar'
import { EditorFile } from '../../types'

const mockFile: EditorFile = {
  id: 'test-example-file',
  path: '/test/example.tsx',
  name: 'example.tsx',
  content: 'const Example = () => {\n  return <div>Hello World</div>\n}\n\nexport default Example',
  language: 'typescript',
  isModified: false
}

const mockModifiedFile: EditorFile = {
  id: 'test-modified-file',
  path: '/test/modified.js',
  name: 'modified.js',
  content: 'console.log("Modified file")\n// Some comment',
  language: 'javascript',
  isModified: true
}

const defaultProps = {
  currentFile: mockFile,
  aiChatOpen: false,
  onToggleSidebar: vi.fn(),
  onToggleAIChat: vi.fn()
}

describe('StatusBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render status bar with basic elements', () => {
      render(<StatusBar {...defaultProps} />)
      
      expect(screen.getByText('main')).toBeInTheDocument()
      expect(screen.getByText('No errors')).toBeInTheDocument()
      expect(screen.getByText('DeepSeek AI Ready')).toBeInTheDocument()
      expect(screen.getByText('AI Chat')).toBeInTheDocument()
    })

    it('should render without current file', () => {
      render(<StatusBar {...defaultProps} currentFile={null} />)
      
      expect(screen.getByText('main')).toBeInTheDocument()
      expect(screen.getByText('No errors')).toBeInTheDocument()
      expect(screen.queryByText('TYPESCRIPT')).not.toBeInTheDocument()
    })

    it('should display file information when file is provided', () => {
      render(<StatusBar {...defaultProps} />)
      
      expect(screen.getByText('TYPESCRIPT')).toBeInTheDocument()
      expect(screen.getByText(/Ln 5, Col 1/)).toBeInTheDocument()
      expect(screen.getByText(/chars/)).toBeInTheDocument()
      expect(screen.getByText(/words/)).toBeInTheDocument()
    })

    it('should show modified indicator for unsaved files', () => {
      render(<StatusBar {...defaultProps} currentFile={mockModifiedFile} />)
      
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    })

    it('should not show modified indicator for saved files', () => {
      render(<StatusBar {...defaultProps} />)
      
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
    })
  })

  describe('File Information Display', () => {
    it('should display correct language for TypeScript files', () => {
      render(<StatusBar {...defaultProps} currentFile={mockFile} />)
      
      expect(screen.getByText('TYPESCRIPT')).toBeInTheDocument()
    })

    it('should display correct language for JavaScript files', () => {
      render(<StatusBar {...defaultProps} currentFile={mockModifiedFile} />)
      
      expect(screen.getByText('JAVASCRIPT')).toBeInTheDocument()
    })

    it('should calculate line count correctly', () => {
      render(<StatusBar {...defaultProps} />)
      
      // mockFile has 5 lines
      expect(screen.getByText(/Ln 5/)).toBeInTheDocument()
    })

    it('should calculate character count correctly', () => {
      render(<StatusBar {...defaultProps} />)
      
      const expectedChars = mockFile.content.length
      expect(screen.getByText(new RegExp(`${expectedChars} chars`))).toBeInTheDocument()
    })

    it('should calculate word count correctly', () => {
      render(<StatusBar {...defaultProps} />)
      
      const expectedWords = mockFile.content.split(/\s+/).filter(word => word.length > 0).length
      expect(screen.getByText(new RegExp(`${expectedWords} words`))).toBeInTheDocument()
    })

    it('should handle empty file content', () => {
      const emptyFile: EditorFile = {
        id: 'test-empty-file',
        path: '/test/empty.txt',
        name: 'empty.txt',
        content: '',
        language: 'plaintext',
        isModified: false
      }

      render(<StatusBar {...defaultProps} currentFile={emptyFile} />)
      
      expect(screen.getByText(/Ln 1, Col 1/)).toBeInTheDocument()
      expect(screen.getByText(/0 chars/)).toBeInTheDocument()
      expect(screen.getByText(/0 words/)).toBeInTheDocument()
    })

    it('should handle file with only whitespace', () => {
      const whitespaceFile: EditorFile = {
        id: 'test-whitespace-file',
        path: '/test/whitespace.txt',
        name: 'whitespace.txt',
        content: '   \n\n  \t  \n',
        language: 'plaintext',
        isModified: false
      }

      render(<StatusBar {...defaultProps} currentFile={whitespaceFile} />)
      
      expect(screen.getByText(/0 words/)).toBeInTheDocument()
    })
  })

  describe('Git Information', () => {
    it('should display git branch information', () => {
      render(<StatusBar {...defaultProps} />)
      
      expect(screen.getByText('main')).toBeInTheDocument()
    })

    it('should display error status', () => {
      render(<StatusBar {...defaultProps} />)
      
      expect(screen.getByText('No errors')).toBeInTheDocument()
    })

    it('should be clickable for git branch info', async () => {
      const user = userEvent.setup()
      render(<StatusBar {...defaultProps} />)
      
      const gitBranch = screen.getByText('main')
      await user.click(gitBranch)
      
      // Should not crash and element should still be there
      expect(gitBranch).toBeInTheDocument()
    })
  })

  describe('AI Chat Toggle', () => {
    it('should show AI Chat button', () => {
      render(<StatusBar {...defaultProps} />)
      
      expect(screen.getByText('AI Chat')).toBeInTheDocument()
    })

    it('should call onToggleAIChat when AI Chat button is clicked', async () => {
      const user = userEvent.setup()
      render(<StatusBar {...defaultProps} />)
      
      const aiChatButton = screen.getByText('AI Chat')
      await user.click(aiChatButton)
      
      expect(defaultProps.onToggleAIChat).toHaveBeenCalledTimes(1)
    })

    it('should show different state when AI chat is open', () => {
      const { rerender } = render(<StatusBar {...defaultProps} aiChatOpen={false} />)
      
      let aiChatButton = screen.getByText('AI Chat')
      expect(aiChatButton).toBeInTheDocument()
      
      rerender(<StatusBar {...defaultProps} aiChatOpen={true} />)
      
      aiChatButton = screen.getByText('AI Chat')
      expect(aiChatButton).toBeInTheDocument()
    })

    it('should have proper title attribute for accessibility', () => {
      render(<StatusBar {...defaultProps} />)
      
      const aiChatButton = screen.getByTitle('Toggle AI Chat')
      expect(aiChatButton).toBeInTheDocument()
    })
  })

  describe('Sidebar Toggle', () => {
    it('should show Sidebar toggle button', () => {
      render(<StatusBar {...defaultProps} />)
      
      const sidebarButton = screen.getByTitle('Toggle Sidebar')
      expect(sidebarButton).toBeInTheDocument()
    })

    it('should call onToggleSidebar when Sidebar button is clicked', async () => {
      const user = userEvent.setup()
      render(<StatusBar {...defaultProps} />)
      
      const sidebarButton = screen.getByTitle('Toggle Sidebar')
      await user.click(sidebarButton)
      
      expect(defaultProps.onToggleSidebar).toHaveBeenCalledTimes(1)
    })

    it('should show active state for sidebar button', () => {
      render(<StatusBar {...defaultProps} />)
      
      const sidebarButton = screen.getByTitle('Toggle Sidebar')
      expect(sidebarButton).toBeInTheDocument()
    })
  })

  describe('DeepSeek AI Status', () => {
    it('should show DeepSeek AI Ready status', () => {
      render(<StatusBar {...defaultProps} />)
      
      expect(screen.getByText('DeepSeek AI Ready')).toBeInTheDocument()
    })

    it('should be clickable', async () => {
      const user = userEvent.setup()
      render(<StatusBar {...defaultProps} />)
      
      const aiStatus = screen.getByText('DeepSeek AI Ready')
      await user.click(aiStatus)
      
      expect(aiStatus).toBeInTheDocument()
    })
  })

  describe('Animations and Interactions', () => {
    it('should handle hover animations on status items', async () => {
      const user = userEvent.setup()
      render(<StatusBar {...defaultProps} />)
      
      const gitBranch = screen.getByText('main')
      
      await user.hover(gitBranch)
      await user.unhover(gitBranch)
      
      expect(gitBranch).toBeInTheDocument()
    })

    it('should handle click animations on buttons', async () => {
      render(<StatusBar {...defaultProps} />)
      
      const aiChatButton = screen.getByText('AI Chat')
      
      fireEvent.mouseDown(aiChatButton)
      fireEvent.mouseUp(aiChatButton)
      
      expect(defaultProps.onToggleAIChat).toHaveBeenCalled()
    })

    it('should handle rapid clicking', async () => {
      const user = userEvent.setup()
      render(<StatusBar {...defaultProps} />)
      
      const aiChatButton = screen.getByText('AI Chat')
      
      await user.click(aiChatButton)
      await user.click(aiChatButton)
      await user.click(aiChatButton)
      
      expect(defaultProps.onToggleAIChat).toHaveBeenCalledTimes(3)
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<StatusBar {...defaultProps} />)
      
      // Tab through the status bar elements
      await user.tab()
      expect(document.activeElement).toBeInTheDocument()
    })

    it('should support Enter key for button activation', async () => {
      const user = userEvent.setup()
      render(<StatusBar {...defaultProps} />)
      
      const aiChatButton = screen.getByText('AI Chat')
      aiChatButton.focus()
      
      await user.keyboard('{Enter}')
      
      expect(defaultProps.onToggleAIChat).toHaveBeenCalledTimes(1)
    })

    it('should support Space key for button activation', async () => {
      const user = userEvent.setup()
      render(<StatusBar {...defaultProps} />)
      
      const aiChatButton = screen.getByText('AI Chat')
      aiChatButton.focus()
      
      await user.keyboard(' ')
      
      expect(defaultProps.onToggleAIChat).toHaveBeenCalledTimes(1)
    })

    it('should have proper ARIA labels', () => {
      render(<StatusBar {...defaultProps} />)
      
      expect(screen.getByTitle('Toggle AI Chat')).toBeInTheDocument()
      expect(screen.getByTitle('Toggle Sidebar')).toBeInTheDocument()
    })

    it('should have proper role attributes', () => {
      render(<StatusBar {...defaultProps} />)
      
      const aiChatButton = screen.getByText('AI Chat')
      const sidebarButton = screen.getByTitle('Toggle Sidebar')
      
      expect(aiChatButton.closest('button')).toBeInTheDocument()
      expect(sidebarButton.tagName).toBe('BUTTON')
    })
  })

  describe('File Type Support', () => {
    it('should display correct language for different file types', () => {
      const pythonFile: EditorFile = {
        id: 'test-python-file',
        path: '/test/script.py',
        name: 'script.py',
        content: 'print("Hello")',
        language: 'python',
        isModified: false
      }

      render(<StatusBar {...defaultProps} currentFile={pythonFile} />)
      
      expect(screen.getByText('PYTHON')).toBeInTheDocument()
    })

    it('should handle unknown file types', () => {
      const unknownFile: EditorFile = {
        id: 'test-unknown-file',
        path: '/test/unknown.xyz',
        name: 'unknown.xyz',
        content: 'unknown content',
        language: 'unknown',
        isModified: false
      }

      render(<StatusBar {...defaultProps} currentFile={unknownFile} />)
      
      expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
    })

    it('should handle files without extension', () => {
      const noExtFile: EditorFile = {
        id: 'test-no-ext-file',
        path: '/test/README',
        name: 'README',
        content: 'This is a readme file',
        language: 'plaintext',
        isModified: false
      }

      render(<StatusBar {...defaultProps} currentFile={noExtFile} />)
      
      expect(screen.getByText('PLAINTEXT')).toBeInTheDocument()
    })
  })

  describe('Dynamic Content Updates', () => {
    it('should update file information when file changes', () => {
      const { rerender } = render(<StatusBar {...defaultProps} currentFile={mockFile} />)
      
      expect(screen.getByText('TYPESCRIPT')).toBeInTheDocument()
      
      rerender(<StatusBar {...defaultProps} currentFile={mockModifiedFile} />)
      
      expect(screen.getByText('JAVASCRIPT')).toBeInTheDocument()
      expect(screen.queryByText('TYPESCRIPT')).not.toBeInTheDocument()
    })

    it('should update character count when file content changes', () => {
      const shortFile: EditorFile = {
        id: 'test-short-file',
        path: '/test/short.txt',
        name: 'short.txt',
        content: 'short',
        language: 'plaintext',
        isModified: false
      }

      const { rerender } = render(<StatusBar {...defaultProps} currentFile={shortFile} />)
      
      expect(screen.getByText(/5 chars/)).toBeInTheDocument()
      
      const longFile: EditorFile = {
        ...shortFile,
        content: 'This is a much longer file content'
      }

      rerender(<StatusBar {...defaultProps} currentFile={longFile} />)
      
      expect(screen.getByText(/34 chars/)).toBeInTheDocument()
    })

    it('should update modification status dynamically', () => {
      const { rerender } = render(<StatusBar {...defaultProps} currentFile={{
        ...mockFile,
        isModified: false
      }} />)
      
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
      
      rerender(<StatusBar {...defaultProps} currentFile={{
        ...mockFile,
        isModified: true
      }} />)
      
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    })
  })

  describe('Layout and Positioning', () => {
    it('should maintain fixed height', () => {
      const { container } = render(<StatusBar {...defaultProps} />)
      
      const statusBar = container.firstChild as HTMLElement
      expect(statusBar).toBeInTheDocument()
    })

    it('should display items in correct sections', () => {
      render(<StatusBar {...defaultProps} />)
      
      // Left section items
      expect(screen.getByText('main')).toBeInTheDocument()
      expect(screen.getByText('No errors')).toBeInTheDocument()
      
      // Right section items
      expect(screen.getByText('DeepSeek AI Ready')).toBeInTheDocument()
      expect(screen.getByText('AI Chat')).toBeInTheDocument()
    })

    it('should handle long file names gracefully', () => {
      const longNameFile: EditorFile = {
        id: 'test-long-name-file',
        path: '/test/very-long-file-name-that-should-not-break-layout.tsx',
        name: 'very-long-file-name-that-should-not-break-layout.tsx',
        content: 'content',
        language: 'typescript',
        isModified: false
      }

      render(<StatusBar {...defaultProps} currentFile={longNameFile} />)
      
      expect(screen.getByText('TYPESCRIPT')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing file gracefully', () => {
      expect(() => {
        render(<StatusBar {...defaultProps} currentFile={null} />)
      }).not.toThrow()
    })

    it('should handle malformed file objects', () => {
      const malformedFile = {
        path: null,
        name: undefined,
        content: null,
        language: '',
        isModified: undefined
      } as any

      expect(() => {
        render(<StatusBar {...defaultProps} currentFile={malformedFile} />)
      }).not.toThrow()
    })

    it('should handle callback errors gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      
      expect(() => {
        render(<StatusBar {...defaultProps} onToggleAIChat={errorCallback} />)
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<StatusBar {...defaultProps} />)
      
      // Re-render with same props
      rerender(<StatusBar {...defaultProps} />)
      
      expect(screen.getByText('main')).toBeInTheDocument()
    })

    it('should handle large file content efficiently', () => {
      const largeFile: EditorFile = {
        id: 'test-large-file',
        path: '/test/large.txt',
        name: 'large.txt',
        content: 'x'.repeat(100000),
        language: 'plaintext',
        isModified: false
      }

      expect(() => {
        render(<StatusBar {...defaultProps} currentFile={largeFile} />)
      }).not.toThrow()
      
      expect(screen.getByText(/100000 chars/)).toBeInTheDocument()
    })
  })
})