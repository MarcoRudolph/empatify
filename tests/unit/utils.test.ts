import { describe, it, expect } from 'vitest'
import { designTokens } from '@/styles/tokens'

describe('Design Tokens', () => {
  it('should export primary colors', () => {
    expect(designTokens.colors.primary).toBeDefined()
    expect(designTokens.colors.primary[500]).toBe('#FF6B00')
    expect(designTokens.colors.primary[600]).toBe('#E65F00')
  })

  it('should export neutral colors', () => {
    expect(designTokens.colors.neutral).toBeDefined()
    expect(designTokens.colors.neutral[50]).toBe('#0F0F0F')
    expect(designTokens.colors.neutral[900]).toBe('#FFFFFF')
  })

  it('should export spacing tokens', () => {
    expect(designTokens.spacing).toBeDefined()
    expect(designTokens.spacing.md).toBe('16px')
    expect(designTokens.spacing.lg).toBe('24px')
  })

  it('should export typography tokens', () => {
    expect(designTokens.typography).toBeDefined()
    expect(designTokens.typography.fontFamily).toContain('Inter')
    expect(designTokens.typography.weights.bold).toBe('700')
  })
})

describe('Token Validation', () => {
  it('should have consistent color values', () => {
    const primary500 = designTokens.colors.primary[500]
    expect(primary500).toMatch(/^#[0-9A-F]{6}$/i)
  })

  it('should have valid spacing values', () => {
    Object.values(designTokens.spacing).forEach(spacing => {
      expect(spacing).toMatch(/^\d+px$/)
    })
  })
})
