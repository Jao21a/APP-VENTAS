import React, { useState, useEffect } from 'react';
import { useOrderStore } from '../../store/useOrderStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

const parseCoordinates = (val: string): { lat: string; lng: string } | null => {
    // 1. Try to find standard query string coordinates: q=lat,lng or daddr=lat,lng or saddr=lat,lng or query=lat,lng
    const queryMatch = val.match(/[?&](q|daddr|saddr|query|ll)=(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (queryMatch) {
        return { lat: queryMatch[2], lng: queryMatch[3] };
    }

    // 2. Try to find coordinates in path segment: /@lat,lng or /place/lat,lng
    const pathMatch = val.match(/\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (pathMatch) {
        return { lat: pathMatch[1], lng: pathMatch[2] };
    }

    // 3. Try to find raw coordinates in text: -12.04318, -77.02824
    const rawMatch = val.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (rawMatch) {
        return { lat: rawMatch[1], lng: rawMatch[2] };
    }

    return null;
};

const MapClickPicker = ({ lat, lng, onChange }: { lat: number | null, lng: number | null, onChange: (lat: number, lng: number) => void }) => {
    const map = useMap();

    useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
        }
    });

    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);

    return lat && lng ? <Marker position={[lat, lng]} /> : null;
};

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function NewOrderModal({ isOpen, onClose }: Props) {
    const { flavors, createOrder } = useOrderStore();
    const { shopLat, shopLng } = useSettingsStore();
    const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
    const [selectedPortion, setSelectedPortion] = useState<string>('10');
    const [showMiniMap, setShowMiniMap] = useState(false);
    const [newOrder, setNewOrder] = useState({
        customer_name: '',
        customer_phone: '',
        total: '',
        additional: '',
        location_link: '',
        lat: '',
        lng: ''
    });

    const toggleFlavor = (flavor: string) => {
        setSelectedFlavors(prev => {
            if (prev.includes(flavor)) {
                return prev.filter(f => f !== flavor);
            }
            return [...prev, flavor];
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFlavors.length === 0) {
            alert('Por favor selecciona al menos un sabor');
            return;
        }

        let flavorsText = selectedFlavors.join(', ');
        if (selectedFlavors.length === 2) {
            flavorsText = `Mixto (${flavorsText})`;
        }

        let orderDetails = `${selectedPortion} Alitas - ${flavorsText}`;
        if (newOrder.additional.trim()) {
            orderDetails += ` + ${newOrder.additional.trim()}`;
        }

        const payload: any = {
            customer_name: newOrder.customer_name,
            customer_phone: newOrder.customer_phone,
            order_details: orderDetails,
            total: parseFloat(newOrder.total) || 0,
            status: 'pending'
        };

        if (newOrder.location_link) payload.location_link = newOrder.location_link;
        if (newOrder.lat && newOrder.lng) {
            payload.lat = parseFloat(newOrder.lat);
            payload.lng = parseFloat(newOrder.lng);
        }

        const created = await createOrder(payload);

        if (created) {
            onClose();
            setNewOrder({ customer_name: '', customer_phone: '', total: '', additional: '', location_link: '', lat: '', lng: '' });
            setSelectedFlavors([]);
            setSelectedPortion('10');
        } else {
            alert('Hubo un error al crear la orden.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2 z-10">
                            <h2 className="text-2xl font-brand text-[#2D1B4E] uppercase tracking-wide">Nuevo Pedido</h2>
                            <button
                                onClick={onClose}
                                className="bg-[#E9E9EB] p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Sabores (Selecciona uno o varios)</label>
                                <div className="flex flex-wrap gap-2">
                                    {flavors.map(flavor => (
                                        <button
                                            key={flavor.id}
                                            type="button"
                                            onClick={() => toggleFlavor(flavor.name)}
                                            className={cn(
                                                "px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer",
                                                selectedFlavors.includes(flavor.name) ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-md shadow-orange-100" : "bg-[#F2F2F7] text-[#2D1B4E] border-transparent hover:bg-[#E5E5EA]"
                                            )}
                                        >
                                            {flavor.name}
                                        </button>
                                    ))}
                                    {flavors.length === 0 && <span className="text-xs text-gray-400">Sin sabores disponibles.</span>}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Porción</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['5', '10', '20'].map(portion => (
                                        <button
                                            key={portion}
                                            type="button"
                                            onClick={() => setSelectedPortion(portion)}
                                            className={cn(
                                                "py-3 rounded-xl font-bold transition-all border",
                                                selectedPortion === portion
                                                    ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)] shadow-md shadow-orange-100"
                                                    : "bg-[#F2F2F7] text-[#2D1B4E] border-transparent hover:bg-[#E5E5EA]"
                                            )}
                                        >
                                            {portion} Alitas
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Nombre del Cliente</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                                        placeholder="Ej: Juan Perez"
                                        value={newOrder.customer_name}
                                        onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                                        placeholder="Ej: 987654321"
                                        value={newOrder.customer_phone}
                                        onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Enlace de Ubicación / Coordenadas</label>
                                        <div className="flex gap-2">
                                            {(newOrder.lat && newOrder.lng) && (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Mapa Activo</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setShowMiniMap(!showMiniMap)}
                                                className="text-[10px] font-bold text-[var(--primary-color)] hover:underline uppercase tracking-wider cursor-pointer"
                                            >
                                                {showMiniMap ? 'Ocultar Mapa' : 'Fijar en Mapa'}
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all text-sm"
                                        placeholder="Ej: https://maps.google.com/?q=-12.04,-77.02 o pega lat, lng..."
                                        value={newOrder.location_link}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const coords = parseCoordinates(val);
                                            if (coords) {
                                                setNewOrder({ ...newOrder, location_link: val, lat: coords.lat, lng: coords.lng });
                                                setShowMiniMap(true);
                                            } else {
                                                setNewOrder({ ...newOrder, location_link: val, lat: '', lng: '' });
                                            }
                                        }}
                                    />
                                    {newOrder.location_link && !newOrder.lat && (
                                        <p className="text-[10px] text-orange-500 ml-1">Asegúrate que el enlace tenga las coordenadas.</p>
                                    )}

                                    {showMiniMap && (
                                        <div className="w-full h-44 rounded-xl overflow-hidden border border-black/5 mt-2 relative z-0">
                                            <MapContainer
                                                center={[
                                                    parseFloat(newOrder.lat) || shopLat || -12.04318,
                                                    parseFloat(newOrder.lng) || shopLng || -77.02824
                                                ]}
                                                zoom={14}
                                                style={{ height: '100%', width: '100%' }}
                                            >
                                                <TileLayer
                                                    url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                                />
                                                <MapClickPicker
                                                    lat={parseFloat(newOrder.lat) || null}
                                                    lng={parseFloat(newOrder.lng) || null}
                                                    onChange={(lat, lng) => {
                                                        const latStr = lat.toFixed(6);
                                                        const lngStr = lng.toFixed(6);
                                                        setNewOrder({
                                                            ...newOrder,
                                                            lat: latStr,
                                                            lng: lngStr,
                                                            location_link: `${latStr}, ${lngStr}`
                                                        });
                                                    }}
                                                />
                                            </MapContainer>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Adicionales (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                                        placeholder="Ej: Doble papas, sin ensalada..."
                                        value={newOrder.additional}
                                        onChange={(e) => setNewOrder({ ...newOrder, additional: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Total (S/)</label>
                                    <input
                                        type="number"
                                        step="0.10"
                                        required
                                        className="w-full px-4 py-3 border-2 border-[var(--primary-color)] rounded-xl font-brand text-2xl text-[var(--primary-color)] focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all"
                                        placeholder="0.00"
                                        value={newOrder.total}
                                        onChange={(e) => setNewOrder({ ...newOrder, total: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#2D1B4E] text-white py-4 rounded-xl font-brand tracking-widest uppercase text-xl mt-4 active:scale-95 transition-all"
                            >
                                Confirmar Pedido
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
