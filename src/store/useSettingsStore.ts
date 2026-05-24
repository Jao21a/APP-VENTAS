import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export interface SettingsStore {
    primaryColor: string;
    fontFamily: string;
    shopLat: number | null;
    shopLng: number | null;
    driverLocations: Record<string, { lat: number; lng: number; lastUpdated: string }>;
    isLoading: boolean;
    fetchSettings: (silent?: boolean) => Promise<void>;
    updateSetting: (key: string, value: string) => Promise<void>;
    updateDriverLocation: (driverName: string, lat: number, lng: number) => Promise<void>;
    subscribeToSettings: () => void;
    unsubscribeFromSettings: () => void;
}

let settingsChannel: any = null;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    primaryColor: '#FF9100',
    fontFamily: 'Luckiest Guy',
    shopLat: null,
    shopLng: null,
    driverLocations: {},
    isLoading: true,

    fetchSettings: async (silent = false) => {
        if (!silent) set({ isLoading: true });
        const { data } = await supabase.from('settings').select('*');
        if (data) {
            const driverLocs: Record<string, { lat: number; lng: number; lastUpdated: string }> = {};
            data.forEach(setting => {
                if (setting.key === 'primary_color') set({ primaryColor: setting.value });
                if (setting.key === 'font_family') set({ fontFamily: setting.value });
                if (setting.key === 'shop_lat') set({ shopLat: parseFloat(setting.value) || null });
                if (setting.key === 'shop_lng') set({ shopLng: parseFloat(setting.value) || null });
                if (setting.key.startsWith('driver_loc_')) {
                    const driverName = setting.key.replace('driver_loc_', '');
                    try {
                        const loc = JSON.parse(setting.value);
                        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
                            driverLocs[driverName] = {
                                lat: loc.lat,
                                lng: loc.lng,
                                lastUpdated: loc.last_updated || new Date().toISOString()
                            };
                        }
                    } catch (e) {
                        console.error('Error parsing driver location JSON:', e);
                    }
                }
            });
            set({ driverLocations: driverLocs });
        }
        if (!silent) set({ isLoading: false });
    },

    updateSetting: async (key: string, value: string) => {
        await supabase.from('settings').upsert({ key, value });
        if (key === 'primary_color') set({ primaryColor: value });
        if (key === 'font_family') set({ fontFamily: value });
        if (key === 'shop_lat') set({ shopLat: parseFloat(value) || null });
        if (key === 'shop_lng') set({ shopLng: parseFloat(value) || null });
    },

    updateDriverLocation: async (driverName: string, lat: number, lng: number) => {
        const key = `driver_loc_${driverName}`;
        const lastUpdated = new Date().toISOString();
        const value = JSON.stringify({ lat, lng, last_updated: lastUpdated });
        
        await supabase.from('settings').upsert({ key, value });
        
        set(state => ({
            driverLocations: {
                ...state.driverLocations,
                [driverName]: { lat, lng, lastUpdated }
            }
        }));
    },

    subscribeToSettings: () => {
        if (settingsChannel) return;
        settingsChannel = supabase
            .channel('public:settings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
                get().fetchSettings(true); // Silent update
            })
            .subscribe();

        get().fetchSettings();
    },

    unsubscribeFromSettings: () => {
        if (settingsChannel) {
            supabase.removeChannel(settingsChannel);
            settingsChannel = null;
        }
    }
}));
