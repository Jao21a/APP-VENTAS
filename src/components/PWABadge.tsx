// Componente extraído de la documentación oficial de vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWABadge() {
    // needRefresh detecta si hay un nuevo Service Worker esperando (app actualizada)
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <AnimatePresence>
            {(offlineReady || needRefresh) && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between p-4 bg-white rounded-2xl shadow-2xl border-4 border-[#F39C12]"
                >
                    <div className="flex-1 mr-4">
                        <h3 className="text-lg font-black text-[#4A0E0E]">
                            {offlineReady ? 'App lista offline' : '¡Actualización Disponible!'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">
                            {offlineReady
                                ? 'HAMMEO ya puede funcionar sin internet.'
                                : 'Hay una nueva versión de la app. Actualiza para ver los cambios.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[100px]">
                        {needRefresh && (
                            <button
                                onClick={() => updateServiceWorker(true)}
                                className="bg-[#F39C12] text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-[#e67e22] active:scale-95 transition-transform"
                            >
                                Actualizar
                            </button>
                        )}
                        <button
                            onClick={close}
                            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-transform"
                        >
                            Cerrar
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
