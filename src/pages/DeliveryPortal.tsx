import { useState, useEffect } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Phone, MessageSquare, MapPin, Check, LogOut, Navigation, AlertTriangle, X, DollarSign, Smartphone } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function DeliveryPortal() {
    const { orders, deliveryPersons, updateOrderStatus, fetchOrders, fetchDeliveryPersons } = useOrderStore();
    const { recordOrderPayment } = useSettingsStore();
    
    const [selectedDriver, setSelectedDriver] = useState<string | null>(() => {
        return localStorage.getItem('active_delivery_driver');
    });
    const [gpsStatus, setGpsStatus] = useState<'active' | 'inactive' | 'denied' | 'unsupported'>('inactive');
    
    // Payment confirmation modal states
    const [payingOrder, setPayingOrder] = useState<Order | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('efectivo');
    const [cashAmount, setCashAmount] = useState<string>('');
    const [yapeAmount, setYapeAmount] = useState<string>('');

    useEffect(() => {
        fetchOrders();
        fetchDeliveryPersons();
    }, [fetchOrders, fetchDeliveryPersons]);

    const handleSelectDriver = (name: string) => {
        setSelectedDriver(name);
        localStorage.setItem('active_delivery_driver', name);
    };

    const handleLogOut = () => {
        setSelectedDriver(null);
        localStorage.removeItem('active_delivery_driver');
    };

    const handleDeliverClick = (order: Order) => {
        setPayingOrder(order);
        setPaymentMethod('efectivo');
        setCashAmount(order.total.toString());
        setYapeAmount('');
    };

    const handleConfirmDelivery = async () => {
        if (!payingOrder) return;

        let cashNum = 0;
        let yapeNum = 0;

        if (paymentMethod === 'efectivo') {
            cashNum = payingOrder.total;
        } else if (paymentMethod === 'yape') {
            yapeNum = payingOrder.total;
        } else if (paymentMethod === 'mixto') {
            cashNum = parseFloat(cashAmount) || 0;
            yapeNum = parseFloat(yapeAmount) || 0;
            
            const totalSum = cashNum + yapeNum;
            if (Math.abs(totalSum - payingOrder.total) > 0.01) {
                alert(`La suma (S/ ${totalSum.toFixed(2)}) debe ser igual al total del pedido (S/ ${payingOrder.total.toFixed(2)}).`);
                return;
            }
        }

        // 1. Record the payment settings entry
        await recordOrderPayment(payingOrder.id, paymentMethod, cashNum || undefined, yapeNum || undefined);
        
        // 2. Change order status to delivered
        await updateOrderStatus(payingOrder.id, 'delivered');

        // 3. Clear modal states
        setPayingOrder(null);
        setCashAmount('');
        setYapeAmount('');
    };

    // Filter orders assigned to this driver that are in 'shipping' status
    const activeDeliveries = orders.filter(
        o => o.delivery_person === selectedDriver && o.status === 'shipping'
    );

    // GPS Tracking Effect
    useEffect(() => {
        if (!selectedDriver || activeDeliveries.length === 0) {
            setGpsStatus('inactive');
            return;
        }

        if (!navigator.geolocation) {
            setGpsStatus('unsupported');
            return;
        }

        let lastUpdateTime = 0;
        
        const handleSuccess = (position: GeolocationPosition) => {
            const now = Date.now();
            if (now - lastUpdateTime >= 15000) {
                const { latitude, longitude } = position.coords;
                useSettingsStore.getState().updateDriverLocation(selectedDriver, latitude, longitude);
                lastUpdateTime = now;
                setGpsStatus('active');
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error('Error retrieving geolocation:', error);
            if (error.code === error.PERMISSION_DENIED) {
                setGpsStatus('denied');
            } else {
                setGpsStatus('inactive');
            }
        };

        const watchId = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 15000
            }
        );

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                useSettingsStore.getState().updateDriverLocation(selectedDriver, latitude, longitude);
                lastUpdateTime = Date.now();
                setGpsStatus('active');
            },
            handleError,
            { enableHighAccuracy: true }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [selectedDriver, activeDeliveries.length]);

    const getWhatsAppLink = (order: Order) => {
        const message = `¡Hola ${order.customer_name}! Te saluda ${selectedDriver || 'tu repartidor'} de Hammeo. Estoy en camino con tu pedido. 🛵🔥`;
        const cleanPhone = order.customer_phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    };

    const getGoogleMapsDir = (order: Order) => {
        if (order.lat && order.lng) {
            return `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`;
        }
        return order.location_link || '#';
    };

    const getWazeDir = (order: Order) => {
        if (order.lat && order.lng) {
            return `https://waze.com/ul?ll=${order.lat},${order.lng}&navigate=yes`;
        }
        return null;
    };

    if (!selectedDriver) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] flex flex-col justify-center items-center px-6 py-12">
                <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-black/5 shadow-xl text-center space-y-6">
                    <div className="w-16 h-16 bg-[#2D1B4E] rounded-full flex items-center justify-center text-3xl mx-auto shadow-md">
                        🛵
                    </div>
                    <div>
                        <h1 className="text-2xl font-brand text-[#2D1B4E] uppercase tracking-wider">Portal de Repartos</h1>
                        <p className="text-[#8E8E93] text-xs font-bold uppercase tracking-widest mt-1">Selecciona tu usuario para iniciar</p>
                    </div>

                    <div className="space-y-2 pt-4">
                        {deliveryPersons.length === 0 ? (
                            <div className="p-4 bg-[#F2F2F7] rounded-xl text-sm italic text-gray-500">
                                No hay repartidores registrados en el panel.
                            </div>
                        ) : (
                            deliveryPersons.map(person => (
                                <button
                                    key={person.id}
                                    onClick={() => handleSelectDriver(person.name)}
                                    className="w-full p-4 rounded-2xl border border-black/5 bg-[#F2F2F7] hover:bg-[var(--primary-color)] hover:text-white transition-all text-left font-bold text-[#2D1B4E] flex items-center justify-between active:scale-95 cursor-pointer"
                                >
                                    <span>{person.name}</span>
                                    <span className="text-xs opacity-55">Ingresar →</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-12 relative">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex justify-between items-center z-40 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🛵</span>
                    <div>
                        <span className="text-xs font-black text-[#8E8E93] uppercase tracking-wider block">Repartidor</span>
                        <h2 className="text-md font-black text-[#2D1B4E] leading-none">{selectedDriver}</h2>
                    </div>
                </div>
                <button
                    onClick={handleLogOut}
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
                    title="Salir"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            {/* Content */}
            <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
                {/* GPS Status Banner */}
                <div className="px-1">
                    {gpsStatus === 'active' && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold text-emerald-800 shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>📍 Transmitiendo ubicación en vivo</span>
                        </div>
                    )}
                    {gpsStatus === 'denied' && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 rounded-2xl text-xs font-bold text-red-800 shadow-sm">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <span>⚠️ Permiso GPS denegado. Activa los permisos de ubicación para reportar tu ruta al restaurante.</span>
                        </div>
                    )}
                    {gpsStatus === 'inactive' && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-xs font-bold text-gray-700 shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
                            <span>📍 GPS listo. Esperando despachos en camino...</span>
                        </div>
                    )}
                    {gpsStatus === 'unsupported' && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-3 rounded-2xl text-xs font-bold text-amber-800 shadow-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>⚠️ GPS no soportado por este navegador.</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center px-1">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase tracking-widest">
                        Entregas Pendientes ({activeDeliveries.length})
                    </h3>
                </div>

                <AnimatePresence mode="popLayout">
                    {activeDeliveries.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white rounded-3xl p-10 border border-black/5 text-center shadow-sm space-y-4 mt-4"
                        >
                            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                                ✓
                            </div>
                            <div>
                                <h4 className="font-brand text-lg text-[#2D1B4E] uppercase">¡Estás al día!</h4>
                                <p className="text-sm text-[#8E8E93] font-medium mt-1">No tienes pedidos pendientes de entrega asignados en este momento.</p>
                            </div>
                        </motion.div>
                    ) : (
                        activeDeliveries.map(order => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl p-5 border border-black/5 shadow-md space-y-4"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <span className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-wider">Pedido #{order.id}</span>
                                        <h4 className="font-black text-xl text-[#2D1B4E] mt-0.5">{order.customer_name}</h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-wider block">Total</span>
                                        <span className="font-brand text-xl text-[var(--primary-color)]">S/ {order.total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="bg-[#F2F2F7] rounded-2xl p-4 border border-black/5">
                                    <p className="text-sm font-bold text-[#2D1B4E] leading-relaxed">{order.order_details}</p>
                                </div>

                                {/* Navigation & Contact buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                    <a
                                        href={getWhatsAppLink(order)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-100 transition-colors"
                                    >
                                        <MessageSquare className="w-4 h-4 fill-emerald-700/10" />
                                        WhatsApp
                                    </a>
                                    <a
                                        href={`tel:${order.customer_phone}`}
                                        className="py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 border border-blue-100 transition-colors"
                                    >
                                        <Phone className="w-4 h-4 fill-blue-700/10" />
                                        Llamar
                                    </a>
                                </div>

                                {(order.lat && order.lng) || order.location_link ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <a
                                            href={getGoogleMapsDir(order)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="py-3 px-4 rounded-xl bg-[#2D1B4E] text-white font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 text-center"
                                        >
                                            <Navigation className="w-4 h-4" />
                                            Google Maps
                                        </a>
                                        {getWazeDir(order) && (
                                            <a
                                                href={getWazeDir(order)!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="py-3 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center gap-2 border border-sky-100 transition-colors"
                                            >
                                                <MapPin className="w-4 h-4 fill-sky-700/10" />
                                                Waze
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-center text-xs text-yellow-800 font-bold uppercase tracking-wider">
                                        📍 Sin ubicación georreferenciada
                                    </div>
                                )}

                                {/* Deliver action */}
                                <button
                                    onClick={() => handleDeliverClick(order)}
                                    className="w-full bg-[var(--primary-color)] text-white py-4 rounded-2xl shadow-lg shadow-orange-100 font-brand text-lg tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border-none"
                                >
                                    <Check className="w-5 h-5 stroke-[3px]" />
                                    Entregar Pedido
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </main>

            {/* Payment Method Modal */}
            <AnimatePresence>
                {payingOrder && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPayingOrder(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10 space-y-5"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] font-black text-[#8E8E93] uppercase tracking-wider block">Confirmar Entrega</span>
                                    <h3 className="text-xl font-brand text-[#2D1B4E] uppercase">¿Cómo pagó el cliente?</h3>
                                </div>
                                <button
                                    onClick={() => setPayingOrder(null)}
                                    className="bg-[#E9E9EB] p-1.5 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-[#F2F2F7] p-3 rounded-2xl flex justify-between items-center text-sm font-bold text-[#2D1B4E] border border-black/5">
                                <span>Total del Pedido:</span>
                                <span className="text-lg text-[var(--primary-color)]">S/ {payingOrder.total.toFixed(2)}</span>
                            </div>

                            {/* Payment Methods Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPaymentMethod('efectivo');
                                        setCashAmount(payingOrder.total.toString());
                                        setYapeAmount('');
                                    }}
                                    className={cn(
                                        "p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 font-bold cursor-pointer",
                                        paymentMethod === 'efectivo' 
                                            ? "border-[var(--primary-color)] bg-orange-50 text-[var(--primary-color)]" 
                                            : "border-black/5 bg-[#F2F2F7] text-[#2D1B4E] hover:bg-[#E5E5EA]"
                                    )}
                                >
                                    <DollarSign className="w-6 h-6" />
                                    <span className="text-xs uppercase tracking-wide">Efectivo</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPaymentMethod('yape');
                                        setYapeAmount(payingOrder.total.toString());
                                        setCashAmount('');
                                    }}
                                    className={cn(
                                        "p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 font-bold cursor-pointer",
                                        paymentMethod === 'yape' 
                                            ? "border-[var(--primary-color)] bg-orange-50 text-[var(--primary-color)]" 
                                            : "border-black/5 bg-[#F2F2F7] text-[#2D1B4E] hover:bg-[#E5E5EA]"
                                    )}
                                >
                                    <Smartphone className="w-6 h-6" />
                                    <span className="text-xs uppercase tracking-wide">Yape</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPaymentMethod('mixto');
                                        setCashAmount('');
                                        setYapeAmount('');
                                    }}
                                    className={cn(
                                        "p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 font-bold cursor-pointer",
                                        paymentMethod === 'mixto' 
                                            ? "border-[var(--primary-color)] bg-orange-50 text-[var(--primary-color)]" 
                                            : "border-black/5 bg-[#F2F2F7] text-[#2D1B4E] hover:bg-[#E5E5EA]"
                                    )}
                                >
                                    <div className="flex gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        <Smartphone className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs uppercase tracking-wide">Mixto</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPaymentMethod('pendiente_yape');
                                        setCashAmount('');
                                        setYapeAmount('');
                                    }}
                                    className={cn(
                                        "p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 font-bold cursor-pointer",
                                        paymentMethod === 'pendiente_yape' 
                                            ? "border-amber-400 bg-amber-50 text-amber-700" 
                                            : "border-black/5 bg-[#F2F2F7] text-[#2D1B4E] hover:bg-[#E5E5EA]"
                                    )}
                                >
                                    <span className="text-xl">⏳</span>
                                    <span className="text-xs uppercase tracking-wide">Pend. Yape</span>
                                </button>
                            </div>

                            {/* Mixed Payment Details */}
                            {paymentMethod === 'mixto' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-3 pt-2"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Monto Efectivo (S/)</label>
                                            <input
                                                type="number"
                                                step="0.10"
                                                placeholder="0.00"
                                                className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all font-bold text-sm"
                                                value={cashAmount}
                                                onChange={e => setCashAmount(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Monto Yape (S/)</label>
                                            <input
                                                type="number"
                                                step="0.10"
                                                placeholder="0.00"
                                                className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all font-bold text-sm"
                                                value={yapeAmount}
                                                onChange={e => setYapeAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-200/50 p-3 rounded-xl text-[10px] font-bold text-[var(--primary-color)] flex justify-between">
                                        <span>Total Ingresado: S/ {((parseFloat(cashAmount) || 0) + (parseFloat(yapeAmount) || 0)).toFixed(2)}</span>
                                        <span>Falta: S/ {(payingOrder.total - ((parseFloat(cashAmount) || 0) + (parseFloat(yapeAmount) || 0))).toFixed(2)}</span>
                                    </div>
                                </motion.div>
                            )}

                            {/* Confirm Action Button */}
                            <button
                                onClick={handleConfirmDelivery}
                                className="w-full bg-[#2D1B4E] text-white py-4 rounded-2xl font-brand text-lg tracking-widest uppercase flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border-none"
                            >
                                <Check className="w-5 h-5" />
                                Confirmar Entrega
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
