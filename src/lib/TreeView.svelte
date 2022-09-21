<script lang="ts">
	import Files, { isFolder } from './Files.svelte';
	import type { Folder } from './Files.svelte';
	export let label: string;
	export let nodes: Folder;
</script>

<div class="flex flex-col w-full">
	<label class="bx--label">{label}</label>
	<ul class="bx--tree bx--tree--default" role="tree">
		{#each nodes.nodes as file}
			<li
				class="bx--tree-node {isFolder(file)
					? 'bx--tree-parent-node'
					: 'bx--tree-leaf-node'}"
			>
				{#if isFolder(file)}
					<Files {...file} depth={1} />
				{:else}
					<div class="bx--tree-node__label pl-8 ml-[-2.5rem]">{file.label}</div>
				{/if}
			</li>
		{/each}
	</ul>
</div>
