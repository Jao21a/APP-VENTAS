import { motion } from 'framer-motion';
import { useOrderStore } from '../store/useOrderStore'; // Ajusta la ruta si es necesario

const steps = [
    { id: 1, name: 'Sabores' },
    { id: 2, name: 'Porciones' },
    { id: 3, name: 'Cliente' },
    { id: 4, name: 'Extras' },
];

export function OrderStepper() {
    const currentStep = useOrderStore((state) => state.currentStep);

    return (
        <div className="w-full px-4 py-6 bg-white shadow-sm rounded-b-3xl mb-4">
            <div className="flex justify-between items-center relative">
                {/* Línea de fondo */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0" />

                {/* Línea de progreso interactiva */}
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#F39C12] rounded-full z-0"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                />

                {steps.map((step) => {
                    const isActive = currentStep >= step.id;
                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isActive ? '#4A0E0E' : '#e5e7eb',
                                    borderColor: isActive ? '#4A0E0E' : '#e5e7eb',
                                    color: isActive ? '#ffffff' : '#9ca3af',
                                    scale: currentStep === step.id ? 1.1 : 1
                                }}
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-colors duration-300"
                            >
                                {step.id}
                            </motion.div>
                            <span className={`text-xs mt-2 font-semibold transition-colors duration-300 ${isActive ? 'text-[#4A0E0E]' : 'text-gray-400'}`}>
                                {step.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
