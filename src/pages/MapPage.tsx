import React, { useEffect } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { MapDelivery } from '../components/MapDelivery';

export function MapPage() {
    const { orders, fetchOrders } = useOrderStore();

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-2rem)]">
            <div>
                <h1 className="text-2xl font-brand text-[#2D1B4E] uppercase tracking-wider">Mapa de Pedidos</h1>
                <p className="text-[#8E8E93] text-sm font-bold uppercase tracking-widest mt-1">
                    Visualiza la ubicación de {orders.filter(o => o.lat && o.lng).length} pedidos en el mapa.
                </p>
            </div>
            
            <div className="flex-1 bg-white p-2 md:p-6 rounded-3xl border border-black/5 shadow-sm min-h-[500px]">
                <MapDelivery orders={orders} />
            </div>
        </div>
    );
}
