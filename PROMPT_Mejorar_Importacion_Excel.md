# Prompt para Antigravity — Mejorar la importación por Excel/CSV (AuraDash)

> Repo AuraDash. Backend Node/Express/Prisma en Render, frontend React/Vite en Vercel. Ya existe un importador en `dashboard-react/src/views/GoogleSheetsSyncView.jsx` (usa SheetJS `xlsx`, acepta `.xlsx`/`.xls`/`.csv` y Google Sheets, con detección y mapeo de columnas) y el backend lo procesa en `backend/src/routes/google.routes.js` (`POST /google/fetch-sheet` y `POST /google/import`) para las entidades `clients`, `services`, `workers`, `appointments`. TODO se filtra por `businessId` (multi-tenant). NO romper esa lógica existente.

## Objetivo
Hacer la importación por Excel más robusta y fácil para negocios reales que suben planillas "sucias" (muchas columnas que no usan, filas inválidas, formatos mezclados), como un export de clientes con columnas: `cantidad_*`, `fn`, `ln`, `email`, `country`, `phone`, `fecha_na`, `monto_v`, `dias_desc`, `ultimo_T...`. El usuario solo debe mapear lo necesario (nombre, apellido, email, teléfono) e ignorar el resto sin errores.

## Cambios requeridos

### 1. Plantillas oficiales descargables (.xlsx)
- Agrega en la pantalla de importación un botón **"Descargar plantilla"** por entidad (Clientes, Servicios, Profesionales, Citas).
- Cada plantilla `.xlsx` debe traer la fila de encabezados con los nombres de campo esperados y 1-2 filas de ejemplo. Genérala en el frontend con SheetJS (`XLSX.utils`), sin pedir nada al backend.
- Campos mínimos por plantilla:
  - Clientes: `nombre`, `apellido`, `email`, `telefono`, `notas`.
  - Servicios: `nombre`, `precio`, `duracion_min`, `descripcion`.
  - Profesionales: `nombre`, `apellido`, `email`, `telefono`, `rol`.
  - Citas: `cliente`, `telefono`, `email`, `servicio`, `profesional`, `fecha`, `hora`, `precio`, `estado`, `notas`.

### 2. Manejo robusto de planillas "sucias"
- El mapeo ya permite ignorar columnas; asegúrate de que las columnas NO mapeadas simplemente se omitan (o se guarden como notas/campos personalizados) sin romper la importación.
- Salta filas inválidas sin abortar todo: fila sin el campo requerido (p. ej. cliente sin nombre) → se cuenta como "omitida", no detiene el proceso.
- Normaliza datos comunes: recorta espacios, normaliza teléfonos (deja solo dígitos y `+`), valida formato de email (si es inválido, deja el cliente pero sin email o márcalo en notas), parsea fechas en formatos `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`.
- Deduplicación: para clientes, no dupliques por email o teléfono ya existente en ese `businessId` (ya hay algo de esto; verifícalo y reúsalo).

### 3. Resumen claro de resultados
- Al terminar, muestra un resumen legible: **Creados / Reutilizados (duplicados) / Omitidos por error**, y para los omitidos, un detalle por fila (número de fila + motivo) en una tabla o lista descargable.
- Maneja archivos grandes: procesa por lotes en el backend para no exceder tiempos (evitar timeouts en Render); si hace falta, importa en bloques.

### 4. UX
- Vista previa de las primeras 10 filas con el mapeo aplicado antes de confirmar la importación.
- Soporta `.xlsx`, `.xls`, `.csv` y link de Google Sheets (ya existe); confirma que el upload de Excel funcione end-to-end.
- Mensaje claro si el negocio no tiene el módulo habilitado por plan (el módulo "Planillas Sheets" hoy está restringido a BIZ; respeta esa regla).

## Entregables
1. Botón "Descargar plantilla" (.xlsx) por entidad, generado en el frontend.
2. Importación robusta: ignora columnas no mapeadas, salta filas inválidas, normaliza teléfonos/fechas/emails, deduplica clientes por email/teléfono.
3. Resumen final Creados/Reutilizados/Omitidos con detalle de errores por fila.
4. Procesamiento por lotes para archivos grandes (sin timeouts).
5. Vista previa con mapeo antes de confirmar.

## Criterios de aceptación
- Puedo subir un Excel "sucio" (como un export de clientes con muchas columnas extra), mapear solo nombre/apellido/email/teléfono e importar sin errores.
- Las filas inválidas se omiten con un motivo claro; el resto se importa.
- No se crean clientes duplicados.
- Todo queda guardado en las tablas del negocio correcto (`businessId`), sin mezclarse con otros.
- Puedo descargar una plantilla oficial por entidad.
