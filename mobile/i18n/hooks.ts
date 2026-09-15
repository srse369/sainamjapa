import { useMemo, useEffect, useState } from 'react';
import * as Localization from 'expo-localization';
import { translations, Locale, t as translate, TranslationKeys } from './translations';

const supportedLocales: Locale[] = ['en', 'es', 'hi'];

// FORCE LOCALE FOR TESTING - set to 'es' to test Spanish
const FORCE_LOCALE: Locale | null = null; // Change to 'es' to test

function getDeviceLocale(): Locale {
  // Allow forced locale for testing
  if (FORCE_LOCALE) {
    console.log('Using FORCED locale:', FORCE_LOCALE);
    return FORCE_LOCALE;
  }
  
  const locales = Localization.getLocales();
  console.log('=== Locale Debug ===');
  console.log('getLocales() raw:', JSON.stringify(locales, null, 2));
  
  const primaryLocale = locales[0]?.languageCode || 'en';
  console.log('Primary languageCode:', primaryLocale);
  
  const fullLocales = locales.map(l => l.languageTag || l.languageCode || '').filter(Boolean);
  console.log('Full locale tags:', fullLocales);
  
  if (supportedLocales.includes(primaryLocale as Locale)) {
    console.log('Matched primary:', primaryLocale);
    return primaryLocale as Locale;
  }
  
  for (const tag of fullLocales) {
    const langCode = tag.split('-')[0].split('_')[0];
    if (supportedLocales.includes(langCode as Locale)) {
      console.log('Matched from tag:', tag, '->', langCode);
      return langCode as Locale;
    }
  }
  
  console.log('Fallback to en');
  return 'en';
}

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>('en');
  
  useEffect(() => {
    const detected = getDeviceLocale();
    console.log('Detected locale:', detected);
    setLocale(detected);
  }, []);
  
  useEffect(() => {
    console.log('Current translation locale:', locale);
    console.log('Sample translation (dashboard.register):', translate(locale, 'dashboard.register'));
  }, [locale]);
  
  const t = useMemo(() => (key: string) => translate(locale, key), [locale]);
  
  return { t, locale, locales: supportedLocales };
}

export { translations, Locale, TranslationKeys };