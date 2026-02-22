import { create } from 'zustand';
// NOTA: Ajusta la ruta de importación de acuerdo a tu proyecto
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

// ============================================================================
// 1. DEFINICIÓN DE TIPOS E INTERFACES (TypeScript)
// ============================================================================

export type UserRole = 'admin' | 'operator' | 'delivery';
export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'delivered';

export interface Profile {
    id: string;
    full_name: string;
    role: UserRole;
}

export interface Product {
    id: string;
    name: string;
    base_price: number;
    category: string;
}

// Representa el pedido ya guardado en la base de datos
export interface Order {
    id: string;
    created_at: string;
    customer_name: string;
    customer_phone: string | null;
    portions: number;
    total_price: number;
    status: OrderStatus;
    operator_id: string;
    delivery_id: string | null;
}

// Representa el estado temporal de los extras seleccionados
export interface SelectedExtra {
    extra_id: string;
    quantity: number;
    price: number; // Guardamos el precio temporalmente para calcular el total
}

// Representa el borrador del pedido que se está construyendo en el formulario
export interface NewOrder {
    customer_name: string;
    customer_phone: string;
    portions: number;
    flavors: string[]; // Arreglo de IDs de los sabores seleccionados
    extras: SelectedExtra[]; // Arreglo de extras seleccionados
    total_price: number;
}

// ============================================================================
// 2. DEFINICIÓN DEL ESTADO GLOBAL (Store) Y SUS ACCIONES
// ============================================================================

interface OrderState {
    // Estado
    currentStep: number;
    orderDraft: NewOrder;
    isSubmitting: boolean;
    error: string | null;

    // Acciones de Navegación y Validación
    nextStep: () => boolean;
    prevStep: () => void;
    goToStep: (step: number) => void;

    // Acciones de Mutación del Borrador
    setCustomerData: (name: string, phone: string) => void;
    setPortions: (portions: number) => void;
    addFlavor: (flavorId: string) => void;
    removeFlavor: (flavorId: string) => void;
    addExtra: (extraId: string, quantity: number, price: number) => void;
    resetOrder: () => void;

    // Acción de Envío a Supabase
    submitOrder: (operatorId: string) => Promise<boolean>;
}

const initialOrderState: NewOrder = {
    customer_name: '',
    customer_phone: '',
    portions: 1,
    flavors: [],
    extras: [],
    total_price: 0,
};

export const useOrderStore = create<OrderState>((set, get) => ({
    currentStep: 1,
    orderDraft: initialOrderState,
    isSubmitting: false,
    error: null,

    // --------------------------------------------------------------------------
    // NAVEGACIÓN Y VALIDACIÓN
    // --------------------------------------------------------------------------
    nextStep: () => {
        const { currentStep, orderDraft } = get();

        // Validaciones por paso antes de avanzar
        if (currentStep === 1) {
            if (!orderDraft.customer_name.trim()) {
                set({ error: 'El nombre del cliente es obligatorio.' });
                return false;
            }
        }

        if (currentStep === 2) {
            if (orderDraft.flavors.length === 0) {
                set({ error: 'Debes seleccionar al menos un sabor.' });
                return false;
            }
            if (orderDraft.portions < 1) {
                set({ error: 'La cantidad de porciones debe ser mayor a 0.' });
                return false;
            }
        }

        // Si pasa las validaciones, limpia el error y avanza
        // Suponemos hasta 4 pasos en este flujo
        set({ error: null, currentStep: Math.min(currentStep + 1, 4) });
        return true;
    },

    prevStep: () => {
        const { currentStep } = get();
        set({ error: null, currentStep: Math.max(currentStep - 1, 1) });
    },

    goToStep: (step) => set({ currentStep: step, error: null }),

    // --------------------------------------------------------------------------
    // CONSTRUCCIÓN DEL PEDIDO
    // --------------------------------------------------------------------------
    setCustomerData: (name, phone) =>
        set((state) => ({
            orderDraft: { ...state.orderDraft, customer_name: name, customer_phone: phone },
            error: null
        })),

    setPortions: (portions) =>
        set((state) => ({
            orderDraft: { ...state.orderDraft, portions },
            error: null
        })),

    addFlavor: (flavorId) =>
        set((state) => {
            const currentFlavors = state.orderDraft.flavors;
            if (!currentFlavors.includes(flavorId)) {
                return { orderDraft: { ...state.orderDraft, flavors: [...currentFlavors, flavorId] }, error: null };
            }
            return state; // Sin cambios
        }),

    removeFlavor: (flavorId) =>
        set((state) => {
            const currentFlavors = state.orderDraft.flavors;
            return {
                orderDraft: { ...state.orderDraft, flavors: currentFlavors.filter(id => id !== flavorId) },
                error: null
            };
        }),

    addExtra: (extraId, quantity, price) =>
        set((state) => {
            const currentExtras = state.orderDraft.extras;
            const existingExtraIndex = currentExtras.findIndex(e => e.extra_id === extraId);

            let newExtras = [...currentExtras];

            if (quantity <= 0) {
                // Remover si la cantidad es 0 o menor
                newExtras = newExtras.filter(e => e.extra_id !== extraId);
            } else if (existingExtraIndex >= 0) {
                // Actualizar cantidad
                newExtras[existingExtraIndex] = { extra_id: extraId, quantity, price };
            } else {
                // Añadir nuevo extra
                newExtras.push({ extra_id: extraId, quantity, price });
            }

            return { orderDraft: { ...state.orderDraft, extras: newExtras } };
        }),

    resetOrder: () => set({
        orderDraft: initialOrderState,
        currentStep: 1,
        error: null,
        isSubmitting: false
    }),

    // --------------------------------------------------------------------------
    // ENVÍO A SUPABASE
    // --------------------------------------------------------------------------
    submitOrder: async (operatorId: string) => {
        set({ isSubmitting: true, error: null });
        const { orderDraft } = get();

        try {
            // 1. Insertar el pedido en la tabla `orders`
            const { data: newOrderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_name: orderDraft.customer_name,
                    customer_phone: orderDraft.customer_phone || null,
                    portions: orderDraft.portions,
                    total_price: orderDraft.total_price,
                    operator_id: operatorId,
                    status: 'pending' // Estado inicial
                }])
                .select('id')
                .single();

            if (orderError) throw orderError;
            const orderId = newOrderData.id;

            // 2. Insertar los sabores seleccionados en `order_flavors`
            if (orderDraft.flavors.length > 0) {
                const flavorsToInsert = orderDraft.flavors.map((flavorId) => ({
                    order_id: orderId,
                    flavor_id: flavorId
                }));

                const { error: flavorsError } = await supabase
                    .from('order_flavors')
                    .insert(flavorsToInsert);

                if (flavorsError) throw flavorsError;
            }

            // 3. Insertar los extras seleccionados en `order_extras`
            if (orderDraft.extras.length > 0) {
                const extrasToInsert = orderDraft.extras.map((extra) => ({
                    order_id: orderId,
                    extra_id: extra.extra_id,
                    quantity: extra.quantity
                }));

                const { error: extrasError } = await supabase
                    .from('order_extras')
                    .insert(extrasToInsert);

                if (extrasError) throw extrasError;
            }

            // 🎉 Todo se guardó correctamente
            get().resetOrder();

            toast.success('¡Pedido enviado con éxito!', {
                duration: 4000,
                style: {
                    background: '#10B981', // Verde
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: '16px'
                }
            });

            return true;

        } catch (error: any) {
            console.error('Error enviando el pedido:', error);

            // Si es un error de conexión, el Service Worker (background sync) lo manejará después
            const isOffline = error.message === 'FetchError: Failed to fetch' || !navigator.onLine;
            const offlineMsg = isOffline
                ? 'Error de conexión, el pedido se sincronizará luego.'
                : error?.message || 'Ocurrió un error al procesar el pedido.';

            toast.error(offlineMsg, {
                duration: 5000,
                style: {
                    background: '#4A0E0E', // Guinda
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: '16px'
                }
            });

            set({
                error: offlineMsg,
                isSubmitting: false
            });
            return false;
        }
    }
}));
