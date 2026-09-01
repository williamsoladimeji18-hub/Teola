import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Maison Teola - Maison Link Helper
 * Used for quick state export/import if needed.
 */
export const maisonLink = {
  exportState: async (userId: string): Promise<string> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const { data: wardrobe } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId);

    const { data: outfits } = await supabase
      .from('saved_outfits')
      .select('*')
      .eq('user_id', userId);

    const state = {
      profile,
      wardrobe: wardrobe || [],
      outfits: outfits || [],
    };

    return btoa(JSON.stringify(state));
  },

  importState: async (
    userId: string,
    code: string
  ): Promise<boolean> => {
    try {
      const state = JSON.parse(atob(code));

      if (state.profile) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            ...state.profile,
            id: userId,
          });

        if (error) throw error;
      }

      if (state.wardrobe?.length) {
        const items = state.wardrobe.map((item: any) => ({
          ...item,
          user_id: userId,
        }));

        const { error } = await supabase
          .from('wardrobe_items')
          .insert(items);

        if (error) throw error;
      }

      if (state.outfits?.length) {
        const items = state.outfits.map((item: any) => ({
          ...item,
          user_id: userId,
        }));

        const { error } = await supabase
          .from('saved_outfits')
          .insert(items);

        if (error) throw error;
      }

      return true;
    } catch (e) {
      console.error('Maison Link Import Error:', e);
      return false;
    }
  },
};
