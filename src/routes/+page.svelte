<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { authState } from '$lib/auth.svelte';
	import { debugLogger } from '$lib/debug.svelte';
	import Papa from 'papaparse';

	// Reactive states
	let places = $state<any[]>([]);
	let loading = $state(true);
	let uploadLoading = $state(false);
	let uploadError = $state('');
	let uploadSuccess = $state('');
	
	// Filtering and search
	let searchQuery = $state('');
	let selectedType = $state('All');
	
	// Stats
	let totalPlaces = $derived(places.length);
	let placeTypes = $derived(['All', ...new Set(places.map(p => p.place_type).filter(Boolean))]);
	let avgRating = $derived(
		places.length 
			? (places.reduce((acc, p) => acc + (parseFloat(p.reviews_average) || 0), 0) / places.length).toFixed(2) 
			: '0.00'
	);
	let totalReviews = $derived(
		places.reduce((acc, p) => acc + (parseInt(p.reviews_count) || 0), 0)
	);

	// Filtered places
	let filteredPlaces = $derived(
		places.filter(p => {
			const matchesSearch = 
				p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.place_type?.toLowerCase().includes(searchQuery.toLowerCase());
			
			const matchesType = selectedType === 'All' || p.place_type === selectedType;
			
			return matchesSearch && matchesType;
		})
	);

	// Load data from Supabase
	async function loadPlaces() {
		loading = true;
		try {
			const { data, error } = await supabase
				.from('places')
				.select('*')
				.order('created_at', { ascending: false });
			
			if (error) throw error;
			places = data || [];
			debugLogger.addLog('info', 'Loaded places list successfully from Supabase', { count: places.length });
		} catch (err: any) {
			console.error('Error loading places:', err.message);
			debugLogger.addLog('error', 'Error loading places from Supabase', {
				message: err.message,
				details: err
			});
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (authState.user) {
			loadPlaces();
		}
	});

	// Handle CSV file drop/input
	function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		parseAndUploadCSV(file);
	}

	// Parsing and upserting logic
	function parseAndUploadCSV(file: File) {
		uploadLoading = true;
		uploadError = '';
		uploadSuccess = '';

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: async (results) => {
				try {
					const rawRows = results.data as any[];
					
					if (rawRows.length === 0) {
						throw new Error('El archivo CSV está vacío.');
					}

					// Map and sanitize fields
					const mappedRecords = rawRows.map((row) => {
						// Clean keys to handle potential whitespace or encoding bugs
						const cleanRow: any = {};
						for (const key in row) {
							cleanRow[key.trim().toLowerCase()] = row[key];
						}

						// Validate required fields
						const name = cleanRow['name']?.trim();
						const address = cleanRow['address']?.trim();

						if (!name || !address) {
							throw new Error('Cada registro en el CSV debe tener al menos "name" y "address".');
						}

						return {
							name,
							address,
							website: cleanRow['website']?.trim() || null,
							phone_number: cleanRow['phone_number']?.trim() || null,
							reviews_count: cleanRow['reviews_count'] ? parseInt(cleanRow['reviews_count'], 10) : null,
							reviews_average: cleanRow['reviews_average'] ? parseFloat(cleanRow['reviews_average']) : null,
							place_type: cleanRow['place_type']?.trim() || null,
							opens_at: cleanRow['opens_at']?.trim() || null
						};
					});

					// Deduplicate by (name, address) to avoid "ON CONFLICT DO UPDATE
					// command cannot affect row a second time" when the CSV contains
					// duplicate entries for the same conflict key.
					const deduplicatedMap = new Map<string, (typeof mappedRecords)[0]>();
					for (const record of mappedRecords) {
						deduplicatedMap.set(`${record.name}|${record.address}`, record);
					}
					const uniqueRecords = Array.from(deduplicatedMap.values());

					// Perform upsert query on Supabase targeting the unique constraint name,address
					const { error } = await supabase
						.from('places')
						.upsert(uniqueRecords, { onConflict: 'name,address' });

					if (error) throw error;

					const duplicatesSkipped = mappedRecords.length - uniqueRecords.length;
					uploadSuccess = `¡Se han procesado e insertado/actualizado ${uniqueRecords.length} registros exitosamente!${duplicatesSkipped > 0 ? ` (${duplicatesSkipped} duplicado${duplicatesSkipped > 1 ? 's' : ''} ignorado${duplicatesSkipped > 1 ? 's' : ''})` : ''}`;
					debugLogger.addLog('success', 'CSV Upload and Upsert completed successfully', {
						fileName: file.name,
						fileSize: file.size,
						recordsCount: uniqueRecords.length,
						duplicatesSkipped
					});
					loadPlaces();
				} catch (err: any) {
					console.error('Error processing CSV:', err);
					uploadError = err.message || 'Error al procesar el archivo CSV.';
					debugLogger.addLog('error', 'Error processing/upserting CSV', {
						message: err.message,
						details: err,
						fileName: file.name
					});
				} finally {
					uploadLoading = false;
				}
			},
			error: (err) => {
				uploadError = `Error al parsear el CSV: ${err.message}`;
				uploadLoading = false;
				debugLogger.addLog('error', 'CSV parsing failed in PapaParse', {
					message: err.message,
					fileName: file.name
				});
			}
		});
	}
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
	<!-- Navbar -->
	<header class="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-blue-500 flex items-center justify-center shadow-md shadow-emerald-500/10">
					<svg class="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</div>
				<span class="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">GeoAnalytics</span>
			</div>

			<div class="flex items-center space-x-4">
				<div class="hidden sm:flex flex-col text-right">
					<span class="text-xs text-slate-400">Usuario</span>
					<span class="text-sm font-medium text-slate-200">{authState.user?.email}</span>
				</div>
				<button
					onclick={() => authState.signOut()}
					class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-medium rounded-xl border border-slate-700/50 hover:border-slate-600 transition active:scale-95"
				>
					Cerrar Sesión
				</button>
			</div>
		</div>
	</header>

	<!-- Main Body -->
	<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
		
		<!-- Banner / Header Info -->
		<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900/60 to-slate-900/20 p-6 sm:p-8 rounded-3xl border border-slate-800/80 backdrop-blur-xl">
			<div>
				<h1 class="text-3xl font-extrabold tracking-tight">Dashboard de Lugares</h1>
				<p class="text-slate-400 mt-1">Administra y visualiza la información de tus ubicaciones de Google Maps.</p>
			</div>
			
			<div class="flex items-center space-x-2">
				<button
					onclick={loadPlaces}
					class="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 rounded-2xl transition hover:text-white"
					title="Actualizar datos"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M9.555 7.162L12 9.5M12 9.5l2.5-2.5" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Metrics Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
			<!-- Total places -->
			<div class="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl flex items-center justify-between">
				<div class="space-y-1">
					<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Lugares</span>
					<h3 class="text-3xl font-bold">{totalPlaces}</h3>
				</div>
				<div class="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
					</svg>
				</div>
			</div>

			<!-- Place types -->
			<div class="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl flex items-center justify-between">
				<div class="space-y-1">
					<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categorías</span>
					<h3 class="text-3xl font-bold">{placeTypes.length - 1}</h3>
				</div>
				<div class="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
			</div>

			<!-- Average rating -->
			<div class="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl flex items-center justify-between">
				<div class="space-y-1">
					<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calificación Promedio</span>
					<h3 class="text-3xl font-bold">{avgRating} <span class="text-sm font-normal text-slate-500">/ 5</span></h3>
				</div>
				<div class="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.367 1.243.583 1.83l-3.978 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.978-2.89a1 1 0 00-1.176 0l-3.978 2.89c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.978-2.89c-.783-.587-.378-1.83.583-1.83h4.907a1 1 0 00.95-.69l1.519-4.674z" />
					</svg>
				</div>
			</div>

			<!-- Total reviews -->
			<div class="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl flex items-center justify-between">
				<div class="space-y-1">
					<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reseñas</span>
					<h3 class="text-3xl font-bold">{totalReviews.toLocaleString()}</h3>
				</div>
				<div class="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
			</div>
		</div>

		<!-- CSV Upload and Instructions -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Upload Card -->
			<div class="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between space-y-4">
				<div>
					<h2 class="text-lg font-bold">Cargar Archivo CSV</h2>
					<p class="text-sm text-slate-400 mt-1">Sube tus datos para importarlos o actualizarlos automáticamente.</p>
				</div>

				<div class="relative border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-8 text-center bg-slate-950/20 hover:bg-slate-950/40 transition group cursor-pointer">
					<input
						type="file"
						accept=".csv"
						onchange={handleFileUpload}
						disabled={uploadLoading}
						class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
					/>
					
					<div class="flex flex-col items-center space-y-3">
						<div class="p-4 bg-slate-900 group-hover:bg-emerald-500/10 rounded-2xl text-slate-400 group-hover:text-emerald-400 transition-colors">
							{#if uploadLoading}
								<svg class="animate-spin h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
							{:else}
								<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
								</svg>
							{/if}
						</div>
						<div class="text-sm">
							<span class="font-semibold text-emerald-400 group-hover:underline">Haz clic para cargar</span> o arrastra y suelta
						</div>
						<div class="text-xs text-slate-500">Solo archivos .csv</div>
					</div>
				</div>

				{#if uploadError}
					<div class="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm flex items-center space-x-2">
						<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<span>{uploadError}</span>
					</div>
				{/if}

				{#if uploadSuccess}
					<div class="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center space-x-2">
						<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>{uploadSuccess}</span>
					</div>
				{/if}
			</div>

			<!-- Format Requirements Card -->
			<div class="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between">
				<div>
					<h2 class="text-lg font-bold">Campos Requeridos</h2>
					<p class="text-sm text-slate-400 mt-1">El archivo CSV debe tener una fila de cabecera con los siguientes nombres de columna:</p>
					
					<ul class="mt-4 space-y-2 text-sm text-slate-300">
						<li class="flex items-center space-x-2">
							<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
							<span><strong class="text-slate-100">name</strong> (texto, requerido)</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
							<span><strong class="text-slate-100">address</strong> (texto, requerido)</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="w-2 h-2 rounded-full bg-blue-400"></span>
							<span><strong>website</strong> (texto, opcional)</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="w-2 h-2 rounded-full bg-blue-400"></span>
							<span><strong>phone_number</strong> (texto, opcional)</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="w-2 h-2 rounded-full bg-blue-400"></span>
							<span><strong>reviews_count</strong> (número, opcional)</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="w-2 h-2 rounded-full bg-blue-400"></span>
							<span><strong>reviews_average</strong> (decimal, opcional)</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="w-2 h-2 rounded-full bg-blue-400"></span>
							<span><strong>place_type</strong> (texto, opcional)</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="w-2 h-2 rounded-full bg-blue-400"></span>
							<span><strong>opens_at</strong> (texto, opcional)</span>
						</li>
					</ul>
				</div>
				<div class="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-800/80">
					* Si el registro existe (mismo nombre y dirección), se actualizará en lugar de crearse.
				</div>
			</div>
		</div>

		<!-- Data Table Card -->
		<div class="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-6">
			
			<!-- Filters -->
			<div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
				<h2 class="text-lg font-bold">Ubicaciones Importadas</h2>
				
				<div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Buscar por nombre, dirección..."
						class="w-full sm:w-64 px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
					/>
					
					<select
						bind:value={selectedType}
						class="w-full sm:w-48 px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
					>
						{#each placeTypes as type}
							<option value={type}>{type === 'All' ? 'Todas las categorías' : type}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Table -->
			<div class="overflow-x-auto rounded-xl border border-slate-800/80">
				{#if loading}
					<div class="py-20 flex flex-col items-center justify-center space-y-3">
						<div class="animate-spin rounded-full h-8 w-8 border-2 border-slate-800 border-t-emerald-500"></div>
						<span class="text-sm text-slate-400">Cargando ubicaciones...</span>
					</div>
				{:else if filteredPlaces.length === 0}
					<div class="py-20 text-center space-y-2">
						<svg class="w-12 h-12 text-slate-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<h3 class="text-sm font-semibold text-slate-300">No se encontraron ubicaciones</h3>
						<p class="text-xs text-slate-500">Prueba ajustando los filtros o subiendo un nuevo archivo CSV.</p>
					</div>
				{:else}
					<table class="w-full text-left border-collapse text-sm">
						<thead>
							<tr class="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
								<th class="p-4">Nombre</th>
								<th class="p-4">Dirección</th>
								<th class="p-4">Categoría</th>
								<th class="p-4">Calificación / Reseñas</th>
								<th class="p-4">Contacto</th>
								<th class="p-4">Horario</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-800/60">
							{#each filteredPlaces as place}
								<tr class="hover:bg-slate-900/20 transition-colors">
									<td class="p-4 font-medium text-slate-200">{place.name}</td>
									<td class="p-4 text-slate-400 max-w-xs truncate" title={place.address}>{place.address}</td>
									<td class="p-4">
										{#if place.place_type}
											<span class="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-medium border border-slate-700/50">
												{place.place_type}
											</span>
										{:else}
											<span class="text-slate-600">-</span>
										{/if}
									</td>
									<td class="p-4">
										<div class="flex items-center space-x-2">
											{#if place.reviews_average !== null}
												<div class="flex items-center text-amber-400 space-x-1">
													<svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
														<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
													</svg>
													<span class="font-semibold text-slate-200">{place.reviews_average}</span>
												</div>
											{/if}
											{#if place.reviews_count !== null}
												<span class="text-slate-500 text-xs">({place.reviews_count} reseña{place.reviews_count === 1 ? '' : 's'})</span>
											{/if}
											{#if place.reviews_average === null && place.reviews_count === null}
												<span class="text-slate-600">-</span>
											{/if}
										</div>
									</td>
									<td class="p-4 space-y-1">
										{#if place.phone_number}
											<div class="flex items-center space-x-1.5 text-slate-400 text-xs">
												<svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
												</svg>
												<span>{place.phone_number}</span>
											</div>
										{/if}
										{#if place.website}
											<div class="flex items-center space-x-1.5 text-xs">
												<svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
												</svg>
												<a href={place.website.startsWith('http') ? place.website : `https://${place.website}`} target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline">Sitio web</a>
											</div>
										{/if}
										{#if !place.phone_number && !place.website}
											<span class="text-slate-600">-</span>
										{/if}
									</td>
									<td class="p-4">
										{#if place.opens_at}
											<div class="flex items-center space-x-1.5 text-slate-300">
												<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
												</svg>
												<span>{place.opens_at}</span>
											</div>
										{:else}
											<span class="text-slate-600">-</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>

	</main>
</div>
