# Prompt para la IA — Preparar la app para la VERIFICACIÓN de Google OAuth (AuraDash)

> Repo AuraDash. Backend Node/Express/Prisma en Render (`https://dashboard-api-r6j9.onrender.com`), frontend React/Vite en Vercel con dominio `https://auradash.digital`. La conexión con Google Calendar muestra "Google no ha verificado esta aplicación" porque el proyecto OAuth no está verificado. Quiero dejar TODO listo en el código para poder enviar la app a verificación.

## Importante
La verificación final la hace Google (revisión manual) y requiere acciones mías en Google Cloud Console. Tú NO puedes enviar la verificación ni verificar el dominio. Tu tarea es preparar el código y los requisitos previos. Al final, dame la lista exacta de pasos manuales que me tocan.

## 1. Confirmar el lado OAuth (código)
- En `backend/src/services/googleService.js`, confirma que el único scope solicitado sea `https://www.googleapis.com/auth/calendar` (o `calendar.events`). NO debe haber scopes de Gmail ni otros restringidos.
- Confirma que el redirect sea ESTÁTICO (sin `/{slug}`): `${GOOGLE_REDIRECT_URI}` = `https://dashboard-api-r6j9.onrender.com/api/public/google/oauth-callback`. Verifica que la ruta exista en `public.routes.js` y que el callback identifique el negocio por `state`.

## 2. Crear las páginas legales (REQUISITO de Google para verificar)
Google exige, en un dominio verificable y accesibles públicamente sin login:
- **Página principal (Homepage)** que describa qué es AuraDash y qué hace.
- **Política de Privacidad** que explique CLARAMENTE: qué datos de Google se acceden (Google Calendar), para qué se usan (sincronizar citas del negocio), cómo se almacenan (tokens en la base de datos), que NO se comparten con terceros, y cómo el usuario puede revocar el acceso/borrar sus datos.
- **Términos de Servicio**.

Tareas:
- Crea estas 3 páginas como rutas públicas en el frontend (`dashboard-react`), accesibles sin iniciar sesión:
  - `https://auradash.digital/` (o una landing) — homepage.
  - `https://auradash.digital/privacidad` (privacy policy).
  - `https://auradash.digital/terminos` (terms).
- Asegúrate de que el router (Vercel SPA) sirva esas rutas correctamente (ya hay rewrite a index.html).
- Redacta el contenido de la Política de Privacidad incluyendo una sección específica de "Uso de datos de Google API" que cumpla con la "Google API Services User Data Policy" (mención de Limited Use). Texto en español, claro y real para AuraDash.
- Agrega enlaces a Privacidad y Términos en el footer de la app y de la landing.

## 3. Branding/consentimiento (dejar lo necesario en el repo)
- Asegura que exista un logo de la app en buena resolución (cuadrado, fondo no transparente) en el repo para subirlo a la pantalla de consentimiento.
- Documenta en un `README_VERIFICACION_GOOGLE.md` los valores que iré a pegar en Google Cloud:
  - App name, support email, logo.
  - Authorized domain: `auradash.digital`.
  - Homepage: `https://auradash.digital`
  - Privacy: `https://auradash.digital/privacidad`
  - Terms: `https://auradash.digital/terminos`
  - Scope: `.../auth/calendar`
  - Authorized redirect URI: `https://dashboard-api-r6j9.onrender.com/api/public/google/oauth-callback`

## Entregables
1. Confirmación del scope y redirect estático (con los archivos/líneas).
2. Las 3 páginas públicas creadas y enlazadas, con la Política de Privacidad cumpliendo la política de datos de Google.
3. `README_VERIFICACION_GOOGLE.md` con los valores y, al final, **la lista de pasos manuales que solo yo puedo hacer**: verificar dominio en Google Search Console, completar la pantalla de consentimiento, subir logo, poner el proyecto "En producción", agregar usuarios de prueba mientras tanto, y enviar a verificación.

## Criterio de aceptación
- `https://auradash.digital/privacidad` y `/terminos` cargan públicamente (sin login) y la política describe el uso de datos de Google Calendar.
- El proyecto solo pide el scope de Calendar con redirect estático.
- Tengo un README con todo lo que debo pegar/hacer en Google Cloud para enviar a verificación.
