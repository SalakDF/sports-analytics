import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "../i18n/locales/en";
import ua from "../i18n/locales/ua";

const STORAGE_KEY = "sports_analytics_language";

const resources = { en, ua };

const LanguageContext = createContext(null);

function getInitialLanguage() {
  if (typeof window === "undefined") return "ua";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "ua" || stored === "en") return stored;
  const browserLang = (navigator.language || "").toLowerCase();
  return browserLang.startsWith("uk") ? "ua" : "en";
}

function resolvePath(obj, path) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] != null ? acc[part] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language === "ua" ? "uk" : "en";
    }
  }, [language]);

  function setLanguage(next) {
    const safe = next === "en" ? "en" : "ua";
    setLanguageState(safe);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, safe);
    }
  }

  function t(key, fallback = key) {
    const value = resolvePath(resources[language], key);
    return typeof value === "string" ? value : fallback;
  }

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return ctx;
}
