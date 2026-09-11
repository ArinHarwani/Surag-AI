import { supabase } from './client';
import { AgencySlug } from '@/types/investigation';

const SEED_AGENCIES = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Jodhpur Police Department',
    slug: 'jodhpur' as AgencySlug,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Kota Police Commissionerate',
    slug: 'kota' as AgencySlug,
  },
];

export async function checkAndSeedSupabase() {
  if (!supabase) return { error: 'Supabase client not initialized' };

  try {
    // 1. Check if agencies exist
    const { data: existingAgencies, error: fetchError } = await supabase
      .from('agencies')
      .select('id, slug');

    if (fetchError) {
      console.error('Failed to fetch agencies (Check if schema.sql was run):', fetchError.message);
      return { error: 'Schema might not be initialized or RLS is blocking read', details: fetchError };
    }

    // 2. Seed missing agencies
    const missingAgencies = SEED_AGENCIES.filter(
      (seed) => !existingAgencies?.some((existing) => existing.slug === seed.slug)
    );

    if (missingAgencies.length > 0) {
      console.log('Seeding missing agencies:', missingAgencies.map((a) => a.slug));
      const { error: insertError } = await supabase.from('agencies').insert(missingAgencies);
      if (insertError) {
        console.error('Failed to seed agencies:', insertError.message);
        return { error: 'Seeding failed', details: insertError };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error during Supabase init:', err);
    return { error: err.message };
  }
}
