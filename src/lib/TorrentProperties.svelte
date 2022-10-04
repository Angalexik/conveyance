<script lang="ts">
	import 'carbon-components-svelte/css/g100.css';
	import { rpc, setPromise, torrents } from './stores';
	import {
		Button,
		Checkbox,
		Form,
		FormGroup,
		Modal,
		NumberInput,
		Select,
		SelectItem,
		Tab,
		TabContent,
		Tabs
	} from 'carbon-components-svelte';
	import {
		getTorrentDetails,
		TorrentPriority,
		type TorrentDetails,
		type TorrentFile,
		type TorrentSeedMode
	} from './torrents';
	import { debounce } from 'lodash-es';
	import { treeFromPaths } from 'tree-from-paths';
	import TreeView from './TreeView.svelte';
	import { readable, type Subscriber } from 'svelte/store';
	import TorrentTable from './TorrentTable.svelte';
	import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let torrentId: number;
	export let container = false;

	$: torrent = $torrents?.filter((x) => x.data.id == torrentId)?.[0];
	$: seedRatioMode = torrent?.data?.seedRatioMode;
	$: seedIdleMode = torrent?.data?.seedIdleMode;
	$: seedIdleLimit = torrent?.data?.seedIdleLimit;
	$: seedRatioLimit = torrent?.data?.seedRatioLimit;
	$: peerLimit = torrent?.data['peer-limit'];
	$: priority = torrent?.data?.bandwidthPriority;
	$: honorsLimit = torrent?.data?.honorsSessionLimits;
	$: downloadLimited = torrent?.data?.downloadLimited;
	$: uploadLimited = torrent?.data?.uploadLimited;
	$: downloadLimit = torrent?.data?.downloadLimit;
	$: uploadLimit = torrent?.data?.uploadLimit;
	const details = readable(undefined, (set: Subscriber<TorrentDetails | undefined>) => {
		const interval = setInterval(() => {
			setPromise(getTorrentDetails(rpc, torrentId), set);
		}, 600);
		setPromise(getTorrentDetails(rpc, torrentId), set);

		return () => {
			clearInterval(interval);
		};
	});
	let modalOpen = false;
	let trashFiles = false;
	let selected: number;

	let files: TorrentFile[] = [];
	// The files tab is selected
	$: if (selected == 1) {
		torrent?.files()?.then((f) => {
			files = f;
		});
	}

	function priorityOnChange(e: CustomEvent<string | number>) {
		torrent?.setPriority(e.detail as TorrentPriority);
	}

	function idleModeOnChange(e: CustomEvent<number | string>) {
		torrent?.setSeedIdleMode(e.detail as TorrentSeedMode);
	}

	function ratioModeOnChange(e: CustomEvent<number | string>) {
		torrent?.setSeedRatioMode(e.detail as TorrentSeedMode);
	}
</script>

<Tabs type={container ? 'container' : undefined} bind:selected>
	<Tab label="Information" />
	<Tab label="Files" />
	<Tab label="Options" />
	<svelte:fragment slot="content">
		<TabContent class="px-0 {container ? 'bg-gray-90' : ''}">
			{#if $details && torrent}
				<TorrentTable {torrent} {details} />
			{/if}
		</TabContent>
		<TabContent class={container ? 'bg-gray-90' : ''}>
			<TreeView
				label="Files"
				nodes={{
					label: torrent?.data?.name ?? 'Unknown',
					nodes: [
						treeFromPaths(
							files.map(({ name }, i) => `${name}[${i}]`),
							torrent?.data?.name ?? 'Unknown',
							(_, x) => x,
							{ label: torrent?.data?.name }
						)
					]
				}}
			/>
		</TabContent>
		<TabContent class={container ? 'bg-gray-90' : ''}>
			<Form>
				<FormGroup legendText="Speed">
					<Checkbox
						bind:checked={honorsLimit}
						labelText="Honor global limits"
						on:change={() => {
							torrent?.setHonorsLimit(!honorsLimit ?? false);
						}}
					/>
					<Checkbox
						checked={downloadLimited}
						labelText="Limit download speed"
						on:change={() => {
							torrent?.setDownloadLimited(!downloadLimited ?? false);
						}}
					/>
					<Checkbox
						checked={uploadLimited}
						labelText="Limit upload speed"
						on:change={() => {
							torrent?.setUploadLimited(!uploadLimited ?? false);
						}}
					/>
				</FormGroup>
				{#if downloadLimited}
					<FormGroup>
						<NumberInput
							label="Download speed limit"
							helperText="kB/s"
							value={downloadLimit}
							step={5}
							on:change={(e) => {
								if (e.detail != null) {
									torrent?.setDownloadLimit(e.detail);
								}
							}}
						/>
					</FormGroup>
				{/if}
				{#if uploadLimited}
					<FormGroup>
						<NumberInput
							label="Upload speed limit"
							helperText="kB/s"
							value={uploadLimit}
							step={5}
							on:change={(e) => {
								if (e.detail != null) {
									torrent?.setUploadLimit(e.detail);
								}
							}}
						/>
					</FormGroup>
				{/if}
				<FormGroup>
					<Select
						labelText="Torrent priority"
						bind:selected={priority}
						on:change={priorityOnChange}
					>
						<SelectItem value={TorrentPriority.High} text="High" />
						<SelectItem value={TorrentPriority.Normal} text="Normal" />
						<SelectItem value={TorrentPriority.Low} text="Low" />
					</Select>
				</FormGroup>
				<FormGroup>
					<Select
						labelText="Ratio"
						bind:selected={seedRatioMode}
						on:change={ratioModeOnChange}
					>
						<SelectItem value={0} text="Use global settings" />
						<SelectItem value={2} text="Seed regardless of ratio" />
						<SelectItem value={1} text="Stop seeding at ratio:" />
					</Select>
					{#if seedRatioMode == 1}
						<NumberInput
							value={seedRatioLimit}
							step={0.5}
							on:change={debounce((e) => {
								if (e.detail != null) {
									torrent?.setSeedRatioLimit(e.detail);
								}
							}, 50)}
						/>
					{/if}
				</FormGroup>
				<FormGroup>
					<Select
						labelText="Idle"
						bind:selected={seedIdleMode}
						on:change={idleModeOnChange}
					>
						<SelectItem value={0} text="Use global settings" />
						<SelectItem value={2} text="Seed regardless of activity" />
						<SelectItem value={1} text="Stop seeding when idle for:" />
					</Select>
					{#if seedIdleMode == 1}
						<NumberInput
							value={seedIdleLimit}
							helperText="minutes"
							on:change={(e) => {
								if (e.detail != null) {
									torrent?.setSeedIdleLimit(e.detail);
								}
							}}
						/>
					{/if}
				</FormGroup>
				<FormGroup>
					<NumberInput
						label="Maximum peers"
						value={peerLimit}
						on:change={(e) => {
							if (e.detail != null) {
								torrent?.setPeerLimit(e.detail);
							}
						}}
					/>
				</FormGroup>
			</Form>
			<Button
				kind="danger"
				icon={TrashCan}
				on:click={() => {
					modalOpen = true;
				}}
			>
				Remove torrent
			</Button>
		</TabContent>
	</svelte:fragment>
</Tabs>

<Modal
	danger
	size="sm"
	bind:open={modalOpen}
	modalHeading="Delete torrent"
	primaryButtonText="Delete"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		modalOpen = false;
	}}
	on:click:button--primary={() => {
		rpc.sendRequest('torrent-remove', {
			ids: [torrentId],
			'delete-local-data': trashFiles
		});
		modalOpen = false;
		if ($page.url.pathname == '/transmission/web/details/') {
			goto('..');
		}
	}}
>
	<FormGroup>
		<p>
			Once removed, continuing the transfer will require the original torrent file. Are
			you sure you want to remove it?
		</p>
	</FormGroup>
	<Checkbox bind:checked={trashFiles} labelText="Delete downloaded data" />
</Modal>
