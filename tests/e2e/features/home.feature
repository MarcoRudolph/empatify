Feature: Home Page
  As a user
  I want to visit the home page
  So that I can learn about Empatify

  Background:
    Given I am on the home page

  Scenario: View home page content
    When I view the page
    Then I should see the main heading "Empatify"
    And I should see a subtitle about the design system
    And I should see a "Get Started" button
    And I should see a "View Documentation" button

  Scenario: Navigate to different sections
    When I scroll down the page
    Then I should see the features section
    And I should see the stats section
    And I should see the tech stack section

  Scenario: Interact with primary CTA
    When I click the "Get Started" button
    Then the button should have a hover effect
    And the button should be accessible via keyboard

  Scenario: Language switching
    When I click the language switcher
    Then the page should switch to German
    And the content should be translated
    When I click the language switcher again
    Then the page should switch back to English

  Scenario: Responsive design
    When I view the page on mobile
    Then the layout should be responsive
    And all elements should be properly sized
    And the navigation should be mobile-friendly

  Scenario: Accessibility compliance
    When I check the page for accessibility
    Then there should be no accessibility violations
    And all interactive elements should have proper ARIA labels
    And the color contrast should meet WCAG AA standards
