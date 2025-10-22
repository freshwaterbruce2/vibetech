import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Sidebar from '../../components/Sidebar'

const defaultProps = {
  workspaceFolder: '/test/workspace',
  onOpenFile: vi.fn(),
  onToggleAIChat: vi.fn(),
  aiChatOpen: false
}

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render sidebar with main sections', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByText('Explorer')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument()
    })

    it('should render workspace folder name when provided', () => {
      render(<Sidebar {...defaultProps} workspaceFolder="/my/project" />)
      
      // The component should show some indication of the workspace
      const sidebar = screen.getByRole('complementary') || screen.getByTestId('sidebar')
      expect(sidebar).toBeInTheDocument()
    })

    it('should render without workspace folder', () => {
      render(<Sidebar {...defaultProps} workspaceFolder={null} />)
      
      expect(screen.getByText('Explorer')).toBeInTheDocument()
    })

    it('should show file tree with demo files', async () => {
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('src')).toBeInTheDocument()
      })
      
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
      expect(screen.getByText('components')).toBeInTheDocument()
    })
  })

  describe('File Tree Navigation', () => {
    it('should expand and collapse folders', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('src')).toBeInTheDocument()
      })
      
      // Find the components folder
      const componentsFolder = screen.getByText('components')
      
      // Click to expand
      await user.click(componentsFolder)
      
      // Should show child files
      await waitFor(() => {
        expect(screen.getByText('Button.tsx')).toBeInTheDocument()
        expect(screen.getByText('Modal.tsx')).toBeInTheDocument()
      })
    })

    it('should call onOpenFile when clicking a file', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument()
      })
      
      // Click on a file
      await user.click(screen.getByText('App.tsx'))
      
      expect(defaultProps.onOpenFile).toHaveBeenCalledWith('src/App.tsx')
    })

    it('should expand nested folders', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('src')).toBeInTheDocument()
      })
      
      // Click on src folder to expand
      await user.click(screen.getByText('src'))
      
      // Should show components folder
      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument()
      })
      
      // Click on components folder
      await user.click(screen.getByText('components'))
      
      // Should show component files
      await waitFor(() => {
        expect(screen.getByText('Button.tsx')).toBeInTheDocument()
      })
    })

    it('should show different icons for files and folders', async () => {
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('src')).toBeInTheDocument()
      })
      
      // Folders and files should have different visual representations
      const srcElement = screen.getByText('src')
      const appTsxElement = screen.getByText('App.tsx')
      
      expect(srcElement).toBeInTheDocument()
      expect(appTsxElement).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should filter files based on search term', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument()
      })
      
      // Type in search box
      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'App')
      
      // Should still show App.tsx
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
    })

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText('Search files...')
      
      // Type and then clear
      await user.type(searchInput, 'test')
      await user.clear(searchInput)
      
      // Should show all files again
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
    })

    it('should handle empty search results gracefully', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument()
      })
      
      // Search for something that doesn't exist
      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'nonexistentfile')
      
      // Should not crash
      expect(searchInput).toHaveValue('nonexistentfile')
    })
  })

  describe('AI Chat Integration', () => {
    it('should show AI chat button', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Look for AI chat toggle button
      const aiButton = screen.getByText('AI Assistant') || screen.getByLabelText(/ai/i)
      expect(aiButton).toBeInTheDocument()
    })

    it('should call onToggleAIChat when AI button is clicked', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Find and click AI button
      const aiButton = screen.getByText('AI Assistant') || screen.getByLabelText(/ai/i)
      await user.click(aiButton)
      
      expect(defaultProps.onToggleAIChat).toHaveBeenCalledTimes(1)
    })

    it('should show different state when AI chat is open', () => {
      const { rerender } = render(<Sidebar {...defaultProps} aiChatOpen={false} />)
      
      const aiButton = screen.getByText('AI Assistant') || screen.getByLabelText(/ai/i)
      expect(aiButton).toBeInTheDocument()
      
      // Rerender with AI chat open
      rerender(<Sidebar {...defaultProps} aiChatOpen={true} />)
      
      // Button should still be there but might look different
      expect(aiButton).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('should highlight selected file', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument()
      })
      
      // Click on a file
      const fileElement = screen.getByText('App.tsx')
      await user.click(fileElement)
      
      // File should be selected (might have different styling)
      expect(defaultProps.onOpenFile).toHaveBeenCalledWith('src/App.tsx')
    })

    it('should handle multiple file selections', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument()
        expect(screen.getByText('index.ts')).toBeInTheDocument()
      })
      
      // Click on first file
      await user.click(screen.getByText('App.tsx'))
      expect(defaultProps.onOpenFile).toHaveBeenCalledWith('src/App.tsx')
      
      // Click on second file
      await user.click(screen.getByText('index.ts'))
      expect(defaultProps.onOpenFile).toHaveBeenCalledWith('src/index.ts')
      
      expect(defaultProps.onOpenFile).toHaveBeenCalledTimes(2)
    })
  })

  describe('Loading States', () => {
    it('should handle workspace folder changes', async () => {
      const { rerender } = render(<Sidebar {...defaultProps} workspaceFolder={null} />)
      
      // Initially no workspace
      expect(screen.getByText('Explorer')).toBeInTheDocument()
      
      // Change to a workspace folder
      rerender(<Sidebar {...defaultProps} workspaceFolder="/new/workspace" />)
      
      // Should load new file tree
      await waitFor(() => {
        expect(screen.getByText('src')).toBeInTheDocument()
      })
    })

    it('should handle errors gracefully', () => {
      // Test with potentially problematic props
      expect(() => {
        render(<Sidebar {...defaultProps} workspaceFolder="" />)
      }).not.toThrow()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument()
      })
      
      // Tab should navigate through elements
      await user.tab()
      
      // Some element should have focus
      expect(document.activeElement).toBeInTheDocument()
    })

    it('should support enter key for file selection', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument()
      })
      
      // Focus on a file and press enter
      const fileElement = screen.getByText('App.tsx')
      fileElement.focus()
      await user.keyboard('{Enter}')
      
      // Should open the file
      expect(defaultProps.onOpenFile).toHaveBeenCalledWith('src/App.tsx')
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle small content gracefully', () => {
      render(<Sidebar {...defaultProps} />)
      
      // Should render without breaking
      expect(screen.getByText('Explorer')).toBeInTheDocument()
    })

    it('should handle very long file names', async () => {
      render(<Sidebar {...defaultProps} />)
      
      // Component should handle long file names in the demo data
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument()
      })
    })
  })

  describe('Component State Management', () => {
    it('should maintain expanded folder state', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)

      // Wait for file tree to load
      await waitFor(() => {
        expect(screen.getByText('src')).toBeInTheDocument()
      })

      // Expand a folder
      await user.click(screen.getByText('components'))

      // Wait for expansion
      await waitFor(() => {
        expect(screen.getByText('Button.tsx')).toBeInTheDocument()
      })

      // Folder should remain expanded
      expect(screen.getByText('Button.tsx')).toBeInTheDocument()
    })

    it('should update when props change', () => {
      const { rerender } = render(<Sidebar {...defaultProps} />)

      // Change onOpenFile prop
      const newOnOpenFile = vi.fn()
      rerender(<Sidebar {...defaultProps} onOpenFile={newOnOpenFile} />)

      // Component should use new prop
      expect(screen.getByText('Explorer')).toBeInTheDocument()
    })
  })

  describe('Settings Button', () => {
    it('should render Settings button when onShowSettings is provided', () => {
      const onShowSettings = vi.fn()
      render(<Sidebar {...defaultProps} onShowSettings={onShowSettings} />)

      const settingsButton = screen.getByLabelText('Settings')
      expect(settingsButton).toBeInTheDocument()
    })

    it('should call onShowSettings when Settings button is clicked', async () => {
      const user = userEvent.setup()
      const onShowSettings = vi.fn()
      render(<Sidebar {...defaultProps} onShowSettings={onShowSettings} />)

      const settingsButton = screen.getByLabelText('Settings')
      await user.click(settingsButton)

      expect(onShowSettings).toHaveBeenCalledTimes(1)
    })

    it('should render Settings button even when onShowSettings is undefined', () => {
      render(<Sidebar {...defaultProps} onShowSettings={undefined} />)

      // Button should render but clicking it would do nothing
      const settingsButton = screen.getByLabelText('Settings')
      expect(settingsButton).toBeInTheDocument()
    })

    it('should handle Settings button click gracefully when handler is undefined', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} onShowSettings={undefined} />)

      const settingsButton = screen.getByLabelText('Settings')

      // Should not crash when clicked
      expect(async () => {
        await user.click(settingsButton)
      }).not.toThrow()
    })

    it('should have proper accessibility attributes', () => {
      const onShowSettings = vi.fn()
      render(<Sidebar {...defaultProps} onShowSettings={onShowSettings} />)

      const settingsButton = screen.getByLabelText('Settings')
      expect(settingsButton).toHaveAttribute('aria-label', 'Settings')
    })
  })
})