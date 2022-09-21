import type { Subscriber } from 'svelte/store';
import type RPC from './rpc';
import { setPromise, updateSession } from './stores';

export type Session = {
	'download-dir': string;
	'start-added-torrents': boolean;
	'download-dir-free-space': number;
};

export type FreeSpace = {
	path: string;
	'size-bytes': number; // the size of free space in directory
	total_size: number; // the capacity of the directory
};

export enum TorrentState {
	Stopped = 0,
	QueuedVerify,
	Verify,
	QueuedDownload,
	Download,
	QueuedSeed,
	Seed
}

export enum TorrentError {
	Ok = 0,
	TrackerWarning,
	TrackerError,
	LocalError
}

export enum TorrentSeedMode {
	Global = 0, // follow the globl settings
	Single, // override the global settings, seeding until a certain idle time
	Unlimited // override the global settings, seeding regardless of activity
}

export enum TorrentPriority {
	Low = -1,
	Normal = 0,
	High = 1
}

// Information about the torrent on the main page
type TorrentInfo = {
	id: number;
	name: string;
	percentDone: number;
	status: TorrentState;
	downloadedEver: number;
	uploadedEver: number;
	sizeWhenDone: number;
	error: TorrentError;
	errorString: string;
	metadataPercentComplete: number;
	rateUpload: number;
	rateDownload: number;
	seedIdleMode: TorrentSeedMode;
	seedIdleLimit: number; // Number of minutes of seeding inactivity
	seedRatioMode: TorrentSeedMode;
	seedRatioLimit: number;
	'peer-limit': number;
	bandwidthPriority: TorrentPriority;
	uploadRatio: number;
	honorsSessionLimits: boolean;
	downloadLimit: number; // kB/s
	downloadLimited: boolean;
	uploadLimit: number; // kB/s
	uploadLimited: boolean;
};

// Information about the torrent in the expanded details table
export type TorrentDetails = {
	activityDate: number;
	dateCreated: number;
	eta: number; // number of seconds until torrent is done; negative number means something bad
	pieceCount: number;
	pieceSize: number;
	startDate: number;
	downloadDir: string;
	isPrivate: boolean;
	creator: string;
	haveUnchecked: number;
	haveValid: number;
	desiredAvailable: number;
	leftUntilDone: number;
};

export type TorrentFile = {
	bytesCompleted: number;
	length: number;
	name: string;
	wanted: boolean;
	priority: number;
};

export class Torrent {
	constructor(
		private rpc: RPC,
		private set: Subscriber<Torrent[]>,
		public data: TorrentInfo
	) {}

	toggleState() {
		if (this.data.status == TorrentState.Stopped) {
			this.start();
		} else {
			this.stop();
		}
	}
	get running() {
		return !(
			this.data.error != TorrentError.Ok ||
			this.data.status == TorrentState.Stopped ||
			this.data.status == TorrentState.QueuedSeed ||
			this.data.status == TorrentState.QueuedVerify ||
			this.data.status == TorrentState.QueuedDownload
		);
	}
	async start() {
		await this.rpc.sendRequest('torrent-start', {
			ids: [this.data.id]
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async stop() {
		await this.rpc.sendRequest('torrent-stop', {
			ids: [this.data.id]
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setSeedIdleMode(mode: TorrentSeedMode) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			seedIdleMode: mode
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setSeedRatioMode(mode: TorrentSeedMode) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			seedRatioMode: mode
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setSeedIdleLimit(limit: number) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			seedIdleLimit: limit
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setSeedRatioLimit(limit: number) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			seedRatioLimit: limit
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setPeerLimit(limit: number) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			'peer-limit': limit
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setPriority(priority: TorrentPriority) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			bandwidthPriority: priority
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setHonorsLimit(doesit: boolean) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			honorsSessionLimits: doesit
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setDownloadLimited(isit: boolean) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			downloadLimited: isit
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setUploadLimited(isit: boolean) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			uploadLimited: isit
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setDownloadLimit(limit: number) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			downloadLimit: limit
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async setUploadLimit(limit: number) {
		await this.rpc.sendRequest('torrent-set', {
			ids: [this.data.id],
			uploadLimit: limit
		});
		setPromise(getTorrents(this.rpc, this.set), this.set);
	}
	async files(): Promise<TorrentFile[]> {
		const torrent: {
			files: Array<{
				bytesCompleted: number;
				length: number;
				name: string;
			}>;
			fileStats: Array<{
				bytesCompleted: number;
				wanted: boolean;
				priority: number;
			}>;
		} = (
			await (
				await this.rpc.sendRequest('torrent-get', {
					ids: [this.data.id],
					fields: ['files', 'fileStats']
				})
			).json()
		).arguments.torrents[0];
		return torrent.files.map((x, i) => {
			return { ...x, ...torrent.fileStats[i] };
		});
	}
}

export async function getTorrents(rpc: RPC, set: Subscriber<Torrent[]>) {
	const info: TorrentInfo[] = (
		await (
			await rpc.sendRequest('torrent-get', {
				fields: [
					'id',
					'name',
					'percentDone',
					'status',
					'sizeWhenDone',
					'downloadedEver',
					'error',
					'errorString',
					'metadataPercentComplete',
					'uploadedEver',
					'rateUpload',
					'rateDownload',
					'seedIdleLimit',
					'seedIdleMode',
					'seedRatioLimit',
					'seedRatioMode',
					'peer-limit',
					'bandwidthPriority',
					'uploadRatio',
					'honorsSessionLimits',
					'downloadLimit',
					'downloadLimited',
					'uploadLimit',
					'uploadLimited'
				]
			})
		).json()
	).arguments.torrents;
	return info.map((x) => {
		return new Torrent(rpc, set, x);
	});
}

export async function getSession(rpc: RPC): Promise<Session> {
	return (
		await (
			await rpc.sendRequest('session-get', {
				fields: [
					'download-dir',
					'start-added-torrents',
					'download-dir-free-space',
					'start-added-torrents'
				]
			})
		).json()
	).arguments;
}

export async function getTorrentDetails(rpc: RPC, id: number): Promise<TorrentDetails> {
	return (
		await (
			await rpc.sendRequest('torrent-get', {
				ids: [id],
				fields: [
					'activityDate',
					'dateCreated',
					'eta',
					'pieceCount',
					'pieceSize',
					'startDate',
					'downloadDir',
					'isPrivate',
					'creator',
					'haveValid',
					'haveUnchecked',
					'desiredAvailable',
					'leftUntilDone'
				]
			})
		).json()
	).arguments.torrents[0];
}

export async function getFreeSpace(rpc: RPC, path: string): Promise<FreeSpace> {
	return (
		await (
			await rpc.sendRequest('free-space', {
				path
			})
		).json()
	).arguments;
}

export function torrentStatusToString(status: TorrentState): string {
	switch (status) {
		case TorrentState.Download:
			return 'Downloading';
		case TorrentState.QueuedDownload:
			return 'Queued';
		case TorrentState.QueuedSeed:
			return 'Queued';
		case TorrentState.QueuedVerify:
			return 'Queued';
		case TorrentState.Seed:
			return 'Seeding';
		case TorrentState.Stopped:
			return 'Paused';
		default:
			return "It's doing something alright";
	}
}

export function uploadTorrent(
	source: string,
	downloadDir: string,
	unwantedFiles: number[],
	bandwidthPriority: TorrentPriority,
	startUnpaused: boolean,
	rpc: RPC,
	kind: 'url' | 'file'
) {
	const options: {
		'download-dir': string;
		paused: boolean;
		bandwidthPriority: TorrentPriority;
		filename?: string;
		metainfo?: string;
		'files-unwanted'?: number[];
	} = {
		'download-dir': downloadDir,
		paused: !startUnpaused,
		bandwidthPriority
	};
	if (kind == 'url') {
		options['filename'] = source;
	} else {
		options['metainfo'] = source;
		options['files-unwanted'] = unwantedFiles;
	}
	rpc.sendRequest('torrent-add', options);
	rpc
		.sendRequest('session-set', {
			'download-dir': downloadDir,
			'start-added-torrents': startUnpaused
		})
		.then(() => {
			updateSession();
		});
}
