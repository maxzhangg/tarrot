import { createContext, useContext, useState, useEffect } from "react";
import zh from "./zh.json";
import en from "./en.json";

const LanguageContext = createContext();
const langMap = { zh, en };

// 检测浏览器语言
function detectBrowserLang() {
  const lang = navigator.language || navigator.userLanguage;
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("en")) return "en";
  return "en"; // 默认 fallback
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("lang") || detectBrowserLang();
  });

  const t = (key) => langMap[lang][key] || key;

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
