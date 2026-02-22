import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function IOSInstallModal() {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Detecta si es un dispositivo iOS
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };

        // Detecta si ya está en modo PWA (Standalone)
        const isStandalone = () => {
            return ('standalone' in window.navigator) && (window.navigator as any).standalone;
        };

        // Si es iOS y NO está instalada, mostramos el modal (una sola vez por sesión)
        if (isIos() && !isStandalone()) {
            const hasSeenPrompt = sessionStorage.getItem('iosInstallPromptSeen');
            if (!hasSeenPrompt) {
                // Retrasamos un poco la aparición para no ser intrusivos
                setTimeout(() => setShowPrompt(true), 3000);
            }
        }
    }, []);

    const handleClose = () => {
        setShowPrompt(false);
        sessionStorage.setItem('iosInstallPromptSeen', 'true');
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-8 bg-black/60 backdrop-blur-sm flex justify-center"
                >
                    <div className="bg-white rounded-[2rem] p-6 shadow-2xl w-full max-w-sm flex flex-col items-center text-center gap-4 relative">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 text-gray-500 rounded-full font-bold"
                        >
                            x
                        </button>

                        <div className="w-16 h-16 bg-[#F39C12] rounded-2xl flex items-center justify-center p-2 mb-2">
                            {/* Asume que tienes el logo en /logo.webp */}
                            <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
                        </div>

                        <h3 className="text-xl font-black text-[#4A0E0E]">Instala HAMMEO</h3>

                        <p className="text-gray-600 font-medium leading-snug">
                            Instala esta aplicación en tu iPhone para acceso rápido y pantalla completa.
                        </p>

                        <div className="bg-gray-50 rounded-2xl p-4 w-full text-left flex flex-col gap-3 font-semibold text-gray-700">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm border text-blue-500 text-xl">
                                    ⇪
                                </span>
                                <span>1. Toca en Compartir</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm border text-gray-800 text-xl">
                                    +
                                </span>
                                <span>2. Añadir a inicio</span>
                            </div>
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
