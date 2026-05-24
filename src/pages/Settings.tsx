import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useOrderStore } from '../store/useOrderStore';
import { Palette, Type as TypeIcon, ChefHat, Plus, Trash2, MapPin } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MarkerPositioner = ({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) => {
    const map = useMap();

    useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
        }
    });

    useEffect(() => {
        if (!isNaN(lat) && !isNaN(lng)) {
            map.setView([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);

    return !isNaN(lat) && !isNaN(lng) ? <Marker position={[lat, lng]} /> : null;
};

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
    const { primaryColor, fontFamily, shopLat, shopLng, updateSetting } = useSettingsStore();
    const { flavors, addFlavor, deleteFlavor } = useOrderStore();
    const [newFlavorName, setNewFlavorName] = useState('');
    const [localLat, setLocalLat] = useState<string>('');
    const [localLng, setLocalLng] = useState<string>('');

    useEffect(() => {
        if (shopLat) setLocalLat(shopLat.toString());
        if (shopLng) setLocalLng(shopLng.toString());
    }, [shopLat, shopLng]);

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

                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase mb-6 flex items-center gap-2 tracking-widest">
                        <MapPin className="w-4 h-4 text-[var(--primary-color)]" />
                        Ubicación del Local
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Latitud</label>
                                <input
                                    type="text"
                                    placeholder="-12.04318"
                                    className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all text-sm"
                                    value={localLat}
                                    onChange={e => setLocalLat(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Longitud</label>
                                <input
                                    type="text"
                                    placeholder="-77.02824"
                                    className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all text-sm"
                                    value={localLng}
                                    onChange={e => setLocalLng(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="w-full h-48 rounded-2xl overflow-hidden border border-black/5 relative z-0">
                            <MapContainer
                                center={[parseFloat(localLat) || -12.04318, parseFloat(localLng) || -77.02824]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                />
                                <MarkerPositioner lat={parseFloat(localLat)} lng={parseFloat(localLng)} onChange={(lat, lng) => {
                                    setLocalLat(lat.toFixed(6));
                                    setLocalLng(lng.toFixed(6));
                                }} />
                            </MapContainer>
                        </div>

                        <button
                            onClick={async () => {
                                if (localLat && localLng) {
                                    await updateSetting('shop_lat', localLat);
                                    await updateSetting('shop_lng', localLng);
                                    alert('Ubicación del local guardada con éxito.');
                                } else {
                                    alert('Por favor introduce latitud y longitud válidas.');
                                }
                            }}
                            className="w-full bg-[var(--primary-color)] text-white py-3.5 rounded-xl font-brand text-lg tracking-widest uppercase active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Guardar Ubicación
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
