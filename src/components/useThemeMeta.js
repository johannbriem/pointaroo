// src/components/useThemeMeta.js
import kidThemeStyles from "../data/themeStyles";

export default function useThemeMeta(theme = "space") {
  return kidThemeStyles[theme] || kidThemeStyles.space;
}
