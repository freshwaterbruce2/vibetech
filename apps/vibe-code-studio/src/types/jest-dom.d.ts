import '@testing-library/jest-dom'

declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void
      toBeVisible(): void
      toBeEmpty(): void
      toBeDisabled(): void
      toBeEnabled(): void
      toBeInvalid(): void
      toBeRequired(): void
      toBeValid(): void
      toContainElement(element: HTMLElement | null): void
      toContainHTML(html: string): void
      toHaveAttribute(attr: string, value?: string): void
      toHaveClass(...classNames: string[]): void
      toHaveFocus(): void
      toHaveFormValues(values: Record<string, any>): void
      toHaveStyle(css: string | Record<string, any>): void
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): void
      toHaveValue(value: string | string[] | number): void
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): void
      toBeChecked(): void
      toBePartiallyChecked(): void
      toHaveDescription(text: string | RegExp): void
      toHaveErrorMessage(text: string | RegExp): void
      toHaveAccessibleDescription(text: string | RegExp): void
      toHaveAccessibleName(text: string | RegExp): void
    }
  }
}

export {}