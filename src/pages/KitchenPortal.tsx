import { useState, useEffect, useRef } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChefHat, Check, RotateCcw, Volume2, VolumeX, AlertCircle } from 'lucide-react';

export function KitchenPortal() {
    const { orders, fetchOrders } = useOrderStore();
    const { kitchenReadyOrders, markOrderAsReady } = useSettingsStore();

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'pending' | 'ready'>('pending');

    // Ref to track the previous list of preparing orders
    const prevPreparingIdsRef = useRef<number[]>([]);

    useEffect(() => {
        fetchOrders();
        // Update current time clock every second
        const timeInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timeInterval);
    }, [fetchOrders]);

    // Filter orders currently in 'preparing' state
    const kitchenOrders = orders.filter(o => o.status === 'preparing');

    // Categorize: active in kitchen vs ready in kitchen
    const pendingCook = kitchenOrders.filter(o => !kitchenReadyOrders[o.id]);
    const readyCook = kitchenOrders.filter(o => !!kitchenReadyOrders[o.id]);

    // Check for new incoming preparing orders to play sound notification
    useEffect(() => {
        const currentPreparingIds = kitchenOrders.map(o => o.id);
        const prevPreparingIds = prevPreparingIdsRef.current;

        // If there are new orders that weren't in the previous list
        const newOrders = currentPreparingIds.filter(id => !prevPreparingIds.includes(id));

        if (newOrders.length > 0 && prevPreparingIds.length > 0 && soundEnabled) {
            playKitchenBell();
        }

        // Update ref
        prevPreparingIdsRef.current = currentPreparingIds;
    }, [kitchenOrders, soundEnabled]);

    // Synthesize a classic metal bell / ding-dong sound for order notification
    const playKitchenBell = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playBellNode = (time: number, freq: number, duration: number) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);

                gain.gain.setValueAtTime(0.4, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(time);
                osc.stop(time + duration);
            };

            const now = audioCtx.currentTime;
            // High double pitch ring
            playBellNode(now, 880, 0.4); // A5
            playBellNode(now + 0.15, 1200, 0.6); // Higher second ring
        } catch (error) {
            console.error('Failed to play synthesized notification chime:', error);
        }
    };

    // Calculate elapsed time in kitchen
    const getElapsedTime = (createdTime: string) => {
        const diffMs = currentTime.getTime() - new Date(createdTime).getTime();
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin >= 60) {
            const hrs = Math.floor(diffMin / 60);
            const mins = diffMin % 60;
            return `${hrs} h ${mins} min`;
        }

        return `${diffMin} min`;
    };

    const getElapsedTimeMinutes = (createdTime: string) => {
        const diffMs = currentTime.getTime() - new Date(createdTime).getTime();
        return Math.floor(diffMs / 60000);
    };

    return (
        <div className="min-h-screen bg-[#0F0F11] text-zinc-100 flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 bg-[#16161A]/95 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex justify-between items-center z-40 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-orange-500 shadow-orange-900/20">
                        🍳
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">Pantalla de Cocina</span>
                        <h1 className="text-xl font-brand tracking-widest text-white uppercase leading-none">HAMMEO COCINA</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Digital Clock */}
                    <div className="hidden sm:flex items-center gap-2 bg-[#202024] px-4 py-2 rounded-xl border border-zinc-800">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="font-mono text-sm font-bold tracking-widest text-zinc-300">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>

                    {/* Mute button */}
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-2 font-bold text-xs uppercase cursor-pointer ${
                            soundEnabled
                                ? 'bg-orange-600/10 border-orange-500/30 text-orange-500 hover:bg-orange-600/20'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                        }`}
                        title={soundEnabled ? 'Silenciar Alertas' : 'Activar Alertas'}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span className="hidden md:inline">{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-[#16161A] border-b border-zinc-800 px-6 py-2 flex gap-4">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none flex items-center gap-2 ${
                        activeTab === 'pending'
                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/30'
                            : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                >
                    <ChefHat className="w-4 h-4" />
                    <span>Por Cocinar ({pendingCook.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('ready')}
                    className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none flex items-center gap-2 ${
                        activeTab === 'ready'
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/30'
                            : 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                >
                    <Check className="w-4 h-4" />
                    <span>Listos para despacho ({readyCook.length})</span>
                </button>
            </div>

            {/* Orders Panel */}
            <main className="flex-1 p-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'pending' ? (
                        <motion.div
                            key="pending-tab"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {pendingCook.length === 0 ? (
                                <div className="col-span-full py-24 text-center space-y-4 max-w-sm mx-auto">
                                    <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center text-4xl mx-auto border border-zinc-800">
                                        📭
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-300">¡Cocina vacía!</h3>
                                        <p className="text-zinc-500 text-xs mt-1">
                                            No hay pedidos asignados en preparación. Espera que la administración envíe nuevos pedidos.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                pendingCook.map(order => {
                                    const elapsedMinutes = getElapsedTimeMinutes(order.created_at);
                                    const isDelayed = elapsedMinutes >= 35; // Warning highlight if delayed
                                    
                                    return (
                                        <motion.div
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={`bg-[#16161B] rounded-3xl border p-5 flex flex-col justify-between shadow-xl min-h-[300px] ${
                                                isDelayed 
                                                    ? 'border-red-500/40 ring-1 ring-red-500/20 shadow-red-950/5' 
                                                    : 'border-zinc-800'
                                            }`}
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-3 pb-3 border-b border-zinc-800">
                                                <div>
                                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Pedido</span>
                                                    <h3 className="text-3xl font-brand font-black text-white mt-0.5">#{order.id}</h3>
                                                </div>
                                                <div className={`text-right px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                                                    isDelayed 
                                                        ? 'bg-red-950/20 border-red-500/30 text-red-400 font-black animate-pulse'
                                                        : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-300 font-bold'
                                                }`}>
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-xs tracking-wider">{getElapsedTime(order.created_at)}</span>
                                                </div>
                                            </div>

                                            {/* Customer Name */}
                                            <div className="mb-4">
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Cliente</span>
                                                <span className="text-lg font-black text-zinc-100">{order.customer_name}</span>
                                            </div>

                                            {/* Order Details (WING SPECIFIC - EXTRA LARGE TEXT) */}
                                            <div className="flex-1 bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800/80 mb-5 overflow-y-auto">
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Detalle del Pedido</span>
                                                <p className="text-lg font-black text-white whitespace-pre-wrap leading-snug tracking-wide">
                                                    {order.order_details}
                                                </p>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={() => markOrderAsReady(order.id, true)}
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-brand text-lg py-4 rounded-2xl tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border-none cursor-pointer shadow-lg shadow-emerald-950/20"
                                            >
                                                <Check className="w-5 h-5 stroke-[3px]" />
                                                Listo
                                            </button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ready-tab"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {readyCook.length === 0 ? (
                                <div className="col-span-full py-24 text-center space-y-4 max-w-sm mx-auto">
                                    <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center text-4xl mx-auto border border-zinc-800">
                                        📦
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-zinc-300">Sin platos listos</h3>
                                        <p className="text-zinc-500 text-xs mt-1">
                                            No hay platos listos esperando despacho en este momento.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                readyCook.map(order => (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="bg-[#16161B] rounded-3xl border border-zinc-800 p-5 flex flex-col justify-between shadow-xl min-h-[300px] opacity-80"
                                    >
                                        <div>
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-3 pb-3 border-b border-zinc-800">
                                                <div>
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Listo</span>
                                                    <h3 className="text-3xl font-brand font-black text-white mt-0.5">#{order.id}</h3>
                                                </div>
                                                <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span className="text-xs">Listo</span>
                                                </div>
                                            </div>

                                            {/* Customer Name */}
                                            <div className="mb-4">
                                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Cliente</span>
                                                <span className="text-lg font-black text-zinc-300">{order.customer_name}</span>
                                            </div>

                                            {/* Order Details */}
                                            <div className="bg-zinc-900/30 rounded-2xl p-4 border border-zinc-800/50 mb-5">
                                                <p className="text-md font-bold text-zinc-400 whitespace-pre-wrap leading-tight">
                                                    {order.order_details}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-zinc-800/40 text-zinc-400 border border-zinc-800 rounded-2xl flex items-center justify-center gap-1.5 font-bold text-xs uppercase">
                                                <span>Esp. Repartidor 🛵</span>
                                            </div>
                                            <button
                                                onClick={() => markOrderAsReady(order.id, false)}
                                                className="bg-red-950/20 hover:bg-red-900/20 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                                                title="Deshacer listo"
                                            >
                                                <RotateCcw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
