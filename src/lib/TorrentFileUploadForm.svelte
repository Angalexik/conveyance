<script lang="ts">
	import { Form, FormGroup } from 'carbon-components-svelte';
	import FileUploader from './FileUploader.svelte';
	import type { TorrentPriority } from './torrents';
	import TorrentUploadForm from './TorrentUploadForm.svelte';
	import { decode } from './bencode';
	import { Buffer } from 'buffer';
	import TreeView from './TreeView.svelte';
	import { treeFromPaths, type ArchyTree } from 'tree-from-paths';

	type TorrentInfo = {
		announce: ArrayBuffer;
		info: {
			files?: {
				length: number;
				path: Array<ArrayBuffer | string>;
			}[];
			length: number;
			name: ArrayBuffer;
			'piece length': number;
			pieces: ArrayBuffer;
		};
	};

	export let downloadDir: string;
	export let priority: TorrentPriority;
	export let startUnpaused: boolean;
	export let torrentFile: string;

	const decoder = new TextDecoder();

	let treeFiles: ArchyTree | undefined;
	let files: FileList | undefined;
	let torrent: TorrentInfo;

	async function doFileStuff() {
		const fileBuffer = await files![0].arrayBuffer();
		const buffer = Buffer.from(fileBuffer);
		torrentFile = buffer.toString('base64');
		//@ts-ignore
		torrent = decode(buffer) as TorrentInfo;
		torrent.info.files = torrent.info.files?.map((x) => {
			x.path = x.path.map((y) => {
				if (!(typeof y == 'string')) {
					return decoder.decode(y);
				}
				return y;
			});
			return x;
		});
		if (torrent.info.files) {
			treeFiles = treeFromPaths(
				torrent.info.files.map((x, i) => `${x.path.join('/')}[${i}]`),
				decoder.decode(torrent.info.name),
				(_, x) => x,
				{ label: decoder.decode(torrent.info.name) }
			);
			// console.log(listToTree(torrent.info.files as StringFiles[]));
		} else {
			treeFiles = undefined;
		}
	}

	$: if (files?.[0]) {
		doFileStuff();
	}
</script>

<Form>
	<FormGroup><FileUploader bind:files label="Torrent file" /></FormGroup>
	{#if treeFiles}
		<FormGroup>
			<!-- <TreeView
				nodes={{
					label: '0',
					nodes: [
						{ label: '1', nodes: [] },
						{ label: '2', nodes: [{ label: '3', nodes: [] }] }
					]
				}}
				label="Files"
			/> -->
			<TreeView
				nodes={{ label: decoder.decode(torrent.info.name), nodes: [treeFiles] }}
				label="Files"
			/>
		</FormGroup>
	{/if}
	<TorrentUploadForm bind:downloadDir bind:priority bind:startUnpaused />
</Form>
