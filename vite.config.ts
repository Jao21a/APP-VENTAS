import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                // Almacenar en caché estático todo el JS, CSS, HTML e imágenes (incluyendo logo)
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
                runtimeCaching: [
                    // Configuración clave: Interceptar peticiones a Supabase para funcionalidad Offline
                    {
                        // Reemplaza con tu URL real si cambia
                        urlPattern: /^https:\/\/amipzfhuogzqwkvolppe\.supabase\.co\/rest\/v1\/.*/i,
                        // 'NetworkFirst' intentará ir a internet y si falla, sirve desde el caché
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'supabase-api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 3 // Mantener la data por 3 días máximo offline
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            },
                            // Configuración Súper Importante: Background Sync para mutaciones (ventas, cambios de estado)
                            // Si falla la conexión al enviar un POST/PATCH, se guarda en la cola y se reintenta luego
                            backgroundSync: {
                                name: 'supabase-mutations-queue',
                                options: {
                                    maxRetentionTime: 24 * 60 // Reintentar hasta por 24 horas cuando regrese Internet
                                }
                            }
                        }
                    }
                ]
            },
            manifest: {
                name: 'HAMMEO PWA',
                short_name: 'HAMMEO',
                description: 'Sistema de Gestión de Ventas de Alitas',
                theme_color: '#4A0E0E', // Color Guinda
                background_color: '#F39C12', // Color Naranja
                display: 'standalone', // Hace que se vea como app nativa en el iPhone sin barra de navegador
                orientation: 'portrait',
                icons: [
                    {
                        // Es necesario que coloques la imagen del logo HAMMEO llamada así en la carpeta /public
                        src: '/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable' // Excelente para el redondeo de iconos de iOS
                    }
                ]
            }
        })
    ]
});
