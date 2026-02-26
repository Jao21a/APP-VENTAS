import { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { Order, OrderStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Truck, Clock, CheckCircle2, Phone, Trash2, ChevronRight, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function Dashboard() {
    const { orders, isLoading, deleteOrder, updateOrderStatus, deliveryPersons } = useOrderStore();
    const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);

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

    return (
        <>
            <div className="hidden lg:flex justify-between items-center mb-8">
                <h2 className="text-3xl font-brand text-[#2D1B4E] uppercase tracking-widest">Panel de Pedidos</h2>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-xl border border-black/5 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse" />
                        <span className="text-xs font-bold text-[#2D1B4E] uppercase">{orders.length} Pedidos Activos</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 space-y-4 opacity-50">
                    <ShoppingBagBigIcon className="w-16 h-16 mx-auto text-[#8E8E93]" />
                    <p className="text-lg font-medium">No hay pedidos registrados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-20">
                    <AnimatePresence mode="popLayout">
                        {orders.map((order) => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="ios-card p-5 space-y-4 bg-white hover:shadow-xl transition-shadow border border-black/5 rounded-3xl shadow-sm"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-xl text-[#2D1B4E]">{order.customer_name}</h3>
                                        <div className="flex items-center text-[#8E8E93] text-sm gap-2 mt-1">
                                            <Phone className="w-4 h-4" />
                                            <span className="font-medium">{order.customer_phone}</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "status-badge flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm",
                                        order.status === 'pending' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                            order.status === 'preparing' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                order.status === 'shipping' ? 'bg-orange-50 text-orange-600 border-orange-200' :
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
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="text-2xl font-brand text-[var(--primary-color)]">
                                        S/ {order.total.toFixed(2)}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => deleteOrder(order.id)}
                                            className="p-2.5 text-[#FF3B30] hover:bg-red-50 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>

                                        {order.status !== 'delivered' && (
                                            <button
                                                onClick={() => handleNextStatus(order)}
                                                className="flex items-center gap-2 bg-[var(--primary-color)] text-white px-5 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-lg shadow-orange-100"
                                            >
                                                Siguiente
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Assign Delivery Modal */}
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
                            className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-brand text-[#2D1B4E] uppercase">Asignar Repartidor</h2>
                                <button
                                    onClick={() => setAssigningOrder(null)}
                                    className="bg-[#E9E9EB] p-1.5 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {deliveryPersons.map(person => (
                                    <button
                                        key={person.id}
                                        onClick={() => assignDelivery(person.name)}
                                        className="w-full text-left p-4 rounded-xl border border-black/5 hover:border-[var(--primary-color)] font-bold text-[#2D1B4E] transition-all bg-[#F2F2F7] hover:bg-white"
                                    >
                                        {person.name}
                                    </button>
                                ))}
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
