const { EventEmitter } = require('events');
const WebSocket = require('ws');

class LavaNode extends EventEmitter {
	constructor(options = {}) {
		super();
		this.gateway = `ws://${options.gateway}`;
		this.user = options.user;
		this.shards = options.shards || 1;
		this.password = options.password;

		this.ws = new WebSocket(this.gateway, {
			headers: {
				Authorization: this.password,
				'Num-Shards': this.shards,
				'User-Id': this.user
			}
		});

		this.ws.on('open', this.ready.bind(this));
		this.ws.on('message', this.message.bind(this));
		this.ws.on('close', () => console.log('disconnected'));
		this.ws.on('error', error => this.emit('error', error));
	}

	ready() {
		this.ready = true;
		this.emit('ready');
	}

	message(message) {
		try {
			var data = JSON.parse(message);
		} catch (error) {
			return this.emit('error', error);
		}

		return this.emit('message', data);
	}

	send(data) {
		try {
			var payload = JSON.stringify(data);
		} catch (error) {
			return this.emit('error', error);
		}

		return this.ws.send(payload);
	}
}

module.exports = LavaNode;
