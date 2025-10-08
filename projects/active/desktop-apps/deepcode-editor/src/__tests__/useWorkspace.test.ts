import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWorkspace } from '../hooks/useWorkspace'

describe('useWorkspace', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useWorkspace())
    
    expect(result.current.workspaceContext).toBeNull()
    expect(result.current.isIndexing).toBe(false)
    expect(result.current.indexingProgress).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('should provide workspace service instance', () => {
    const { result } = renderHook(() => useWorkspace())
    
    expect(result.current.workspaceService).toBeDefined()
    expect(result.current.workspaceService).toHaveProperty('indexWorkspace')
  })

  it('should provide action functions', () => {
    const { result } = renderHook(() => useWorkspace())
    
    expect(typeof result.current.indexWorkspace).toBe('function')
    expect(typeof result.current.getRelatedFiles).toBe('function')
    expect(typeof result.current.searchFiles).toBe('function')
    expect(typeof result.current.getFileContext).toBe('function')
    expect(typeof result.current.refreshIndex).toBe('function')
    expect(typeof result.current.clearWorkspace).toBe('function')
  })

  it('should clear workspace', () => {
    const { result } = renderHook(() => useWorkspace())
    
    // Call clearWorkspace directly without act since it's synchronous
    result.current.clearWorkspace()
    
    expect(result.current.workspaceContext).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.indexingProgress).toBe(0)
  })

  it('should return empty arrays when no workspace context', () => {
    const { result } = renderHook(() => useWorkspace())
    
    const relatedFiles = result.current.getRelatedFiles('/test/path')
    const searchResults = result.current.searchFiles('test')
    const fileContext = result.current.getFileContext({
      id: 'test',
      name: 'test.ts',
      path: '/test/test.ts',
      content: '',
      language: 'typescript',
      isModified: false
    })
    
    expect(relatedFiles).toEqual([])
    expect(searchResults).toEqual([])
    expect(fileContext).toEqual([])
  })
})