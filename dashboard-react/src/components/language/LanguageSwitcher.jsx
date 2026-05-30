import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, ChevronDown } from "lucide-react";
import "./LanguageSwitcher.css";

const LANGUAGES = [
  { code: "en", label: "English", short: "EN", flag: "🇺🇸" },
  { code: "es", label: "Español", short: "ES", flag: "🇪🇸" },
];

export default function LanguageSwitcher({ variant = "default", compact = false }) {
  const { i18n, t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function changeLanguage(code) {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem("app_lang", code);
    } catch (_) {
      // ignore
    }
    setOpen(false);
  }

  return (
    <div className={`lang-switcher lang-switcher--${variant} ${open ? "is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="lang-switcher__btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("language.switch")}
        title={t("language.switch")}
      >
        <Globe size={16} className="lang-switcher__globe" />
        <span className="lang-switcher__flag" aria-hidden style={{ fontSize: "14px", marginLeft: "2px" }}>
          {current.flag}
        </span>
        {!compact && <span className="lang-switcher__label">{current.short}</span>}
        {!compact && <ChevronDown size={14} className="lang-switcher__chev" />}
      </button>

      {open && (
        <div className="lang-switcher__menu" role="menu">
          {LANGUAGES.map((lang) => {
            const active = lang.code === i18n.language;
            return (
              <button
                key={lang.code}
                type="button"
                role="menuitem"
                className={`lang-switcher__item ${active ? "is-active" : ""}`}
                onClick={() => changeLanguage(lang.code)}
              >
                <span className="lang-switcher__flag" aria-hidden>
                  {lang.flag}
                </span>
                <span className="lang-switcher__name">{lang.label}</span>
                {active && <Check size={14} className="lang-switcher__check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
