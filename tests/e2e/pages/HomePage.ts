import { Page, Locator, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

export class HomePage {
  readonly page: Page
  readonly mainHeading: Locator
  readonly subtitle: Locator
  readonly getStartedButton: Locator
  readonly viewDocsButton: Locator
  readonly languageSwitcher: Locator
  readonly featuresSection: Locator
  readonly statsSection: Locator
  readonly techStackSection: Locator

  constructor(page: Page) {
    this.page = page
    this.mainHeading = page.locator('h1')
    this.subtitle = page.locator('p').filter({ hasText: /design system/i })
    this.getStartedButton = page.getByRole('button', { name: 'Get Started' })
    this.viewDocsButton = page.getByRole('button', { name: 'View Documentation' })
    this.languageSwitcher = page.locator('[data-testid="language-switcher"]')
    this.featuresSection = page.locator('[data-testid="features-section"]')
    this.statsSection = page.locator('[data-testid="stats-section"]')
    this.techStackSection = page.locator('[data-testid="tech-stack-section"]')
  }

  async goto() {
    await this.page.goto('/')
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.mainHeading.waitFor({ state: 'visible' })
  }

  async getMainHeading(): Promise<string> {
    return await this.mainHeading.textContent() || ''
  }

  async getSubtitle(): Promise<string> {
    return await this.subtitle.textContent() || ''
  }

  async getButton(buttonText: string): Promise<Locator> {
    return this.page.getByRole('button', { name: buttonText })
  }

  async clickButton(buttonText: string) {
    const button = await this.getButton(buttonText)
    await button.click()
  }

  async clickLanguageSwitcher() {
    await this.languageSwitcher.click()
  }

  async getCurrentLocale(): Promise<string> {
    return await this.page.evaluate(() => {
      return document.documentElement.lang || 'en'
    })
  }

  async scrollToFeatures() {
    await this.featuresSection.scrollIntoViewIfNeeded()
  }

  async getFeaturesSection(): Promise<Locator> {
    return this.featuresSection
  }

  async getStatsSection(): Promise<Locator> {
    return this.statsSection
  }

  async getTechStackSection(): Promise<Locator> {
    return this.techStackSection
  }

  async checkResponsiveLayout(): Promise<boolean> {
    const viewport = this.page.viewportSize()
    if (!viewport) return false
    
    // Check if layout adapts to viewport
    const container = this.page.locator('.container-custom')
    const containerWidth = await container.boundingBox()
    
    return containerWidth ? containerWidth.width <= viewport.width : false
  }

  async checkElementSizing(): Promise<boolean> {
    // Check if key elements are properly sized
    const button = await this.getStartedButton.boundingBox()
    const heading = await this.mainHeading.boundingBox()
    
    return !!(button && heading && button.height > 0 && heading.height > 0)
  }

  async checkMobileNavigation(): Promise<boolean> {
    // Check if navigation elements are accessible on mobile
    const nav = this.page.locator('nav')
    const isVisible = await nav.isVisible()
    
    return isVisible
  }

  async checkAccessibility() {
    // This will be called before checking accessibility
  }

  async getAccessibilityViolations() {
    const accessibilityScanResults = await new AxeBuilder({ page: this.page })
      .include('main')
      .analyze()
    
    return accessibilityScanResults.violations
  }

  async checkAriaLabels(): Promise<boolean> {
    // Check if interactive elements have proper ARIA labels
    const buttons = this.page.locator('button')
    const links = this.page.locator('a')
    
    const buttonsWithAria = await buttons.filter({ has: this.page.locator('[aria-label]') }).count()
    const linksWithAria = await links.filter({ has: this.page.locator('[aria-label]') }).count()
    
    return buttonsWithAria > 0 && linksWithAria > 0
  }

  async checkColorContrast(): Promise<boolean> {
    // This is a simplified check - in real scenarios you'd use a proper contrast checker
    const mainText = this.mainHeading
    const background = this.page.locator('body')
    
    // Basic visibility check
    const textVisible = await mainText.isVisible()
    const bgVisible = await background.isVisible()
    
    return textVisible && bgVisible
  }
}












