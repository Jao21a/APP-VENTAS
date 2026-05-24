import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Order } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';

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

interface StreetRouteLineProps {
  start: [number, number];
  end: [number, number];
  isDriverActive: boolean;
  orderId: number;
  onRouteInfo: (orderId: number, distanceKm: number, durationMin: number) => void;
}

const StreetRouteLine: React.FC<StreetRouteLineProps> = ({ 
  start, 
  end, 
  isDriverActive, 
  orderId, 
  onRouteInfo 
}) => {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    let active = true;
    
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (active && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // OSRM coordinates are [lng, lat], Leaflet wants [lat, lng]
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
          setRouteCoords(coords);
          
          const distanceKm = route.distance / 1000;
          const durationMin = route.duration / 60;
          onRouteInfo(orderId, distanceKm, durationMin);
        }
      } catch (err) {
        console.error('Error fetching route from OSRM:', err);
      }
    };

    fetchRoute();

    return () => {
      active = false;
    };
  }, [start[0], start[1], end[0], end[1], orderId]);

  // Fallback to straight dashed line if OSRM route is not loaded yet
  if (!routeCoords) {
    return (
      <Polyline
        positions={[start, end]}
        pathOptions={{
          color: isDriverActive ? '#10B981' : 'var(--primary-color)',
          weight: 2.5,
          dashArray: '5, 8',
          opacity: 0.8
        }}
      />
    );
  }

  return (
    <Polyline
      positions={routeCoords}
      pathOptions={{
        color: isDriverActive ? '#10B981' : 'var(--primary-color)',
        weight: 4,
        opacity: 0.8
      }}
    />
  );
};

// Component to instantly center map on orders/shop/drivers when they change
const MapUpdater = ({ 
  orders, 
  shopLat, 
  shopLng, 
  activeDrivers 
}: { 
  orders: Order[]; 
  shopLat: number | null; 
  shopLng: number | null; 
  activeDrivers: [string, { lat: number; lng: number }][] 
}) => {
  const map = useMap();
  
  useEffect(() => {
    const points: [number, number][] = [];
    if (shopLat && shopLng) {
      points.push([shopLat, shopLng]);
    }
    
    orders.filter(o => o.lat && o.lng).forEach(o => {
      points.push([o.lat!, o.lng!]);
    });

    activeDrivers.forEach(([_, loc]) => {
      points.push([loc.lat, loc.lng]);
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      if (points.length === 1) {
          map.setView(points[0], 15);
      } else {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
       // Default center (Lima, Peru) if no coordinates
       map.setView([-12.04318, -77.02824], 12);
    }
  }, [orders, shopLat, shopLng, activeDrivers, map]);

  return null;
};

// Haversine formula to calculate straight line distance in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const createShopIcon = () => {
  return L.divIcon({
      html: `<div class="w-10 h-10 bg-[#2D1B4E] rounded-full border-2 border-white flex items-center justify-center shadow-lg text-lg animate-bounce">🔥</div>`,
      className: 'custom-shop-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
  });
};

const createDriverIcon = (name: string) => {
  const firstName = name.split(' ')[0];
  return L.divIcon({
      html: `<div class="flex flex-col items-center justify-center">
              <div class="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg text-md animate-pulse">🛵</div>
              <div class="bg-[#2D1B4E] text-white text-[8px] font-black uppercase px-1 py-0.5 rounded-md shadow mt-0.5 whitespace-nowrap border border-white/20">${firstName}</div>
             </div>`,
      className: 'custom-driver-icon',
      iconSize: [40, 48],
      iconAnchor: [20, 20]
  });
};

export const MapDelivery: React.FC<MapDeliveryProps> = ({ orders }) => {
  const { shopLat, shopLng, driverLocations } = useSettingsStore();
  const validOrders = orders.filter(o => o.lat && o.lng);
  
  // State to hold calculated route distances and durations for active orders
  const [routeInfo, setRouteInfo] = useState<Record<number, { distance: number; duration: number }>>({});

  // Filter out drivers who haven't updated location in last 15 minutes
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  const activeDrivers = Object.entries(driverLocations).filter(([_, loc]) => {
    return new Date(loc.lastUpdated).getTime() > fifteenMinutesAgo;
  });

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
        
        {/* Shop Marker */}
        {shopLat && shopLng && (
          <Marker position={[shopLat, shopLng]} icon={createShopIcon()}>
            <Popup>
              <div className="font-brand text-[#2D1B4E] text-center">
                <strong className="block text-lg">NUESTRO LOCAL 🔥</strong>
                <span className="text-xs text-gray-500">Punto de origen</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Active Drivers Markers */}
        {activeDrivers.map(([name, loc]) => (
          <Marker key={`driver-${name}`} position={[loc.lat, loc.lng]} icon={createDriverIcon(name)}>
            <Popup>
              <div className="font-brand text-[#2D1B4E] text-center">
                <strong className="block text-lg">Repartidor: {name} 🛵</strong>
                <span className="text-xs text-gray-500 block">GPS Activo en ruta</span>
                <span className="text-[9px] text-[#8E8E93] block mt-1">
                  Última act: {new Date(loc.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Client Markers */}
        {validOrders.map(order => {
          // Check if this order has an active driver assigned
          const assignedDriverLoc = order.delivery_person ? driverLocations[order.delivery_person] : null;
          const isDriverActive = assignedDriverLoc && new Date(assignedDriverLoc.lastUpdated).getTime() > fifteenMinutesAgo;

          // Route starting point is driver's location if active, otherwise the shop
          const startCoords: [number, number] | null = isDriverActive 
            ? [assignedDriverLoc!.lat, assignedDriverLoc!.lng] 
            : (shopLat && shopLng ? [shopLat, shopLng] : null);

          // Standard distance calculation as a fallback
          const directDistance = startCoords 
            ? calculateDistance(startCoords[0], startCoords[1], order.lat!, order.lng!)
            : null;

          const info = routeInfo[order.id];

          return (
            <React.Fragment key={order.id}>
              <Marker position={[order.lat!, order.lng!]}>
                <Popup>
                  <div className="font-brand text-[#2D1B4E]">
                    <strong className="block text-lg">{order.customer_name}</strong>
                    <span className="text-gray-600 block">{order.customer_phone}</span>
                    <span className="text-sm font-bold text-[var(--primary-color)] mt-1 block">S/ {order.total.toFixed(2)}</span>
                    <p className="text-xs mt-2 italic">{order.order_details}</p>
                    
                    {info ? (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <span className="text-[10px] bg-purple-50 text-[#2D1B4E] font-bold border border-purple-100 px-2 py-0.5 rounded-full w-fit">
                          {isDriverActive 
                            ? `📍 A ${info.distance.toFixed(1)} km del repartidor` 
                            : `📍 A ${info.distance.toFixed(1)} km del local`
                          } (por calles)
                        </span>
                        <span className="text-[10px] bg-blue-50 text-blue-800 font-bold border border-blue-100 px-2 py-0.5 rounded-full w-fit">
                          🚗 Aprox. {Math.round(info.duration)} min
                        </span>
                      </div>
                    ) : directDistance !== null ? (
                      <span className="text-[10px] bg-purple-50 text-[#2D1B4E] font-bold border border-purple-100 px-2 py-0.5 rounded-full inline-block mt-2">
                        {isDriverActive 
                          ? `📍 A ${directDistance.toFixed(1)} km (Línea recta)` 
                          : `📍 A ${directDistance.toFixed(1)} km (Línea recta)`
                        }
                      </span>
                    ) : null}

                    <div className="mt-2">
                      {order.status === 'pending' && <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded-full uppercase inline-block">Pendiente</span>}
                      {order.status === 'preparing' && <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full uppercase inline-block">Preparando</span>}
                      {order.status === 'shipping' && <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full uppercase inline-block">En Camino</span>}
                      {order.status === 'delivered' && <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full uppercase inline-block">Entregado</span>}
                    </div>
                  </div>
                </Popup>
              </Marker>
              
              {/* Street Route from Start Point (Shop or Driver) to Client for Active Shipments */}
              {startCoords && order.status !== 'delivered' && (
                <StreetRouteLine
                  start={startCoords}
                  end={[order.lat!, order.lng!]}
                  isDriverActive={isDriverActive}
                  orderId={order.id}
                  onRouteInfo={(orderId, dist, dur) => {
                    setRouteInfo(prev => {
                      if (prev[orderId]?.distance === dist && prev[orderId]?.duration === dur) {
                        return prev;
                      }
                      return {
                        ...prev,
                        [orderId]: { distance: dist, duration: dur }
                      };
                    });
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
        
        <MapUpdater orders={orders} shopLat={shopLat} shopLng={shopLng} activeDrivers={activeDrivers} />
      </MapContainer>
    </div>
  );
};
