import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Order } from '../types';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapDeliveryProps {
  orders: Order[];
}

// Component to instantly center map on orders when they change
const MapUpdater = ({ orders }: { orders: Order[] }) => {
  const map = useMap();
  
  useEffect(() => {
    const validOrders = orders.filter(o => o.lat && o.lng);
    if (validOrders.length > 0) {
      const bounds = L.latLngBounds(validOrders.map(o => [o.lat!, o.lng!]));
      if (validOrders.length === 1) {
          map.setView([validOrders[0].lat!, validOrders[0].lng!], 15);
      } else {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
       // Default center (Lima, Peru) if no orders
       map.setView([-12.04318, -77.02824], 12);
    }
  }, [orders, map]);

  return null;
};

export const MapDelivery: React.FC<MapDeliveryProps> = ({ orders }) => {
  const validOrders = orders.filter(o => o.lat && o.lng);

  return (
    <div className="w-full h-full min-h-[500px] rounded-3xl overflow-hidden shadow-sm border border-black/5 z-0 relative">
      <MapContainer 
        center={[-12.04318, -77.02824]} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        
        {validOrders.map(order => (
          <Marker key={order.id} position={[order.lat!, order.lng!]}>
            <Popup>
              <div className="font-brand text-[#2D1B4E]">
                <strong className="block text-lg">{order.customer_name}</strong>
                <span className="text-gray-600 block">{order.customer_phone}</span>
                <span className="text-sm font-bold text-[var(--primary-color)] mt-1 block">S/ {order.total.toFixed(2)}</span>
                <p className="text-xs mt-2 italic">{order.order_details}</p>
                {order.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full uppercase mt-2 inline-block">Pendiente</span>}
                {order.status === 'preparing' && <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full uppercase mt-2 inline-block">Preparando</span>}
                {order.status === 'shipping' && <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full uppercase mt-2 inline-block">En Camino</span>}
              </div>
            </Popup>
          </Marker>
        ))}
        
        <MapUpdater orders={orders} />
      </MapContainer>
    </div>
  );
};
