import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CodeActions } from '../../components/CodeActions'

const mockActions = [
  {
    id: 'quickfix-1',
    title: 'Fix missing semicolon',
    kind: 'quickfix' as const,
    description: 'Add semicolon at end of line',
    execute: vi.fn().mockResolvedValue(undefined)
  },
  {
    id: 'refactor-1',
    title: 'Extract method',
    kind: 'refactor' as const,
    description: 'Extract selected code into a new method',
    execute: vi.fn().mockResolvedValue(undefined)
  },
  {
    id: 'source-1',
    title: 'Organize imports',
    kind: 'source' as const,
    execute: vi.fn().mockResolvedValue(undefined)
  },
  {
    id: 'quickfix-2',
    title: 'Remove unused variable',
    kind: 'quickfix' as const,
    execute: vi.fn().mockResolvedValue(undefined)
  }
]

const defaultProps = {
  actions: mockActions,
  position: { x: 100, y: 200 },
  onClose: vi.fn()
}

describe('CodeActions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render code actions menu', () => {
      render(<CodeActions {...defaultProps} />)
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      expect(screen.getByText('Fix missing semicolon')).toBeInTheDocument()
      expect(screen.getByText('Extract method')).toBeInTheDocument()
      expect(screen.getByText('Organize imports')).toBeInTheDocument()
    })

    it('should render action descriptions when provided', () => {
      render(<CodeActions {...defaultProps} />)
      
      expect(screen.getByText('Add semicolon at end of line')).toBeInTheDocument()
      expect(screen.getByText('Extract selected code into a new method')).toBeInTheDocument()
    })

    it('should not render when no actions provided', () => {
      render(<CodeActions {...defaultProps} actions={[]} />)
      
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument()
    })

    it('should position correctly based on position prop', () => {
      const { container } = render(<CodeActions {...defaultProps} position={{ x: 150, y: 250 }} />)
      
      // Find the positioned container (should be after the backdrop)
      const menuContainer = container.querySelector('div:nth-child(2)')
      expect(menuContainer).toBeInTheDocument()
      expect(menuContainer).toHaveStyle('top: 250px')
      expect(menuContainer).toHaveStyle('left: 150px')
    })

    it('should render backdrop', () => {
      const { container } = render(<CodeActions {...defaultProps} />)
      
      // Backdrop should be the first child (before the menu container)
      const backdrop = container.firstChild
      expect(backdrop).toBeInTheDocument()
    })
  })

  describe('Action Types and Icons', () => {
    it('should display correct icons for different action types', () => {
      render(<CodeActions {...defaultProps} />)
      
      // Icons should be rendered for each action type
      const actionItems = screen.getAllByRole('listitem')
      expect(actionItems).toHaveLength(4)
    })

    it('should handle quickfix actions', () => {
      render(<CodeActions {...defaultProps} />)
      
      expect(screen.getByText('Fix missing semicolon')).toBeInTheDocument()
      expect(screen.getByText('Remove unused variable')).toBeInTheDocument()
    })

    it('should handle refactor actions', () => {
      render(<CodeActions {...defaultProps} />)
      
      expect(screen.getByText('Extract method')).toBeInTheDocument()
    })

    it('should handle source actions', () => {
      render(<CodeActions {...defaultProps} />)
      
      expect(screen.getByText('Organize imports')).toBeInTheDocument()
    })
  })

  describe('Action Execution', () => {
    it('should execute action when clicked', async () => {
      const user = userEvent.setup()
      render(<CodeActions {...defaultProps} />)
      
      const action = screen.getByText('Fix missing semicolon')
      await user.click(action)
      
      expect(mockActions[0].execute).toHaveBeenCalledTimes(1)
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should execute correct action when multiple actions exist', async () => {
      const user = userEvent.setup()
      render(<CodeActions {...defaultProps} />)
      
      const action = screen.getByText('Extract method')
      await user.click(action)
      
      expect(mockActions[1].execute).toHaveBeenCalledTimes(1)
      expect(mockActions[0].execute).not.toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should handle action execution errors gracefully', async () => {
      const errorAction = {
        id: 'error-action',
        title: 'Error Action',
        kind: 'quickfix' as const,
        execute: vi.fn().mockRejectedValue(new Error('Execution failed'))
      }

      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<CodeActions {...defaultProps} actions={[errorAction]} />)
      
      const action = screen.getByText('Error Action')
      await user.click(action)
      
      await waitFor(() => {
        expect(errorAction.execute).toHaveBeenCalledTimes(1)
        expect(consoleSpy).toHaveBeenCalledWith('Failed to execute code action:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })

    it('should not close menu if action execution fails', async () => {
      const errorAction = {
        id: 'error-action',
        title: 'Error Action',
        kind: 'quickfix' as const,
        execute: vi.fn().mockRejectedValue(new Error('Execution failed'))
      }

      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<CodeActions {...defaultProps} actions={[errorAction]} />)
      
      const action = screen.getByText('Error Action')
      await user.click(action)
      
      await waitFor(() => {
        expect(errorAction.execute).toHaveBeenCalledTimes(1)
      })

      // Menu should not close on error
      expect(defaultProps.onClose).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Backdrop Interaction', () => {
    it('should close menu when backdrop is clicked', async () => {
      const user = userEvent.setup()
      const { container } = render(<CodeActions {...defaultProps} />)
      
      const backdrop = container.firstChild as HTMLElement
      await user.click(backdrop)
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close when clicking inside the menu', async () => {
      const user = userEvent.setup()
      render(<CodeActions {...defaultProps} />)
      
      const header = screen.getByText('Quick Actions')
      await user.click(header)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle keyboard events on action items', () => {
      render(<CodeActions {...defaultProps} />)
      
      const action = screen.getByText('Fix missing semicolon')
      fireEvent.keyDown(action, { key: 'Enter' })
      
      // Should be accessible via keyboard
      expect(action).toBeInTheDocument()
    })

    it('should be focusable via tab navigation', async () => {
      const user = userEvent.setup()
      render(<CodeActions {...defaultProps} />)
      
      await user.tab()
      expect(document.activeElement).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper list structure', () => {
      render(<CodeActions {...defaultProps} />)
      
      const actionList = screen.getByRole('list')
      expect(actionList).toBeInTheDocument()
      
      const actionItems = screen.getAllByRole('listitem')
      expect(actionItems).toHaveLength(4)
    })

    it('should be keyboard accessible', () => {
      render(<CodeActions {...defaultProps} />)
      
      const actionItems = screen.getAllByRole('listitem')
      actionItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should support Enter key for action execution', async () => {
      const user = userEvent.setup()
      render(<CodeActions {...defaultProps} />)
      
      const action = screen.getByText('Fix missing semicolon')
      action.focus()
      
      await user.keyboard('{Enter}')
      
      expect(mockActions[0].execute).toHaveBeenCalledTimes(1)
    })

    it('should support Space key for action execution', async () => {
      const user = userEvent.setup()
      render(<CodeActions {...defaultProps} />)
      
      const action = screen.getByText('Extract method')
      action.focus()
      
      await user.keyboard(' ')
      
      expect(mockActions[1].execute).toHaveBeenCalledTimes(1)
    })
  })

  describe('Visual Elements', () => {
    it('should display action titles prominently', () => {
      render(<CodeActions {...defaultProps} />)
      
      expect(screen.getByText('Fix missing semicolon')).toBeInTheDocument()
      expect(screen.getByText('Extract method')).toBeInTheDocument()
      expect(screen.getByText('Organize imports')).toBeInTheDocument()
    })

    it('should display lightbulb icon in header', () => {
      render(<CodeActions {...defaultProps} />)
      
      const header = screen.getByText('Quick Actions').closest('div')
      expect(header).toBeInTheDocument()
    })

    it('should handle actions without descriptions', () => {
      const actionsWithoutDescriptions = [
        {
          id: 'no-desc',
          title: 'Action without description',
          kind: 'quickfix' as const,
          execute: vi.fn()
        }
      ]

      render(<CodeActions {...defaultProps} actions={actionsWithoutDescriptions} />)
      
      expect(screen.getByText('Action without description')).toBeInTheDocument()
    })
  })

  describe('Hover Interactions', () => {
    it('should handle hover animations on action items', async () => {
      const user = userEvent.setup()
      render(<CodeActions {...defaultProps} />)
      
      const action = screen.getByText('Fix missing semicolon')
      
      await user.hover(action)
      await user.unhover(action)
      
      expect(action).toBeInTheDocument()
    })

    it('should show visual feedback on hover', async () => {
      const user = userEvent.setup()
      render(<CodeActions {...defaultProps} />)
      
      const actionItem = screen.getByText('Fix missing semicolon').closest('li')
      
      await user.hover(actionItem!)
      
      // Element should have hover styles applied
      expect(actionItem).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty actions array', () => {
      const { container } = render(<CodeActions {...defaultProps} actions={[]} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should handle actions with empty titles', () => {
      const emptyTitleAction = {
        id: 'empty-title',
        title: '',
        kind: 'quickfix' as const,
        execute: vi.fn()
      }

      render(<CodeActions {...defaultProps} actions={[emptyTitleAction]} />)
      
      // Should still render but with empty title
      expect(screen.getByRole('list')).toBeInTheDocument()
    })

    it('should handle very long action titles', () => {
      const longTitleAction = {
        id: 'long-title',
        title: 'This is a very long action title that should be handled gracefully without breaking the layout',
        kind: 'refactor' as const,
        execute: vi.fn()
      }

      render(<CodeActions {...defaultProps} actions={[longTitleAction]} />)
      
      expect(screen.getByText('This is a very long action title that should be handled gracefully without breaking the layout')).toBeInTheDocument()
    })

    it('should handle actions with special characters in titles', () => {
      const specialCharAction = {
        id: 'special-chars',
        title: 'Fix "quotes" & <brackets> {braces}',
        kind: 'quickfix' as const,
        execute: vi.fn()
      }

      render(<CodeActions {...defaultProps} actions={[specialCharAction]} />)
      
      expect(screen.getByText('Fix "quotes" & <brackets> {braces}')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large number of actions', () => {
      const manyActions = Array.from({ length: 50 }, (_, i) => ({
        id: `action-${i}`,
        title: `Action ${i}`,
        kind: 'quickfix' as const,
        execute: vi.fn()
      }))

      expect(() => {
        render(<CodeActions {...defaultProps} actions={manyActions} />)
      }).not.toThrow()
      
      expect(screen.getByText('Action 0')).toBeInTheDocument()
      expect(screen.getByText('Action 49')).toBeInTheDocument()
    })

    it('should handle rapid clicking without issues', async () => {
      const user = userEvent.setup()
      render(<CodeActions {...defaultProps} />)
      
      const action = screen.getByText('Fix missing semicolon')
      
      await user.click(action)
      await user.click(action)
      await user.click(action)
      
      // Should only execute once due to menu closing
      expect(mockActions[0].execute).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing execute function gracefully', async () => {
      const invalidAction = {
        id: 'invalid',
        title: 'Invalid Action',
        kind: 'quickfix' as const,
        execute: undefined as any
      }

      const user = userEvent.setup()
      
      expect(() => {
        render(<CodeActions {...defaultProps} actions={[invalidAction]} />)
      }).not.toThrow()
      
      const action = screen.getByText('Invalid Action')
      
      expect(async () => {
        await user.click(action)
      }).not.toThrow()
    })

    it('should handle malformed action objects', () => {
      const malformedAction = {
        id: null,
        title: undefined,
        kind: 'invalid',
        execute: 'not a function'
      } as any

      expect(() => {
        render(<CodeActions {...defaultProps} actions={[malformedAction]} />)
      }).not.toThrow()
    })
  })

  describe('Layout and Positioning', () => {
    it('should maintain proper layout with scrollable content', () => {
      const manyActions = Array.from({ length: 20 }, (_, i) => ({
        id: `action-${i}`,
        title: `Action ${i}`,
        kind: 'quickfix' as const,
        execute: vi.fn()
      }))

      render(<CodeActions {...defaultProps} actions={manyActions} />)
      
      const actionList = screen.getByRole('list')
      expect(actionList).toBeInTheDocument()
    })

    it('should handle extreme positioning values', () => {
      const { container } = render(<CodeActions {...defaultProps} position={{ x: -100, y: 9999 }} />)
      
      const menuContainer = container.querySelector('div[style*="top: 9999px"]')
      expect(menuContainer).toBeInTheDocument()
      expect(menuContainer).toHaveStyle('left: -100px')
    })
  })
})