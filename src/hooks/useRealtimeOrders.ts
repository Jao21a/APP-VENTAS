import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast'; // Requiere 'npm install react-hot-toast'

export function useRealtimeOrders() {
    useEffect(() => {
        // Nos suscribimos a los cambios de la tabla 'orders'
        const channel = supabase
            .channel('public:orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    const newOrder = payload.new as any;

                    if (payload.eventType === 'UPDATE') {
                        if (newOrder.status === 'ready') {
                            toast.success(`🍽️ Pedido #${newOrder.id.slice(0, 5)} LISTO para entrega`, {
                                duration: 6000,
                                style: {
                                    background: '#10B981', // Emerald 500
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    borderRadius: '16px',
                                    padding: '16px'
                                },
                            });
                        } else if (newOrder.status === 'delivered') {
                            toast.success(`✅ Pedido #${newOrder.id.slice(0, 5)} Entregado`, {
                                duration: 4000,
                                style: {
                                    background: '#4A0E0E', // Guinda corporativo
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    borderRadius: '16px',
                                }
                            });
                        }
                    }
                    // Puedes agregar un bloque para 'INSERT' si quieres que la cajera
                    // sepa que la orden entró correctamente al sistema general.
                }
            )
            .subscribe();

        // Limpiamos la suscripción al desmontar para evitar fugas de memoria
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
}
