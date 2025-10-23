import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge simple class names', () => {
      const result = cn('px-4', 'py-2')
      expect(result).toBe('px-4 py-2')
    })

    it('should handle conditional classes', () => {
      const isActive = false
      const result = cn('px-4', isActive && 'py-2', 'text-red-500')
      expect(result).toBe('px-4 text-red-500')
    })

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-4 py-2', 'px-6')
      expect(result).toBe('py-2 px-6')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['px-4', 'py-2'], 'text-red-500')
      expect(result).toBe('px-4 py-2 text-red-500')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'px-4': true,
        'py-2': false,
        'text-red-500': true,
      })
      expect(result).toBe('px-4 text-red-500')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle null and undefined', () => {
      const result = cn('px-4', null, undefined, 'py-2')
      expect(result).toBe('px-4 py-2')
    })

    it('should merge complex Tailwind variants', () => {
      const result = cn(
        'bg-blue-500 hover:bg-blue-600',
        'bg-red-500 hover:bg-red-600'
      )
      expect(result).toBe('bg-red-500 hover:bg-red-600')
    })

    it('should handle nested conditionals', () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled ? 'disabled-class' : 'enabled-class'
      )

      expect(result).toBe('base-class active-class enabled-class')
    })
  })
})