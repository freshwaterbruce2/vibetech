import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Settings } from '../../components/Settings'
import { EditorSettings } from '../../types'

const mockSettings: EditorSettings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: true,
  aiAutoComplete: true,
  aiSuggestions: true
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  settings: mockSettings,
  onSettingsChange: vi.fn()
}

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render settings panel when open', () => {
      render(<Settings {...defaultProps} />)
      
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Appearance')).toBeInTheDocument()
      expect(screen.getByText('Editor')).toBeInTheDocument()
      expect(screen.getByText('AI Features')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      const { container } = render(<Settings {...defaultProps} isOpen={false} />)
      
      // The overlay should have display: none
      const overlay = container.querySelector('div')
      expect(overlay).toHaveStyle('display: none')
    })

    it('should render all setting controls', () => {
      render(<Settings {...defaultProps} />)
      
      // Appearance settings
      expect(screen.getByDisplayValue('dark')).toBeInTheDocument() // Theme select
      expect(screen.getByDisplayValue('14')).toBeInTheDocument() // Font size
      expect(screen.getByLabelText(/Show Minimap/)).toBeInTheDocument()
      
      // Editor settings
      expect(screen.getByDisplayValue('2')).toBeInTheDocument() // Tab size
      expect(screen.getByLabelText(/Word Wrap/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Auto Save/)).toBeInTheDocument()
      
      // AI settings
      expect(screen.getByLabelText(/AI Auto Complete/)).toBeInTheDocument()
      expect(screen.getByLabelText(/AI Suggestions/)).toBeInTheDocument()
    })

    it('should render action buttons', () => {
      render(<Settings {...defaultProps} />)
      
      expect(screen.getByText('Reset to Defaults')).toBeInTheDocument()
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      render(<Settings {...defaultProps} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      await userEvent.click(closeButton)
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when overlay is clicked', async () => {
      render(<Settings {...defaultProps} />)
      
      // Click on the overlay (not the panel)
      const overlay = screen.getByRole('dialog', { hidden: true })
      await userEvent.click(overlay)
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should update theme setting', async () => {
      render(<Settings {...defaultProps} />)
      
      const themeSelect = screen.getByDisplayValue('dark')
      await userEvent.selectOptions(themeSelect, 'light')
      
      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)
      
      expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
        ...mockSettings,
        theme: 'light'
      })
    })

    it('should update font size setting', async () => {
      render(<Settings {...defaultProps} />)
      
      const fontSizeInput = screen.getByDisplayValue('14')
      await userEvent.clear(fontSizeInput)
      await userEvent.type(fontSizeInput, '16')
      
      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)
      
      expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
        ...mockSettings,
        fontSize: 16
      })
    })

    it('should update tab size setting', async () => {
      render(<Settings {...defaultProps} />)
      
      const tabSizeInput = screen.getByDisplayValue('2')
      await userEvent.clear(tabSizeInput)
      await userEvent.type(tabSizeInput, '4')
      
      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)
      
      expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
        ...mockSettings,
        tabSize: 4
      })
    })

    it('should toggle boolean settings', async () => {
      render(<Settings {...defaultProps} />)
      
      const minimapToggle = screen.getByLabelText(/Show Minimap/)
      await userEvent.click(minimapToggle)
      
      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)
      
      expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
        ...mockSettings,
        minimap: false
      })
    })

    it('should reset to default settings', async () => {
      const customSettings: EditorSettings = {
        ...mockSettings,
        fontSize: 20,
        theme: 'light',
        tabSize: 8
      }
      
      render(<Settings {...defaultProps} settings={customSettings} />)
      
      const resetButton = screen.getByText('Reset to Defaults')
      await userEvent.click(resetButton)
      
      // Check that values are reset to defaults
      expect(screen.getByDisplayValue('dark')).toBeInTheDocument()
      expect(screen.getByDisplayValue('14')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    })

    it('should save changes and close on save button click', async () => {
      render(<Settings {...defaultProps} />)
      
      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)
      
      expect(defaultProps.onSettingsChange).toHaveBeenCalledWith(mockSettings)
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Settings Persistence', () => {
    it('should update local settings when props change', () => {
      const { rerender } = render(<Settings {...defaultProps} />)
      
      const updatedSettings: EditorSettings = {
        ...mockSettings,
        fontSize: 18,
        theme: 'light'
      }
      
      rerender(<Settings {...defaultProps} settings={updatedSettings} />)
      
      expect(screen.getByDisplayValue('light')).toBeInTheDocument()
      expect(screen.getByDisplayValue('18')).toBeInTheDocument()
    })

    it('should maintain local changes until save or reset', async () => {
      render(<Settings {...defaultProps} />)
      
      // Make a local change
      const fontSizeInput = screen.getByDisplayValue('14')
      await userEvent.clear(fontSizeInput)
      await userEvent.type(fontSizeInput, '16')
      
      // Verify the change is reflected locally
      expect(screen.getByDisplayValue('16')).toBeInTheDocument()
      
      // But onSettingsChange should not be called until save
      expect(defaultProps.onSettingsChange).not.toHaveBeenCalled()
    })
  })

  describe('Input Validation', () => {
    it('should enforce font size limits', async () => {
      render(<Settings {...defaultProps} />)
      
      const fontSizeInput = screen.getByDisplayValue('14') as HTMLInputElement
      
      expect(fontSizeInput.min).toBe('10')
      expect(fontSizeInput.max).toBe('24')
    })

    it('should enforce tab size limits', async () => {
      render(<Settings {...defaultProps} />)
      
      const tabSizeInput = screen.getByDisplayValue('2') as HTMLInputElement
      
      expect(tabSizeInput.min).toBe('1')
      expect(tabSizeInput.max).toBe('8')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Settings {...defaultProps} />)
      
      expect(screen.getByLabelText(/Theme/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Font Size/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Tab Size/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Show Minimap/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Word Wrap/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Auto Save/)).toBeInTheDocument()
      expect(screen.getByLabelText(/AI Auto Complete/)).toBeInTheDocument()
      expect(screen.getByLabelText(/AI Suggestions/)).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      render(<Settings {...defaultProps} />)
      
      // Tab through focusable elements
      await userEvent.tab()
      expect(screen.getByDisplayValue('dark')).toHaveFocus()
      
      await userEvent.tab()
      expect(screen.getByDisplayValue('14')).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid number inputs gracefully', async () => {
      render(<Settings {...defaultProps} />)
      
      const fontSizeInput = screen.getByDisplayValue('14')
      await userEvent.clear(fontSizeInput)
      await userEvent.type(fontSizeInput, 'invalid')
      
      // Should not crash and should handle NaN
      const saveButton = screen.getByText('Save Changes')
      await userEvent.click(saveButton)
      
      // The component should still function
      expect(defaultProps.onSettingsChange).toHaveBeenCalled()
    })
  })
})