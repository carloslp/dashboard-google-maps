import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

class AuthState {
	session = $state<Session | null>(null);
	user = $state<User | null>(null);
	loading = $state(true);

	constructor() {
		// Initialize session
		supabase.auth.getSession().then(({ data: { session } }) => {
			this.session = session;
			this.user = session?.user ?? null;
			this.loading = false;
		});

		// Listen to auth changes
		supabase.auth.onAuthStateChange((_event, session) => {
			this.session = session;
			this.user = session?.user ?? null;
			this.loading = false;
		});
	}

	async signOut() {
		await supabase.auth.signOut();
	}
}

export const authState = new AuthState();
