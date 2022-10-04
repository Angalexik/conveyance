<script lang="ts">
	import 'carbon-components-svelte/css/g100.css';
	import TorrentProperties from '$lib/TorrentProperties.svelte';
	import { torrents } from '$lib/stores';
	import { page } from '$app/stores';
	import { Button } from 'carbon-components-svelte';
</script>

<div class="mb-10">
	<h3 class="mt-5 mr-9 ml-5 mb-3 text-xl">Torrent properties</h3>
	{#if $torrents}
		<TorrentProperties torrentId={+($page.url.searchParams.get('torrent') ?? 1)} />
	{/if}
</div>
<Button size="lg" href=".." kind="secondary" class="min-w-[100vw] fixed bottom-0">
	Close
</Button>
