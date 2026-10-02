import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isUrdu: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.home': { en: 'Home', ur: 'ہوم' },
  'nav.categories': { en: 'Services', ur: 'سروسز' },
  'nav.workers': { en: 'Find Workers', ur: 'کاریگر تلاش کریں' },
  'nav.post_job': { en: 'Post a Job', ur: 'کام لگائیں' },
  'nav.how_it_works': { en: 'How It Works', ur: 'طریقہ کار' },
  'nav.support': { en: 'Support', ur: 'رابطہ و مدد' },
  'nav.login': { en: 'Sign In', ur: 'لاگ ان' },
  'nav.register_worker': { en: 'Join as Worker', ur: 'کاریگر بنیں' },
  'nav.customer_dashboard': { en: 'My Account', ur: 'میرا اکاؤنٹ' },
  'nav.worker_dashboard': { en: 'Worker Panel', ur: 'کاریگر ڈیش بورڈ' },
  'nav.admin_dashboard': { en: 'Admin Panel', ur: 'ایڈمن پینل' },
  'nav.logout': { en: 'Sign Out', ur: 'لاگ آؤٹ' },

  // Hero
  'hero.tagline': { en: 'Pakistan\'s Most Trusted Home & Local Services Marketplace', ur: 'پاکستان کا سب سے معتبر اور آسان ہوم سروس پلیٹ فارم' },
  'hero.search_placeholder': { en: 'Search 50+ services (e.g. Plumber, AC Repair, Electrician)...', ur: 'کوئی بھی سروس تلاش کریں (مثلاً پلمبر، اے سی مرمت، الیکٹریشن)...' },
  'hero.city_placeholder': { en: 'Select City', ur: 'شہر منتخب کریں' },
  'hero.popular': { en: 'Popular Services', ur: 'مشہور سروسز' },
  'hero.find_worker_btn': { en: 'Find Worker', ur: 'کاریگر تلاش کریں' },
  'hero.post_job_btn': { en: 'Post Custom Job', ur: 'مطلوبہ کام لگائیں' },

  // Trust badges
  'badge.verified_workers': { en: '100% CNIC Verified Workers', ur: 'مکمل شناختی کارڈ سے تصدیق شدہ کاریگر' },
  'badge.safe_payment': { en: 'Company Protected Payments', ur: 'فرسٹ اسٹیپ کے ذریعے محفوظ ادائیگی' },
  'badge.support': { en: 'Live Helpline: 03209976716', ur: 'لائیو ہیلپ لائن: 03209976716' },

  // Buttons
  'btn.book_now': { en: 'Book Worker', ur: 'ابھی بک کریں' },
  'btn.view_profile': { en: 'View Profile', ur: 'پروفائل دیکھیں' },
  'btn.send_offer': { en: 'Send Offer', ur: 'آفر بھیجیں' },
  'btn.available': { en: 'Available Now', ur: 'دستیاب ہے' },
  'btn.off_today': { en: 'Off Today', ur: 'آج چھٹی پر' },
  'btn.busy': { en: 'Busy on Job', ur: 'کام میں مصروف' }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key, fallback) => fallback || key,
  isUrdu: false
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('firststep_lang') as Language) || 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('firststep_lang', newLang);
    document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string, fallback?: string): string => {
    if (translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isUrdu: lang === 'ur' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
