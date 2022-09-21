<script lang="ts">
	import {
		FormGroup,
		TextInput,
		Checkbox,
		Select,
		SelectItem
	} from 'carbon-components-svelte';
	import filesize from 'filesize';
	import { session, freeSpace } from './stores';
	import { TorrentPriority } from './torrents';

	export let priority: TorrentPriority = TorrentPriority.Normal;
	export let startUnpaused = $session?.['start-added-torrents'] ?? false;
	export let downloadDir = $session?.['download-dir'] ?? '';
	let freeBytes = 0;

	function recalculateFreeSpace() {
		freeSpace(downloadDir)?.then((x) => {
			console.log(x);
			freeBytes = x['size-bytes'];
		});
	}
	recalculateFreeSpace();
</script>

{#if $session}
	<FormGroup>
		<TextInput
			labelText="Destination folder"
			bind:value={downloadDir}
			helperText={freeBytes != -1 ? filesize(freeBytes) + ' free' : ''}
			on:input={recalculateFreeSpace}
		/>
	</FormGroup>
	<FormGroup>
		<Select labelText="Priority" bind:selected={priority}>
			<SelectItem value={TorrentPriority.High} text="High" />
			<SelectItem value={TorrentPriority.Normal} text="Normal" />
			<SelectItem value={TorrentPriority.Low} text="Low" />
		</Select>
	</FormGroup>
	<FormGroup>
		<Checkbox labelText="Start when added" bind:checked={startUnpaused} />
	</FormGroup>
{/if}
