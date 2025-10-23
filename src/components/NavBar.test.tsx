import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NavBar from './NavBar';

// Wrapper for React Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('NavBar', () => {
  it('renders the logo with text', () => {
    render(<NavBar />, { wrapper: RouterWrapper });
    expect(screen.getByText('Vibe Tech')).toBeInTheDocument();
  });

  it('renders logo as a link to home', () => {
    render(<NavBar />, { wrapper: RouterWrapper });
    const logo = screen.getByText('Vibe Tech');
    expect(logo.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders all navigation links', () => {
    render(<NavBar />, { wrapper: RouterWrapper });

    const expectedLinks = [
      'Home', 'Services', 'Pricing', 'Tools', 'Resources',
      'About', 'Portfolio', 'Blog', 'Contact', 'Dashboard'
    ];

    expectedLinks.forEach(linkText => {
      expect(screen.getByText(linkText)).toBeInTheDocument();
    });
  });

  it('navigation links have correct hrefs', () => {
    render(<NavBar />, { wrapper: RouterWrapper });

    expect(screen.getByText('Services').closest('a')).toHaveAttribute('href', '/services');
    expect(screen.getByText('Pricing').closest('a')).toHaveAttribute('href', '/pricing');
    expect(screen.getByText('Tools').closest('a')).toHaveAttribute('href', '/tools');
    expect(screen.getByText('About').closest('a')).toHaveAttribute('href', '/about');
    expect(screen.getByText('Blog').closest('a')).toHaveAttribute('href', '/blog');
  });

  it('has fixed positioning and backdrop blur', () => {
    const { container } = render(<NavBar />, { wrapper: RouterWrapper });
    const header = container.querySelector('header');

    expect(header).toHaveClass('fixed');
    expect(header).toHaveClass('backdrop-blur-lg');
    expect(header).toHaveClass('z-50');
  });

  it('renders mobile menu button', () => {
    render(<NavBar />, { wrapper: RouterWrapper });
    const buttons = screen.getAllByRole('button');
    const mobileButton = buttons.find(btn => btn.classList.contains('md:hidden'));

    expect(mobileButton).toBeInTheDocument();
    expect(mobileButton).toHaveClass('md:hidden');
  });

  it('navigation is hidden on mobile', () => {
    render(<NavBar />, { wrapper: RouterWrapper });
    const nav = screen.getByRole('navigation');

    expect(nav).toHaveClass('hidden');
    expect(nav).toHaveClass('md:flex');
  });

  it('applies hover styles to links', () => {
    render(<NavBar />, { wrapper: RouterWrapper });
    const servicesLink = screen.getByText('Services');

    expect(servicesLink).toHaveClass('hover:text-aura-accent');
    expect(servicesLink).toHaveClass('transition-colors');
  });

  it('logo has gradient text styling', () => {
    render(<NavBar />, { wrapper: RouterWrapper });
    const logo = screen.getByText('Vibe Tech');

    expect(logo).toHaveClass('bg-gradient-to-r');
    expect(logo).toHaveClass('from-aura-accent');
    expect(logo).toHaveClass('bg-clip-text');
    expect(logo).toHaveClass('text-transparent');
  });

  it('renders mobile menu icon SVG', () => {
    const { container } = render(<NavBar />, { wrapper: RouterWrapper });
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});
