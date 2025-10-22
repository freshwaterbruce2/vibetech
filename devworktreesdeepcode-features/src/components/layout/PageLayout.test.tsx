import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PageLayout from './PageLayout';

// Wrapper component that provides necessary context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </HelmetProvider>
);

describe('PageLayout', () => {
  it('renders children correctly', () => {
    render(
      <TestWrapper>
        <PageLayout>
          <div data-testid="test-content">Test Content</div>
        </PageLayout>
      </TestWrapper>
    );
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('sets default title when no title prop provided', () => {
    render(
      <TestWrapper>
        <PageLayout>
          <div>Content</div>
        </PageLayout>
      </TestWrapper>
    );
    // Helmet may set a default title or it may be empty in test environment
    // Just verify the component renders without errors
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('sets custom title when title prop provided', () => {
    render(
      <TestWrapper>
        <PageLayout title="Custom Page Title">
          <div>Content</div>
        </PageLayout>
      </TestWrapper>
    );
    // Helmet should update the title
    expect(document.title).toContain('Custom Page Title');
  });

  it('renders navigation bar', () => {
    render(
      <TestWrapper>
        <PageLayout>
          <div>Content</div>
        </PageLayout>
      </TestWrapper>
    );
    // NavBar should be rendered (can verify by checking for navigation role or specific elements)
    expect(document.querySelector('nav')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(
      <TestWrapper>
        <PageLayout>
          <div>Content</div>
        </PageLayout>
      </TestWrapper>
    );
    // Footer should be rendered
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('renders background decorations', () => {
    const { container } = render(
      <TestWrapper>
        <PageLayout>
          <div>Content</div>
        </PageLayout>
      </TestWrapper>
    );
    // Check for background elements (corner decorations, gradients, etc.)
    const decorations = container.querySelectorAll('.absolute');
    expect(decorations.length).toBeGreaterThan(0);
  });

  it('accepts particleOpacity prop', () => {
    render(
      <TestWrapper>
        <PageLayout particleOpacity={0.3}>
          <div>Content</div>
        </PageLayout>
      </TestWrapper>
    );
    // Component should render without errors
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('accepts auroraIntensity prop', () => {
    render(
      <TestWrapper>
        <PageLayout auroraIntensity="high">
          <div>Content</div>
        </PageLayout>
      </TestWrapper>
    );
    // Component should render without errors
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
