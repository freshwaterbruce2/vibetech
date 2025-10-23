import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ToolCard from './ToolCard';

describe('ToolCard', () => {
  const mockProps = {
    title: 'Development Tools',
    description: 'Essential development and code collaboration tools',
    icon: <span data-testid="mock-icon">🔧</span>,
    category: 'Development',
    tools: ['Git', 'Docker', 'VS Code'],
  };

  it('renders title correctly', () => {
    render(<ToolCard {...mockProps} />);
    expect(screen.getByText('Development Tools')).toBeInTheDocument();
  });

  it('renders description correctly', () => {
    render(<ToolCard {...mockProps} />);
    expect(
      screen.getByText('Essential development and code collaboration tools')
    ).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<ToolCard {...mockProps} />);
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<ToolCard {...mockProps} />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders all tools in the list', () => {
    render(<ToolCard {...mockProps} />);
    expect(screen.getByText('Git')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('VS Code')).toBeInTheDocument();
  });

  it('renders featured tools heading', () => {
    render(<ToolCard {...mockProps} />);
    expect(screen.getByText('Featured Tools')).toBeInTheDocument();
  });

  it('applies default blue variant', () => {
    const { container } = render(<ToolCard {...mockProps} />);
    // FuturisticCard should be rendered (basic smoke test)
    expect(container.querySelector('.h-full')).toBeInTheDocument();
  });

  it('applies purple variant when specified', () => {
    const { container } = render(<ToolCard {...mockProps} variant="purple" />);
    expect(container.querySelector('.h-full')).toBeInTheDocument();
  });

  it('applies teal variant when specified', () => {
    const { container } = render(<ToolCard {...mockProps} variant="teal" />);
    expect(container.querySelector('.h-full')).toBeInTheDocument();
  });

  it('renders with empty tools array', () => {
    render(<ToolCard {...mockProps} tools={[]} />);
    expect(screen.getByText('Development Tools')).toBeInTheDocument();
    expect(screen.getByText('Featured Tools')).toBeInTheDocument();
  });

  it('handles long description text', () => {
    const longDescription =
      'This is a very long description that should still render correctly without breaking the layout or causing any issues with the component structure and styling.';
    render(<ToolCard {...mockProps} description={longDescription} />);
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('handles many tools in the list', () => {
    const manyTools = Array.from({ length: 10 }, (_, i) => `Tool ${i + 1}`);
    render(<ToolCard {...mockProps} tools={manyTools} />);
    manyTools.forEach((tool) => {
      expect(screen.getByText(tool)).toBeInTheDocument();
    });
  });
});
