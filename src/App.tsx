import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Deliverys } from './pages/Deliverys';
import { MapPage } from './pages/MapPage';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { DeliveryPortal } from './pages/DeliveryPortal';
import { KitchenPortal } from './pages/KitchenPortal';
import { useSettingsStore } from './store/useSettingsStore';
import { useOrderStore } from './store/useOrderStore';

export default function App() {
  const { primaryColor, fontFamily, subscribeToSettings, unsubscribeFromSettings } = useSettingsStore();
  const { subscribeToUpdates, unsubscribeFromUpdates } = useOrderStore();

  useEffect(() => {
    subscribeToSettings();
    subscribeToUpdates();
    return () => {
      unsubscribeFromSettings();
      unsubscribeFromUpdates();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);

    // Attempt dynamic font loading logic if needed, or rely on CSS 
    const fontObj = [
      { name: 'Luckiest Guy', value: "'Luckiest Guy', cursive" },
      { name: 'Inter', value: "'Inter', sans-serif" },
      { name: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
      { name: 'Playfair Display', value: "'Playfair Display', serif" },
      { name: 'JetBrains Mono', value: "'JetBrains Mono', monospace" }
    ].find(f => f.name === fontFamily);

    if (fontObj) {
      root.style.setProperty('--font-brand', fontObj.value);
    }
  }, [primaryColor, fontFamily]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="deliverys" element={<Deliverys />} />
          <Route path="map" element={<MapPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/delivery-portal" element={<DeliveryPortal />} />
        <Route path="/kitchen-portal" element={<KitchenPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
