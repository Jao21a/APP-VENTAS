import { useState, useEffect } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Order, OrderStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Truck, Clock, CheckCircle2, Phone, Trash2, ChevronRight, X, MessageSquare, MapPin } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Dashboard() {
    const { orders, isLoading, deleteOrder, updateOrderStatus, updateOrdersStatusInBatch, deliveryPersons } = useOrderStore();
    const { orderTimelines, orderPayments, kitchenReadyOrders } = useSettingsStore();
    const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    const formatMinutes = (minutes: number): string => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
        }
        return `${minutes} min`;
    };

    const getOrderTimeInfo = (order: Order) => {
        const timeline = orderTimelines[order.id];
        const now = new Date();
        
        if (order.status === 'preparing') {
            const prepStart = timeline?.preparing_at ? new Date(timeline.preparing_at) : new Date(order.created_at);
            const diffMin = Math.floor((now.getTime() - prepStart.getTime()) / 60000);
            return `⏱️ ${formatMinutes(diffMin >= 0 ? diffMin : 0)} cocina`;
        }
        
        if (order.status === 'shipping') {
            const shipStart = timeline?.shipping_at ? new Date(timeline.shipping_at) : new Date(order.created_at);
            const diffMin = Math.floor((now.getTime() - shipStart.getTime()) / 60000);
            return `⏱️ ${formatMinutes(diffMin >= 0 ? diffMin : 0)} camino`;
        }
        
        if (order.status === 'delivered') {
            const start = new Date(order.created_at);
            const end = timeline?.delivered_at ? new Date(timeline.delivered_at) : now;
            const diffMin = Math.floor((end.getTime() - start.getTime()) / 60000);
            return `⏱️ Total: ${formatMinutes(diffMin >= 0 ? diffMin : 0)}`;
        }
        
        // pending
        const start = new Date(order.created_at);
        const diffMin = Math.floor((now.getTime() - start.getTime()) / 60000);
        return `⏱️ Hace ${formatMinutes(diffMin >= 0 ? diffMin : 0)}`;
    };
    const [assigningBatch, setAssigningBatch] = useState<boolean>(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'preparing': return <ChefHat className="w-4 h-4" />;
            case 'shipping': return <Truck className="w-4 h-4" />;
            case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'preparing': return 'Preparando';
            case 'shipping': return 'En camino';
            case 'delivered': return 'Entregado';
        }
    };

    const handleNextStatus = (order: Order) => {
        const nextStatusMap: Record<OrderStatus, OrderStatus> = {
            pending: 'preparing',
            preparing: 'shipping',
            shipping: 'delivered',
            delivered: 'delivered'
        };

        const nextStatus = nextStatusMap[order.status];

        if (nextStatus === 'shipping') {
            if (deliveryPersons.length === 0) {
                alert('Por favor añade repartidores primero en la pestaña de Repartidores');
                return;
            }
            setAssigningOrder(order);
        } else {
            updateOrderStatus(order.id, nextStatus);
        }
    };

    const assignDelivery = (personName: string) => {
        if (assigningOrder) {
            updateOrderStatus(assigningOrder.id, 'shipping', personName);
            setAssigningOrder(null);
        }
    };

    const assignBatchDelivery = async (personName: string) => {
        if (selectedOrderIds.length > 0) {
            await updateOrdersStatusInBatch(selectedOrderIds, 'shipping', personName);
            setSelectedOrderIds([]);
            setAssigningBatch(false);
        }
    };

    const toggleSelectOrder = (id: number) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (filteredOrders: Order[]) => {
        const batchableOrders = filteredOrders.filter(o => o.status !== 'delivered');
        const batchableIds = batchableOrders.map(o => o.id);
        const allSelected = batchableIds.every(id => selectedOrderIds.includes(id));

        if (allSelected) {
            // Deselect all in this view
            setSelectedOrderIds(prev => prev.filter(id => !batchableIds.includes(id)));
        } else {
            // Select all in this view
            setSelectedOrderIds(prev => {
                const newSelection = [...prev];
                batchableIds.forEach(id => {
                    if (!newSelection.includes(id)) newSelection.push(id);
                });
                return newSelection;
            });
        }
    };

    const getWhatsAppLink = (order: Order) => {
        let message = '';
        if (order.status === 'pending') {
            message = `¡Hola ${order.customer_name}! Recibimos tu pedido en Hammeo. Pronto comenzaremos a prepararlo. 🔥`;
        } else if (order.status === 'preparing') {
            message = `¡Hola ${order.customer_name}! Tu pedido de Hammeo ya está en preparación en cocina. 🔥`;
        } else if (order.status === 'shipping') {
            message = `¡Hola ${order.customer_name}! Tu pedido ya está en camino con nuestro repartidor ${order.delivery_person || ''}. 🛵`;
        } else {
            message = `¡Hola ${order.customer_name}! Tu pedido ya fue entregado. ¡Esperamos que lo disfrutes! 🔥`;
        }
        const cleanPhone = order.customer_phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    };

    const filteredOrders = orders.filter(o => activeTab === 'all' || o.status === activeTab);
    const batchableOrdersInView = filteredOrders.filter(o => o.status !== 'delivered');

    return (
        <>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-brand text-[#2D1B4E] uppercase tracking-widest">Panel de Pedidos</h2>
                    <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-widest mt-1">
                        Gestiona y despacha las ventas diarias
                    </p>
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <div className="bg-white px-4 py-2.5 rounded-xl border border-black/5 flex items-center gap-2 shadow-sm w-full lg:w-auto justify-center">
                        <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse" />
                        <span className="text-xs font-bold text-[#2D1B4E] uppercase">{orders.length} Pedidos Totales</span>
                    </div>
                </div>
            </div>

            {/* Pestañas de Estado */}
            <div className="flex flex-wrap gap-2 mb-6 bg-[#E5E5EA]/50 p-1.5 rounded-2xl w-fit border border-black/5">
                {(['all', 'pending', 'preparing', 'shipping', 'delivered'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setSelectedOrderIds([]); // Clear selection when changing tabs
                        }}
                        className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                            activeTab === tab 
                                ? "bg-white text-[#2D1B4E] shadow-sm font-black" 
                                : "text-[#8E8E93] hover:text-[#2D1B4E]"
                        )}
                    >
                        {tab === 'all' ? 'Todos' : getStatusLabel(tab)}
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-[#F2F2F7] text-[10px] text-[#2D1B4E] font-black">
                            {tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Barra de Acciones por Lote Flotante */}
            <AnimatePresence>
                {selectedOrderIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-fit bg-[#2D1B4E] text-white px-6 py-4 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 z-50 border border-white/10"
                    >
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <span className="w-6 h-6 bg-[var(--primary-color)] text-white rounded-full flex items-center justify-center text-xs font-black">
                                {selectedOrderIds.length}
                            </span>
                            <span>pedidos seleccionados para despacho</span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => {
                                    if (deliveryPersons.length === 0) {
                                        alert('Por favor añade repartidores primero en la pestaña de Repartidores');
                                        return;
                                    }
                                    setAssigningBatch(true);
                                }}
                                className="flex-1 sm:flex-none bg-[var(--primary-color)] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-600 transition-all cursor-pointer active:scale-95"
                            >
                                Asignar Repartidor
                            </button>
                            <button
                                onClick={() => setSelectedOrderIds([])}
                                className="bg-white/10 text-white hover:bg-white/20 p-2.5 rounded-xl transition-all cursor-pointer"
                                title="Cancelar selección"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm space-y-4 opacity-75">
                    <ShoppingBagBigIcon className="w-16 h-16 mx-auto text-[#E5E5EA]" />
                    <p className="text-lg font-brand text-[#2D1B4E] uppercase">No hay pedidos en esta categoría</p>
                </div>
            ) : (
                <div className="space-y-4 pb-24">
                    {/* Select all button if on batchable tab */}
                    {batchableOrdersInView.length > 0 && (
                        <div className="flex justify-end pr-2">
                            <button
                                onClick={() => handleSelectAll(filteredOrders)}
                                className="text-xs font-bold text-[var(--primary-color)] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                                {batchableOrdersInView.every(id => selectedOrderIds.includes(id.id)) 
                                    ? 'Deseleccionar Todos' 
                                    : 'Seleccionar Todos'}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredOrders.map((order) => {
                                const isSelected = selectedOrderIds.includes(order.id);
                                const isBatchable = order.status !== 'delivered';

                                return (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={cn(
                                            "ios-card p-5 space-y-4 bg-white hover:shadow-xl transition-all border rounded-3xl shadow-sm relative overflow-hidden",
                                            isSelected ? "border-[var(--primary-color)] ring-2 ring-orange-100" : "border-black/5"
                                        )}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-start gap-3">
                                                {isBatchable && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSelectOrder(order.id)}
                                                        className={cn(
                                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all cursor-pointer",
                                                            isSelected 
                                                                ? "bg-[var(--primary-color)] border-[var(--primary-color)] text-white" 
                                                                : "border-[#D1D1D6] hover:border-[var(--primary-color)]"
                                                        )}
                                                    >
                                                        {isSelected && <span className="text-[10px] font-black">✓</span>}
                                                    </button>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-xl text-[#2D1B4E]">{order.customer_name}</h3>
                                                    <div className="flex items-center text-[#8E8E93] text-xs gap-3 mt-1 flex-wrap">
                                                        <span className="font-medium">{order.customer_phone}</span>
                                                        <span className="font-bold text-[var(--primary-color)] bg-orange-50 px-2 py-0.5 rounded-lg text-[10px] border border-orange-100/50">
                                                            {getOrderTimeInfo(order)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "status-badge flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm shrink-0",
                                                order.status === 'pending' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                                    order.status === 'preparing' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                        order.status === 'shipping' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            'bg-green-50 text-green-600 border-green-200'
                                            )}>
                                                {getStatusIcon(order.status)}
                                                <span className="text-[10px] font-black uppercase tracking-wider">{getStatusLabel(order.status)}</span>
                                            </div>
                                        </div>

                                        <div className="bg-[#F2F2F7] rounded-2xl p-4 border border-black/5">
                                            <div className="text-sm font-bold text-[#2D1B4E] leading-relaxed">
                                                {order.order_details}
                                            </div>
                                            {order.delivery_person && order.status !== 'pending' && order.status !== 'preparing' && (
                                                <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest bg-orange-50 w-fit px-2 py-1 rounded-lg">
                                                    <Truck className="w-3.5 h-3.5" />
                                                    Repartidor: {order.delivery_person}
                                                </div>
                                            )}
                                            
                                            {order.status === 'preparing' && kitchenReadyOrders[order.id] && (
                                                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 w-fit px-2.5 py-1.5 rounded-lg uppercase tracking-wider border border-emerald-100/60 animate-pulse">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                    Listo en Cocina
                                                </div>
                                            )}
                                            
                                            {/* Payment Details */}
                                            {order.status === 'delivered' && orderPayments[order.id] && (
                                                <div className="mt-3 pt-3 border-t border-black/5 flex flex-col gap-2">
                                                    {(() => {
                                                        const p = orderPayments[order.id];
                                                        if (p.method === 'efectivo') {
                                                            return (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider border border-emerald-100 w-fit">
                                                                    💵 Efectivo: S/ {order.total.toFixed(2)}
                                                                </span>
                                                            );
                                                        }
                                                        if (p.method === 'yape') {
                                                            return (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-wider border border-purple-100 w-fit">
                                                                    📱 Yape: S/ {order.total.toFixed(2)}
                                                                </span>
                                                            );
                                                        }
                                                        if (p.method === 'pendiente_yape') {
                                                            return (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider border border-amber-200 w-fit">
                                                                    ⏳ Pendiente Yape
                                                                </span>
                                                            );
                                                        }
                                                        if (p.method === 'mixto') {
                                                            return (
                                                                <div className="space-y-1.5">
                                                                    <div className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider border border-blue-100 w-fit">
                                                                        ⚖️ Mixto: S/ {order.total.toFixed(2)}
                                                                    </div>
                                                                    <div className="flex gap-2 text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider pl-1">
                                                                        <span>Efec: S/ {p.cash_amount?.toFixed(2) || '0.00'}</span>
                                                                        <span>Yape: S/ {p.yape_amount?.toFixed(2) || '0.00'}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Botones de Acción Rápida (Contacto y Ubicación) */}
                                        <div className="flex gap-2 bg-[#F2F2F7]/50 p-2 rounded-2xl border border-black/5">
                                            <a
                                                href={getWhatsAppLink(order)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
                                            >
                                                <MessageSquare className="w-4 h-4 fill-emerald-700/10" />
                                                WhatsApp
                                            </a>
                                            <a
                                                href={`tel:${order.customer_phone}`}
                                                className="py-2 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200"
                                            >
                                                <Phone className="w-4 h-4 fill-blue-700/10" />
                                            </a>
                                            {(order.lat && order.lng) ? (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${order.lat},${order.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-2 px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[var(--primary-color)] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-orange-200"
                                                    title="Ver ubicación en Google Maps"
                                                >
                                                    <MapPin className="w-4 h-4 fill-[var(--primary-color)]/10" />
                                                </a>
                                            ) : order.location_link ? (
                                                <a
                                                    href={order.location_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-2 px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[var(--primary-color)] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-orange-200"
                                                    title="Ver enlace de ubicación"
                                                >
                                                    <MapPin className="w-4 h-4 fill-[var(--primary-color)]/10" />
                                                </a>
                                            ) : null}
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <div className="text-2xl font-brand text-[var(--primary-color)]">
                                                S/ {order.total.toFixed(2)}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('¿Eliminar este pedido permanentemente?')) {
                                                            deleteOrder(order.id);
                                                        }
                                                    }}
                                                    className="p-2.5 text-[#FF3B30] hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>

                                                {order.status !== 'delivered' && (
                                                    <button
                                                        onClick={() => handleNextStatus(order)}
                                                        className="flex items-center gap-2 bg-[var(--primary-color)] text-white px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-orange-100 cursor-pointer"
                                                    >
                                                        Siguiente
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Assign Delivery Modal (Single Order) */}
            <AnimatePresence>
                {assigningOrder && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAssigningOrder(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-brand text-[#2D1B4E] uppercase">Asignar Repartidor</h2>
                                <button
                                    onClick={() => setAssigningOrder(null)}
                                    className="bg-[#E9E9EB] p-1.5 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {deliveryPersons.map(person => (
                                    <button
                                        key={person.id}
                                        onClick={() => assignDelivery(person.name)}
                                        className="w-full text-left p-4 rounded-xl border border-black/5 hover:border-[var(--primary-color)] font-bold text-[#2D1B4E] transition-all bg-[#F2F2F7] hover:bg-white cursor-pointer"
                                    >
                                        {person.name}
                                    </button>
                                ))}
                                {deliveryPersons.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No hay repartidores registrados.</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assign Delivery Modal (Batch Orders) */}
            <AnimatePresence>
                {assigningBatch && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAssigningBatch(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-brand text-[#2D1B4E] uppercase">Asignar Repartidor a Lote</h2>
                                <button
                                    onClick={() => setAssigningBatch(false)}
                                    className="bg-[#E9E9EB] p-1.5 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-xs font-bold text-[#8E8E93] mb-4 uppercase tracking-wider">
                                Despachar {selectedOrderIds.length} pedidos seleccionados con:
                            </p>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {deliveryPersons.map(person => (
                                    <button
                                        key={person.id}
                                        onClick={() => assignBatchDelivery(person.name)}
                                        className="w-full text-left p-4 rounded-xl border border-black/5 hover:border-[var(--primary-color)] font-bold text-[#2D1B4E] transition-all bg-[#F2F2F7] hover:bg-white cursor-pointer"
                                    >
                                        {person.name}
                                    </button>
                                ))}
                                {deliveryPersons.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No hay repartidores registrados.</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

// Temporary internal component
function ShoppingBagBigIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    );
}
