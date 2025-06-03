<script lang="ts">
	import { goto } from '$app/navigation';
	import { rpc } from '$lib/stores';
	import {
		breakpointObserver,
		Button,
		Checkbox,
		Form,
		FormGroup,
		InlineNotification,
		PasswordInput,
		TextInput
	} from 'carbon-components-svelte';
	import 'carbon-components-svelte/css/g100.css';
	import ArrowRight from 'carbon-icons-svelte/lib/ArrowRight.svelte';
	import Cookies from 'js-cookie';

	const size = breakpointObserver();
	const desktop = size.largerThan('sm');

	let username = '';
	let password = '';
	let remember = false;

	let showIncorrectLogin = false;
	let showOtherError = false;

	async function login() {
		const base64 = btoa(`${username}:${password}`);
		rpc.auth = `Basic ${base64}`;

		const response = await rpc.sendRequest('session-get', {
			fields: ['rpc-version']
		});

		if (response.status == 401) {
			username = '';
			password = '';
			showIncorrectLogin = true;
		} else if (response.ok) {
			Cookies.set('auth', base64, {
				expires: remember ? 1000 : undefined,
				sameSite: 'strict'
			});
			goto('../');
		} else {
			showOtherError = true;
		}
	}
</script>

<div class="flex justify-center md:items-center h-screen">
	<div class="p-5 flex flex-col md:bg-gray-90 gap-5 w-[40rem]">
		<h1 class="text-3xl">Log in</h1>

		{#if showIncorrectLogin}
			<InlineNotification
				kind="error"
				title="Error:"
				subtitle="Incorrect username or password."
				on:close={() => (showIncorrectLogin = false)}
			/>
		{/if}

		{#if showOtherError}
			<InlineNotification
				kind="error"
				title="Error:"
				subtitle="Something went wrong. Idk man..."
				on:close={() => (showOtherError = false)}
			/>
		{/if}

		<Form>
			<FormGroup class="flex flex-col gap-5" noMargin>
				<TextInput light={$desktop} labelText="Username" bind:value={username} />
				<PasswordInput light={$desktop} labelText="Password" bind:value={password} />
				<Checkbox labelText="Remember me" bind:checked={remember} />
				<Button size="lg" class="w-full self-end" on:click={login} icon={ArrowRight}>
					Log in
				</Button>
			</FormGroup>
		</Form>
	</div>
</div>
