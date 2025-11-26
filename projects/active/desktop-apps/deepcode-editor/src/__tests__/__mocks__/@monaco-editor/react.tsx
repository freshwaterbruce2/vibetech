// Mock @monaco-editor/react for testing
import React from 'react'

export const Editor = vi.fn((props: any) => {
  return React.createElement('div', {
    'data-testid': 'monaco-editor',
    'data-value': props.value,
    'data-language': props.language,
  })
})

export const DiffEditor = vi.fn((props: any) => {
  return React.createElement('div', {
    'data-testid': 'monaco-diff-editor',
  })
})

export const useMonaco = vi.fn(() => null)

export const loader = {
  init: vi.fn(() => Promise.resolve()),
  config: vi.fn(),
}

export default Editor
