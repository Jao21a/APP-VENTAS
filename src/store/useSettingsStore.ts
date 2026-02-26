import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export interface SettingsStore {
    primaryColor: string;
    fontFamily: string;
    isLoading: boolean;
    fetchSettings: () => Promise<void>;
    updateSetting: (key: string, value: string) => Promise<void>;
    subscribeToSettings: () => void;
    unsubscribeFromSettings: () => void;
}

let settingsChannel: any = null;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    primaryColor: '#FF9100',
    fontFamily: 'Luckiest Guy',
    isLoading: true,

    fetchSettings: async () => {
        set({ isLoading: true });
        const { data } = await supabase.from('settings').select('*');
        if (data) {
            data.forEach(setting => {
                if (setting.key === 'primary_color') set({ primaryColor: setting.value });
                if (setting.key === 'font_family') set({ fontFamily: setting.value });
            });
        }
        set({ isLoading: false });
    },

    updateSetting: async (key: string, value: string) => {
        await supabase.from('settings').upsert({ key, value });
        if (key === 'primary_color') set({ primaryColor: value });
        if (key === 'font_family') set({ fontFamily: value });
    },

    subscribeToSettings: () => {
        if (settingsChannel) return;
        settingsChannel = supabase
            .channel('public:settings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
                get().fetchSettings();
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
