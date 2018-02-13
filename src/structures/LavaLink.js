const { EventEmitter } = require('events');
const LavaNode = require('./LavaNode');
const LavaPlayer = require('./LavaPlayer');

class LavaLink extends EventEmitter {
	constructor(client) {
		super();
		Object.defineProperty(this, 'client', { value: client });

		this.players = new Map();
		this.nodes = new Map();

		for (const node of this.nodes) this.createNode(Object.assign({}, node));
	}

	createNode(options) {
		const node = new LavaNode({
			gateway: options.gateway,
			shards: options.shards,
			user: options.user,
			password: options.password
		});

		node.on('error', console.error);
		node.on('message', this.message.bind(this, node));

		this.nodes.set(options.host, node);
	}

	removeNode(host) {
		const node = this.nodes.get(host);
		if (!node) return;
		node.removeAllListeners();
		this.nodes.delete(host);
	}

	/* eslint-disable consistent-return */
	message(node, message) {
		if (!message.op) return;

		switch (message.op) {
			case 'event': {
				const player = this.players.get(message.guildId);
				if (!player) return;

				switch (message.type) {
					case 'TrackEndEvent':
						return player.end(message);
					case 'TrackExceptionEvent':
						return player.exception(message);
					case 'TrackStuckEvent':
						return player.stuck(message);
					default:
						return player.emit('warn', `Unexpected event type: ${message.type}`);
				}
			}
		}
	}
	/* eslint-enable consistent-return */

	join(data) {
		if (this.client.connections) {
			this.client.connections.get(data.shard).send(data.op, data.d);
			this.spawnPlayer({
				host: data.host,
				guild: data.d.guild_id,
				channel: data.d.channel_id
			});
		}
	}

	leave(data) {
		const player = this.players.get(data.guild);
		if (!player) return;
		if (this.client.connections) {
			this.client.connections.get(data.shard).send(data.op, data.d);
		}
		player.removeAllListeners();
		this.players.delete(data.guild);
	}

	spawnPlayer(data) {
		let player = this.players.get(data.guild);
		if (!player) {
			player = new LavaPlayer({
				node: this.nodes.get(data.host),
				guild: data.guild,
				channel: data.channel
			});

			this.players.set(data.guild, player);
		}
	}
}

module.exports = LavaLink;
