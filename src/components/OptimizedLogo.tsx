import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
    className?: string;
    width?: number | string;
}

export function OptimizedLogo({ className = '', width = '100%' }: Props) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width }}>
            {/* Placeholder o Esqueleto mientras carga (mejora UX en conexiones 4G muy lentas) */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-orange-100 rounded-full animate-pulse flex items-center justify-center">
                    <span className="text-[#F39C12] font-black text-xs">HAMMEO</span>
                </div>
            )}

            {/* Imagen del Logo con etiqueta picture para formato moderno WebPFallback */}
            {/* IMPORTANTE: Debes convertir tu logo a WebP y PNG y guardarlos en /public */}
            <motion.picture
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.9 }}
                transition={{ duration: 0.3 }}
                className="w-full h-auto drop-shadow-lg"
            >
                {/* Intenta WebP primero (super ligero) */}
                <source srcSet="/logo.webp" type="image/webp" />
                {/* Fallback a PNG si el navegador (iOS muy antiguo) no soporta WebP */}
                <img
                    src="/logo.png"
                    alt="HAMMEO Alitas"
                    className="w-full h-auto object-contain"
                    onLoad={() => setIsLoaded(true)}
                    // Atributos clave de rendimiento
                    loading="eager" // eagerness porque es LCP (Largest Contentful Paint) si está arriba
                    fetchPriority="high" // Le dice al navegador de iPhone que lo descargue ya
                />
            </motion.picture>
        </div>
    );
}
