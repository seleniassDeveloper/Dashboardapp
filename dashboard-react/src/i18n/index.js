/**
 * Implementación propia de i18n compatible con la API de react-i18next.
 *
 * No requiere instalar ningún paquete (i18next, react-i18next,
 * i18next-browser-languagedetector). Los aliases en vite.config.js hacen
 * que las importaciones existentes (`useTranslation`, `Trans`, etc.) sigan
 * funcionando sin cambios.
 *
 * API soportada:
 *   - useTranslation(ns?)
 *   - Trans (con `i18nKey`, `components`, `values`)
 *   - i18n.t / i18n.changeLanguage / i18n.language
 *   - i18n.use(...).init(...)  (no-ops, sólo para compat)
 *   - initReactI18next, LanguageDetector  (no-ops, sólo para compat)
 *
 * Soporta:
 *   - namespaces ("ns:path.to.key")
 *   - interpolación "{{varName}}"
 *   - opción { defaultValue }
 *   - persistencia en localStorage
 *   - detección del idioma del navegador
 */

import React, { useEffect, useMemo, useState } from "react";

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

const STORAGE_KEY = "app_lang";
const SUPPORTED = ["en", "es"];
const FALLBACK = "en";
const DEFAULT_NS = "common";

function detectInitialLanguage() {
  try {
    const saved = typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  try {
    const navLang = (typeof navigator !== "undefined" && navigator.language) || "";
    const short = navLang.slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(short)) return short;
  } catch {
    /* ignore */
  }
  return FALLBACK;
}

let currentLang = detectInitialLanguage();
const listeners = new Set();

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener(currentLang);
    } catch {
      /* ignore listener errors */
    }
  }
}

function lookupKey(lang, ns, path) {
  let node = resources[lang]?.[ns];
  if (!node) return undefined;
  for (const part of String(path).split(".")) {
    if (node == null || typeof node !== "object") return undefined;
    node = node[part];
  }
  return node;
}

function interpolate(str, vars) {
  if (typeof str !== "string") return str;
  if (!vars) return str;
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : match
  );
}

function translate(key, opts, defaultNs) {
  if (typeof key !== "string") return key;

  let ns = defaultNs || DEFAULT_NS;
  let path = key;
  const colonIdx = key.indexOf(":");
  if (colonIdx !== -1) {
    ns = key.slice(0, colonIdx);
    path = key.slice(colonIdx + 1);
  }

  let val = lookupKey(currentLang, ns, path);
  if (val === undefined && currentLang !== FALLBACK) {
    val = lookupKey(FALLBACK, ns, path);
  }
  if (val === undefined) {
    if (typeof opts === "string") {
      return opts;
    }
    if (opts && typeof opts === "object" && opts.defaultValue !== undefined) {
      val = opts.defaultValue;
    }
  }
  if (val === undefined) {
    return key;
  }

  return interpolate(val, typeof opts === "object" ? opts : undefined);
}

// --- i18n core object (default export) ---------------------------------------
const i18n = {
  get language() {
    return currentLang;
  },
  set language(lang) {
    this.changeLanguage(lang);
  },
  get languages() {
    return [currentLang, FALLBACK];
  },
  changeLanguage(lang) {
    if (!SUPPORTED.includes(lang)) {
      return Promise.resolve(currentLang);
    }
    currentLang = lang;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, lang);
      }
    } catch {
      /* ignore */
    }
    notifyListeners();
    return Promise.resolve(currentLang);
  },
  t(key, opts) {
    return translate(key, opts);
  },
  use() {
    return this;
  },
  init() {
    return Promise.resolve(this);
  },
  on() {},
  off() {},
};

export default i18n;

// --- react-i18next compatibility exports -------------------------------------
export const initReactI18next = { type: "3rdParty", init() {} };
export const LanguageDetector = { type: "languageDetector", init() {} };

export function useTranslation(ns) {
  // Tick counter that increments whenever the language changes — used both to
  // trigger re-renders and as a `useMemo` dependency so `t` stays referentially
  // stable across renders that DON'T involve a language change.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Resolve default namespace as a primitive (string) so `useMemo` can compare it
  // shallowly even if the caller passes a fresh array literal on every render.
  const defaultNs = Array.isArray(ns)
    ? ns[0] || DEFAULT_NS
    : ns || DEFAULT_NS;

  // `t` keeps the same reference across renders unless the namespace or the
  // active language changes. This matches react-i18next's behaviour and is
  // critical for callers that put `t` in dependency arrays of useEffect /
  // useCallback / useMemo (otherwise you get infinite re-render loops).
  const t = useMemo(
    () => (key, opts) => translate(key, opts, defaultNs),
    [defaultNs, tick]
  );

  return { t, i18n, ready: true };
}

export function Trans({ i18nKey, components, values, children, defaults }) {
  const { t } = useTranslation();
  const opts = values ? { ...values } : {};
  if (defaults !== undefined) opts.defaultValue = defaults;
  const text = t(i18nKey, opts);

  if (typeof text !== "string") {
    return text == null ? null : React.createElement(React.Fragment, null, text);
  }

  const comps = components || {};
  const parts = [];
  const regex = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let lastIndex = 0;
  let match;
  let counter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, tagName, inner] = match;
    const component = comps[tagName];
    if (component && React.isValidElement(component)) {
      parts.push(React.cloneElement(component, { key: `tr-${counter++}` }, inner));
    } else {
      // Tag without matching component → render inner text only
      parts.push(inner);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return React.createElement(React.Fragment, null, ...parts);
}

// `withTranslation` HOC stub (rarely used; included for full compat)
export function withTranslation(ns) {
  return function wrap(Component) {
    return function Wrapped(props) {
      const { t, i18n: i18nRef } = useTranslation(ns);
      return React.createElement(Component, { ...props, t, i18n: i18nRef, tReady: true });
    };
  };
}

// `I18nextProvider` stub (the provider is no-op since state is module-global)
export function I18nextProvider({ children }) {
  return children;
}
