<script lang="ts">
	export let label: string;

	const id = Math.random().toString(36);
	export let files: FileList | undefined;
</script>

<div class="flex flex-col">
	<label class="bx--label" for="fileUploader-{id}">{label}</label>
	<input
		type="file"
		accept=".torrent,application/x-bittorrent"
		class="w-full"
		bind:files
	/>
</div>

<style lang="scss">
	input {
		@apply border-b border-solid border-b-gray-60 pr-5 bg-gray-90;
		line-height: 1.28572;
		letter-spacing: 0.16px;
		font-size: 0.875rem;

		&::file-selector-button {
			@apply bg-gray-90 border-solid border-gray-60 border text-white-0;
			border-bottom: none;
			padding: calc(0.675rem - 3px) 60px calc(0.675rem - 3px) 12px;
			min-height: 2.5rem;
			font-size: 0.875rem;
			font-weight: 400;
			line-height: 1.28572;
			letter-spacing: 0.16px;
			position: relative;
			display: inline-flex;
			max-width: 20rem;
			flex-shrink: 0;
			align-items: center;
			justify-content: space-between;
			margin: 0 1rem 0 0;
			border-radius: 0;
			cursor: pointer;
			outline: none;
			text-align: left;
			text-decoration: none;
			transition: background 70ms cubic-bezier(0, 0, 0.38, 0.9),
				box-shadow 70ms cubic-bezier(0, 0, 0.38, 0.9),
				border-color 70ms cubic-bezier(0, 0, 0.38, 0.9),
				outline 70ms cubic-bezier(0, 0, 0.38, 0.9);

			&:hover {
				background-color: #353535 !important;
			}
		}
	}
</style>
