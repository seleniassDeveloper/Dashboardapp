# i18n — Sistema de internacionalización (EN / ES)

Este proyecto usa **react-i18next** para soportar inglés y español.

## Instalación (una sola vez)

Después de hacer `git pull`, instalá las nuevas dependencias:

```bash
cd dashboard-react
npm install
```

Las dependencias agregadas a `package.json` son:

- `i18next`
- `react-i18next`
- `i18next-browser-languagedetector`

## Estructura

```
src/i18n/
├── index.js                  ← configuración de i18next
├── locales/
│   ├── en/
│   │   ├── common.json       ← botones, labels, errores genéricos
│   │   ├── landing.json      ← página pública
│   │   ├── auth.json         ← login, registro, recuperar clave
│   │   ├── nav.json          ← menús, sidebar, topbar
│   │   ├── dashboard.json    ← panel principal y KPIs
│   │   ├── views.json        ← vistas Clients/Services/Team/Finances/…
│   │   ├── booking.json      ← páginas públicas de reservas
│   │   └── admin.json        ← admin (usuarios, marca, módulos)
│   └── es/  (mismas claves, traducidas)
```

El idioma se detecta del navegador y se persiste en `localStorage` bajo la clave `app_lang`. El idioma por defecto es **inglés**.

## Cómo usarlo en un componente

```jsx
import { useTranslation } from "react-i18next";

export default function MyComponent() {
  // Cargo uno o varios namespaces
  const { t } = useTranslation(["views", "common"]);

  return (
    <>
      <h1>{t("clients.title")}</h1>
      <button>{t("common:actions.save")}</button>
    </>
  );
}
```

### Con interpolación

```jsx
t("clients.pagination", { from: 1, to: 10, total: 42 })
// "Showing 1 to 10 of 42 clients"
```

### Con HTML embebido

```jsx
import { Trans } from "react-i18next";

<Trans
  i18nKey="views:settings.workflowHint.p1"
  components={{ strong: <strong />, code: <code /> }}
/>
```

### Fuera de React (utilidades, providers no React)

```js
import i18n from "../i18n";
const msg = i18n.t("auth:errors.firebase.invalidCredential");
```

## Selector de idioma

El componente `<LanguageSwitcher />` (en `components/language/`) muestra el selector con banderas EN/ES. Ya está montado en:

- `TopBar` (interior de la app)
- `LandingPage` (header público)
- `LoginScreen` (esquina superior derecha)
- `PublicBookingPage` (encima del header del negocio)

Cuando el usuario cambia idioma, se guarda en `localStorage` y persiste entre sesiones.

## Cómo agregar nuevas strings

1. Agregá la clave en el archivo EN correspondiente: `src/i18n/locales/en/<ns>.json`
2. Agregá la misma clave traducida en ES: `src/i18n/locales/es/<ns>.json`
3. Usá `t("ns:key")` o `useTranslation("ns")` + `t("key")` en el componente.

> Consejo: mantené las claves balanceadas entre EN/ES. Podés verificarlo con:
> ```bash
> python3 -c "import json; en=set(); es=set(); ..."
> ```

## Qué queda por traducir

El setup está completo y las pantallas más visibles ya están traducidas (landing, auth, header, sidebar, dashboard, vistas principales, páginas de reservas públicas). Los siguientes componentes todavía tienen strings hardcodeadas en español y se pueden ir migrando con el mismo patrón:

- `components/configurable-fields/*` — editores de catálogo/asignación
- `components/dashboard/widgets/*` — widgets internos del dashboard
- `components/finance/*` — submódulos financieros
- `components/inventory/*` — submódulos de inventario
- `components/workflows/*` — builder de workflows
- `gadgets/appointments/*` — modales y listas de citas
- `header/clients/*`, `header/workers/*`, `header/services/*` — modales ABM
- `views/GoogleSheetsSyncView.jsx` — sección de sincronización
- `admin/UsersAdminModal.jsx` — modal de admin

El patrón es el mismo: importar `useTranslation`, reemplazar strings literales por `t("ns:key")`, y agregar las claves en EN/ES.
