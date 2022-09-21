<script lang="ts">
	import { torrentStatusToString, type Torrent, type TorrentDetails } from './torrents';
	import type { Readable } from 'svelte/store';

	import { filesize } from './utils';
	import {
		formatDuration,
		addSeconds,
		intervalToDuration,
		formatDistanceToNow,
		format,
		type Duration
	} from 'date-fns';

	export let torrent: Torrent;
	export let details: Readable<TorrentDetails | undefined>;

	function secondsToIntervalToDuration(seconds: number) {
		const now = new Date();
		return intervalToDuration({ start: now, end: addSeconds(now, seconds) });
	}

	let etaDuration: Duration | undefined;
	$: if ($details) {
		etaDuration = secondsToIntervalToDuration($details.eta);
	}

	function getOrigin(details: TorrentDetails): string {
		const empty_creator = !details?.creator || details?.creator?.length == 0;
		const empty_date = !details?.dateCreated;

		if (empty_creator && empty_date && details == undefined) {
			return 'Unknown';
		} else if (empty_date && !empty_creator && details != undefined) {
			return `Created by ${details.creator}`;
		} else if (empty_creator && !empty_date && details != undefined) {
			return `Created on ${format(new Date(details.dateCreated * 1000), 'PP')}`;
		} else if (details != undefined) {
			return `Created by ${details.creator} on ${format(
				new Date(details.dateCreated * 1000),
				'PP'
			)}`;
		}
		return 'Unknown';
	}

	function have(details: TorrentDetails) {
		if (details == undefined) {
			return 'Unknown';
		}
		const verified = details.haveValid;
		const unverified = details.haveUnchecked;
		const leftUntilDone = details.leftUntilDone;
		const percent = (
			100 *
			(torrent.data.sizeWhenDone
				? (torrent.data.sizeWhenDone - leftUntilDone) / torrent.data.sizeWhenDone
				: 1)
		).toFixed(2);

		if (!unverified && !leftUntilDone) {
			return `${filesize(verified)} (100%)`;
		} else if (!unverified) {
			return `${filesize(verified)} of ${filesize(
				torrent.data.sizeWhenDone
			)} (${percent}%)`;
		} else {
			return `${filesize(verified)} of ${filesize(
				torrent.data.sizeWhenDone
			)} (${percent}%), ${filesize(unverified)} Unverified`;
		}
	}
</script>

{#if $details != undefined}
	<table class="bx--data-table">
		<thead>
			<tr>
				<th colspan="2">Activity</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th>Have:</th>
				<td>{have($details)}</td>
			</tr>
			<tr>
				<th>Availability:</th>
				<td
					>{(
						(($details.haveUnchecked + $details.haveValid + $details.desiredAvailable) /
							torrent.data.sizeWhenDone) *
						100
					).toFixed(2)}%</td
				>
			</tr>
			<tr>
				<th>Uploaded:</th>
				<td>
					{filesize(torrent.data.uploadedEver)} (Ratio: {torrent.data.uploadRatio.toFixed(
						2
					)})
				</td>
			</tr>
			<tr>
				<th>Downloaded:</th>
				<td>{filesize(torrent.data.downloadedEver)}</td>
			</tr>
			<tr>
				<th>State:</th>
				<td>{torrentStatusToString(torrent.data.status)}</td>
			</tr>
			<tr>
				<th>Running time:</th>
				<td>
					{torrent.running
						? formatDistanceToNow(new Date($details.startDate * 1000))
						: torrentStatusToString(torrent.data.status)}
				</td>
			</tr>
			<tr>
				<th>Remaining time:</th>
				<td
					>{$details.eta > 0 && etaDuration
						? formatDuration(etaDuration)
						: 'Unknown'}</td
				>
			</tr>
			<tr>
				<th>Last activity</th>
				<td>{formatDistanceToNow(new Date($details.activityDate * 1000))} ago</td>
			</tr>
		</tbody>
		<thead>
			<tr>
				<th colspan="2">Details</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th>Size:</th>
				<td>
					{filesize(torrent.data.sizeWhenDone)} ({$details.pieceCount} pieces @ {filesize(
						$details.pieceSize
					)})
				</td>
			</tr>
			<tr>
				<th>Location:</th>
				<td>{$details.downloadDir}</td>
			</tr>
			<tr>
				<th>Privacy:</th>
				<td>{$details.isPrivate ? 'Private' : 'Public'} torrent</td>
			</tr>
			<tr>
				<th>Origin:</th>
				<td>{getOrigin($details)}</td>
			</tr>
		</tbody>
	</table>
{/if}
