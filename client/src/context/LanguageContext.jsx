import React, { createContext, useContext, useState, useEffect } from 'react';
import mr from '../locales/mr.json';
import hi from '../locales/hi.json';
import en from '../locales/en.json';

const translations = { mr, hi, en };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('ganpati_mandal_lang') || 'mr';
  });

  useEffect(() => {
    localStorage.setItem('ganpati_mandal_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (keyPath, fallback = '') => {
    if (!keyPath) return fallback;
    const keys = keyPath.split('.');
    let current = translations[lang] || translations.mr;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to Marathi if key missing in current language
        let mrCurrent = translations.mr;
        for (const mrKey of keys) {
          if (mrCurrent && typeof mrCurrent === 'object' && mrKey in mrCurrent) {
            mrCurrent = mrCurrent[mrKey];
          } else {
            return fallback || keyPath;
          }
        }
        return mrCurrent || fallback || keyPath;
      }
    }

    return current || fallback || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
