import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  translations,
  type Language,
  type TranslationKey,
} from "./data/translations";

type Params = Record<string, string | number>;
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Params) => string;
  translateData: (text: string) => string;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "front-row-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "th";
    } catch {
      return "th";
    }
  });
  const t = (key: TranslationKey, params: Params = {}) =>
    translations[language][key].replace(
      /\{(\w+)\}/g,
      (placeholder, name: string) =>
        params[name] === undefined ? placeholder : String(params[name]),
    );
  // Localize presentation only: the public selection API remains independent of locale.
  function translateData(text: string): string {
    if (Object.hasOwn(translations.en, text)) return t(text as TranslationKey);
    const connection =
      /^(.*): (shared phone number|shared device ID|shared payment account)$/.exec(
        text,
      );
    return connection
      ? `${connection[1]}: ${t(connection[2] as TranslationKey)}`
      : text;
  }
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t("Front Row Upgrade Queue");
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* Storage may be disabled. */
    }
  }, [language]);
  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t, translateData }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
