import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

export function AdminReport() {
    const [sales, setSales] = useState({
        totalRevenue: 0,
        portions5: 0,
        portions10: 0,
        portions20: 0,
        totalOrders: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodaySales();
    }, []);

    const fetchTodaySales = async () => {
        setLoading(true);
        // Obtener la fecha de inicio del día local
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('orders')
            .select('portions, total_price')
            .gte('created_at', startOfToday.toISOString())
            .not('status', 'eq', 'cancelled'); // Opcional, excluir cancelados si lo tienes

        if (error) {
            toast.error('Error cargando ventas');
            console.error(error);
        } else if (data) {
            let revenue = 0;
            let p5 = 0;
            let p10 = 0;
            let p20 = 0;

            data.forEach(order => {
                revenue += Number(order.total_price);
                if (order.portions === 5) p5++;
                if (order.portions === 10) p10++;
                if (order.portions === 20) p20++;
            });

            setSales({
                totalRevenue: revenue,
                portions5: p5,
                portions10: p10,
                portions20: p20,
                totalOrders: data.length
            });
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <span className="text-[#4A0E0E] font-bold text-xl animate-pulse">Cargando Reporte...</span>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen flex flex-col gap-6 items-center">
            <h1 className="text-3xl font-black text-[#4A0E0E] tracking-tight mt-4">
                Cierre de Caja Hoy
            </h1>

            {/* Tarjeta de Ingresos Totales */}
            <div className="w-full max-w-md bg-gradient-to-br from-[#F39C12] to-[#E67E22] text-white rounded-[2rem] p-8 shadow-2xl flex flex-col items-center gap-2 relative overflow-hidden">
                {/* Adorno visual */}
                <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-white opacity-10 rounded-full" />
                <div className="absolute bottom-[-30px] left-[-20px] w-24 h-24 bg-white opacity-10 rounded-full" />

                <span className="text-sm font-bold uppercase tracking-widest text-[#FFF3E0]">
                    Total Recaudado
                </span>
                <span className="text-5xl font-black tracking-tighter">
                    S/ {sales.totalRevenue.toFixed(2)}
                </span>
                <span className="text-sm mt-2 opacity-90 font-medium">
                    {sales.totalOrders} pedidos completados
                </span>
            </div>

            {/* Desglose de Porciones */}
            <h2 className="text-xl font-bold text-gray-700 mt-4 w-full max-w-md">Desglose de Porciones</h2>

            <div className="w-full max-w-md grid grid-cols-3 gap-4">
                <PortionStatCard count={sales.portions5} label="5 Unds" color="text-gray-600" />
                <PortionStatCard count={sales.portions10} label="10 Unds" color="text-[#F39C12]" />
                <PortionStatCard count={sales.portions20} label="20 Unds" color="text-[#4A0E0E]" />
            </div>

            <button
                onClick={fetchTodaySales}
                className="mt-8 bg-white border-2 border-gray-200 text-gray-600 font-bold py-3 px-8 rounded-full shadow-sm hover:bg-gray-50 active:scale-95 transition-transform"
            >
                Actualizar Datos
            </button>
        </div>
    );
}

function PortionStatCard({ count, label, color }: any) {
    return (
        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-gray-100">
            <span className={`text-4xl font-black ${color}`}>{count}</span>
            <span className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-wider">{label}</span>
            <span className="text-[10px] text-gray-400 mt-1">Vendidas</span>
        </div>
    );
}
