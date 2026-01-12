import { supabase } from '../lib/supabase';

/**
 * Get public URL for a file in Supabase 'assets' bucket
 * @param path File path inside the bucket (e.g., 'menu/taco.jpg')
 * @returns Full public URL
 */
export const getStorageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path; // Already a full URL

    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    return data.publicUrl;
};
