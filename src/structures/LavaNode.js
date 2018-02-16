const { EventEmitter } = require('events');
const WebSocket = require('ws');

class LavaNode extends EventEmitter {
	constructor(options = {}) {
		super();
		this.gateway = `ws://${options.gateway}`;
		this.user = options.user;
		this.shards = options.shards || 1;
		this.password = options.password;
		this.reconnectInterval = options.reconnectInterval || 5000;
		this.ws = null;
		this.stats = {
			players: 0,
			playingPlayers: 0
		};

		this.connect();
	}

	connect() {
		this.ws = new WebSocket(this.gateway, {
			headers: {
				Authorization: this.password,
				'Num-Shards': this.shards,
				'User-Id': this.user
			}
		});

		this.ws.on('open', this._ready.bind(this));
		this.ws.on('message', this._message.bind(this));
		this.ws.on('close', this._close.bind(this));
		this.ws.on('error', this._error.bind(this));
	}

	_ready() {
		this.ready = true;
		this.emit('ready');
	}

	_message(message) {
		try {
			var data = JSON.parse(message);
		} catch (error) {
			return this.emit('error', error);
		}
		if (!data) return undefined;
		if (data.op === 'stats') this.stats = data;

		return this.emit('message', data);
	}

	_error(error) {
		if (error.message.includes('ECONNREFUSED')) return this.reconnect();
		return this.emit('error', error);
	}

	_close(code, reason) {
		this.ready = false;
		if (code !== 1000) return this.reconnect();
		this.ws = null;
		return this.emit('disconnect', reason);
	}

	_reconnect() {
		setTimeout(() => {
			this.emit('reconnecting');
			this.connect();
		}, this.reconnectInterval);
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
