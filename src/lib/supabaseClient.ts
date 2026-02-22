import { createClient } from '@supabase/supabase-js';

// Usamos import.meta.env porque asumo que tu proyecto usa Vite (React)
// Si usas Create React App o Next.js, deberás cambiar esto a process.env.REACT_APP_... o process.env.NEXT_PUBLIC_...
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan las variables de entorno de Supabase en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
