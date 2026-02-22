import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Order } from '../store/useOrderStore'; // O define el tipo aquí si no está exportado
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function OrderBoard() {
    const [orders, setOrders] = useState<Order[]>([]);

    // Función para obtener órdenes iniciales
    const fetchActiveOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_flavors(flavor_id), order_extras(extra_id, quantity)')
            .in('status', ['pending', 'cooking', 'ready'])
            .order('created_at', { ascending: true }); // Los más antiguos arriba

        if (error) {
            console.error('Error cargando pedidos:', error);
            toast.error('Error conectando con la base de datos');
        } else {
            setOrders(data as any || []);
        }
    };

    useEffect(() => {
        fetchActiveOrders();

        // Suscripción en tiempo real
        const subscription = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                // Recargar todo es más seguro y fácil por las relaciones (sabores/extras)
                // en una app real optimizarías actualizando el array de estado localmente
                fetchActiveOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const updateOrderStatus = async (id: string, newStatus: Order['status']) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast.error('No se pudo actualizar el estado');
            console.error(error);
        } else {
            toast.success('Estado actualizado');
        }
    };

    // Filtrar órdenes por estado
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const cookingOrders = orders.filter(o => o.status === 'cooking');
    const readyOrders = orders.filter(o => o.status === 'ready');

    return (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-screen bg-gray-50">

            {/* COLUMNA 1: PENDIENTES */}
            <Column title="Pendientes" color="bg-red-100 text-red-800" borderColor="border-red-200">
                <AnimatePresence>
                    {pendingOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            actionText="Empezar Cocina"
                            actionColor="bg-orange-500 hover:bg-orange-600"
                            onAction={() => updateOrderStatus(order.id, 'cooking')}
                        />
                    ))}
                </AnimatePresence>
            </Column>

            {/* COLUMNA 2: EN COCINA */}
            <Column title="En Cocina" color="bg-[#F39C12]/20 text-orange-800" borderColor="border-[#F39C12]/30">
                <AnimatePresence>
                    {cookingOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            actionText="Listo para Envío"
                            actionColor="bg-[#4A0E0E] hover:bg-red-900"
                            onAction={() => updateOrderStatus(order.id, 'ready')}
                        />
                    ))}
                </AnimatePresence>
            </Column>

            {/* COLUMNA 3: PARA DELIVERY */}
            <Column title="Para Delivery" color="bg-green-100 text-green-800" borderColor="border-green-200">
                <AnimatePresence>
                    {readyOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            actionText="Marcar Entregado"
                            actionColor="bg-green-600 hover:bg-green-700"
                            onAction={() => updateOrderStatus(order.id, 'delivered')}
                        />
                    ))}
                </AnimatePresence>
            </Column>

        </div>
    );
}

// Subcomponente de Columna
function Column({ title, children, color, borderColor }: any) {
    return (
        <div className={`flex flex-col gap-4 bg-white rounded-3xl shadow-sm p-4 border ${borderColor}`}>
            <h2 className={`font-black text-xl py-2 px-4 rounded-xl text-center ${color}`}>
                {title}
            </h2>
            <div className="flex flex-col gap-4 overflow-y-auto pb-4">
                {children}
            </div>
        </div>
    );
}

// Subcomponente de Tarjeta de Pedido
function OrderCard({ order, actionText, actionColor, onAction }: any) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex flex-col gap-3"
        >
            <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-gray-500">#{order.id.slice(0, 5).toUpperCase()}</span>
                <span className="font-black text-lg">{order.customer_name}</span>
            </div>

            <div className="flex gap-2 text-sm font-semibold">
                <span className="bg-[#4A0E0E] text-white px-2 py-1 rounded">
                    {order.portions} Unds
                </span>
            </div>

            {/* En una app real, aquí mapearías los IDs de sabores y extras a sus nombres reales haciendo un join en Supabase o buscando en un diccionario local */}
            <div className="text-gray-600 text-sm">
                <p><span className="font-bold">Total:</span> S/ {order.total_price}</p>
            </div>

            <button
                onClick={onAction}
                className={`mt-2 w-full text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 ${actionColor}`}
            >
                {actionText}
            </button>
        </motion.div>
    );
}
