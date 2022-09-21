<script lang="ts">
	import 'carbon-components-svelte/css/g100.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import { rpc, session, unwantedFiles } from '$lib/stores';
	import { uploadTorrent, type TorrentPriority } from '$lib/torrents';
	import TorrentUrlUploadForm from '$lib/TorrentURLUploadForm.svelte';
	import TorrentFileUploadForm from '$lib/TorrentFileUploadForm.svelte';
	import { Button } from 'carbon-components-svelte';

	const kind: 'url' | 'file' | null = <'url' | 'file' | null>(
		$page.url.searchParams.get('kind')
	);

	let downloadDir: string;
	let magnetLink: string;
	let priority: TorrentPriority;
	let startUnpaused: boolean;
	let torrentFile: string;
</script>

<h3 class="mt-5 mr-9 ml-5 mb-3 text-xl">Upload torrent</h3>
<!-- mb-10 for size of buttons + mb-2 for size of bottom margin -->
<div class="m-5 mb-12">
	{#if $session}
		{#if kind == 'url'}
			<TorrentUrlUploadForm
				bind:downloadDir
				bind:magnetLink
				bind:priority
				bind:startUnpaused
			/>
		{:else if kind == 'file'}
			<TorrentFileUploadForm
				bind:downloadDir
				bind:torrentFile
				bind:priority
				bind:startUnpaused
			/>
		{/if}
	{/if}
</div>

<div class="flex flex-row fixed bottom-0 w-screen">
	<Button kind="secondary" size="lg" href=".." class="flex-1">Cancel</Button>
	<Button
		kind="primary"
		size="lg"
		class="flex-1"
		on:click={() => {
			//const options = {
			//	'download-dir': downloadDir,
			//	paused: !startUnpaused,
			//	bandwidthPriority: priority
			//};
			//if (kind == 'url') {
			//	//@ts-ignore
			//	options['filename'] = magnetLink;
			//} else {
			//	//@ts-ignore
			//	options['metainfo'] = torrentFile;
			//	//@ts-ignore
			//	options['files-unwanted'] = $unwantedFiles;
			//}
			//rpc.sendRequest('torrent-add', options);
			//rpc
			//	.sendRequest('session-set', {
			//		'download-dir': downloadDir,
			//		'start-added-torrents': startUnpaused
			//	})
			//	.then(() => {
			//		updateSession();
			//	});
			if (kind != null) {
				uploadTorrent(
					kind == 'url' ? magnetLink : torrentFile,
					downloadDir,
					$unwantedFiles,
					priority,
					startUnpaused,
					rpc,
					kind
				);
				magnetLink = '';
				$unwantedFiles = [];
				goto('..');
			}
		}}
	>
		Upload
	</Button>
</div>
