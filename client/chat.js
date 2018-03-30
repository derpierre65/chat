$(function () {
	var username      = localStorage.getItem('chatUsername') ? localStorage.getItem('chatUsername') : '';
	var userHash      = '';
	var pageStatus    = true;
	var modalFunction = null;
	var users         = {};
	var errors        = [
		'Bitte benutze /nick <Name>.',
		'Bitte benutze einen neuen Namen',
		'Der Name ist bereits vergeben.'
	];

	$(window).focus(function () {
		pageStatus = true;
	}).blur(function () {
		pageStatus = false;
	});

	while (!username.length) {
		username = prompt('Name');
		if (username === undefined || username === null) {
			username = '';
		}
		username = username.trim();
	}

	localStorage.setItem('chatUsername', username);

	function insertAtCaret(areaId, text) {
		var txtarea = document.getElementById(areaId);
		if (!txtarea) {
			console.log('fail');
			return;
		}

		var scrollPos = txtarea.scrollTop;
		var strPos    = 0;
		var br        = ((txtarea.selectionStart || txtarea.selectionStart == '0') ?
			'ff' : (document.selection ? 'ie' : false));
		if (br == 'ie') {
			txtarea.focus();
			var range = document.selection.createRange();
			range.moveStart('character', -txtarea.value.length);
			strPos = range.text.length;
		} else if (br == 'ff') {
			strPos = txtarea.selectionStart;
		}

		var front     = (txtarea.value).substring(0, strPos);
		var back      = (txtarea.value).substring(strPos, txtarea.value.length);
		txtarea.value = front + text + back;
		strPos        = strPos + text.length;
		if (br == 'ie') {
			txtarea.focus();
			var ieRange = document.selection.createRange();
			ieRange.moveStart('character', -txtarea.value.length);
			ieRange.moveStart('character', strPos);
			ieRange.moveEnd('character', 0);
			ieRange.select();
		} else if (br == 'ff') {
			txtarea.selectionStart = strPos;
			txtarea.selectionEnd   = strPos;
			txtarea.focus();
		}

		txtarea.scrollTop = scrollPos;
	}

	function updateUserList() {
		var text = '';

		console.log(users);
		Object.keys(users).forEach(function (hash) {
			text += '<li>' + users[hash] + '</li>';
		});

		$('#users-online').html($('<ul>').html(text));
	}

	var socket = io(document.location.host + ':3666', {
		secure: true,
		query: 'username=' + username
	});

	Notification.requestPermission();

	String.prototype.htmlentities = function () {
		var str = this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		str     = str.replace(/\[b\](.+?)\[\/b\]/g, '<strong>$1</strong>');
		str     = str.replace(/\[s\](.+?)\[\/s\]/g, '<s>$1</s>');
		str     = str.replace(/\[url\](.+?)\[\/url\]/g, '<a target="_blank" href="$1">$1</a>');
		str     = str.replace(/\[url=(.+?)\](.+?)\[\/url\]/g, '<a target="_blank" href="$1">$2</a>');
		str     = str.replace(/\[u\](.+?)\[\/u\]/g, '<u>$1</u>');
		str     = str.replace(/\[i\](.+?)\[\/i\]/g, '<i>$1</i>');
		str     = str.replace(/\[twitch-clip\](.+?)\[\/twitch-clip\]/g, '<br/><iframe src="https://clips.twitch.tv/embed?clip=$1&autoplay=false&tt_medium=clips_embed" width="640" height="360" frameborder="0" scrolling="no" allowfullscreen="true"></iframe>');
		str     = str.replace(/\[twitch-video\](.+?)\[\/twitch-video\]/g, '<br/><iframe src="https://player.twitch.tv/?autoplay=false&video=v$1" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="640"></iframe>');
		str     = str.replace(/\[youtube\](.+?)\[\/youtube\]/g, '<br/><iframe width="640" height="360" src="https://www.youtube.com/embed/$1?rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>');
		str     = str.replace(/\[spotify\](.+?)\[\/spotify\]/g, '<br/><iframe src="https://open.spotify.com/embed/track/$1" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>');
		str     = str.replace(/\[img\](.+?)\[\/img\]/g, '<br/><img src="$1" style="max-width: 300px;" />');
		str     = str.replace(/\[video=(.+?)\](.+?)\[\/video\]/g, '<br/><video style="max-width: 300px;" controls><source src="$2" type="video/$1"></video>');

		// <video width="320" height="240" controls>
		// <source src="movie.mp4" type="video/mp4">

		return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
	};

	function newMessage(options) {
		var time      = options.time ? new Date(options.time) : new Date();
		var hours     = ('0' + time.getHours()).slice(-2);
		var minutes   = ('0' + time.getMinutes()).slice(-2);
		var seconds   = ('0' + time.getSeconds()).slice(-2);
		var startSpan = '', endSpan = '';

		if (options.color) {
			startSpan = '<span style="color:' + options.color + '">';
			endSpan   = '</span>';
		}

		$('#content').append(`[${hours}:${minutes}:${seconds}] ` + startSpan + (options.name ? '&lt;' + options.name.htmlentities() + '&gt; ' : '') + options.text.htmlentities() + endSpan + '<br />');

		var container       = document.getElementById('content');
		container.scrollTop = container.scrollHeight;

		if (options.name && options.name !== username && !pageStatus) {
			var notification = new Notification('Nachricht von ' + options.name, {
				body: options.text
			});
		}
	}

	function serverStatus(online) {
		var rC = 'offline', aC = 'online', text = 'Online';
		if (!online) {
			rC   = 'online';
			aC   = 'offline';
			text = 'Offline';
		}

		$('#status').removeClass(rC).addClass(aC).html(text);
	}

    function urlParam(param,name){
        var results = new RegExp('[\?&]' + param + '=([^&#]*)').exec(name);
        if (results==null){
            return null;
        }
        else{
            return decodeURI(results[1]) || 0;
        }
    }

	socket
		.on('connect', function () {
			serverStatus(true);
		})
		.on('messages', function (messages, onlineUsers) {
			users = onlineUsers;
			$('#content').html('');

			messages.forEach(function (msg) {
				newMessage(msg);
			});
		})
		.on('disconnectUser', function (hash) {
			if (users[hash] !== username) {
				newMessage({
					text: '[b]' + users[hash] + '[/b] hat den Chat verlassen.'
				});
			}

			delete users[hash];

			updateUserList();
		})
		.on('newUser', function (hash, name) {
			users[hash] = name;
			if (name !== username) {
				newMessage({
					text: '[b]' + name + '[/b] hat den Chat betreten.'
				});
			}
			else {
				userHash = hash;
			}

			updateUserList();
		})
		.on('cmderror', function (code) {
			newMessage({
				text: errors[code],
				color: 'red'
			});
		})
		.on('changedName', function (hash, name) {
			if (hash === userHash) {
				username = name;
				localStorage.setItem('chatUsername', username);
			}
			newMessage({
				text: '[b]' + users[hash] + '[/b] hat sein Namen in [b]' + name + '[/b] geändert.'
			});
			users[hash] = name;

			updateUserList();
		})
		.on('disconnect', function () {
			serverStatus(false);
		})
		.on('chat', function (username, text) {
			newMessage({
				name: username,
				text: text
			});
		});

	var sendChatMessage = function (e) {
		var box  = $('#box');
		var text = box.val().trim();

		box.focus();

		if (!text.length || !username.length) {
			return false;
		}
		if (!e.ctrlKey && !e.shiftKey && e.keyCode === 13) {
			if (text.toLowerCase() === '/help') {
				newMessage({
					text: '/nick [Name] - änderte den Nicknamen.'
				});

				return;
			}

			socket.emit('chat', text);
			box.val('');
		}
	};
	$('.bb-button').on('click', function () {
		var bbcode = $(this).attr('id').substr(3);
		var dl     = $('<dl />');

		var addField = function (options) {
			if (Array.isArray(options)) {
				$.each(options, function () {
					addField(this);
				});

				return;
			}

			var $element = null;
			switch (options.type) {
				case 'text': {
					$element = $('<input />', {
						type: 'text',
						id: 'bbcode-input-' + options.name
					}).addClass('form-control');
					break;
				}
				case 'select': {
					$element = $('<select />', {
						id: 'bbcode-input-' + options.name
					});
					$.each(options.options, function (value) {
						$element.append(
							$('<option />')
								.val(value)
								.html(this)
						);
					});
				}
			}

			dl.append($('<dt />').html(options.title));
			dl.append($('<dd />').append($element));
		};

        bbcodeMethod(bbcode);

        function bbcodeMethod(bbcode) {
            switch (bbcode) {
                case 'italic':
                case 'under':
                case 'crossed':
                case 'bold': {
                    addField({
                        title: 'Text',
                        name: 'text',
                        type: 'text'
                    });

                    // get tag name
                    var tag = 'b';
                    switch (bbcode) {
                        case 'italic':
                            tag = 'i';
                            break;
                        case 'crossed':
                            tag = 's';
                            break;
                        case 'under':
                            tag = 'u';
                            break;
                    }

                    modalFunction = function () {
                        return '[' + tag + ']' + $('#bbcode-input-text').val() + '[/' + tag + ']';
                    };

                    break;
                }
                case 'img': {
                    addField({
                        title: 'Link des Bildes',
                        name: 'imageurl',
                        type: 'text'
                    });

                    modalFunction = function () {
                        var link = $('#bbcode-input-imageurl').val();
                        if (!link.length) {
                            return false;
                        }

                        return '[img]' + link + '[/img]';
                    };
                    break;
                }
                case 'url': {
                    addField({
                        title: 'Anzeigetext (optional)',
                        name: 'showtext',
                        type: 'text'
                    });
                    addField({
                        title: 'Link',
                        name: 'link',
                        type: 'text'
                    });

                    modalFunction = function () {
                        var showtext = $('#bbcode-input-showtext').val().trim();
                        var link     = $('#bbcode-input-link').val().trim();
                        var type = '';
                        var encTypeDetect = link.substr(link.length - 4);
                        var vidArray = ['webm', '.mp4', '.ogg'];
                        var isEncVideo = inHaystack(encTypeDetect,vidArray);
                        if (!link.length) {
                            return false;
                        }
                        if (isEncVideo || inHaystack('twitch.tv/',link) || inHaystack('youtube.com/',link)|| inHaystack('open.spotify.com/track/',link)) {
                            if ( link.indexOf('twitch.tv/') >= 0) {
                                type = 3;
                            } else if ( link.indexOf('youtube.com/') >= 0) {
                                type = 4;
                            } else if ( inHaystack('open.spotify.com/track/',link)) {
                                type = 5;
                            } else {
                            	type = 0;
							}

                            return mediaBBCode(link,type);
                        }
                        if (showtext.length) {
                            return '[url=' + link + ']' + showtext + '[/url]';
                        }

                        return '[url]' + link + '[/url]';
                    };
                    break;
                }
                case 'video': {
                    addField({
                        title: 'Typ (optional)',
                        name: 'type',
                        type: 'select',
                        options: {
                            0: 'Automatisch',
                            1: 'MP 4',
                            2: 'OGG',
                            3: 'Twitch Clip',
                            4: 'YouTube'
                        }
                    });
                    addField({
                        title: 'Link',
                        name: 'link',
                        type: 'text'
                    });

                    modalFunction = function () {
                        var link    = $('#bbcode-input-link').val().trim();
                        var type    = parseInt($('#bbcode-input-type').val());
                        if (!link.length) {
                            return false;
                        }

                        if (type === 0 && link.indexOf('twitch.tv/') >= 0) {
                            type = 3;
                        }
                        if (type === 0 && link.indexOf('youtube.com/') >= 0) {
                            type = 4;
                        }
                        if ( inHaystack('open.spotify.com/track/',link)) {
                            type = 5;
                        }
                        return mediaBBCode(link,type);

                    };

                    break;
                }
            }
        }


		$('.modal-title').html(bbcode);
		$('.modal-body').html(dl);
		$('.modal').modal();
	});

	function mediaBBCode(link,type) {
        if (type === 0) {
            encType = link.substr(link.length - 3);
            if(encType = 'ebm') {
                encTypetemp = link.substr(link.length - 4);
                if(encTypetemp = '.webm') {
                    encType = 'webm';
				}
            }
        }
        else if (type === 1) {
            encType = 'mp4';
        }
        else if (type === 2) {
            encType = 'ogg';
        }
        else if (type === 3) {
            var twitchPosition = link.indexOf('twitch.tv/');
            if (twitchPosition >= 0) {
            	if(link.indexOf('twitch.tv/videos/')) {
                    link = link.substr(twitchPosition + 'twitch.tv/videos/'.length);
                    return '[twitch-video]' + link + '[/twitch-video]';
				}
                link = link.substr(twitchPosition + 'twitch.tv/'.length);
            }

            return '[twitch-clip]' + link + '[/twitch-clip]';
        }else if (type === 4) {
            var youtubePosition = link.indexOf('youtube.com/');
            if (youtubePosition >= 0) {
                link = link.substr(youtubePosition + 'youtube.com/'.length);
            }

            return '[youtube]' + urlParam('v',link) + '[/youtube]';
        }else if (type === 5) {
            var spotifyPosition = link.indexOf('open.spotify.com/track/');
            if (spotifyPosition >= 0) {
                link = link.substr(spotifyPosition + 'open.spotify.com/track/'.length);
            }

            return '[spotify]' + link + '[/spotify]';
        }

        return '[video=' + encType + ']' + link + '[/video]';
	}

	function inHaystack(needle,haystack) {
		if(haystack.indexOf(needle) >= 0) {
			return true;
		} else {
			return false;
		}
	}

	$('.btn-paste').on('click', function () {
		var text = modalFunction();
		if (text !== false) {
			$('.modal').modal('hide');
			insertAtCaret('box', text);
		}
	});
	$('#box')
		.on('keydown', function (e) {
			if (!e.ctrlKey && !e.shiftKey && e.keyCode === 13) {
				e.preventDefault();
			}
		})
		.on('keyup', sendChatMessage);
});
