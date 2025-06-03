import Cookies from 'js-cookie';

export default class RPC {
	private session_id: string | null = null;
	public auth: string = `Basic ${Cookies.get('auth')}` ?? '';

	constructor(private endpoint: URL) {}

	async sendRequest(method: string, data: any): Promise<Response> {
		const headers = {
			'X-Transmission-Session-Id': this.session_id ?? '',
			Authorization: this.auth
		};
		const body = JSON.stringify({
			arguments: data,
			method
		});

		const response = await fetch(this.endpoint, {
			method: 'POST',
			headers,
			credentials: 'include',
			body
		});
		if (response.status == 409) {
			this.session_id = response.headers.get('X-Transmission-Session-Id');
			return this.sendRequest(method, data);
		}
		return response;
	}
}
