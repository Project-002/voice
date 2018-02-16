const { EventEmitter } = require('events');
const WebSocket = require('ws');

/**
 * A LavaNode instance
 * @extends {EventEmitter}
 */
class LavaNode extends EventEmitter {
	/**
	 * Options passed to LavaNode when creating a new instance
	 * @typedef {object} LavaNodeOptions
	 * @prop {string} [gateway] The gateway URL
	 * @prop {string} [user] The user
	 * @prop {number} [shards=1] The shard count
	 * @prop {string} [password] The password
	 * @prop {number} [reconnectInterval=10000] The reconnect interval, in milliseconds
	 */

	/**
	 * Creates an instance of LavaNode.
	 * @param {LavaNodeOptions} [options={}] The node options
	 * @memberof LavaNode
	 */
	constructor(options = {}) {
		super();
		/**
		 * The WebSocket URL
		 * @type {string}
		 */
		this.gateway = `ws://${options.gateway}`;

		/**
		 * The user ID of this node
		 * @type {string}
		 */
		this.user = options.user;

		/**
		 * The shard amount
		 * @type {number}
		 * @default 1
		 */
		this.shards = options.shards || 1;

		/**
		 * The password used when connecting to the WebSocket
		 * @type {string}
		 */
		this.password = options.password;

		/**
		 * The reconnect interval, in milliseconds
		 * @type {number}
		 * @default 10000
		 */
		this.reconnectInterval = options.reconnectInterval || 10000;

		/**
		 * The WebSocket connection
		 * @type {?WebSocket}
		 */
		this.ws = null;

		/**
		 * The statistics of this node
		 * @typedef {object} LavaNodeStatistics
		 * @prop {number} [players=0] The amount of connected players
		 * @prop {number} [playingPlayers=0] The amount of currently playing players
		 */

		/**
		 * The current stats of this LavaNode
		 * @type {LavaNodeStatistics}
		 */
		this.stats = {
			players: 0,
			playingPlayers: 0
		};

		this._connect();
	}

	/**
	 * Connects to the WebSocket.
	 * @private
	 * @memberof LavaNode
	 */
	_connect() {
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

	/**
	 * Function ran when the WebSocket connection is ready.
	 * @private
	 * @memberof LavaNode
	 */
	_ready() {
		/**
		 * A value representing if the node is currently ready
		 * @type {boolean}
		 */
		this.ready = true;

		/**
		 * Emmited when the node gets ready
		 * @event LavaNode#ready
		 */
		this.emit('ready');
	}

	/**
	 * Parses a received message.
	 * @private
	 * @param {object} message The WebSocket message
	 * @returns {void}
	 * @memberof LavaNode
	 */
	_message(message) {
		try {
			var data = JSON.parse(message);
		} catch (error) {
			/**
			 * Emmited when an error occured
			 * @event LavaNode#error
			 * @prop {Error|TypeError|RangeError} error The error
			 */
			return this.emit('error', error);
		}
		if (!data) return undefined;
		if (data.op === 'stats') this.stats = data;

		/**
		 * Emmited when a message is received and parsed
		 * @event LavaNode#message
		 * @prop {object} data The raw message data
		 */
		return this.emit('message', data);
	}

	/**
	 * Handles any errors that occur.
	 * @private
	 * @param {Error} error The received error
	 * @returns {void}
	 * @memberof LavaNode
	 */
	_error(error) {
		if (error.message.includes('socket hang up')) return undefined;
		if (error.message.includes('ECONNREFUSED')) return this._reconnect();
		return this.emit('error', error);
	}

	/**
	 * Function ran when the WebSocket connection closes.
	 * @private
	 * @param {number} code The code used for closing the connection
	 * @param {any} reason The reason for closing the connection
	 * @returns {void}
	 * @memberof LavaNode
	 */
	_close(code, reason) {
		this.ready = false;
		if (code !== 1000) return this._reconnect();
		this.ws = null;

		/**
		 * Emmited when the node disconnects from the WebSocket,
		 * and won't attempt to reconnect
		 * @event LavaNode#disconnect
		 * @prop {string} reason The reason for the disconnect
		 */
		return this.emit('disconnect', reason);
	}

	/**
	 * Handles the reconnecting to the WebSocket.
	 * @private
	 * @memberof LavaNode
	 */
	_reconnect() {
		setTimeout(() => {
			/**
			 * Emmited when the node is attempting a reconnect
			 * @event LavaNode#reconnecting
			 */
			this.emit('reconnecting');
			this._connect();
		}, this.reconnectInterval);
	}

	/**
	 * Sends a packet to the WebSocket connection.
	 * @param {object} data The data to send
	 * @returns {void}
	 * @memberof LavaNode
	 */
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
