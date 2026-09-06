import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '[REDACTED]';
const supabaseKey = '[REDACTED]';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the AI Studio Settings menu.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Maison Teola - Maison Link Helper
 * Used for quick state export/import if needed, though real Supabase
 * handles persistence automatically.
 */
export const maisonLink = {
  exportState: async (userId: string): Promise<string> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId);
    const profile = data && data.length > 0 ? data[0] : null;
    const { data: wardrobe } = await supabase.from('wardrobe_items').select('*').eq('user_id', userId);
    const { data: outfits } = await supabase.from('saved_outfits').select('*').eq('user_id', userId);
    
    const state = { profile, wardrobe, outfits };
    return btoa(JSON.stringify(state));
  },
  importState: async (userId: string, code: string): Promise<boolean> => {
    try {
      const state = JSON.parse(atob(code));
      if (state.profile) await supabase.from('profiles').upsert({ ...state.profile, id: userId });
      if (state.wardrobe) {
        const items = state.wardrobe.map((item: any) => ({ ...item, user_id: userId }));
        await supabase.from('wardrobe_items').insert(items);
      }
      if (state.outfits) {
        const items = state.outfits.map((item: any) => ({ ...item, user_id: userId }));
        await supabase.from('saved_outfits').insert(items);
      }
      return true;
    } catch (e) {
      console.error('Maison Link Import Error:', e);
      return false;
    }
  }
};
