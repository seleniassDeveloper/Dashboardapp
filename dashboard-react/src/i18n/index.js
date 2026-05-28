import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enLanding from "./locales/en/landing.json";
import enAuth from "./locales/en/auth.json";
import enNav from "./locales/en/nav.json";
import enDashboard from "./locales/en/dashboard.json";
import enViews from "./locales/en/views.json";
import enBooking from "./locales/en/booking.json";
import enAdmin from "./locales/en/admin.json";

import esCommon from "./locales/es/common.json";
import esLanding from "./locales/es/landing.json";
import esAuth from "./locales/es/auth.json";
import esNav from "./locales/es/nav.json";
import esDashboard from "./locales/es/dashboard.json";
import esViews from "./locales/es/views.json";
import esBooking from "./locales/es/booking.json";
import esAdmin from "./locales/es/admin.json";

const resources = {
  en: {
    common: enCommon,
    landing: enLanding,
    auth: enAuth,
    nav: enNav,
    dashboard: enDashboard,
    views: enViews,
    booking: enBooking,
    admin: enAdmin,
  },
  es: {
    common: esCommon,
    landing: esLanding,
    auth: esAuth,
    nav: esNav,
    dashboard: esDashboard,
    views: esViews,
    booking: esBooking,
    admin: esAdmin,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    defaultNS: "common",
    ns: ["common", "landing", "auth", "nav", "dashboard", "views", "booking", "admin"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "app_lang",
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
