<script lang="ts">
	import { Form, FormGroup, TextInput } from 'carbon-components-svelte';
	import type { TorrentPriority } from './torrents';
	import TorrentUploadForm from './TorrentUploadForm.svelte';

	export let magnetLink = '';
	export let downloadDir: string;
	export let priority: TorrentPriority;
	export let startUnpaused: boolean;
</script>

<Form>
	<FormGroup>
		<TextInput labelText="Source" placeholder="magnet:?" bind:value={magnetLink} />
	</FormGroup>
	<TorrentUploadForm bind:downloadDir bind:priority bind:startUnpaused />
</Form>
