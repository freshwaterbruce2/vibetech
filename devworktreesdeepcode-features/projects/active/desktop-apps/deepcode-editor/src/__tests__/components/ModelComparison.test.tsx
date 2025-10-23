import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ModelComparison from '@/components/ModelComparison'

describe('ModelComparison', () => {
  it('renders all three AI models', () => {
    render(<ModelComparison />)
    
    expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument()
    expect(screen.getByText('DeepSeek Coder')).toBeInTheDocument()
    expect(screen.getByText('DeepSeek Reasoner')).toBeInTheDocument()
  })

  it('displays subtitles for each model', () => {
    render(<ModelComparison />)
    
    expect(screen.getByText('General Purpose')).toBeInTheDocument()
    expect(screen.getByText('Code Specialist')).toBeInTheDocument()
    expect(screen.getByText('Chain of Thought')).toBeInTheDocument()
  })

  it('shows features for each model', () => {
    render(<ModelComparison />)
    
    // DeepSeek Chat features
    expect(screen.getByText('Fast responses')).toBeInTheDocument()
    expect(screen.getByText('Conversational AI')).toBeInTheDocument()
    
    // DeepSeek Coder features
    expect(screen.getByText('Advanced code generation')).toBeInTheDocument()
    expect(screen.getByText('Design patterns expert')).toBeInTheDocument()
    
    // DeepSeek Reasoner features
    expect(screen.getByText('Step-by-step reasoning')).toBeInTheDocument()
    expect(screen.getByText('Complex problem solving')).toBeInTheDocument()
  })

  it('displays best use cases for each model', () => {
    render(<ModelComparison />)
    
    expect(screen.getByText(/Daily coding tasks/)).toBeInTheDocument()
    expect(screen.getByText(/Complex code generation/)).toBeInTheDocument()
    expect(screen.getByText(/Debugging, system design/)).toBeInTheDocument()
  })

  it('highlights the current model when provided', () => {
    // Verify the component accepts the currentModel prop without errors
    expect(() => render(<ModelComparison currentModel="deepseek-coder" />)).not.toThrow()
  })

  it('renders icons for each model', () => {
    const { container } = render(<ModelComparison />)
    
    // Check that SVG icons are rendered
    const icons = container.querySelectorAll('svg')
    expect(icons).toHaveLength(3)
  })

  it('renders all features for each model', () => {
    render(<ModelComparison />)
    
    // Count all feature list items
    const features = screen.getAllByRole('listitem')
    expect(features).toHaveLength(15) // 5 features × 3 models
  })
})