import tokens from './tokens.json';

// Helper functions for type-safe token access
const c = (p: string) => (tokens as any).props.color[p];
const t = (p: string) => (tokens as any).props.typography[p];
const r = (p: string) => (tokens as any).props.radius[p].value;
const s = (p: string) => (tokens as any).props.spacing[p].value;
const l = (p: string) => (tokens as any).props.layout[p].value;
const sh = (p: string) => (tokens as any).props.shadow[p].value;

// Export tokens for use in components
export const designTokens = {
  colors: {
    primary: {
      50: c("primary")["50"].value,
      100: c("primary")["100"].value,
      500: c("primary")["500"].value,
      600: c("primary")["600"].value,
      900: c("primary")["900"].value
    },
    neutral: {
      50: c("neutral")["50"].value,
      75: c("neutral")["75"].value,
      100: c("neutral")["100"].value,
      200: c("neutral")["200"].value,
      300: c("neutral")["300"].value,
      400: c("neutral")["400"].value,
      500: c("neutral")["500"].value,
      700: c("neutral")["700"].value,
      800: c("neutral")["800"].value,
      900: c("neutral")["900"].value
    },
    accent: {
      blue: c("accent")["blue"].value
    },
    semantic: {
      bg: c("semantic")["bg"].value,
      surface: c("semantic")["surface"].value,
      border: c("semantic")["border"].value,
      text: c("semantic")["text"].value,
      mutedText: c("semantic")["mutedText"].value,
      link: c("semantic")["link"].value,
      focusRing: c("semantic")["focusRing"].value
    }
  },
  typography: {
    fontFamily: t("fontFamily").value,
    weights: {
      regular: t("weights")["regular"].value,
      medium: t("weights")["medium"].value,
      bold: t("weights")["bold"].value
    },
    sizes: {
      xs: t("size")["xs"].value,
      sm: t("size")["sm"].value,
      base: t("size")["base"].value,
      lg: t("size")["lg"].value,
      xl: t("size")["xl"].value,
      "2xl": t("size")["2xl"].value,
      "3xl": t("size")["3xl"].value,
      "4xl": t("size")["4xl"].value,
      "5xl": t("size")["5xl"].value
    },
    lineHeight: {
      tight: t("lineHeight")["tight"].value,
      snug: t("lineHeight")["snug"].value,
      normal: t("lineHeight")["normal"].value,
      relaxed: t("lineHeight")["relaxed"].value
    },
    tracking: {
      tight: t("tracking")["tight"].value
    }
  },
  radius: {
    sm: r("sm"),
    md: r("md"),
    lg: r("lg"),
    xl: r("xl"),
    "2xl": r("2xl"),
    full: r("full")
  },
  shadow: {
    sm: sh("sm"),
    md: sh("md"),
    lg: sh("lg"),
    xl: sh("xl")
  },
  spacing: {
    xxs: s("xxs"),
    xs: s("xs"),
    sm: s("sm"),
    md: s("md"),
    lg: s("lg"),
    xl: s("xl"),
    "2xl": s("2xl"),
    "3xl": s("3xl")
  },
  layout: {
    containerMaxWidth: l("containerMaxWidth"),
    sectionPaddingDesktopY: l("sectionPaddingDesktopY"),
    sectionPaddingMobileY: l("sectionPaddingMobileY"),
    gridGap: l("gridGap"),
    avatarSize: l("avatarSize"),
    buttonMinHeight: l("buttonMinHeight"),
    buttonPx: l("buttonPx"),
    cardPadding: l("cardPadding"),
    cardRadius: l("cardRadius")
  },
  motion: {
    duration: {
      fast: (tokens as any).props.motion.duration.fast.value,
      base: (tokens as any).props.motion.duration.base.value,
      slow: (tokens as any).props.motion.duration.slow.value
    },
    easing: {
      standard: (tokens as any).props.motion.easing.standard.value
    }
  }
};

export default designTokens;
