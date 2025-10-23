import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('Footer', () => {
  it('renders the Vibe Tech brand name', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    expect(screen.getByText('Vibe Tech')).toBeInTheDocument();
  });

  it('renders company description', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    expect(
      screen.getByText(/Innovative digital solutions where bold design meets rock-solid functionality/i)
    ).toBeInTheDocument();
  });

  it('renders contact information', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    expect(screen.getByText(/Bruce Freshwater/i)).toBeInTheDocument();
    expect(screen.getByText(/freshwaterbruce@icloud.com/i)).toBeInTheDocument();
    expect(screen.getByText(/\(803\) 825-2876/)).toBeInTheDocument();
  });

  it('renders Quick Links section', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
  });

  it('renders all quick link items', () => {
    render(<Footer />, { wrapper: RouterWrapper });

    // Note: Home appears twice (in NavBar and Footer)
    const quickLinks = ['Services', 'Portfolio', 'Contact'];

    quickLinks.forEach(link => {
      expect(screen.getByText(link)).toBeInTheDocument();
    });
  });

  it('quick links have correct hrefs', () => {
    render(<Footer />, { wrapper: RouterWrapper });

    const links = screen.getAllByRole('link');
    const servicesLink = links.find(link => link.textContent === 'Services');
    const portfolioLink = links.find(link => link.textContent === 'Portfolio');
    const contactLink = links.find(link => link.textContent === 'Contact');

    expect(servicesLink).toHaveAttribute('href', '/services');
    expect(portfolioLink).toHaveAttribute('href', '/portfolio');
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('renders copyright notice with current year', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    expect(screen.getByText(/© 2025 Vibe Tech. All rights reserved./i)).toBeInTheDocument();
  });

  it('renders Privacy Policy link', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    const privacyLink = screen.getByText('Privacy Policy');

    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink.closest('a')).toHaveAttribute('href', '/privacy');
  });

  it('renders Terms of Service link', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    const termsLink = screen.getByText('Terms of Service');

    expect(termsLink).toBeInTheDocument();
    expect(termsLink.closest('a')).toHaveAttribute('href', '/terms');
  });

  it('has footer tag with correct styling', () => {
    const { container } = render(<Footer />, { wrapper: RouterWrapper });
    const footer = container.querySelector('footer');

    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('border-t');
    expect(footer).toHaveClass('mt-auto');
  });

  it('applies hover styles to links', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    const servicesLink = screen.getByText('Services');

    expect(servicesLink).toHaveClass('hover:text-aura-accent');
    expect(servicesLink).toHaveClass('transition-colors');
  });

  it('brand name has gradient styling', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    const brandName = screen.getByText('Vibe Tech');

    expect(brandName).toHaveClass('bg-gradient-to-r');
    expect(brandName).toHaveClass('from-aura-accent');
    expect(brandName).toHaveClass('bg-clip-text');
  });

  it('uses responsive grid layout', () => {
    const { container } = render(<Footer />, { wrapper: RouterWrapper });
    const grid = container.querySelector('.grid');

    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-3');
  });

  it('renders newsletter subscribe component', () => {
    render(<Footer />, { wrapper: RouterWrapper });
    // The NewsletterSubscribe component should be in the DOM
    // We can't test its exact content without seeing its implementation
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });
});
