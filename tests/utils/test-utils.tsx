import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/messages/en.json'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextIntlClientProvider messages={messages} locale="en">
      {children}
    </NextIntlClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Test data helpers
export const createMockUser = () => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg'
})

export const createMockDesignTokens = () => ({
  colors: {
    primary: {
      500: '#FF6B00',
      600: '#E65F00'
    },
    neutral: {
      50: '#0F0F0F',
      100: '#1A1A1A',
      900: '#FFFFFF'
    }
  },
  spacing: {
    md: '16px',
    lg: '24px'
  }
})

// Accessibility testing helpers
export const expectToBeAccessible = async (container: HTMLElement) => {
  const { axe } = await import('axe-core')
  const results = await axe(container)
  expect(results.violations).toHaveLength(0)
}

// Form testing helpers
export const fillFormField = async (name: string, value: string) => {
  const input = screen.getByRole('textbox', { name })
  await userEvent.type(input, value)
}

export const submitForm = async (submitButtonText: string) => {
  const submitButton = screen.getByRole('button', { name: submitButtonText })
  await userEvent.click(submitButton)
}












