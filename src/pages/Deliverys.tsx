import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { Truck, Plus, Trash2 } from 'lucide-react';

export function Deliverys() {
    const { deliveryPersons, addDeliveryPerson, deleteDeliveryPerson } = useOrderStore();
    const [newDeliveryName, setNewDeliveryName] = useState('');

    const handleAddDelivery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newDeliveryName.trim()) {
            await addDeliveryPerson(newDeliveryName.trim());
            setNewDeliveryName('');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm">
                    <h2 className="text-2xl font-brand text-[#2D1B4E] mb-6 uppercase tracking-wider">Nuevo Repartidor</h2>
                    <form onSubmit={handleAddDelivery} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Nombre Completo</label>
                            <input
                                type="text"
                                placeholder="Ej: Juan Perez"
                                className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-black/5 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                                value={newDeliveryName}
                                onChange={e => setNewDeliveryName(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="w-full bg-[var(--primary-color)] text-white py-4 rounded-2xl shadow-lg shadow-orange-100 font-brand text-xl tracking-widest uppercase active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Plus className="w-6 h-6" />
                            Añadir
                        </button>
                    </form>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-black text-[#8E8E93] uppercase tracking-widest ml-1">Repartidores Activos</h3>
                {deliveryPersons.length === 0 ? (
                    <div className="ios-card p-12 text-center bg-white border border-black/5 rounded-3xl shadow-sm">
                        <Truck className="w-12 h-12 mx-auto text-[#E5E5EA] mb-4" />
                        <p className="text-[#8E8E93] font-medium italic">No hay repartidores registrados</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {deliveryPersons.map(person => (
                            <div key={person.id} className="ios-card p-5 flex justify-between items-center bg-white border border-black/5 hover:shadow-md transition-shadow rounded-3xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#F2F2F7] rounded-full flex items-center justify-center text-[#2D1B4E] font-bold">
                                        {person.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-lg text-[#2D1B4E]">{person.name}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm(`¿Eliminar al repartidor ${person.name}?`)) deleteDeliveryPerson(person.id);
                                    }}
                                    className="text-[#FF3B30] p-2 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
