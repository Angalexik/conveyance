import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import Cookies from 'js-cookie';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async () => {
	if (browser) {
		const auth = Cookies.get('auth');
		if (auth === undefined) {
			throw redirect(302, './login/');
		}
	}
};
