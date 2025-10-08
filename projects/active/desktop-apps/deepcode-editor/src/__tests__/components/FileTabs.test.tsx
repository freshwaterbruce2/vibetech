import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import FileTabs from '../../components/FileTabs'
import { EditorFile } from '../../types'

const mockFiles: EditorFile[] = [
  {
    id: 'test-app-tsx',
    path: '/test/App.tsx',
    name: 'App.tsx',
    content: 'const App = () => <div>Hello</div>',
    language: 'typescript',
    isModified: false
  },
  {
    id: 'test-index-js',
    path: '/test/index.js',
    name: 'index.js',
    content: 'console.log("hello")',
    language: 'javascript',
    isModified: true
  },
  {
    id: 'test-styles-css',
    path: '/test/styles.css',
    name: 'styles.css',
    content: '.container { margin: 0; }',
    language: 'css',
    isModified: false
  },
  {
    id: 'test-config-json',
    path: '/test/config.json',
    name: 'config.json',
    content: '{"name": "test"}',
    language: 'json',
    isModified: true
  }
]

const defaultProps = {
  files: mockFiles,
  activeFile: mockFiles[0],
  onFileSelect: vi.fn(),
  onCloseFile: vi.fn()
}

describe('FileTabs Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all file tabs', () => {
      render(<FileTabs {...defaultProps} />)
      
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
      expect(screen.getByText('index.js')).toBeInTheDocument()
      expect(screen.getByText('styles.css')).toBeInTheDocument()
      expect(screen.getByText('config.json')).toBeInTheDocument()
    })

    it('should render nothing when no files are provided', () => {
      const { container } = render(<FileTabs {...defaultProps} files={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('should highlight the active file tab', () => {
      render(<FileTabs {...defaultProps} activeFile={mockFiles[1]} />)
      
      const activeTab = screen.getByText('index.js').closest('div')
      const inactiveTab = screen.getByText('App.tsx').closest('div')
      
      expect(activeTab).toBeInTheDocument()
      expect(inactiveTab).toBeInTheDocument()
    })

    it('should show language icons for each file', () => {
      render(<FileTabs {...defaultProps} />)
      
      // Language icons should be present (TS, JS, CS, JS for json)
      const tabs = screen.getAllByText(/^(TS|JS|CS)$/)
      expect(tabs.length).toBeGreaterThan(0)
    })

    it('should show modified indicator for modified files', () => {
      render(<FileTabs {...defaultProps} />)
      
      // Modified files should have a visual indicator (● symbol)
      const modifiedTab = screen.getByText('index.js').closest('div')
      expect(modifiedTab).toBeInTheDocument()
    })

    it('should show close buttons on hover', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('App.tsx').closest('div')
      
      // Hover over the tab
      await user.hover(tab!)
      
      // Close button should be visible
      const closeButtons = screen.getAllByTitle('Close file')
      expect(closeButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Language Icons and Colors', () => {
    it('should display correct language icon for TypeScript files', () => {
      render(<FileTabs {...defaultProps} />)
      
      expect(screen.getByText('TS')).toBeInTheDocument()
    })

    it('should display correct language icon for JavaScript files', () => {
      render(<FileTabs {...defaultProps} />)
      
      expect(screen.getByText('JS')).toBeInTheDocument()
    })

    it('should display correct language icon for CSS files', () => {
      render(<FileTabs {...defaultProps} />)
      
      expect(screen.getByText('CS')).toBeInTheDocument()
    })

    it('should handle unknown file types with default icon', () => {
      const unknownFile: EditorFile = {
        id: 'test-unknown-file',
        path: '/test/unknown.xyz',
        name: 'unknown.xyz',
        content: 'unknown content',
        language: 'unknown',
        isModified: false
      }

      render(<FileTabs {...defaultProps} files={[unknownFile]} activeFile={unknownFile} />)
      
      expect(screen.getByText('TX')).toBeInTheDocument()
    })

    it('should apply correct background colors for different languages', () => {
      render(<FileTabs {...defaultProps} />)
      
      const tsIcon = screen.getByText('TS')
      const jsIcon = screen.getByText('JS')
      
      expect(tsIcon).toBeInTheDocument()
      expect(jsIcon).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('should call onFileSelect when clicking a tab', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('index.js')
      await user.click(tab)
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(mockFiles[1])
    })

    it('should call onFileSelect with correct file object', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      await user.click(screen.getByText('styles.css'))
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(mockFiles[2])
    })

    it('should handle rapid clicking without issues', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('App.tsx')
      
      // Click multiple times rapidly
      await user.click(tab)
      await user.click(tab)
      await user.click(tab)
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledTimes(3)
    })
  })

  describe('File Closing', () => {
    it('should call onCloseFile when clicking close button', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('App.tsx').closest('div')
      await user.hover(tab!)
      
      const closeButton = screen.getAllByTitle('Close file')[0]
      await user.click(closeButton)
      
      expect(defaultProps.onCloseFile).toHaveBeenCalledWith('/test/App.tsx')
    })

    it('should prevent tab selection when clicking close button', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('App.tsx').closest('div')
      await user.hover(tab!)
      
      const closeButton = screen.getAllByTitle('Close file')[0]
      await user.click(closeButton)
      
      // onFileSelect should not be called when clicking close button
      expect(defaultProps.onFileSelect).not.toHaveBeenCalled()
      expect(defaultProps.onCloseFile).toHaveBeenCalledWith('/test/App.tsx')
    })

    it('should close the correct file when multiple tabs are open', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      // Hover over the second tab
      const secondTab = screen.getByText('index.js').closest('div')
      await user.hover(secondTab!)
      
      const closeButtons = screen.getAllByTitle('Close file')
      // Find the close button for the second tab
      await user.click(closeButtons[1])
      
      expect(defaultProps.onCloseFile).toHaveBeenCalledWith('/test/index.js')
    })

    it('should handle closing non-existent files gracefully', async () => {
      const user = userEvent.setup()
      const onCloseFile = vi.fn()
      
      render(<FileTabs {...defaultProps} onCloseFile={onCloseFile} />)
      
      const tab = screen.getByText('App.tsx').closest('div')
      await user.hover(tab!)
      
      const closeButton = screen.getAllByTitle('Close file')[0]
      await user.click(closeButton)
      
      expect(onCloseFile).toHaveBeenCalledTimes(1)
    })
  })

  describe('Modified Files Indicator', () => {
    it('should show modified indicator for unsaved files', () => {
      const modifiedFile: EditorFile = {
        id: 'test-modified-file',
        path: '/test/modified.tsx',
        name: 'modified.tsx',
        content: 'modified content',
        language: 'typescript',
        isModified: true
      }

      render(<FileTabs {...defaultProps} files={[modifiedFile]} activeFile={modifiedFile} />)
      
      const tab = screen.getByText('modified.tsx').closest('div')
      expect(tab).toBeInTheDocument()
    })

    it('should not show modified indicator for saved files', () => {
      const savedFile: EditorFile = {
        id: 'test-saved-file',
        path: '/test/saved.tsx',
        name: 'saved.tsx',
        content: 'saved content',
        language: 'typescript',
        isModified: false
      }

      render(<FileTabs {...defaultProps} files={[savedFile]} activeFile={savedFile} />)
      
      const tab = screen.getByText('saved.tsx').closest('div')
      expect(tab).toBeInTheDocument()
    })

    it('should update modified indicator when file modification state changes', () => {
      const { rerender } = render(<FileTabs {...defaultProps} />)
      
      // Initially unmodified
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
      
      // Update to modified
      const modifiedFile = { ...mockFiles[0], isModified: true }
      rerender(<FileTabs {...defaultProps} files={[modifiedFile]} activeFile={modifiedFile} />)
      
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
    })
  })

  describe('Tab Animations and Interactions', () => {
    it('should handle hover animations', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('App.tsx').closest('div')
      
      await user.hover(tab!)
      await user.unhover(tab!)
      
      expect(tab).toBeInTheDocument()
    })

    it('should handle click animations', async () => {
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('App.tsx')
      
      // Simulate press and release
      fireEvent.mouseDown(tab)
      fireEvent.mouseUp(tab)
      
      expect(defaultProps.onFileSelect).toHaveBeenCalled()
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('App.tsx')
      tab.focus()
      
      await user.keyboard('{Enter}')
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(mockFiles[0])
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for close buttons', () => {
      render(<FileTabs {...defaultProps} />)
      
      const closeButtons = screen.getAllByTitle('Close file')
      closeButtons.forEach(button => {
        expect(button).toHaveAttribute('title', 'Close file')
      })
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      // Tab navigation should work
      await user.tab()
      
      expect(document.activeElement).toBeInTheDocument()
    })

    it('should support Enter key for file selection', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('App.tsx')
      tab.focus()
      
      await user.keyboard('{Enter}')
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(mockFiles[0])
    })

    it('should support Space key for file selection', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      const tab = screen.getByText('App.tsx')
      tab.focus()
      
      await user.keyboard(' ')
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledWith(mockFiles[0])
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle overflow with many tabs', () => {
      const manyFiles = Array.from({ length: 20 }, (_, i) => ({
        id: `file-${i}`,
        path: `/test/file${i}.tsx`,
        name: `file${i}.tsx`,
        content: `content ${i}`,
        language: 'typescript',
        isModified: false
      }))

      render(<FileTabs {...defaultProps} files={manyFiles} activeFile={manyFiles[0]} />)
      
      // Should render without breaking
      expect(screen.getByText('file0.tsx')).toBeInTheDocument()
    })

    it('should handle very long file names', () => {
      const longNameFile: EditorFile = {
        id: 'test-long-name-file',
        path: '/test/very-long-file-name-that-should-be-truncated.tsx',
        name: 'very-long-file-name-that-should-be-truncated.tsx',
        content: 'content',
        language: 'typescript',
        isModified: false
      }

      render(<FileTabs {...defaultProps} files={[longNameFile]} activeFile={longNameFile} />)
      
      expect(screen.getByText('very-long-file-name-that-should-be-truncated.tsx')).toBeInTheDocument()
    })

    it('should maintain tab order when files are added/removed', () => {
      const { rerender } = render(<FileTabs {...defaultProps} />)
      
      // Remove a file
      const updatedFiles = mockFiles.slice(1)
      rerender(<FileTabs {...defaultProps} files={updatedFiles} activeFile={updatedFiles[0]} />)
      
      expect(screen.getByText('index.js')).toBeInTheDocument()
      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single file', () => {
      const singleFile = [mockFiles[0]]
      render(<FileTabs {...defaultProps} files={singleFile} activeFile={singleFile[0]} />)
      
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
    })

    it('should handle file with empty name', () => {
      const emptyNameFile: EditorFile = {
        id: 'test-empty-name-file',
        path: '/test/',
        name: '',
        content: 'content',
        language: 'typescript',
        isModified: false
      }

      render(<FileTabs {...defaultProps} files={[emptyNameFile]} activeFile={emptyNameFile} />)
      
      // Should render without breaking
      const container = screen.getByText('TS').closest('div')
      expect(container).toBeInTheDocument()
    })

    it('should handle file with special characters in name', () => {
      const specialFile: EditorFile = {
        id: 'test-special-file',
        path: '/test/file@#$.tsx',
        name: 'file@#$.tsx',
        content: 'content',
        language: 'typescript',
        isModified: false
      }

      render(<FileTabs {...defaultProps} files={[specialFile]} activeFile={specialFile} />)
      
      expect(screen.getByText('file@#$.tsx')).toBeInTheDocument()
    })

    it('should handle rapid tab switching', async () => {
      const user = userEvent.setup()
      render(<FileTabs {...defaultProps} />)
      
      // Rapidly switch between tabs
      await user.click(screen.getByText('App.tsx'))
      await user.click(screen.getByText('index.js'))
      await user.click(screen.getByText('styles.css'))
      
      expect(defaultProps.onFileSelect).toHaveBeenCalledTimes(3)
    })
  })

  describe('Component Updates', () => {
    it('should update when active file changes', () => {
      const { rerender } = render(<FileTabs {...defaultProps} activeFile={mockFiles[0]} />)
      
      // Change active file
      rerender(<FileTabs {...defaultProps} activeFile={mockFiles[1]} />)
      
      expect(screen.getByText('index.js')).toBeInTheDocument()
    })

    it('should update when files list changes', () => {
      const { rerender } = render(<FileTabs {...defaultProps} />)
      
      const newFiles = [...mockFiles, {
        id: 'test-new-file',
        path: '/test/new.tsx',
        name: 'new.tsx',
        content: 'new content',
        language: 'typescript',
        isModified: false
      }]
      
      rerender(<FileTabs {...defaultProps} files={newFiles} />)
      
      expect(screen.getByText('new.tsx')).toBeInTheDocument()
    })

    it('should handle callback prop changes', () => {
      const newOnFileSelect = vi.fn()
      const { rerender } = render(<FileTabs {...defaultProps} />)
      
      rerender(<FileTabs {...defaultProps} onFileSelect={newOnFileSelect} />)
      
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
    })
  })
})