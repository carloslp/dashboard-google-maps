<script lang="ts">
	import './layout.css';
	import { authState } from '$lib/auth.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import DebugPanel from '$lib/DebugPanel.svelte';

	let { children } = $props();

	// Redirect to login if not authenticated (except when on /login page)
	$effect(() => {
		if (!authState.loading) {
			const onLoginPage = page.url.pathname === '/login';
			if (!authState.user && !onLoginPage) {
				goto('/login');
			} else if (authState.user && onLoginPage) {
				goto('/');
			}
		}
	});
</script>

<svelte:head>
	<title>GeoAnalytics - Dashboard</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if authState.loading}
	<div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
		<div class="relative w-16 h-16">
			<div class="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
			<div class="absolute inset-0 border-4 border-t-emerald-500 border-r-emerald-500 rounded-full animate-spin"></div>
		</div>
		<span class="text-slate-400 font-medium tracking-wide animate-pulse">Cargando GeoAnalytics...</span>
	</div>
{:else}
	{@render children()}
{/if}

<DebugPanel />
