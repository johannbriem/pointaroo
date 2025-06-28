import { useTheme } from "./ThemeContext";
import { useTranslation } from "react-i18next";

export default function ThemeSelector() {
  const { theme, setTheme, uiMode } = useTheme();
  const { t } = useTranslation();

  if (uiMode !== "kid") return null;

  const kidThemes = [
    { id: "space", label: t("navbar.spaceTheme") },
    { id: "jungle", label: t("navbar.jungleTheme") },
    { id: "robot", label: t("navbar.robotTheme") },
    { id: "ocean", label: t("navbar.oceanTheme") },
  ];

  return (
    <div className="flex flex-col gap-2 mt-4">
      <span className="text-sm font-semibold text-[var(--color-navbar-text)]">
        {t("navbar.kidThemes")}
      </span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md text-black bg-[var(--color-navbar-hover-bg)]"
      >
        {kidThemes.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
