import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { Order, OrderStatus, DeliveryPerson } from '../types';

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
            return newOrder;
        }
        return null;
    },

    updateOrderStatus: async (id, status, deliveryPerson) => {
        const payload: any = { status };
        if (deliveryPerson !== undefined) {
            payload.delivery_person = deliveryPerson;
        }

        await supabase.from('orders').update(payload).eq('id', id);
    },

    deleteOrder: async (id) => {
        await supabase.from('orders').delete().eq('id', id);
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                get().fetchOrders();
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
