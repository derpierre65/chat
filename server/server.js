var md5         = require('md5');
var util        = require('util');
var fs          = require('fs');
var https       = require('https');
var httpsServer = https.createServer({
	    key: fs.readFileSync('/etc/letsencrypt/live/chat.derpierre65.de/privkey.pem'),
	    cert: fs.readFileSync('/etc/letsencrypt/live/chat.derpierre65.de/fullchain.pem')
    }),
    io          = require('socket.io').listen(httpsServer);

var savedMessages = [];
var usernames     = {};
var request       = require('request');
var twitchEmotes  = {};

if (fs.existsSync(__dirname + '/../emotes.json')) {
	twitchEmotes = require(__dirname + '/../emotes.json');
	console.log('emotes loaded!');
}
else {
	console.log('scan emotes');
	request('https://twitchemotes.com/api_cache/v3/global.json', function (error, response, body) {
		if (error) {
			console.log('Failed to get twitch emotes');
			return;
		}

		var twitchGlobalEmotes = JSON.parse(body);
		Object.keys(twitchGlobalEmotes).forEach(function (emote) {
			twitchEmotes[emote] = {
				twitch: true,
				id: twitchGlobalEmotes[emote].id
			};
		});

		request('https://api.betterttv.net/2/emotes', function (error, response, body) {
			if (error) {
				console.log('failed get bettertv emotes');
				return;
			}

			var bttvEmotes = JSON.parse(body);
			bttvEmotes.emotes.forEach(function (emote) {
				twitchEmotes[emote.code] = {
					bttv: true,
					id: emote.id
				};
			});

			request('https://twitchemotes.com/api_cache/v3/subscriber.json', function (error, response, body) {
				if (error) {
					console.log('failed get subscriber emotes');
					return;
				}
				/** @type {{emotes: []}} */
				var subEmotes = JSON.parse(body);
				Object.keys(subEmotes).forEach(function (key) {
					subEmotes[key].emotes.forEach(function (emote) {
						twitchEmotes[emote.code] = {
							twitch: true,
							id: emote.id
						};
					});
				});

				fs.writeFile('./../emotes.json', JSON.stringify(twitchEmotes), function (err) {
					if (err) {
						throw err;
					}

					console.log('saved emotes');
				});
			});

		});

	});
}

httpsServer.listen(3666, '0.0.0.0');
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
