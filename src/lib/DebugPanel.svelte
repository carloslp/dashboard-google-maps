<script lang="ts">
	import { isDevMode, debugLogger } from './debug.svelte';
	import { slide, fade } from 'svelte/transition';

	let isOpen = $state(false);
	let selectedLogId = $state<string | null>(null);

	// Count log types
	let errorCount = $derived(debugLogger.logs.filter(l => l.type === 'error').length);
	let warnCount = $derived(debugLogger.logs.filter(l => l.type === 'warn').length);
	let infoCount = $derived(debugLogger.logs.filter(l => l.type !== 'error' && l.type !== 'warn').length);

	function toggleLogDetails(id: string) {
		selectedLogId = selectedLogId === id ? null : id;
	}

	function simulateError() {
		try {
			// Simulate a ReferenceError or a Supabase error
			throw new Error('Simulated Supabase API Connection Timeout (Error 504)');
		} catch (err: any) {
			debugLogger.addLog('error', err.message, {
				code: 'PGRST301',
				details: 'Connection to pool failed after 5000ms',
				hint: 'Check database status on Supabase dashboard',
				stack: err.stack
			});
		}
	}

	function simulateWarning() {
		debugLogger.addLog('warn', 'CSV Row 14 contains an invalid reviews_count. Fallback applied.', {
			row: 14,
			raw_value: 'N/A',
			fallback: 0
		});
	}

	function simulateInfo() {
		debugLogger.addLog('info', 'Loaded places list from cache / API', {
			recordCount: 15,
			cacheHit: false,
			latencyMs: 142
		});
	}

	function copyLogs() {
		const text = JSON.stringify(debugLogger.logs, null, 2);
		navigator.clipboard.writeText(text);
		debugLogger.addLog('success', 'Logs copied to clipboard');
	}
</script>

{#if isDevMode}
	<!-- Floating Debug Toggle Button -->
	<div class="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2 font-sans">
		{#if !isOpen}
			<button
				onclick={() => isOpen = true}
				class="flex items-center space-x-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-medium rounded-full shadow-2xl shadow-emerald-500/10 backdrop-blur-md transition-all active:scale-95 text-xs tracking-wider uppercase"
				transition:fade={{ duration: 150 }}
			>
				<span class="relative flex h-2 w-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
				</span>
				<span>🐞 Debug Mode</span>
				{#if errorCount > 0}
					<span class="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 rounded-md border border-rose-500/30">
						{errorCount}
					</span>
				{/if}
			</button>
		{/if}

		<!-- Expandable Debug Tray -->
		{#if isOpen}
			<div
				transition:slide={{ axis: 'y', duration: 250 }}
				class="w-[92vw] sm:w-[500px] md:w-[650px] max-h-[500px] bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col text-slate-200"
			>
				<!-- Panel Header -->
				<div class="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<span class="text-lg">🐞</span>
						<div>
							<h3 class="text-sm font-bold tracking-wide text-slate-100 uppercase">Panel de Debug (Dev Mode)</h3>
							<p class="text-[10px] text-emerald-400">Activo desde .env</p>
						</div>
					</div>

					<div class="flex items-center space-x-2">
						<button
							onclick={copyLogs}
							class="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
							title="Copiar logs"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 4h6m-6 4h6m-6 4h6" />
							</svg>
						</button>
						<button
							onclick={() => debugLogger.clear()}
							class="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
							title="Limpiar logs"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
						<button
							onclick={() => isOpen = false}
							class="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
							title="Cerrar panel"
						>
							<svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Stats and Tools Bar -->
				<div class="px-4 py-2 bg-slate-950 border-b border-slate-900 flex flex-wrap items-center justify-between gap-2">
					<div class="flex items-center space-x-3 text-[11px] text-slate-400">
						<span class="flex items-center gap-1">
							<span class="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
							{errorCount} Errores
						</span>
						<span class="flex items-center gap-1">
							<span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
							{warnCount} Advertencias
						</span>
						<span class="flex items-center gap-1">
							<span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
							{infoCount} Info
						</span>
					</div>

					<div class="flex items-center space-x-1">
						<button
							onclick={simulateError}
							class="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-[10px] transition"
						>
							+ Error
						</button>
						<button
							onclick={simulateWarning}
							class="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded text-[10px] transition"
						>
							+ Advertencia
						</button>
						<button
							onclick={simulateInfo}
							class="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-[10px] transition"
						>
							+ Info
						</button>
					</div>
				</div>

				<!-- Logs Container -->
				<div class="flex-1 overflow-y-auto min-h-[220px] max-h-[350px] p-2 space-y-1.5 custom-scrollbar">
					{#if debugLogger.logs.length === 0}
						<div class="h-[220px] flex flex-col items-center justify-center text-slate-500 text-xs">
							<span>No hay logs de debug registrados.</span>
							<span class="mt-1 text-[10px]">Realiza acciones en la app o haz clic en simular arriba.</span>
						</div>
					{:else}
						{#each debugLogger.logs as log (log.id)}
							<div class="rounded-xl border border-slate-900 bg-slate-900/20 overflow-hidden text-xs">
								<!-- Log Header -->
								<button
									onclick={() => toggleLogDetails(log.id)}
									class="w-full text-left p-2.5 flex items-start gap-2.5 hover:bg-slate-900/40 transition"
								>
									<!-- Indicator Icon -->
									{#if log.type === 'error'}
										<span class="text-rose-500 flex-shrink-0 mt-0.5">🚨</span>
									{:else if log.type === 'warn'}
										<span class="text-amber-500 flex-shrink-0 mt-0.5">⚠️</span>
									{:else if log.type === 'success'}
										<span class="text-emerald-400 flex-shrink-0 mt-0.5">✅</span>
									{:else}
										<span class="text-blue-400 flex-shrink-0 mt-0.5">ℹ️</span>
									{/if}

									<!-- Message -->
									<div class="flex-1 min-w-0">
										<div class="flex justify-between items-center gap-2 mb-0.5">
											<span class="font-semibold text-slate-300">
												{#if log.type === 'error'}
													Error
												{:else if log.type === 'warn'}
													Warning
												{:else if log.type === 'success'}
													Success
												{:else}
													System
												{/if}
											</span>
											<span class="text-[10px] text-slate-500">
												{log.timestamp.toLocaleTimeString()}
											</span>
										</div>
										<p class="text-slate-400 truncate-2-lines break-all">{log.message}</p>
									</div>

									<!-- Chevron Indicator -->
									{#if log.details}
										<svg
											class="w-4 h-4 text-slate-500 mt-1.5 transition-transform duration-200 {selectedLogId === log.id ? 'rotate-180' : ''}"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
										</svg>
									{/if}
								</button>

								<!-- Expanded Log Details -->
								{#if log.details && selectedLogId === log.id}
									<div
										transition:slide={{ duration: 180 }}
										class="px-3 pb-3 pt-1 bg-slate-950 border-t border-slate-900 text-[11px] font-mono text-emerald-400 overflow-x-auto"
									>
										<pre class="whitespace-pre-wrap break-all p-2 bg-slate-900/50 rounded-lg text-slate-300 max-h-[180px] overflow-y-auto">{JSON.stringify(log.details, null, 2)}</pre>
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* Custom scrollbar to match design */
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #1e293b;
		border-radius: 9999px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #334155;
	}

	.truncate-2-lines {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
