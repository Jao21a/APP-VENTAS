import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { Order, OrderStatus, DeliveryPerson } from '../types';
import { useSettingsStore } from './useSettingsStore';

export interface Flavor {
    id: number;
    name: string;
}

interface OrderStore {
    orders: Order[];
    deliveryPersons: DeliveryPerson[];
    flavors: Flavor[];
    isLoading: boolean;

    fetchOrders: () => Promise<void>;
    createOrder: (data: Omit<Order, 'id' | 'created_at'>) => Promise<Order | null>;
    updateOrderStatus: (id: number, status: OrderStatus, deliveryPerson?: string) => Promise<void>;
    updateOrdersStatusInBatch: (ids: number[], status: OrderStatus, deliveryPerson?: string) => Promise<void>;
    deleteOrder: (id: number) => Promise<void>;

    fetchDeliveryPersons: () => Promise<void>;
    addDeliveryPerson: (name: string) => Promise<void>;
    deleteDeliveryPerson: (id: number) => Promise<void>;

    fetchFlavors: () => Promise<void>;
    addFlavor: (name: string) => Promise<void>;
    deleteFlavor: (id: number) => Promise<void>;

    subscribeToUpdates: () => void;
    unsubscribeFromUpdates: () => void;
}

let channel: any = null;

export const useOrderStore = create<OrderStore>((set, get) => ({
    orders: [],
    deliveryPersons: [],
    flavors: [],
    isLoading: true,

    fetchOrders: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ orders: data });
        }
        set({ isLoading: false });
    },

    createOrder: async (data) => {
        const { data: newOrder, error } = await supabase
            .from('orders')
            .insert([data])
            .select()
            .single();

        if (!error && newOrder) {
            set((state) => {
                if (state.orders.some(o => o.id === newOrder.id)) return {};
                const updatedOrders = [newOrder, ...state.orders];
                updatedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                return { orders: updatedOrders };
            });
            return newOrder;
        }
        return null;
    },

    updateOrderStatus: async (id, status, deliveryPerson) => {
        // Optimistic update
        set((state) => ({
            orders: state.orders.map(o => 
                o.id === id 
                    ? { ...o, status, ...(deliveryPerson !== undefined ? { delivery_person: deliveryPerson } : {}) } 
                    : o
            )
        }));

        const payload: any = { status };
        if (deliveryPerson !== undefined) {
            payload.delivery_person = deliveryPerson;
        }

        try {
            const { error } = await supabase.from('orders').update(payload).eq('id', id);
            if (error) throw error;

            const order = get().orders.find(o => o.id === id);
            if (order) {
                await useSettingsStore.getState().recordOrderTimestamp(id, status, order.created_at);
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            get().fetchOrders();
        }
    },

    updateOrdersStatusInBatch: async (ids, status, deliveryPerson) => {
        // Optimistic update
        set((state) => ({
            orders: state.orders.map(o => 
                ids.includes(o.id) 
                    ? { ...o, status, ...(deliveryPerson !== undefined ? { delivery_person: deliveryPerson } : {}) } 
                    : o
            )
        }));

        const payload: any = { status };
        if (deliveryPerson !== undefined) {
            payload.delivery_person = deliveryPerson;
        }

        try {
            const { error } = await supabase.from('orders').update(payload).in('id', ids);
            if (error) throw error;

            for (const id of ids) {
                const order = get().orders.find(o => o.id === id);
                if (order) {
                    await useSettingsStore.getState().recordOrderTimestamp(id, status, order.created_at);
                }
            }
        } catch (error) {
            console.error("Error updating orders in batch:", error);
            get().fetchOrders();
        }
    },

    deleteOrder: async (id) => {
        // Optimistic update
        set((state) => ({
            orders: state.orders.filter(o => o.id !== id)
        }));

        try {
            const { error } = await supabase.from('orders').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error("Error deleting order:", error);
            get().fetchOrders();
        }
    },

    fetchDeliveryPersons: async () => {
        const { data } = await supabase.from('delivery_persons').select('*').order('name');
        if (data) set({ deliveryPersons: data });
    },

    addDeliveryPerson: async (name) => {
        await supabase.from('delivery_persons').insert([{ name }]);
    },

    deleteDeliveryPerson: async (id) => {
        await supabase.from('delivery_persons').delete().eq('id', id);
    },

    fetchFlavors: async () => {
        const { data } = await supabase.from('flavors').select('*').order('name');
        if (data) set({ flavors: data });
    },

    addFlavor: async (name) => {
        await supabase.from('flavors').insert([{ name }]);
    },

    deleteFlavor: async (id) => {
        await supabase.from('flavors').delete().eq('id', id);
    },

    subscribeToUpdates: () => {
        if (channel) return;
        channel = supabase
            .channel('public:all')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                if (eventType === 'INSERT') {
                    const newOrder = newRecord as Order;
                    set((state) => {
                        if (state.orders.some(o => o.id === newOrder.id)) return {};
                        const updatedOrders = [newOrder, ...state.orders];
                        updatedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                        return { orders: updatedOrders };
                    });
                } else if (eventType === 'UPDATE') {
                    const updatedOrder = newRecord as Order;
                    set((state) => ({
                        orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                    }));
                } else if (eventType === 'DELETE') {
                    const deletedId = oldRecord.id;
                    set((state) => ({
                        orders: state.orders.filter(o => o.id !== deletedId)
                    }));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'flavors' }, () => {
                get().fetchFlavors();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_persons' }, () => {
                get().fetchDeliveryPersons();
            })
            .subscribe();

        get().fetchOrders();
        get().fetchFlavors();
        get().fetchDeliveryPersons();
    },

    unsubscribeFromUpdates: () => {
        if (channel) {
            supabase.removeChannel(channel);
            channel = null;
        }
    }
}));
