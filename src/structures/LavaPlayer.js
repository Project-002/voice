const { EventEmitter } = require('events');

/**
 * A LavaPlayer instance.
 * @extends {EventEmitter}
 */
class LavaPlayer extends EventEmitter {
	/**
	 * Options passed to LavaPlayer when creating a new instance
	 * @typedef {Object} LavaPlayerOptions
	 * @prop {LavaNode} [node] The node used for this player
	 * @prop {string} [guild] The guild ID of this player
	 * @prop {string} [channel] The channel ID of this player
	 */

	/**
	 * Creates an instance of LavaPlayer.
	 * @param {LavaPlayerOptions} [options={}] The player options
	 * @memberof LavaPlayer
	 */
	constructor(options = {}) {
		super();
		/**
		 * The node used for this player
		 * @type {LavaNode}
		 */
		this.node = options.node;

		/**
		 * The guild ID of this player
		 * @type {string}
		 */
		this.guild = options.guild;

		/**
		 * The channel ID of this player
		 * @type {string}
		 */
		this.channel = options.channel;

		/**
		 * If this player is ready
		 * @type {boolean}
		 * @default false
		 */
		this.ready = false;

		/**
		 * If this player is currently playing
		 * @type {boolean}
		 * @default false
		 */
		this.playing = false;

		/**
		 * If this player is currently paused
		 * @type {boolean}
		 * @default false
		 */
		this.paused = false;

		/**
		 * The current state of this player
		 * TODO: Needs more docs
		 * @type {Object}
		 * @default {}
		 */
		this.state = {};

		/**
		 * The current track
		 * @type {?string}
		 * @default null
		 */
		this.track = null;

		/**
		 * The start time of this player
		 * @type {Date}
		 * @default Date.now()
		 */
		this.timestamp = Date.now();
	}

	/**
	 * Options passed when connecting to a voice channel using a {@link LavaPlayer} instance
	 * @typedef {Object} LavaPlayerConnectData
	 * @prop {string} [session] The session ID
	 * @prop {string} [event] The event
	 */

	/**
	 * Connects to a voice channel.
	 * @param {LavaPlayerConnectData} data The connection data
	 * @memberof LavaPlayer
	 */
	connect(data) {
		this.node.send({
			op: 'voiceUpdate',
			guildId: this.guild,
			sessionId: data.session,
			event: data.event
		});
	}

	/**
	 * Plays a track in the channel.
	 * @param {string} track The track that should be played
	 * @param {Object} options The options for playing the track
	 * @memberof LavaPlayer
	 */
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

	/**
	 * Stops playing the current track.
	 * @memberof LavaPlayer
	 */
	stop() {
		this.node.send({
			op: 'stop',
			guildId: this.guild
		});
		this.playing = false;
		this.track = null;
	}

	/**
	 * Pauses the playing of the current track.
	 * @param {?boolean} [pause] If the playback should be paused or resumed
	 * @returns {void}
	 * @memberof LavaPlayer
	 */
	pause(pause) {
		if ((pause && this.paused) || (!pause && !this.paused)) return;
		this.node.send({
			op: 'pause',
			guildId: this.guild,
			pause
		});
		this.paused = Boolean(pause);
	}

	/**
	 * Changes the volume of the current player.
	 * @param {string} volume The new volume
	 * @memberof LavaPlayer
	 */
	volume(volume) {
		this.node.send({
			op: 'volume',
			guildId: this.guild,
			volume
		});
	}

	/**
	 * Seeks the playback to the specified time.
	 * @param {string} position The new position
	 * @memberof LavaPlayer
	 */
	seek(position) {
		this.node.send({
			op: 'seek',
			guildId: this.guild,
			position
		});
	}

	/**
	 * Function ran when playback ends.
	 * @param {Object} message The raw message object
	 * @memberof LavaPlayer
	 */
	end(message) {
		if (message.reason !== 'REPLACED') {
			this.playing = false;
			this.track = null;
		}

		/**
		 * Emmited when the player ends playing
		 * @event LavaPlayer#end
		 * @prop {object} message The raw message
		 */
		this.emit('end', message);
	}

	/**
	 * Function that is ran when an error is occured.
	 * @param {Object} message The raw message
	 * @memberof LavaPlayer
	 */
	exception(message) {
		/**
		 * Emmited when the player encounters an error
		 * @event LavaPlayer#error
		 * @prop {object} message The raw message
		 */
		this.emit('error', message);
	}

	/**
	 * Function that stops the player when it gets stuck.
	 * @param {Object} message The raw message
	 * @memberof LavaPlayer
	 */
	stuck(message) {
		this.stop();
		this.emit('end', message);
	}
}

module.exports = LavaPlayer;
