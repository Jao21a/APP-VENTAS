import React, { useState, useMemo } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useOrderStore } from '../store/useOrderStore';
import { Palette, Type as TypeIcon, ChefHat, Plus, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const COLOR_PALETTES = [
    { name: 'Hammeo Original', primary: '#FF9100', secondary: '#2D1B4E' },
    { name: 'Bosque', primary: '#2D5A27', secondary: '#1B3019' },
    { name: 'Océano', primary: '#007AFF', secondary: '#003366' },
    { name: 'Atardecer', primary: '#FF3B30', secondary: '#5856D6' },
    { name: 'Elegante', primary: '#1C1C1E', secondary: '#8E8E93' },
];

const FONTS = [
    { name: 'Luckiest Guy', value: "'Luckiest Guy', cursive" },
    { name: 'Inter', value: "'Inter', sans-serif" },
    { name: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
    { name: 'Playfair Display', value: "'Playfair Display', serif" },
    { name: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
];

export function Settings() {
    const { primaryColor, fontFamily, updateSetting } = useSettingsStore();
    const { flavors, addFlavor, deleteFlavor } = useOrderStore();
    const [newFlavorName, setNewFlavorName] = useState('');

    const handleAddFlavor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newFlavorName.trim()) {
            await addFlavor(newFlavorName.trim());
            setNewFlavorName('');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
            <div className="space-y-6">
                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase mb-6 flex items-center gap-2 tracking-widest">
                        <Palette className="w-4 h-4 text-[var(--primary-color)]" />
                        Paleta de Colores
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {COLOR_PALETTES.map(palette => (
                            <button
                                key={palette.name}
                                onClick={() => updateSetting('primary_color', palette.primary)}
                                className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between",
                                    primaryColor === palette.primary
                                        ? "border-[var(--primary-color)] bg-orange-50"
                                        : "border-transparent bg-[#F2F2F7] hover:bg-[#E5E5EA]"
                                )}
                            >
                                <span className="font-bold text-sm text-[#2D1B4E]">{palette.name}</span>
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.primary }} />
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.secondary }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase mb-6 flex items-center gap-2 tracking-widest">
                        <TypeIcon className="w-4 h-4 text-[var(--primary-color)]" />
                        Tipografía
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {FONTS.map(font => (
                            <button
                                key={font.name}
                                onClick={() => updateSetting('font_family', font.name)}
                                className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left",
                                    fontFamily === font.name
                                        ? "border-[var(--primary-color)] bg-orange-50"
                                        : "border-transparent bg-[#F2F2F7] hover:bg-[#E5E5EA]"
                                )}
                                style={{ fontFamily: font.value }}
                            >
                                <span className="font-bold text-lg">{font.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase mb-6 flex items-center gap-2 tracking-widest">
                        <ChefHat className="w-4 h-4 text-[var(--primary-color)]" />
                        Gestión de Sabores
                    </h3>
                    <form onSubmit={handleAddFlavor} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Nuevo sabor..."
                            className="ios-input flex-1 px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                            value={newFlavorName}
                            onChange={e => setNewFlavorName(e.target.value)}
                        />
                        <button type="submit" className="bg-[var(--primary-color)] text-white p-3 rounded-xl shadow-lg active:scale-95 transition-all">
                            <Plus className="w-6 h-6" />
                        </button>
                    </form>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {flavors.map(flavor => (
                            <div key={flavor.id} className="flex justify-between items-center p-3 bg-[#F2F2F7] rounded-xl border border-black/5">
                                <span className="font-bold text-[#2D1B4E]">{flavor.name}</span>
                                <button
                                    onClick={() => {
                                        if (confirm(`¿Eliminar ${flavor.name}?`)) deleteFlavor(flavor.id);
                                    }}
                                    className="text-[#FF3B30] p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {flavors.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No hay sabores.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
