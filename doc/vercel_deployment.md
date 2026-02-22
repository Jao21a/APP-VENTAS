# Guía de Despliegue en Vercel para HAMMEO

Para lanzar HAMMEO a producción con Vercel, sigue estos pasos:

## 1. Conectar tu repositorio a Vercel
1. Entra a [Vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **Add New -> Project**.
3. Importa el repositorio de `Web_ventas` (HAMMEO).

## 2. Configuración del Proyecto en Vercel
Vercel detectará automáticamente que es un proyecto de Vite/React.
* **Framework Preset**: Vite
* **Build Command**: `npm run build`
* **Output Directory**: `dist`

## 3. Variables de Entorno (¡CRÍTICO!)
Abre la sección **Environment Variables** antes de darle a Deploy y agrega tus claves de Supabase. A diferencia de tu `.env` local, en Vercel debes configurarlas aquí por seguridad:

* **Name:** `VITE_SUPABASE_URL`
  **Value:** `https://amipzfhuogzqwkvolppe.supabase.co`

* **Name:** `VITE_SUPABASE_ANON_KEY`
  **Value:** `eyJhbGciOiJI...tu_token_largo...js`

Haz clic en **Add** para cada una.

## 4. Desplegar
Haz clic en el botón grande **Deploy**. Vercel construirá tu aplicación PWA y te dará una URL en vivo (puedes configurar un dominio personalizado gratis en Vercel más adelante).

## ¿Para qué sirve el archivo `vercel.json` incluido?
He generado un archivo `vercel.json` en la raíz de tu proyecto. Este archivo le dice a Vercel:
1. **Enrutamiento SPA**: Que redirija todas las rutas al `index.html` (para que React Router funcione si lo usas y no dé error 404 al recargar).
2. **Caché Agresivo**: Que almacene en caché las imágenes (`.webp`, `.png`) y archivos compilados (`.js`, `.css`) por un año para que la app cargue súper rápido en Puerto Maldonado.
3. **PWA Fresca**: Le prohíbe a Vercel cachear el `sw.js` (Service Worker) para garantizar que si lanzas una actualización, a los usuarios les llegue la notificación al instante.
