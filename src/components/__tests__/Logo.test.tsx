import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Logo, LogoIcon } from '../Logo'

describe('Logo Component', () => {
  test('renders logo with default props', () => {
    render(<Logo />)
    const svg = screen.getByLabelText('Search Syntax Pro Logo')
    expect(svg).toBeInTheDocument()
    expect(svg.tagName.toLowerCase()).toBe('svg')
  })

  test('renders logo without text when showText is false', () => {
    render(<LogoIcon size={32} />)
    const svg = screen.getByLabelText('Search Syntax Pro Logo')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '650 600 1400 1550')
  })

  test('renders logo with custom size', () => {
    render(<Logo size={64} />)
    const svg = screen.getByLabelText('Search Syntax Pro Logo')
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64') // 1:1 aspect ratio
  })

  test('renders logo icon with custom size', () => {
    render(<LogoIcon size={64} />)
    const svg = screen.getByLabelText('Search Syntax Pro Logo')
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64')
  })

  test('applies custom className', () => {
    render(<Logo className="custom-class" />)
    const svg = screen.getByLabelText('Search Syntax Pro Logo')
    expect(svg).toHaveClass('custom-class')
  })

  test('has proper accessibility attributes', () => {
    render(<Logo />)
    const svg = screen.getByLabelText('Search Syntax Pro Logo')
    expect(svg).toHaveAttribute('aria-label', 'Search Syntax Pro Logo')
    expect(svg).toHaveAttribute('role', 'img')
  })

  test('renders text when showText is true', () => {
    render(<Logo size={100} showText={true} />)
    const svg = screen.getByLabelText('Search Syntax Pro Logo')
    expect(svg).toHaveAttribute('height', '100') // 1:1 aspect ratio
  })
})

describe('LogoIcon Component', () => {
  test('renders icon without text', () => {
    render(<LogoIcon />)
    const svg = screen.getByLabelText('Search Syntax Pro Logo')
    expect(svg).toHaveAttribute('viewBox', '650 600 1400 1550')
  })

  test('does not include text elements', () => {
    render(<LogoIcon />)
    const svg = screen.getByLabelText('Search Syntax Pro Logo')
    // Check that viewBox matches simpleLogo.svg
    expect(svg).toHaveAttribute('viewBox', '650 600 1400 1550')
    // Check that it doesn't have the height that would include text
    expect(svg).toHaveAttribute('height', '48')
  })
})