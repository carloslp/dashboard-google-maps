import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
	console.error('Supabase URL or Anon Key is missing. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(
	PUBLIC_SUPABASE_URL || '',
	PUBLIC_SUPABASE_ANON_KEY || ''
);
