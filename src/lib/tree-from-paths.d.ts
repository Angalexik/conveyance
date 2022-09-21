declare module 'tree-from-paths' {
	interface ArchyTree {
		label: string;
		nodes: ArchyTree[];
	}

	/**
	 * Transform an array of paths into an [archy](https://www.npmjs.com/package/archy)-compatible tree structure.
	 *
	 * ```
	 * ['abc/cde/efg/', 'abc/cde/abc', 'abc/zyx']
	 * ```
	 * becomes
	 * ```
	 * {
	 *   label: 'abc/',
	 *   nodes: [{ label: 'cde/',nodes: ['efg/', 'abc']}, 'zyx']
	 * }
	 * ```
	 *
	 * Nodes with a single subnode are collapsed and the resulting node gets the label `node/subnode`.
	 * @param files - an array of sorted file paths relative to `parent`
	 * @param baseDir - the directory of the files
	 * @param renderLabelFn - function that renders the label
	 *  of a node. It receives the parent and a filenpath as parameters.
	 * @param options - optional parameters
	 * @param options.label - the label of the root node (default: '')
	 * @returns a tree structure as needed by [archy](https://www.npmjs.com/package/archy)
	 */
	export function treeFromPaths(
		files: string[],
		baseDir: string,
		renderLabelFn: (parent: string, file: string, expilicit: boolean) => string,
		options?: { label?: string }
	): ArchyTree;
	// NOTE: There are two other exported functions, I just don't care
}
