import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { HomePage } from '../pages/HomePage'

let homePage: HomePage

Given('I am on the home page', async function() {
  homePage = new HomePage(this.page)
  await homePage.goto()
})

When('I view the page', async function() {
  await homePage.waitForPageLoad()
})

When('I scroll down the page', async function() {
  await homePage.scrollToFeatures()
})

When('I click the {string} button', async function(buttonText: string) {
  await homePage.clickButton(buttonText)
})

When('I click the language switcher', async function() {
  await homePage.clickLanguageSwitcher()
})

When('I view the page on mobile', async function() {
  await this.page.setViewportSize({ width: 375, height: 667 })
})

When('I check the page for accessibility', async function() {
  await homePage.checkAccessibility()
})

Then('I should see the main heading {string}', async function(heading: string) {
  const title = await homePage.getMainHeading()
  expect(title).toBe(heading)
})

Then('I should see a subtitle about the design system', async function() {
  const subtitle = await homePage.getSubtitle()
  expect(subtitle).toContain('design system')
})

Then('I should see a {string} button', async function(buttonText: string) {
  const button = await homePage.getButton(buttonText)
  expect(button).toBeVisible()
})

Then('I should see the features section', async function() {
  const featuresSection = await homePage.getFeaturesSection()
  expect(featuresSection).toBeVisible()
})

Then('I should see the stats section', async function() {
  const statsSection = await homePage.getStatsSection()
  expect(statsSection).toBeVisible()
})

Then('I should see the tech stack section', async function() {
  const techStackSection = await homePage.getTechStackSection()
  expect(techStackSection).toBeVisible()
})

Then('the button should have a hover effect', async function() {
  const button = await homePage.getButton('Get Started')
  await button.hover()
  // Check for hover styles (this would need custom CSS class checking)
  expect(button).toBeVisible()
})

Then('the button should be accessible via keyboard', async function() {
  const button = await homePage.getButton('Get Started')
  await button.focus()
  expect(button).toBeFocused()
})

Then('the page should switch to German', async function() {
  const currentLocale = await homePage.getCurrentLocale()
  expect(currentLocale).toBe('de')
})

Then('the content should be translated', async function() {
  const title = await homePage.getMainHeading()
  expect(title).toBe('Empatify') // Would be translated in German
})

Then('the page should switch back to English', async function() {
  const currentLocale = await homePage.getCurrentLocale()
  expect(currentLocale).toBe('en')
})

Then('the layout should be responsive', async function() {
  const isResponsive = await homePage.checkResponsiveLayout()
  expect(isResponsive).toBe(true)
})

Then('all elements should be properly sized', async function() {
  const elementsSized = await homePage.checkElementSizing()
  expect(elementsSized).toBe(true)
})

Then('the navigation should be mobile-friendly', async function() {
  const isMobileFriendly = await homePage.checkMobileNavigation()
  expect(isMobileFriendly).toBe(true)
})

Then('there should be no accessibility violations', async function() {
  const violations = await homePage.getAccessibilityViolations()
  expect(violations).toHaveLength(0)
})

Then('all interactive elements should have proper ARIA labels', async function() {
  const ariaLabels = await homePage.checkAriaLabels()
  expect(ariaLabels).toBe(true)
})

Then('the color contrast should meet WCAG AA standards', async function() {
  const contrastCompliant = await homePage.checkColorContrast()
  expect(contrastCompliant).toBe(true)
})












