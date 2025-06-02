import {
	readable,
	writable,
	type Readable,
	type Subscriber,
	type Writable
} from 'svelte/store';
import RPC from './rpc';
import {
	getFreeSpace,
	getSession,
	getTorrents,
	type Session,
	type FreeSpace
} from './torrents';
import type { Torrent } from './torrents';

export const rpc = import.meta.env.DEV
	? new RPC(new URL('http://localhost:9091/transmission/rpc'))
	: new RPC(new URL('/transmission/rpc', import.meta.url));

export function setPromise<T>(promise: Promise<T>, set: Subscriber<T>) {
	promise.then((x) => {
		set(x);
	});
}

export async function freeSpace(path: string): Promise<FreeSpace> {
	return await getFreeSpace(rpc, path);
}

export const torrents: Readable<Torrent[] | undefined> = readable(
	undefined,
	(set: Subscriber<Torrent[] | undefined>) => {
		const interval = setInterval(() => {
			setPromise(getTorrents(rpc, set), set);
			// getTorrents(rpc, set).then((x) => {
			// 	set(x);
			// });
		}, 600);

		return () => {
			clearInterval(interval);
		};
	}
);

export const session = writable(undefined, (set: Subscriber<Session | undefined>) => {
	setPromise(getSession(rpc), set);
	// const interval = setInterval(() => {
	// 	setPromise(getSession(rpc), set);
	// }, 2000);

	// return () => {
	// 	clearInterval(interval);
	// };
});
export function updateSession() {
	setPromise(getSession(rpc), session.set);
}

export const unwantedFiles: Writable<number[]> = writable([]);
