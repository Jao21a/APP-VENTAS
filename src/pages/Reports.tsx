import { useMemo } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { TrendingUp, ChefHat, BarChart3, ShoppingBag, Users, Truck, Clock } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#FF9100', '#2D1B4E', '#8E8E93', '#FF3B30', '#34C759', '#5856D6'];
const PORTIONS = ['5', '10', '20'];

export function Reports() {
    const { orders, flavors } = useOrderStore();
    const { primaryColor, orderTimelines, orderPayments } = useSettingsStore();

    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const flavorCounts: Record<string, number> = {};
        const portionCounts: Record<string, number> = {};
        const deliveryCounts: Record<string, number> = {};

        // Timing variables
        let totalPrepTime = 0;
        let prepTimeCount = 0;
        let totalShipTime = 0;
        let shipTimeCount = 0;
        let totalDeliveredTime = 0;
        let deliveredTimeCount = 0;

        const driverDeliveryTimes: Record<string, { totalTime: number; count: number }> = {};

        // Cash reconciliation variables
        let totalCash = 0;
        let totalYape = 0;
        let totalPendingYape = 0;
        const paymentMethodCounts: Record<string, number> = {
            'efectivo': 0,
            'yape': 0,
            'mixto': 0,
            'pendiente_yape': 0
        };

        orders.forEach(order => {
            flavors.forEach(flavor => {
                if (order.order_details.includes(flavor.name)) {
                    flavorCounts[flavor.name] = (flavorCounts[flavor.name] || 0) + 1;
                }
            });

            PORTIONS.forEach(portion => {
                if (order.order_details.startsWith(`${portion} Alitas`)) {
                    portionCounts[`${portion} Alitas`] = (portionCounts[`${portion} Alitas`] || 0) + 1;
                }
            });

            if (order.delivery_person) {
                deliveryCounts[order.delivery_person] = (deliveryCounts[order.delivery_person] || 0) + 1;
            }

            // Calculate durations from timelines
            const timeline = orderTimelines[order.id];
            if (timeline) {
                // Prep time (preparing -> shipping)
                if (timeline.preparing_at && timeline.shipping_at) {
                    const prepDuration = (new Date(timeline.shipping_at).getTime() - new Date(timeline.preparing_at).getTime()) / 60000;
                    if (prepDuration >= 0) {
                        totalPrepTime += prepDuration;
                        prepTimeCount++;
                    }
                }
                
                // Shipping time (shipping -> delivered)
                if (timeline.shipping_at && timeline.delivered_at) {
                    const shipDuration = (new Date(timeline.delivered_at).getTime() - new Date(timeline.shipping_at).getTime()) / 60000;
                    if (shipDuration >= 0) {
                        totalShipTime += shipDuration;
                        shipTimeCount++;
                        
                        if (order.delivery_person) {
                            if (!driverDeliveryTimes[order.delivery_person]) {
                                driverDeliveryTimes[order.delivery_person] = { totalTime: 0, count: 0 };
                            }
                            driverDeliveryTimes[order.delivery_person].totalTime += shipDuration;
                            driverDeliveryTimes[order.delivery_person].count++;
                        }
                    }
                }

                // Total delivery time (created -> delivered)
                if (timeline.pending_at && timeline.delivered_at) {
                    const totalDuration = (new Date(timeline.delivered_at).getTime() - new Date(timeline.pending_at).getTime()) / 60000;
                    if (totalDuration >= 0) {
                        totalDeliveredTime += totalDuration;
                        deliveredTimeCount++;
                    }
                }
            }

            // Calculate payment reconciliation (only for delivered orders)
            const payment = orderPayments[order.id];
            if (payment && order.status === 'delivered') {
                paymentMethodCounts[payment.method] = (paymentMethodCounts[payment.method] || 0) + 1;
                
                if (payment.method === 'efectivo') {
                    totalCash += order.total;
                } else if (payment.method === 'yape') {
                    totalYape += order.total;
                } else if (payment.method === 'pendiente_yape') {
                    totalPendingYape += order.total;
                } else if (payment.method === 'mixto') {
                    totalCash += payment.cash_amount || 0;
                    totalYape += payment.yape_amount || 0;
                }
            } else if (order.status === 'delivered') {
                // Fallback for orders delivered before payment method tracking was added: default to cash
                totalCash += order.total;
                paymentMethodCounts['efectivo']++;
            }
        });

        const flavorData = Object.entries(flavorCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const portionData = Object.entries(portionCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const deliveryData = Object.entries(deliveryCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Averages
        const avgPrepTime = prepTimeCount > 0 ? totalPrepTime / prepTimeCount : 0;
        const avgShipTime = shipTimeCount > 0 ? totalShipTime / shipTimeCount : 0;
        const avgTotalTime = deliveredTimeCount > 0 ? totalDeliveredTime / deliveredTimeCount : 0;

        // Driver average speed data for charts
        const driverSpeedData = Object.entries(driverDeliveryTimes)
            .map(([name, statVal]) => ({
                name,
                value: parseFloat((statVal.totalTime / statVal.count).toFixed(1)) // average minutes
            }))
            .sort((a, b) => a.value - b.value); // Fastest first

        // Payment pie chart data formatting
        const paymentPieData = [
            { name: 'Efectivo 💵', value: paymentMethodCounts['efectivo'] },
            { name: 'Yape 📱', value: paymentMethodCounts['yape'] },
            { name: 'Mixto ⚖️', value: paymentMethodCounts['mixto'] },
            { name: 'Pend. Yape ⏳', value: paymentMethodCounts['pendiente_yape'] }
        ].filter(item => item.value > 0);

        return { 
            totalRevenue, 
            flavorData, 
            portionData, 
            deliveryData,
            avgPrepTime,
            avgShipTime,
            avgTotalTime,
            driverSpeedData,
            totalCash,
            totalYape,
            totalPendingYape,
            paymentPieData
        };
    }, [orders, flavors, orderTimelines, orderPayments]);

    return (
        <div className="space-y-6 pb-20">
            {/* Cards de Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ios-card p-8 bg-gradient-to-br from-[var(--primary-color)] to-[#FFB75E] text-white shadow-xl shadow-orange-100 md:col-span-2 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-8 h-8" />
                        <span className="text-sm font-black uppercase tracking-widest opacity-90">Ventas Totales del Periodo</span>
                    </div>
                    <div className="text-6xl font-brand tracking-tighter">
                        S/ {stats.totalRevenue.toFixed(2)}
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold">
                            {orders.length} Pedidos
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold">
                            S/ {(stats.totalRevenue / (orders.length || 1)).toFixed(2)} Promedio
                        </div>
                    </div>
                </div>

                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl flex flex-col justify-center items-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-[var(--primary-color)] mb-4">
                        <ChefHat className="w-8 h-8" />
                    </div>
                    <h4 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Sabor Estrella</h4>
                    <div className="text-2xl font-brand text-[#2D1B4E] uppercase">
                        {stats.flavorData[0]?.name || 'N/A'}
                    </div>
                    <div className="text-xs font-bold text-[var(--primary-color)] mt-1">
                        {stats.flavorData[0]?.value || 0} Pedidos
                    </div>
                </div>
            </div>

            {/* Fila de Cuadre de Caja (Efectivo vs Yape vs Pendientes) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ios-card p-5 bg-white border border-black/5 rounded-3xl shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Caja Efectivo (Total)</h4>
                        <div className="text-2xl font-brand text-emerald-600">
                            S/ {stats.totalCash.toFixed(2)}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                        💵
                    </div>
                </div>
                <div className="ios-card p-5 bg-white border border-black/5 rounded-3xl shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Caja Yape (Total)</h4>
                        <div className="text-2xl font-brand text-purple-600">
                            S/ {stats.totalYape.toFixed(2)}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">
                        📱
                    </div>
                </div>
                <div className="ios-card p-5 bg-white border border-black/5 rounded-3xl shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Pendiente de Yapeo</h4>
                        <div className="text-2xl font-brand text-amber-600">
                            S/ {stats.totalPendingYape.toFixed(2)}
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
                        ⏳
                    </div>
                </div>
            </div>

            {/* Fila de Tiempos Promedio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ios-card p-5 bg-white border border-black/5 rounded-3xl shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Promedio Cocina</h4>
                        <div className="text-2xl font-brand text-[#2D1B4E]">
                            {stats.avgPrepTime.toFixed(1)} min
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center text-lg font-bold">
                        🍳
                    </div>
                </div>
                <div className="ios-card p-5 bg-white border border-black/5 rounded-3xl shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Promedio Ruta</h4>
                        <div className="text-2xl font-brand text-[var(--primary-color)]">
                            {stats.avgShipTime.toFixed(1)} min
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[var(--primary-color)] flex items-center justify-center text-lg font-bold">
                        🛵
                    </div>
                </div>
                <div className="ios-card p-5 bg-white border border-black/5 rounded-3xl shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1">Tiempo de Entrega Total</h4>
                        <div className="text-2xl font-brand text-emerald-600">
                            {stats.avgTotalTime.toFixed(1)} min
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                        🏁
                    </div>
                </div>
            </div>

            {/* Gráficos de Ventas y Métodos de Pago */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm lg:col-span-2">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase mb-8 flex items-center gap-2 tracking-widest">
                        <BarChart3 className="w-4 h-4 text-[var(--primary-color)]" />
                        Ranking de Sabores
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.flavorData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F2F2F7" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fontWeight: 'bold', fill: '#2D1B4E' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F2F2F7' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                                />
                                <Bar dataKey="value" fill={primaryColor || '#FF9100'} radius={[0, 8, 8, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase mb-6 flex items-center gap-2 tracking-widest">
                        <ShoppingBag className="w-4 h-4 text-[var(--primary-color)]" />
                        Distribución de Métodos de Pago
                    </h3>
                    {stats.paymentPieData.length === 0 ? (
                        <div className="text-center py-16 text-[#8E8E93] italic text-sm">
                            No hay datos de pagos disponibles
                        </div>
                    ) : (
                        <div className="h-80 w-full flex flex-col items-center justify-center gap-4">
                            <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.paymentPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={6}
                                            dataKey="value"
                                        >
                                            {stats.paymentPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full grid grid-cols-2 gap-2 text-[10px] font-bold text-[#2D1B4E] uppercase px-2">
                                {stats.paymentPieData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 truncate">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                        <span className="truncate">{item.name}: {item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fila de Distribución de Porciones y Trazados */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm lg:col-span-1">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase mb-8 flex items-center gap-2 tracking-widest">
                        <ShoppingBag className="w-4 h-4 text-[var(--primary-color)]" />
                        Distribución de Porciones
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.portionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {stats.portionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm lg:col-span-1">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase mb-6 flex items-center gap-2 tracking-widest">
                        <Users className="w-4 h-4 text-[var(--primary-color)]" />
                        Total de Pedidos por Repartidor
                    </h3>
                    {stats.deliveryData.length === 0 ? (
                        <div className="text-center py-12">
                            <Truck className="w-12 h-12 mx-auto text-[#E5E5EA] mb-4" />
                            <p className="text-[#8E8E93] text-sm italic">No hay datos de reparto disponibles</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                            {stats.deliveryData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 bg-[#F2F2F7] rounded-2xl border border-black/5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-[10px] font-black text-[#2D1B4E]">
                                            {idx + 1}
                                        </div>
                                        <span className="font-bold text-sm text-[#2D1B4E]">{item.name}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-md font-brand text-[var(--primary-color)]">{item.value}</span>
                                        <span className="text-[8px] font-black text-[#8E8E93] uppercase tracking-tighter">Pedidos</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="ios-card p-6 bg-white border border-black/5 rounded-3xl shadow-sm lg:col-span-1">
                    <h3 className="text-xs font-black text-[#8E8E93] uppercase mb-6 flex items-center gap-2 tracking-widest">
                        <Clock className="w-4 h-4 text-[var(--primary-color)]" />
                        Tiempo Promedio de Entrega (Menos es mejor)
                    </h3>
                    {stats.driverSpeedData.length === 0 ? (
                        <div className="text-center py-12 text-[#8E8E93] italic text-sm">
                            No hay datos de tiempo disponibles
                        </div>
                    ) : (
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.driverSpeedData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F2F2F7" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={80}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#2D1B4E' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F2F2F7' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '10px' }}
                                    />
                                    <Bar dataKey="value" fill="#34C759" radius={[0, 8, 8, 0]} barSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
