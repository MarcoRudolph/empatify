import type { Config } from "tailwindcss";

// Import tokens - use require for CommonJS compatibility in Tailwind config
const designTokens = require("./src/styles/tokens").default || require("./src/styles/tokens").designTokens;

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.primary,
        neutral: designTokens.colors.neutral,
        accent: designTokens.colors.accent,
        semantic: designTokens.colors.semantic
      },
      fontFamily: {
        sans: [designTokens.typography.fontFamily]
      },
      fontSize: {
        xs: [designTokens.typography.sizes.xs, { lineHeight: designTokens.typography.lineHeight.tight }],
        sm: [designTokens.typography.sizes.sm, { lineHeight: designTokens.typography.lineHeight.snug }],
        base: [designTokens.typography.sizes.base, { lineHeight: designTokens.typography.lineHeight.normal }],
        lg: [designTokens.typography.sizes.lg, { lineHeight: designTokens.typography.lineHeight.relaxed }],
        xl: [designTokens.typography.sizes.xl, { lineHeight: designTokens.typography.lineHeight.relaxed }],
        "2xl": [designTokens.typography.sizes["2xl"], { lineHeight: designTokens.typography.lineHeight.tight }],
        "3xl": [designTokens.typography.sizes["3xl"], { lineHeight: designTokens.typography.lineHeight.tight }],
        "4xl": [designTokens.typography.sizes["4xl"], { lineHeight: designTokens.typography.lineHeight.tight }],
        "5xl": [designTokens.typography.sizes["5xl"], { lineHeight: designTokens.typography.lineHeight.tight }]
      },
      fontWeight: {
        regular: designTokens.typography.weights.regular,
        medium: designTokens.typography.weights.medium,
        bold: designTokens.typography.weights.bold
      },
      letterSpacing: {
        tight: designTokens.typography.tracking.tight
      },
      borderRadius: {
        sm: designTokens.radius.sm,
        md: designTokens.radius.md,
        lg: designTokens.radius.lg,
        xl: designTokens.radius.xl,
        "2xl": designTokens.radius["2xl"],
        full: designTokens.radius.full
      },
      boxShadow: {
        sm: designTokens.shadow.sm,
        md: designTokens.shadow.md,
        lg: designTokens.shadow.lg,
        xl: designTokens.shadow.xl
      },
      spacing: {
        xxs: designTokens.spacing.xxs,
        xs: designTokens.spacing.xs,
        sm: designTokens.spacing.sm,
        md: designTokens.spacing.md,
        lg: designTokens.spacing.lg,
        xl: designTokens.spacing.xl,
        "2xl": designTokens.spacing["2xl"],
        "3xl": designTokens.spacing["3xl"]
      },
      maxWidth: {
        container: designTokens.layout.containerMaxWidth
      },
      minHeight: {
        button: designTokens.layout.buttonMinHeight
      },
      padding: {
        button: designTokens.layout.buttonPx,
        card: designTokens.layout.cardPadding,
        section: {
          desktop: designTokens.layout.sectionPaddingDesktopY,
          mobile: designTokens.layout.sectionPaddingMobileY
        }
      },
      gap: {
        grid: designTokens.layout.gridGap
      },
      transitionDuration: {
        fast: designTokens.motion.duration.fast,
        base: designTokens.motion.duration.base,
        slow: designTokens.motion.duration.slow
      },
      transitionTimingFunction: {
        standard: designTokens.motion.easing.standard
      }
    }
  },
  plugins: []
} satisfies Config;
