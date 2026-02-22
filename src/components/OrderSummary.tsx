import { motion } from 'framer-motion';
import { useOrderStore } from '../store/useOrderStore';

export function OrderSummary() {
    const { orderDraft, isSubmitting, submitOrder } = useOrderStore();

    const handleConfirm = async () => {
        // Para simplificar, asumimos que el operador tiene un ID válido en la tabla public.profiles
        // Esto lo sacarías de tu Auth Context si el usuario ya inició sesión
        const dummyOperatorId = '00000000-0000-0000-0000-000000000000'; // Reemplazar con ID real UUID

        const success = await submitOrder(dummyOperatorId);
        if (success) {
            alert('¡Pedido enviado exitosamente a cocina!');
        }
    };

    return (
        <div className="w-full px-4 py-8 bg-gray-50 flex flex-col gap-6 mt-6 rounded-t-[2.5rem] shadow-[0_-10px_25px_rgba(0,0,0,0.05)] border-t border-gray-100 relative">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full" />

            <h2 className="text-2xl font-black text-[#4A0E0E] text-center mt-2">Resumen del Pedido</h2>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold">Cliente</span>
                    <span className="font-bold text-gray-800 text-lg">{orderDraft.customer_name || 'Sin nombre'}</span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold">Porciones</span>
                    <span className="font-black text-[#4A0E0E] text-xl bg-red-50 px-3 py-1 rounded-lg">
                        {orderDraft.portions} Unds
                    </span>
                </div>

                <div className="flex justify-between items-start pb-4 border-b border-gray-50">
                    <span className="text-gray-500 font-semibold mt-1">Sabores</span>
                    <div className="flex flex-col items-end gap-1">
                        {orderDraft.flavors.length > 0 ? (
                            orderDraft.flavors.map((f, i) => (
                                <span key={i} className="font-bold text-gray-700 bg-gray-100 px-3 py-1 text-sm rounded-full">
                                    {f}
                                </span>
                            ))
                        ) : (
                            <span className="text-red-500 text-sm font-semibold bg-red-50 px-2 py-1 rounded">Ninguno</span>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-sm">Total a Pagar</span>
                    <span className="font-black text-3xl text-[#F39C12]">S/ {orderDraft.total_price.toFixed(2)}</span>
                </div>
            </div>

            <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={isSubmitting || orderDraft.flavors.length === 0}
                onClick={handleConfirm}
                className={`
          w-full h-16 rounded-2xl text-white font-black text-xl tracking-wider shadow-[0_8px_20px_rgba(243,156,18,0.3)]
          flex items-center justify-center mt-2
          ${(isSubmitting || orderDraft.flavors.length === 0)
                        ? 'bg-gray-300 shadow-none text-gray-500 cursor-not-allowed'
                        : 'bg-[#F39C12] hover:bg-[#E67E22] active:bg-[#D35400]'}
          transition-all duration-200
        `}
            >
                {isSubmitting ? 'PROCESANDO...' : 'CONFIRMAR PEDIDO'}
            </motion.button>
        </div>
    );
}
