const { EventEmitter } = require('events');

class LavaPlayer extends EventEmitter {
	constructor(options = {}) {
		super(options);
		this.node = options.node;
		this.guild = options.guild;
		this.channel = options.channel;
		this.ready = false;
		this.playing = false;
		this.paused = false;
		this.state = {};
		this.track = null;
		this.timestamp = Date.now();
	}

	connect(data) {
		this.node.send({
			op: 'voiceUpdate',
			guildId: this.guild,
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
		if ((pause && this.paused) || (!pause && !this.paused)) return;
		this.node.send({
			op: 'pause',
			guildId: this.guild,
			pause
		});
		this.paused = Boolean(pause);
	}

	volume(volume) {
		this.node.send({
			op: 'volume',
			guildId: this.guild,
			volume
		});
	}

	seek(position) {
		this.node.send({
			op: 'seek',
			guildId: this.guild,
			position
		});
	}

	end(message) {
		if (message.reason !== 'REPLACED') {
			this.playing = false;
			this.track = null;
		}

		this.emit('end', message);
	}

	exception(message) {
		this.emit('error', message);
	}

	stuck(message) {
		this.stop();
		this.emit('end', message);
	}
}

module.exports = LavaPlayer;
