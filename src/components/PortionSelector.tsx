import { motion } from 'framer-motion';
import { useOrderStore } from '../store/useOrderStore';

const PORTIONS = [5, 10, 20];

export function PortionSelector() {
    const { setPortions, orderDraft: { portions } } = useOrderStore();

    return (
        <div className="w-full px-4 flex flex-col gap-6 py-4">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight text-center">¿Cuántas alitas?</h2>

            <div className="flex justify-evenly items-center gap-4 mt-2">
                {PORTIONS.map((amount) => {
                    const isSelected = portions === amount;
                    return (
                        <motion.button
                            key={amount}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setPortions(amount)}
                            className={`
                 w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg border-4 transition-all duration-300 relative
                 ${isSelected
                                    ? 'bg-[#4A0E0E] border-[#F39C12] text-white scale-110 z-10'
                                    : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
                                }
               `}
                        >
                            <span className="text-3xl font-black">{amount}</span>
                            <span className={`text-xs font-bold uppercase mt-1 tracking-wider ${isSelected ? 'text-[#F39C12]' : 'text-gray-400'}`}>
                                Unds
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
