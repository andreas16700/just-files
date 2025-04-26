<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Login from '$lib/components/Login.svelte';
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import { appEntrypoint, userContainer, select, logout } from "$lib/stores/stores.svelte";
	import Files from '$lib/components/Files.svelte';
	import Upload from '$lib/components/upload.svelte';
  	
	let { children } = $props();
	let wait = $state(true);
  
	onMount(async () => {
	  try {
		await appEntrypoint();
	  } catch (error) {
		console.error("error on app entrypoint!", error);
	  } finally {
		wait = false;
	  }
	});

	const panes = ['files','upload', 'logout'];
    let selectedPane = $derived(userContainer.selectedPane)

	



    function selectItem(id: string, event: MouseEvent | KeyboardEvent) {
		
        if (selectedPane && selectedPane === id) {
			select(null)
        }else{
			// selectedUpdateID = id
			console.log("selected "+id)
			// general.selectedUpdateID = id
			select(id)
		}

		if (id === 'logout'){
			logout()
			selectedPane=null
		}
        
        // Animation logic (keep as is)
        if (event?.currentTarget && event.currentTarget instanceof HTMLElement) {
            const el = event.currentTarget;
            const class_name = "animate-mypulse";
            el.classList.remove(class_name);
            void el.offsetWidth;
            el.classList.add(class_name);
            setTimeout(() => {
                if (el?.classList.contains(class_name)) {
                     el.classList.remove(class_name);
                }
            }, 450);
        }
    }
  </script>
  
  <style>
	.the-footer {
	  max-height: 4rem;
	}
  </style>
  
  <div class="grid h-screen grid-rows-[1fr_auto]">
	{#if wait}
	  <!-- Loading -->
	  <div class="flex items-center justify-center">
		<ProgressRing value={null} size="size-34"/>
		<p class="text-center text-xl mt-2">loading..</p>
	  </div>
	{:else if userContainer.user}
	<div class="flex items-start">
		<!-- SIDEBAR -->
		<aside class="w-60 bg-slate-900 text-white p-6 rounded-tr-3xl rounded-br-3xl">
		  <!-- logo + title -->
		  <div class="flex items-center mb-8">
			<img src="/ares.jpeg" alt="FootyFlow" class="h-15 w-auto" />
			<span class="ml-3 text-2xl font-bold">files</span>
		  </div>
	  
		  <!-- nav buttons -->
		  <nav class="flex flex-col space-y-4">
			{#each panes as pane}
		<button
		  class="w-full text-left p-3 rounded-lg transition-colors duration-150
				 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
				 dark:focus-visible:ring-offset-black focus-visible:ring-offset-2
				 hover:preset-tonal-primary"
		  class:bg-primary-500={selectedPane === pane}
		  class:hover:bg-primary-600={selectedPane === pane}
		  onclick={(event) => selectItem(pane, event)}
									onkeydown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') selectItem(pane, event);
									}}
		>
		  {pane.charAt(0).toUpperCase() + pane.slice(1)}
		</button>
	  {/each}
		  </nav>
		</aside>
	  
		<!-- RIGHT CONTENT (placeholder) -->
		<main class="flex-1 p-6">
		<!-- <main class="flex-grow min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8"> -->
		 {#if selectedPane == "files"}
			<Files />
		{:else if selectedPane == "upload"}
			<Upload />
		{:else}
			{@render children()}
		 {/if}
		</main>
	  </div>

	{:else}
	  <!-- Login -->
	  <div class="flex-grow">
		<Login />
	  </div>
	{/if}
  
	<!-- Footer always in 2nd row -->
	<footer class="border-t border-surface-500/30 bg-surface-100-900 p-4 text-left text-sm the-footer">
	  © {new Date().getFullYear()} andreas & lambros & alexis for SFA
	</footer>
  </div>
  