var md5          = require('md5');
var util         = require('util');
var fs           = require('fs');
var sha256       = require('sha256');
var colors       = require('colors');
var request      = require('request');
var readlineSync = require('readline-sync');
var io;

if (util.isUndefined(process.argv[2])) {
	console.log('Missing argument, use in exapmle: "node server.js staging", key must exists in config.json');
	process.exit();
}
var Config = require('./../config')[process.argv[2]];
if (!util.isObject(Config)) {
	console.log('Missing config for', process.argv[2]);
	process.exit();
}

// HTTPS
if (util.isObject(Config.ssl)) {
	var https       = require('https');
	var httpsServer = https.createServer({
		key: fs.readFileSync(Config.ssl.key),
		cert: fs.readFileSync(Config.ssl.cert)
	});

	io = require('socket.io').listen(httpsServer);
	httpsServer.listen(Config.port, '0.0.0.0');
}
// HTTP
else {
	io = require('socket.io')(Config.port);
}

var savedMessages = [];
var usernames     = {};
var twitchEmotes  = {};

console.log('[Twitch Emotes] Load from emotes.json...');
if (fs.existsSync(__dirname + '/../emotes.json')) {
	twitchEmotes = require(__dirname + '/../emotes.json');
	console.log(colors.green('[Twitch Emotes] Loaded Twitch Emotes from emotes.json'));
}
else {
	console.log('[Twitch Emotes] Fetch Twitch Emotes from twitchemotes.com...');
	request('https://twitchemotes.com/api_cache/v3/global.json', function (error, response, body) {
		if (error) {
			console.log(colors.red('[Twitch Emotes] Failed to fetch global emotes from twitchemotes.com'));
		}
		else {
			try {
				var twitchGlobalEmotes = JSON.parse(body);
				Object.keys(twitchGlobalEmotes).forEach(function (emote) {
					twitchEmotes[emote] = {
						twitch: true,
						id: twitchGlobalEmotes[emote].id
					};
				});
			}
			catch (e) {
				console.log(colors.red('[Twitch Emotes] Failed to fetch global emotes from twitchemotes.com'));
			}
		}

		request('https://api.betterttv.net/2/emotes', function (error, response, body) {
			if (error) {
				console.log(colors.red('[Twitch Emotes] Failed to fetch emotes from Better Twitch TV'));
			}
			else {
				try {
					var bttvEmotes = JSON.parse(body);
					bttvEmotes.emotes.forEach(function (emote) {
						twitchEmotes[emote.code] = {
							bttv: true,
							id: emote.id
						};
					});
				}
				catch (e) {
					console.log(colors.red('[Twitch Emotes] Failed to fetch emotes from Better Twitch TV'));
				}
			}

			request('https://twitchemotes.com/api_cache/v3/subscriber.json', function (error, response, body) {
				if (error) {
					console.log(colors.red('[Twitch Emotes] Failed to load sub emotes from twitchemotes.com'));
				}
				else {
					/** @type {{emotes: []}} */
					try {
						var subEmotes = JSON.parse(body);
						Object.keys(subEmotes).forEach(function (key) {
							subEmotes[key].emotes.forEach(function (emote) {
								twitchEmotes[emote.code] = {
									twitch: true,
									id: emote.id
								};
							});
						});
					}
					catch (e) {
						console.log(colors.red('[Twitch Emotes] Failed to load sub emotes from twitchemotes.com'));
					}
				}

				fs.writeFile(__dirname + '/../emotes.json', JSON.stringify(twitchEmotes), function (err) {
					if (err) {
						console.log(colors.red('[Twitch Emotes] Failed to save emotes.json'));
						throw err;
					}

					console.log(colors.green('[Twitch Emotes] Saved to emotes.json'));
				});
			});
		});
	});
}

// check and load users.json
if (!fs.existsSync(__dirname + '/users.json')) {
	fs.writeFileSync(__dirname + '/users.json', '{}');
}

var UserList = null;

console.log('[Users] Load registered users...');
try {
	UserList = require('./users.json');
	console.log(colors.green('[Users] Loaded ' + Object.keys(UserList).length + ' users'));
}
catch (e) {
	console.log(colors.red('[Users] users.json are corrupted? ' + e.toString()));

	if (readlineSync.keyInYNStrict(colors.red('[Users] Should re create users.json? (all users will deleted)'), {defaultInput: 'Y'})) {
		fs.writeFileSync(__dirname + '/users.json', '{}', {
			flag: 'w+'
		});
		UserList = {};
	}
	else {
		console.log('Closed Chat Server.');
		process.exit();
	}
}

io.sockets.on('connection', function (socket) {
	var username = '';

	if (
		!util.isObject(socket.handshake) ||
		!util.isObject(socket.handshake.query) ||
		!util.isString(socket.handshake.query.username) ||
		!socket.handshake.query.username.length
	) {
		socket.disconnect();

		return;
	}
	username = socket.handshake.query.username;

	var userHash = (md5('super-' + (new Date()).getTime() + '-secret-key')).substr(0, 8);

	socket.emit('messages', savedMessages, usernames);
	io.emit('newUser', userHash, username);

	usernames[userHash] = username;

	socket.on('disconnect', function () {
		delete usernames[userHash];
		io.emit('disconnectUser', userHash);
	});

	socket.on('chat', function (text) {
		if (!username.length) {
			return false;
		}

		if (!util.isString(text)) {
			return false;
		}

		if (!text.length) {
			return false;
		}

		if (text[0] === '/') {
			text = text.substr(1);

			var params = text.split(' ');

			switch (params[0].toLowerCase()) {
				case 'nick': {
					if (util.isUndefined(params[1])) {
						socket.emit('cmderror', 0);
						return false;
					}

					if (username === params[1]) {
						socket.emit('cmderror', 1);
						return false;
					}

					username            = params[1].substr(0, 16);
					usernames[userHash] = username;
					socket.emit('changedName', userHash, username);

					break;
				}
			}

			return true;
		}

		var words = text.split(' ');
		words     = words.map(function (word) {
			if (!util.isUndefined(twitchEmotes[word])) {
				if (twitchEmotes[word].bttv) {
					return '[img]https://cdn.betterttv.net/emote/' + twitchEmotes[word].id + '/1x[/img]';
				}
				else {
					return '[img]https://static-cdn.jtvnw.net/emoticons/v1/' + twitchEmotes[word].id + '/1.0[/img]';
				}
			}

			return word;
		});
		text      = words.join(' ');

		io.emit('chat', username, text);
		savedMessages.push({
			name: username,
			text: text,
			time: (new Date()).getTime()
		});

		if (savedMessages.length > 50) {
			savedMessages.shift();
		}
	});
});
