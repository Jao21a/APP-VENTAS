import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ShoppingBag, Truck, BarChart3, Settings, Plus, Map, ChefHat } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { NewOrderModal } from '../kanban/NewOrderModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function AdminLayout() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const links = [
        { to: "/", icon: ShoppingBag, label: "Pedidos" },
        { to: "/deliverys", icon: Truck, label: "Repartidores" },
        { to: "/map", icon: Map, label: "Mapa" },
        { to: "/reports", icon: BarChart3, label: "Reportes" },
        { to: "/settings", icon: Settings, label: "Configuración" },
    ];

    return (
        <div className="min-h-screen bg-[#F2F2F7] flex flex-col lg:flex-row relative overflow-x-hidden">
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-black/5 sticky top-0 h-screen p-6">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-[var(--primary-color)] rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 border-white transition-colors">
                        <span className="text-xl">🔥</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-brand tracking-wider text-[#2D1B4E] uppercase leading-none transition-all">Hammeo</h1>
                    </div>
                </div>

                <nav className="flex flex-col gap-2">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wide",
                                isActive ? "bg-[var(--primary-color)] text-white shadow-lg shadow-orange-200" : "text-[#8E8E93] hover:bg-[#F2F2F7]"
                            )}
                        >
                            <link.icon className="w-5 h-5" />
                            {link.label}
                        </NavLink>
                    ))}
                    <a
                        href="/kitchen-portal"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wide text-[#8E8E93] hover:bg-[#F2F2F7] mt-4 border-t border-black/5 pt-4 hover:text-[var(--primary-color)]"
                    >
                        <ChefHat className="w-5 h-5 text-orange-500" />
                        <span>Ver Cocina ↗</span>
                    </a>
                </nav>

                <div className="mt-auto">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-[var(--primary-color)] text-white py-4 rounded-2xl shadow-xl shadow-orange-200 font-brand text-xl tracking-widest uppercase active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-6 h-6" />
                        Nuevo Pedido
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="lg:hidden sticky top-0 z-10 bg-[#F2F2F7]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-black/5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[var(--primary-color)] rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 border-white transition-colors">
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-brand tracking-wider text-[#2D1B4E] uppercase leading-none transition-all">Hammeo</h1>
                            <p className="text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest mt-1">Alitas para devorar</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[var(--primary-color)] text-white p-2 rounded-full shadow-lg active:scale-95 transition-all"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-6 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>

                {/* Mobile Navigation */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-black/5 pb-safe z-40 px-6 py-2 flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => cn(
                                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                                isActive ? "text-[var(--primary-color)] scale-110" : "text-[#8E8E93]"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <link.icon className={cn("w-6 h-6", isActive ? "stroke-[3px]" : "")} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">{link.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <NewOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
