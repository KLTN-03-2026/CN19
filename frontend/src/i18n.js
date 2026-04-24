import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import các file ngôn ngữ Tiếng Anh
import enBlog from './locales/enBlog';
import enEvent from './locales/enEvent';
import enMarketplace from './locales/enMarketplace';
import enMerchandise from './locales/enMerchandise';
import enMyEvent from './locales/enMyEvent';
import enSupport from './locales/enSupport';
import enMyTransaction from './locales/enMyTransaction';
import enMyRevenue from './locales/enMyRevenue';

// Import các file ngôn ngữ Tiếng Việt
import vnBlog from './locales/vnBlog';
import vnEvent from './locales/vnEvent';
import vnMarketplace from './locales/vnMarketplace';
import vnMerchandise from './locales/vnMerchandise';
import vnMyEvent from './locales/vnMyEvent';
import viSupport from './locales/viSupport';
import vnMyTransaction from './locales/vnMyTransaction';
import vnMyRevenue from './locales/vnMyRevenue';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          ...enBlog,
          ...enEvent,
          ...enMarketplace,
          ...enMerchandise,
          ...enMyEvent,
          ...enSupport,
          ...enMyTransaction,
          ...enMyRevenue
        }
      },
      vi: {
        translation: {
          ...vnBlog,
          ...vnEvent,
          ...vnMarketplace,
          ...vnMerchandise,
          ...vnMyEvent,
          ...viSupport,
          ...vnMyTransaction,
          ...vnMyRevenue
        }
      }
    },
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
