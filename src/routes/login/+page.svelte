<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { authState } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { debugLogger } from '$lib/debug.svelte';

	let email = $state('');
	let password = $state('');
	let isSignUp = $state(false);
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	$effect(() => {
		if (authState.user && !authState.loading) {
			goto('/');
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		errorMessage = '';
		successMessage = '';

		try {
			if (isSignUp) {
				const { data, error } = await supabase.auth.signUp({
					email,
					password
				});
				if (error) throw error;
				
				if (data.session) {
					successMessage = '¡Registro exitoso! Iniciando sesión...';
					debugLogger.addLog('success', 'User signed up successfully with auto-session', { email });
					setTimeout(() => goto('/'), 1500);
				} else {
					successMessage = 'Registro exitoso. Por favor verifica tu correo electrónico para confirmar tu cuenta.';
					debugLogger.addLog('info', 'User signed up successfully, email verification pending', { email });
				}
			} else {
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (error) throw error;
				successMessage = '¡Inicio de sesión exitoso! Redirigiendo...';
				debugLogger.addLog('success', 'User logged in successfully', { email });
				setTimeout(() => goto('/'), 1000);
			}
		} catch (err: any) {
			errorMessage = err.message || 'Ocurrió un error inesperado';
			debugLogger.addLog('error', `Authentication failed (${isSignUp ? 'Sign Up' : 'Sign In'})`, {
				email,
				message: err.message,
				details: err
			});
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
	<!-- Background decorations -->
	<div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
	<div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>

	<!-- Main Container -->
	<div class="w-full max-w-5xl grid md:grid-cols-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
		
		<!-- Visual / Promo side -->
		<div class="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-950/40 via-slate-900/40 to-blue-950/40 border-r border-slate-800/50 relative">
			<div class="flex items-center space-x-3">
				<div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
					<svg class="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</div>
				<span class="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">GeoAnalytics</span>
			</div>

			<div class="space-y-6 my-auto pr-6">
				<h1 class="text-4xl font-extrabold tracking-tight leading-tight">
					Visualiza tus datos de <span class="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Google Maps</span> en segundos.
				</h1>
				<p class="text-slate-400 text-lg leading-relaxed">
					Sube tus archivos CSV, mantén tu base de datos Supabase actualizada automáticamente y analiza el rendimiento de tus lugares con métricas avanzadas.
				</p>
			</div>

			<div class="text-xs text-slate-500">
				&copy; 2026 GeoAnalytics. Todos los derechos reservados.
			</div>
		</div>

		<!-- Form side -->
		<div class="p-8 md:p-12 flex flex-col justify-center">
			<div class="max-w-md w-full mx-auto space-y-8">
				<div class="space-y-2">
					<h2 class="text-3xl font-bold tracking-tight">
						{isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
					</h2>
					<p class="text-slate-400">
						{isSignUp ? 'Regístrate para comenzar a gestionar tus mapas' : 'Ingresa tus credenciales para acceder a tu panel'}
					</p>
				</div>

				<form onsubmit={handleSubmit} class="space-y-5">
					{#if errorMessage}
						<div class="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-sm flex items-center space-x-2">
							<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
							<span>{errorMessage}</span>
						</div>
					{/if}

					{#if successMessage}
						<div class="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-sm flex items-center space-x-2">
							<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span>{successMessage}</span>
						</div>
					{/if}

					<div class="space-y-2">
						<label for="email" class="text-sm font-medium text-slate-300">Correo Electrónico</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							required
							placeholder="correo@ejemplo.com"
							class="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
						/>
					</div>

					<div class="space-y-2">
						<label for="password" class="text-sm font-medium text-slate-300">Contraseña</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							required
							placeholder="••••••••"
							class="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition flex items-center justify-center space-x-2"
					>
						{#if loading}
							<svg class="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
							</svg>
						{:else}
							<span>{isSignUp ? 'Registrarse' : 'Iniciar Sesión'}</span>
						{/if}
					</button>
				</form>

				<div class="text-center pt-2">
					<button
						type="button"
						onclick={() => { isSignUp = !isSignUp; errorMessage = ''; successMessage = ''; }}
						class="text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition"
					>
						{isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
					</button>
				</div>
			</div>
		</div>

	</div>
</div>
