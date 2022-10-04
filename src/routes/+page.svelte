<script lang="ts">
	import 'carbon-components-svelte/css/g100.css';
	import {
		ContentSwitcher,
		Switch,
		Tile,
		ProgressBar,
		Button,
		SkeletonText,
		SkeletonPlaceholder,
		breakpointObserver,
		ClickableTile
	} from 'carbon-components-svelte';
	import { unwantedFiles, rpc } from '$lib/stores';
	import { filesize } from '$lib/utils';
	import {
		Torrent,
		TorrentError,
		TorrentPriority,
		TorrentState,
		torrentStatusToString,
		uploadTorrent,
		type Session
	} from '$lib/torrents';
	import CloudDownload from 'carbon-icons-svelte/lib/CloudDownload.svelte';
	import DataBase from 'carbon-icons-svelte/lib/DataBase.svelte';
	import CloudUpload from 'carbon-icons-svelte/lib/CloudUpload.svelte';
	import Pause from 'carbon-icons-svelte/lib/Pause.svelte';
	import Play from 'carbon-icons-svelte/lib/Play.svelte';
	import SettingsAdjust from 'carbon-icons-svelte/lib/SettingsAdjust.svelte';
	import MeterAlt from 'carbon-icons-svelte/lib/MeterAlt.svelte';
	import Upload from 'carbon-icons-svelte/lib/Upload.svelte';
	import Link from 'carbon-icons-svelte/lib/Link.svelte';
	import Touch from 'carbon-pictograms-svelte/lib/Touch.svelte';
	import { derived, writable, type Readable, type Writable } from 'svelte/store';
	import TorrentUrlUploadForm from '$lib/TorrentURLUploadForm.svelte';
	import TorrentFileUploadForm from '$lib/TorrentFileUploadForm.svelte';
	import TorrentProperties from '$lib/TorrentProperties.svelte';
	import { onMount } from 'svelte';

	enum RightPaneState {
		AddingURL = 'url',
		AddingFile = 'file',
		ViewingTorrent = 'i dunno lol'
	}

	let activeTorents: Readable<Torrent[] | undefined> | undefined;

	let finishedTorrents: Readable<Torrent[] | undefined> | undefined;

	const size = breakpointObserver();
	const desktop = size.largerThan('sm');

	let torrents: Readable<Torrent[] | undefined> | undefined;
	let session: Writable<Session | undefined> | undefined;
	let currentTorrents: Readable<Torrent[] | undefined> | undefined;
	let selectedIndex = 0;
	let selectedTorrent: Writable<number | null> = writable(null);
	// let details = derived(
	// 	selectedTorrent,
	// 	($selectedTorrent, set: Subscriber<TorrentDetails | undefined>) => {
	// 		if ($selectedTorrent != null) {
	// 			const interval = setInterval(() => {
	// 				setPromise(getTorrentDetails(rpc, $selectedTorrent), set);
	// 			}, 600);
	// 			setPromise(getTorrentDetails(rpc, $selectedTorrent), set);

	// 			return () => {
	// 				clearInterval(interval);
	// 			};
	// 		}
	// 	},
	// 	undefined
	// );
	let rightPaneState = RightPaneState.ViewingTorrent;
	let downloadDir: string;
	let magnetLink: string;
	let priority: TorrentPriority;
	let startUnpaused: boolean;
	let torrentFile: string;
	let lastLength: number | undefined;

	$: if (torrents && activeTorents && finishedTorrents) {
		switch (selectedIndex) {
			case 0:
				currentTorrents = torrents;
				break;
			case 1:
				currentTorrents = activeTorents;
				break;
			case 2:
				currentTorrents = finishedTorrents;
				break;
			default:
				break;
		}
	}

	function torrentStatus(torrent: Torrent): string {
		if (torrent.data.error == TorrentError.Ok) {
			return torrentStatusToString(torrent.data.status);
		} else {
			return 'Error';
		}
	}

	function torrentSeeding(torrent: Torrent) {
		return (
			torrent.data.status == TorrentState.Seed ||
			torrent.data.status == TorrentState.QueuedSeed
		);
	}

	function torrentText(torrent: Torrent): string {
		if (torrent.data.error != TorrentError.Ok) {
			return torrent.data.errorString;
		}
		if (torrent.data.metadataPercentComplete < 1) {
			return 'Downloading metadata';
		}
		if (torrentSeeding(torrent)) {
			return `Uploaded ${filesize(torrent.data.uploadedEver)}`;
		}
		if (
			torrent.data.status == TorrentState.Download ||
			torrent.data.status == TorrentState.QueuedDownload
		) {
			return `Downloaded ${filesize(torrent.data.downloadedEver)} of ${filesize(
				torrent.data.sizeWhenDone
			)}`;
		}
		if (torrent.data.status == TorrentState.Stopped) {
			return '';
		}
		return 'Torrent status goes here';
	}

	function torrentSpeed(torrent: Torrent): string {
		if (torrentSeeding(torrent)) {
			return `${filesize(torrent.data.rateUpload)}/s`;
		}
		return `${filesize(torrent.data.rateDownload)}/s`;
	}

	onMount(async () => {
		({ torrents, session } = await import('$lib/stores'));
		currentTorrents = torrents;
		activeTorents = derived(torrents, ($x) => $x?.filter((t) => t.running));
		finishedTorrents = derived(torrents, ($x) =>
			$x?.filter(
				(t) =>
					t.data.status == TorrentState.QueuedSeed ||
					t.data.status == TorrentState.Seed ||
					t.data.percentDone == 1
			)
		);
		torrents.subscribe((x) => {
			if (x != undefined) {
				if (lastLength == undefined) {
					lastLength = x.length;
				} else if (lastLength > x.length) {
					$selectedTorrent = null;
					lastLength = x.length;
				} else if (lastLength < x.length) {
					lastLength = x.length;
				}
			}
		});
	});
</script>

<div class="md:flex">
	<div
		class="flex flex-col gap-5 m-5 mb-9 md:mb-0 md:m-0 md:ml-5 md:pt-5 md:max-w-[24rem] md:h-screen md:overflow-y-scroll md:overflow-x-hidden no-scrollbar"
	>
		<div class="flex flex-row gap-5">
			<Button
				class="grow"
				kind="tertiary"
				icon={Upload}
				href={!$desktop ? './add?kind=file' : undefined}
				on:click={() => {
					rightPaneState = RightPaneState.AddingFile;
				}}
			>
				Add Torrent
			</Button>
			<Button
				class="grow"
				kind="tertiary"
				icon={Link}
				href={!$desktop ? './add?kind=url' : undefined}
				on:click={() => {
					rightPaneState = RightPaneState.AddingURL;
				}}
			>
				Add URL
			</Button>
		</div>
		{#if currentTorrents && $currentTorrents}
			<!-- {#if false} -->
			{#each $currentTorrents as torrent}
				{@const data = torrent.data}
				<svelte:component
					this={$desktop ? ClickableTile : Tile}
					on:click={() => {
						$selectedTorrent = data.id;
						rightPaneState = RightPaneState.ViewingTorrent;
					}}
					class="flex-none"
				>
					<p class="text-xl font-semibold truncate">{data.name}</p>
					<div class="flex flex-row justify-between items-end">
						<p
							class="text-xl leading-none"
							class:text-red-50={data.error != TorrentError.Ok}
							class:text-blue-50={data.error == TorrentError.Ok}
						>
							{Math.floor(
								data.metadataPercentComplete == 1
									? data.percentDone * 100
									: data.metadataPercentComplete * 100
							)}%
						</p>
						<p class="leading-none" class:text-red-50={data.error != TorrentError.Ok}>
							{torrentStatus(torrent)}
						</p>
					</div>
					<ProgressBar
						value={data.metadataPercentComplete == 1
							? data.percentDone * 100
							: data.metadataPercentComplete * 100}
						helperText={torrentText(torrent)}
					/>
					<div class="flex flex-row justify-between mt-5">
						<div class="flex flex-row items-center gap-[0.5ch]">
							{#if torrentSeeding(torrent)}
								<CloudUpload aria-label="Upload speed" />
							{:else}
								<CloudDownload aria-label="Download speed" />
							{/if}
							{torrentSpeed(torrent)}
							<DataBase aria-label="Torrent size" />
							{filesize(Math.max(data.downloadedEver, data.sizeWhenDone))}
							<MeterAlt aria-label="Ratio" />
							{data.uploadRatio.toFixed(2)}
						</div>
						<div class="flex flex-row gap-1">
							<Button
								class="md:hidden"
								kind="ghost"
								size="field"
								iconDescription={'Properties'}
								icon={SettingsAdjust}
								href="./details?torrent={data.id}"
								on:click={() => {
									// selectedTorrent = data.id;
									// open = true;
									// goto('web/details')
								}}
							/>
							<Button
								kind="ghost"
								size="field"
								iconDescription={data.status == TorrentState.Stopped
									? 'Unpause'
									: 'Pause'}
								icon={data.status == TorrentState.Stopped ? Play : Pause}
								on:click={torrent.toggleState.bind(torrent)}
							/>
						</div>
					</div>
				</svelte:component>
			{/each}
		{:else}
			{#each new Array(4) as _}
				<Tile class="md:w-[24rem] flex-none">
					<SkeletonText heading />
					<div class="flex flex-row justify-between items-end">
						<SkeletonText heading width="55px" />
						<SkeletonText width="55px" />
					</div>
					<SkeletonPlaceholder style="width: 100%; height: 8px" />
					<div class="flex flex-row justify-between mt-5 h-8 items-center">
						<SkeletonText width="200px" />
					</div>
				</Tile>
			{/each}
		{/if}
	</div>
	{#if $desktop}
		<div
			class="flex {$selectedTorrent == null &&
			rightPaneState == RightPaneState.ViewingTorrent
				? 'justify-center items-center'
				: ''} flex-col h-screen overflow-y-scroll no-scrollbar grow pt-5 mx-5 lg:mx-8 xlg:mx-12 max:mx-13"
		>
			{#if rightPaneState == RightPaneState.AddingURL}
				{#if session && $session}
					<TorrentUrlUploadForm
						bind:downloadDir
						bind:magnetLink
						bind:priority
						bind:startUnpaused
					/>
				{/if}
			{:else if rightPaneState == RightPaneState.AddingFile}
				{#if session && $session}
					<TorrentFileUploadForm
						bind:downloadDir
						bind:torrentFile
						bind:priority
						bind:startUnpaused
					/>
				{/if}
			{:else if $selectedTorrent == null}
				<Touch />
				<h2 class="text-center select-none">
					Click on a torrent to view its information
				</h2>
			{:else}
				{@const filtered = $torrents?.filter((x) => x.data.id == $selectedTorrent)}
				<h3 class="mb-4">{filtered?.[0]?.data?.name}</h3>
				{#if filtered && filtered != []}
					<TorrentProperties container torrentId={$selectedTorrent} />
				{/if}
			{/if}

			{#if rightPaneState == RightPaneState.AddingURL || rightPaneState == RightPaneState.AddingFile}
				<div>
					<Button
						on:click={() => {
							if (rightPaneState != RightPaneState.ViewingTorrent) {
								uploadTorrent(
									rightPaneState == 'url' ? magnetLink : torrentFile,
									downloadDir,
									$unwantedFiles,
									priority,
									startUnpaused,
									rpc,
									rightPaneState
								);

								$selectedTorrent = null;
								rightPaneState = RightPaneState.ViewingTorrent;
							}
						}}
					>
						Upload
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- <Modal passiveModal bind:open modalHeading="Torrent Properites" on:open on:close on:submit>
	{#if selectedTorrent}
		<TorrentProperties {open} torrentId={selectedTorrent} />
	{/if}
</Modal> -->

<!-- <Modal
	bind:open={addUrlOpen}
	modalHeading="Upload torrent from URL"
	primaryButtonText="Upload"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		addUrlOpen = false;
	}}
	on:click:button--primary={() => {
		rpc.sendRequest('torrent-add', {
			'download-dir': downloadDir,
			filename: magnetLink,
			paused: !startUnpaused,
			bandwidthPriority: priority
		});
		rpc
			.sendRequest('session-set', {
				'download-dir': downloadDir,
				'start-added-torrents': startUnpaused
			})
			.then(() => {
				updateSession();
			});
		magnetLink = '';
		addUrlOpen = false;
	}}
	on:open
	on:close
	on:submit
>
	{#if $session}
		<TorrentUrlUploadForm bind:downloadDir bind:magnetLink bind:priority bind:startUnpaused />
	{/if}
</Modal> -->

<ContentSwitcher class="fixed bottom-0 bg-gray-100 md:hidden" bind:selectedIndex>
	<Switch text="All" />
	<Switch text="Active" />
	<Switch text="Finished" />
</ContentSwitcher>
