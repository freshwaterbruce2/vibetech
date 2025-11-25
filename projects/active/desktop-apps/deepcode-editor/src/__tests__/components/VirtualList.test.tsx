import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { VirtualList, useVirtualScroll } from '@/components/VirtualList'
import { renderHook, act } from '@testing-library/react'

const generateItems = (count: number) => 
  Array.from({ length: count }, (_, i) => ({ id: i, content: `Item ${i}` }))

describe('VirtualList', () => {

  const defaultProps = {
    items: generateItems(100),
    height: 400,
    itemHeight: 50,
    renderItem: (item: any, index: number, style: React.CSSProperties) => (
      <div style={style} data-testid={`item-${index}`}>
        {item.content}
      </div>
    )
  }

  it('renders only visible items', () => {
    render(<VirtualList {...defaultProps} />)
    
    // With height 400 and itemHeight 50, we should see ~8 items plus overscan
    const renderedItems = screen.getAllByTestId(/^item-/)
    expect(renderedItems.length).toBeLessThan(20) // Much less than 100 total items
  })

  it('renders correct number of items based on height and item height', () => {
    render(<VirtualList {...defaultProps} overscan={0} />)
    
    // Visible items = height / itemHeight = 400 / 50 = 8
    const renderedItems = screen.getAllByTestId(/^item-/)
    expect(renderedItems.length).toBeGreaterThanOrEqual(8)
    expect(renderedItems.length).toBeLessThanOrEqual(10) // Allow for edge cases
  })

  it('updates visible items on scroll', () => {
    const { container } = render(<VirtualList {...defaultProps} />)
    const scrollContainer = container.firstChild as HTMLElement
    
    // Initially should show first items
    expect(screen.getByText('Item 0')).toBeInTheDocument()
    expect(screen.queryByText('Item 50')).not.toBeInTheDocument()
    
    // Scroll down
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 2500 } })
    
    // Should now show items around index 50 (2500 / 50)
    expect(screen.queryByText('Item 0')).not.toBeInTheDocument()
    // Due to overscan, exact visibility depends on implementation
  })

  it('calls onScroll callback when scrolling', () => {
    const onScroll = vi.fn()
    const { container } = render(<VirtualList {...defaultProps} onScroll={onScroll} />)
    const scrollContainer = container.firstChild as HTMLElement
    
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } })
    
    expect(onScroll).toHaveBeenCalledWith(100)
  })

  it('handles dynamic item heights', () => {
    const dynamicHeightProps = {
      ...defaultProps,
      itemHeight: (index: number) => index % 2 === 0 ? 50 : 100
    }
    
    render(<VirtualList {...dynamicHeightProps} />)
    
    // Should render without errors
    const renderedItems = screen.getAllByTestId(/^item-/)
    expect(renderedItems.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(
      <VirtualList {...defaultProps} className="custom-virtual-list" />
    )
    
    expect(container.firstChild).toHaveClass('custom-virtual-list')
  })

  it('respects overscan prop', () => {
    const { rerender } = render(<VirtualList {...defaultProps} overscan={0} />)
    const withoutOverscan = screen.getAllByTestId(/^item-/).length
    
    rerender(<VirtualList {...defaultProps} overscan={5} />)
    const withOverscan = screen.getAllByTestId(/^item-/).length
    
    expect(withOverscan).toBeGreaterThan(withoutOverscan)
  })

  it('handles empty items array', () => {
    render(<VirtualList {...defaultProps} items={[]} />)
    
    const items = screen.queryAllByTestId(/^item-/)
    expect(items).toHaveLength(0)
  })

  it('calculates correct total height', () => {
    const { container } = render(<VirtualList {...defaultProps} />)
    // Find the scroll container (second div with height style)
    const scrollContainers = container.querySelectorAll('[style*="height"]')
    const scrollContent = scrollContainers[1] as HTMLElement // First is container, second is scroll content
    
    // Total height should be items.length * itemHeight = 100 * 50 = 5000
    expect(scrollContent.style.height).toBe('5000px')
  })
})

describe('useVirtualScroll', () => {
  it('calculates visible range correctly', () => {
    const items = generateItems(100)
    const { result } = renderHook(() => 
      useVirtualScroll(items, 400, 50, 3)
    )
    
    // Initially at top
    expect(result.current.visibleRange.startIndex).toBe(0)
    expect(result.current.visibleRange.endIndex).toBeGreaterThan(0)
    
    // Scroll down
    act(() => {
      result.current.setScrollTop(500)
    })
    
    // Should update visible range
    expect(result.current.visibleRange.startIndex).toBeGreaterThan(0)
  })

  it('calculates total height', () => {
    const items = generateItems(50)
    const { result } = renderHook(() => 
      useVirtualScroll(items, 400, 40)
    )
    
    expect(result.current.totalHeight).toBe(2000) // 50 * 40
  })

  it('handles dynamic item heights in hook', () => {
    const items = generateItems(10)
    const dynamicHeight = (index: number) => index * 10 + 50
    
    const { result } = renderHook(() => 
      useVirtualScroll(items, 400, dynamicHeight)
    )
    
    // Total should be sum of 50, 60, 70, ..., 140
    const expectedTotal = items.reduce((sum, _, i) => sum + dynamicHeight(i), 0)
    expect(result.current.totalHeight).toBe(expectedTotal)
  })

  it('updates scroll position', () => {
    const items = generateItems(100)
    const { result } = renderHook(() => 
      useVirtualScroll(items, 400, 50)
    )
    
    expect(result.current.scrollTop).toBe(0)
    
    act(() => {
      result.current.setScrollTop(1000)
    })
    
    expect(result.current.scrollTop).toBe(1000)
  })
})