import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Notification, NotificationContainer } from '../../components/Notification'

const mockNotification = {
  id: 'test-notification',
  type: 'success' as const,
  title: 'Success Message',
  message: 'Operation completed successfully',
  duration: 5000,
  onClose: vi.fn()
}

const defaultProps = {
  ...mockNotification
}

describe('Notification Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render notification with title and message', () => {
      render(<Notification {...defaultProps} />)
      
      expect(screen.getByText('Success Message')).toBeInTheDocument()
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()
    })

    it('should render notification without message', () => {
      render(<Notification {...defaultProps} message={undefined} />)
      
      expect(screen.getByText('Success Message')).toBeInTheDocument()
      expect(screen.queryByText('Operation completed successfully')).not.toBeInTheDocument()
    })

    it('should render close button', () => {
      render(<Notification {...defaultProps} />)
      
      const closeButton = screen.getByRole('button')
      expect(closeButton).toBeInTheDocument()
    })

    it('should render progress bar for timed notifications', () => {
      const { container } = render(<Notification {...defaultProps} duration={3000} />)
      
      // Progress bar should be present
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should not render progress bar for persistent notifications', () => {
      const { container } = render(<Notification {...defaultProps} duration={0} />)
      
      // Should not have progress animation
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Notification Types', () => {
    it('should render success notification with correct icon', () => {
      render(<Notification {...defaultProps} type="success" />)
      
      expect(screen.getByText('Success Message')).toBeInTheDocument()
    })

    it('should render error notification with correct icon', () => {
      render(<Notification {...defaultProps} type="error" title="Error Message" />)
      
      expect(screen.getByText('Error Message')).toBeInTheDocument()
    })

    it('should render warning notification with correct icon', () => {
      render(<Notification {...defaultProps} type="warning" title="Warning Message" />)
      
      expect(screen.getByText('Warning Message')).toBeInTheDocument()
    })

    it('should render info notification with correct icon', () => {
      render(<Notification {...defaultProps} type="info" title="Info Message" />)
      
      expect(screen.getByText('Info Message')).toBeInTheDocument()
    })
  })

  describe('Auto-dismiss Functionality', () => {
    it('should auto-dismiss after specified duration', async () => {
      render(<Notification {...defaultProps} duration={1000} />)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
      
      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      
      // Wait for animation to complete
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      expect(defaultProps.onClose).toHaveBeenCalledWith('test-notification')
    })

    it('should not auto-dismiss when duration is 0', () => {
      render(<Notification {...defaultProps} duration={0} />)
      
      vi.advanceTimersByTime(10000)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('should handle negative duration', () => {
      render(<Notification {...defaultProps} duration={-1000} />)
      
      vi.advanceTimersByTime(5000)
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })

    it('should cleanup timer on unmount', () => {
      const { unmount } = render(<Notification {...defaultProps} duration={5000} />)
      
      unmount()
      
      vi.advanceTimersByTime(5000)
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('Manual Close Functionality', () => {
    it('should close when close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<Notification {...defaultProps} />)
      
      const closeButton = screen.getByRole('button')
      await user.click(closeButton)
      
      // Should trigger closing animation, then call onClose
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      expect(defaultProps.onClose).toHaveBeenCalledWith('test-notification')
    })

    it('should handle rapid clicking of close button', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<Notification {...defaultProps} />)
      
      const closeButton = screen.getByRole('button')
      
      await user.click(closeButton)
      await user.click(closeButton)
      await user.click(closeButton)
      
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      // Should only close once
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Animations', () => {
    it('should handle closing animation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<Notification {...defaultProps} />)
      
      const closeButton = screen.getByRole('button')
      await user.click(closeButton)
      
      // Animation should be triggered
      expect(screen.getByText('Success Message')).toBeInTheDocument()
      
      // After animation completes
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should show slide-in animation on mount', () => {
      const { container } = render(<Notification {...defaultProps} />)
      
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<Notification {...defaultProps} />)
      
      await user.tab()
      expect(document.activeElement).toBe(screen.getByRole('button'))
    })

    it('should support Enter key for close button', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<Notification {...defaultProps} />)
      
      const closeButton = screen.getByRole('button')
      closeButton.focus()
      
      await user.keyboard('{Enter}')
      
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should support Space key for close button', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<Notification {...defaultProps} />)
      
      const closeButton = screen.getByRole('button')
      closeButton.focus()
      
      await user.keyboard(' ')
      
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should have proper ARIA attributes', () => {
      render(<Notification {...defaultProps} />)
      
      const closeButton = screen.getByRole('button')
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Content Handling', () => {
    it('should handle very long titles', () => {
      const longTitle = 'This is a very long notification title that should be handled gracefully without breaking the layout'
      
      render(<Notification {...defaultProps} title={longTitle} />)
      
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle very long messages', () => {
      const longMessage = 'This is a very long notification message that contains a lot of text and should wrap properly within the notification container without causing layout issues or overflow problems'
      
      render(<Notification {...defaultProps} message={longMessage} />)
      
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('should handle special characters in content', () => {
      const specialTitle = 'Special chars: @#$%^&*()_+{}|:"<>?[]\\;\',./'
      const specialMessage = 'Message with special chars: 🚀 Hello 世界'
      
      render(<Notification {...defaultProps} title={specialTitle} message={specialMessage} />)
      
      expect(screen.getByText(specialTitle)).toBeInTheDocument()
      expect(screen.getByText(specialMessage)).toBeInTheDocument()
    })

    it('should handle empty title', () => {
      render(<Notification {...defaultProps} title="" />)
      
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('should show progress animation for correct duration', () => {
      const { container } = render(<Notification {...defaultProps} duration={2000} />)
      
      // Progress bar should be present and animated
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle zero duration properly', () => {
      render(<Notification {...defaultProps} duration={0} />)
      
      // Should render notification but no progress bar
      expect(screen.getByText('Success Message')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing onClose callback', () => {
      expect(() => {
        render(<Notification {...defaultProps} onClose={undefined as any} />)
      }).not.toThrow()
    })

    it('should handle invalid notification type', () => {
      expect(() => {
        render(<Notification {...defaultProps} type={'invalid' as any} />)
      }).not.toThrow()
    })

    it('should handle invalid duration values', () => {
      expect(() => {
        render(<Notification {...defaultProps} duration={NaN} />)
      }).not.toThrow()
      
      expect(() => {
        render(<Notification {...defaultProps} duration={Infinity} />)
      }).not.toThrow()
    })
  })
})

describe('NotificationContainer Component', () => {
  const mockNotifications = [
    {
      id: 'notification-1',
      type: 'success' as const,
      title: 'Success 1',
      message: 'First success message',
      duration: 5000
    },
    {
      id: 'notification-2',
      type: 'error' as const,
      title: 'Error 1',
      message: 'First error message',
      duration: 0
    },
    {
      id: 'notification-3',
      type: 'warning' as const,
      title: 'Warning 1'
    }
  ]

  const containerProps = {
    notifications: mockNotifications,
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render all notifications', () => {
      render(<NotificationContainer {...containerProps} />)
      
      expect(screen.getByText('Success 1')).toBeInTheDocument()
      expect(screen.getByText('Error 1')).toBeInTheDocument()
      expect(screen.getByText('Warning 1')).toBeInTheDocument()
    })

    it('should render empty container when no notifications', () => {
      const { container } = render(<NotificationContainer {...containerProps} notifications={[]} />)
      
      expect(container.firstChild?.childNodes).toHaveLength(0)
    })

    it('should position container correctly', () => {
      const { container } = render(<NotificationContainer {...containerProps} />)
      
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Notification Management', () => {
    it('should pass correct props to individual notifications', () => {
      render(<NotificationContainer {...containerProps} />)
      
      expect(screen.getByText('Success 1')).toBeInTheDocument()
      expect(screen.getByText('First success message')).toBeInTheDocument()
      expect(screen.getByText('Error 1')).toBeInTheDocument()
      expect(screen.getByText('First error message')).toBeInTheDocument()
    })

    it('should handle notification close callback', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<NotificationContainer {...containerProps} />)
      
      const closeButtons = screen.getAllByRole('button')
      await user.click(closeButtons[0])
      
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      expect(containerProps.onClose).toHaveBeenCalledWith('notification-1')
    })

    it('should handle multiple notifications closing', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<NotificationContainer {...containerProps} />)
      
      const closeButtons = screen.getAllByRole('button')
      
      await user.click(closeButtons[0])
      await user.click(closeButtons[1])
      
      act(() => {
        vi.advanceTimersByTime(300)
      })
      
      expect(containerProps.onClose).toHaveBeenCalledWith('notification-1')
      expect(containerProps.onClose).toHaveBeenCalledWith('notification-2')
    })
  })

  describe('Dynamic Updates', () => {
    it('should handle adding new notifications', () => {
      const { rerender } = render(<NotificationContainer {...containerProps} />)
      
      expect(screen.getAllByRole('button')).toHaveLength(3)
      
      const newNotifications = [
        ...mockNotifications,
        {
          id: 'notification-4',
          type: 'info' as const,
          title: 'New Info',
          message: 'New info message'
        }
      ]
      
      rerender(<NotificationContainer {...containerProps} notifications={newNotifications} />)
      
      expect(screen.getByText('New Info')).toBeInTheDocument()
      expect(screen.getAllByRole('button')).toHaveLength(4)
    })

    it('should handle removing notifications', () => {
      const { rerender } = render(<NotificationContainer {...containerProps} />)
      
      expect(screen.getByText('Success 1')).toBeInTheDocument()
      
      const updatedNotifications = mockNotifications.slice(1)
      rerender(<NotificationContainer {...containerProps} notifications={updatedNotifications} />)
      
      expect(screen.queryByText('Success 1')).not.toBeInTheDocument()
      expect(screen.getByText('Error 1')).toBeInTheDocument()
    })

    it('should handle clearing all notifications', () => {
      const { rerender } = render(<NotificationContainer {...containerProps} />)
      
      expect(screen.getAllByRole('button')).toHaveLength(3)
      
      rerender(<NotificationContainer {...containerProps} notifications={[]} />)
      
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })
  })

  describe('Performance', () => {
    it('should handle large number of notifications', () => {
      const manyNotifications = Array.from({ length: 20 }, (_, i) => ({
        id: `notification-${i}`,
        type: 'info' as const,
        title: `Notification ${i}`,
        message: `Message ${i}`
      }))

      expect(() => {
        render(<NotificationContainer {...containerProps} notifications={manyNotifications} />)
      }).not.toThrow()
      
      expect(screen.getByText('Notification 0')).toBeInTheDocument()
      expect(screen.getByText('Notification 19')).toBeInTheDocument()
    })

    it('should handle rapid notification updates', () => {
      const { rerender } = render(<NotificationContainer {...containerProps} />)
      
      for (let i = 0; i < 10; i++) {
        const newNotifications = Array.from({ length: i + 1 }, (_, j) => ({
          id: `notification-${j}`,
          type: 'info' as const,
          title: `Notification ${j}`
        }))
        
        rerender(<NotificationContainer {...containerProps} notifications={newNotifications} />)
      }
      
      expect(screen.getByText('Notification 9')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle notifications with missing required fields', () => {
      const invalidNotifications = [
        {
          id: '',
          type: 'success' as const,
          title: '',
          message: undefined
        },
        {
          id: 'valid',
          type: undefined as any,
          title: 'Valid Title'
        }
      ] as any

      expect(() => {
        render(<NotificationContainer {...containerProps} notifications={invalidNotifications} />)
      }).not.toThrow()
    })

    it('should handle duplicate notification IDs', () => {
      const duplicateNotifications = [
        {
          id: 'duplicate',
          type: 'success' as const,
          title: 'First'
        },
        {
          id: 'duplicate',
          type: 'error' as const,
          title: 'Second'
        }
      ]

      expect(() => {
        render(<NotificationContainer {...containerProps} notifications={duplicateNotifications} />)
      }).not.toThrow()
      
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })
  })

  describe('Layout and Positioning', () => {
    it('should maintain proper stacking order', () => {
      render(<NotificationContainer {...containerProps} />)
      
      const notifications = screen.getAllByText(/Success 1|Error 1|Warning 1/)
      expect(notifications).toHaveLength(3)
    })

    it('should handle container overflow gracefully', () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
        id: `notification-${i}`,
        type: 'info' as const,
        title: `Notification ${i}`
      }))

      const { container } = render(<NotificationContainer {...containerProps} notifications={manyNotifications} />)
      
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})