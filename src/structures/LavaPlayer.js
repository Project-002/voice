const { EventEmitter } = require('events');

class LavaPlayer extends EventEmitter {
	constructor(options = {}) {
		super(options);
		this.node = options.node;
		this.guild = options.guild;
		this.channel = options.channel;
		this.ready = false;
		this.playing = false;
		this.track = null;
		this.timestamp = Date.now();
	}

	connect(data) {
		this.node.send({
			op: 'voiceUpdate',
			guildId: data.guild,
			sessionId: data.session,
			event: data.event
		});
	}

	play(track, options) {
		this.track = track;
		const payload = Object.assign({
			op: 'play',
			guildId: this.guild,
			track
		}, options);
		this.node.send(payload);
		this.playing = true;
		this.timestamp = Date.now();
	}

	stop() {
		this.node.send({
			op: 'stop',
			guildId: this.guild
		});
		this.playing = false;
		this.track = null;
	}

	pause(pause) {
		this.node.send({
			op: 'pause',
			guildId: this.guild,
			pause
		});
	}

	volume(volume) {
		this.node.send({
			op: 'volume',
			guildId: this.guild,
			volume
		});
	}
}

module.exports = LavaPlayer;
