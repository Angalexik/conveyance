<script lang="ts" context="module">
	export type File = {
		label: string;
	};
	export type Folder = {
		label: string;
		nodes: Array<Folder | File>;
	};
	export function isFolder(thing: File | Folder): thing is Folder {
		return (thing as Folder)?.nodes && (thing as Folder)?.nodes?.length > 0;
	}
</script>

<script lang="ts">
	import { Checkbox } from 'carbon-components-svelte';
	import CaretDown from 'carbon-icons-svelte/lib/CaretDown.svelte';
	import { unwantedFiles } from './stores';
	export let nodes: Array<Folder | File>;
	export let label: string;
	export let depth: number;

	function extractIndex(str: string): number | undefined {
		const idx = str.slice(str.lastIndexOf('[')).match(/\[(\d+)\]/)?.[1];
		if (idx != undefined) {
			return +idx;
		}
		return undefined;
	}

	function updateUnwanted(_: unknown) {
		fileNodes.forEach(({ label }) => {
			const idx = extractIndex(label) ?? -1;
			const idxInGroup = group.includes(idx);
			const idxUnwanted = $unwantedFiles.includes(idx);
			if (idxInGroup && idxUnwanted) {
				$unwantedFiles = $unwantedFiles.filter((x) => x != idx); // remove idx from $unwantedFiles
			} else if (!idxInGroup && !idxUnwanted) {
				$unwantedFiles = [...$unwantedFiles, idx];
			}
		});
	}

	const fileNodes = nodes.filter((x) => !isFolder(x));
	let expanded = true;
	let group: number[] = fileNodes.map(({ label }) => extractIndex(label) ?? -1);
	export let checked = group.length != 0;
	$: checked = group.length != 0;
	$: updateUnwanted(group); // Really wish there was a nicer way to do this
</script>

<div
	class="bx--tree-node__label"
	style="margin-left: -{depth}rem; padding-left: {depth}rem"
>
	<span
		class="bx--tree-parent-node__toggle"
		on:click={() => {
			expanded = !expanded;
		}}
	>
		<CaretDown
			class="bx--tree-parent-node__toggle-icon {expanded &&
				'bx--tree-parent-node__toggle-icon--expanded'}"
		/>
	</span>
	<span class="bx--tree-node__label__details">{label}</span>
	<span class="ml-auto mr-5">
		<Checkbox
			labelText="Wanted"
			hideLabel
			bind:checked
			on:change={() => {
				if (group.length != 0) {
					group = [];
					// group = nodes
					// 	.filter((x) => !isFolder(x))
					// 	.map((x) => x.label)
					// 	.slice(0, 1);
				} else {
					group = fileNodes.map(({ label }) => extractIndex(label) ?? -1);
				}
				// debugger;
			}}
			indeterminate={group.length != fileNodes.length && group.length != 0}
		/>
	</span>
</div>

{#if expanded}
	<ul class="bx--tree-node__children">
		{#each nodes as file}
			<li
				class="bx--tree-node {isFolder(file)
					? 'bx--tree-parent-node'
					: 'bx--tree-leaf-node'}"
			>
				{#if isFolder(file)}
					<svelte:self {...file} depth={depth + 1} />
				{:else}
					<div
						class="bx--tree-node__label"
						style="margin-left: -{(depth + 1) * 2.5}rem; padding-left: {(depth + 1) *
							2.5}rem"
					>
						<!-- Don't forget about this lol -->
						{file.label.slice(0, file.label.lastIndexOf('['))}
						<span class="ml-auto mr-5">
							<Checkbox
								labelText="Wanted"
								hideLabel
								bind:group
								value={extractIndex(file.label)}
							/>
						</span>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
