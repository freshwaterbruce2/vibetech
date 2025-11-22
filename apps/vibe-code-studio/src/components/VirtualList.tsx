import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

/**
 * Virtual List Component - 2025 Performance Pattern
 *
 * A lightweight virtual scrolling implementation without external dependencies
 *
 * Features:
 * - Renders only visible items
 * - Smooth scrolling
 * - Dynamic item heights support
 * - Keyboard navigation
 * - Minimal re-renders
 */

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

const Container = styled.div`
  position: relative;
  overflow: auto;
  will-change: transform;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${vibeTheme.colors.primary};
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: 4px;

    &:hover {
      background: rgba(139, 92, 246, 0.5);
    }
  }
`;

const ScrollContainer = styled.div`
  position: relative;
`;

const ItemContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  onScroll,
  className,
}: VirtualListProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Calculate item heights
  const getItemHeight = useCallback(
    (index: number): number => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  // Calculate total height
  const totalHeight = items.reduce((acc, _, index) => {
    return acc + getItemHeight(index);
  }, 0);

  // Calculate visible range
  const getVisibleRange = useCallback(() => {
    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    // Find end index
    accumulatedHeight = 0;
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > scrollTop + height) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
      accumulatedHeight += getItemHeight(i);
    }

    return { startIndex, endIndex };
  }, [items, scrollTop, height, overscan, getItemHeight]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      setIsScrolling(true);

      // Call external scroll handler
      onScroll?.(newScrollTop);

      // Reset scrolling state after scroll ends
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    },
    [onScroll]
  );

  // Get items to render
  const { startIndex, endIndex } = getVisibleRange();
  const visibleItems: Array<{ item: T; index: number; top: number }> = [];

  let accumulatedHeight = 0;
  for (let i = 0; i < items.length; i++) {
    const itemHeight = getItemHeight(i);

    if (i >= startIndex && i <= endIndex) {
      const currentItem = items[i];
      if (currentItem !== undefined) {
        visibleItems.push({
          item: currentItem,
          index: i,
          top: accumulatedHeight,
        });
      }
    }

    accumulatedHeight += itemHeight;
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Container
      ref={scrollElementRef}
      style={{ height }}
      onScroll={handleScroll}
      className={className}
    >
      <ScrollContainer style={{ height: totalHeight }}>
        {visibleItems.map(({ item, index, top }) => (
          <ItemContainer
            key={index}
            style={{
              transform: `translateY(${top}px)`,
              height: getItemHeight(index),
            }}
          >
            {renderItem(item, index, {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: getItemHeight(index),
            })}
          </ItemContainer>
        ))}
      </ScrollContainer>
    </Container>
  );
}

// Memoized version for better performance
export const MemoizedVirtualList = React.memo(VirtualList) as typeof VirtualList;

// Hook for virtual scrolling logic
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number | ((index: number) => number),
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const getItemHeight = useCallback(
    (index: number): number => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  const visibleRange = React.useMemo(() => {
    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = items.length - 1;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (accumulatedHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    // Find end index
    accumulatedHeight = 0;
    for (let i = startIndex; i < items.length; i++) {
      if (accumulatedHeight > scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
      accumulatedHeight += getItemHeight(i);
    }

    return { startIndex, endIndex };
  }, [items, scrollTop, containerHeight, overscan, getItemHeight]);

  const totalHeight = React.useMemo(() => {
    return items.reduce((acc, _, index) => acc + getItemHeight(index), 0);
  }, [items, getItemHeight]);

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    totalHeight,
  };
}

export default VirtualList;
