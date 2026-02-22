import { motion } from 'framer-motion';
import { useOrderStore } from '../store/useOrderStore';

// Identificadores que coincidan con los nombres/IDs que uses en BD
const FLAVORS = [
    { id: '1', name: 'Acevichado' },
    { id: '2', name: 'BBQ' },
    { id: '3', name: 'Maracumango' },
    { id: '4', name: 'Buffalo' },
    { id: '5', name: 'Clásica' },
    { id: '6', name: 'Chicharrón' },
];

export function FlavorSelector() {
    const { orderDraft, addFlavor, removeFlavor } = useOrderStore();
    const { flavors } = orderDraft;

    const handleToggle = (flavorName: string) => {
        if (flavors.includes(flavorName)) {
            removeFlavor(flavorName);
        } else {
            addFlavor(flavorName);
        }
    };

    return (
        <div className="w-full px-4 flex flex-col gap-5 py-4">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Selecciona Sabores</h2>

            <div className="grid grid-cols-2 gap-4">
                {FLAVORS.map((flavor) => {
                    const isSelected = flavors.includes(flavor.name); // Usamos el nombre para simplificar la UI/visualización en este demo
                    return (
                        <motion.button
                            key={flavor.id}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleToggle(flavor.name)}
                            className={`
                h-28 rounded-2xl shadow-sm text-lg font-black transition-all duration-200
                flex flex-col items-center justify-center border-2 px-2 text-center
                ${isSelected
                                    ? 'bg-[#4A0E0E] text-white border-[#4A0E0E] ring-4 ring-[#4A0E0E]/20'
                                    : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200'
                                }
              `}
                        >
                            {flavor.name}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 bg-[#F39C12] rounded-full mt-2"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
