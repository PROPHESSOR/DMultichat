/* eslint-disable */

function getParameterByName(name) {
    // Taken from http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

Youtube = {
    parseEmoji: function (text) {
        return jEmoji.unifiedToHTML(message);
    },

    parseDogs: function (text) {
        //text.replace(/@(.+)\s/, '<span class="chat-dog">@$1 </span>'); // Can be multi-word nicks
        if(/@(.+)\s/.test(text))
            return `<span class="chat-dog">${text}</span>`;
        else
            return text;
    }
};

Twitch = {
    emoteTemplate: function (id) {
        return '<img class="emoticon ttv-emo-' + id + '" src="//static-cdn.jtvnw.net/emoticons/v1/' + id + '/1.0" srcset="//static-cdn.jtvnw.net/emoticons/v1/' + id + '/2.0 2x" />';
    },

    parseDogs: function (text) {
        //return text.replace(/@(.+)\s/, '<span class="chat-dog">@$1 </span>'); // Only single-word nicks
        if(/@(.+)\s/.test(text))
            return `<span class="chat-dog">${text}</span>`;
        else
            return text;
    },

    formatEmotes: function (text, emotes) {
        var splitText = text.split('');
        for (var i in emotes) {
            var e = emotes[i];
            for (var j in e) {
                var mote = e[j];
                if (typeof mote == 'string') {
                    mote = mote.split('-');
                    mote = [parseInt(mote[0]), parseInt(mote[1])];
                    var length = mote[1] - mote[0],
                        empty = Array.apply(null, new Array(length + 1)).map(function () {
                            return ''
                        });
                    splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
                    splitText.splice(mote[0], 1, Twitch.emoteTemplate(i));
                }
            }
        }
        return splitText.join('');
    }
};

System = {
    handleMessage: function (data) {
        var message = data.message.split('|');
        var type = message[0];
        var value = message[1];

        switch (data.source) {
            case 'youtube':
                var youtubeStatus = $('#youtube-status');

                if (youtubeStatus.parent().is('a'))
                    youtubeStatus.unwrap();

                youtubeStatus.removeAttr('title');

                switch (type) {
                    case 'auth-url':
                        console.log('You need to generate a new auth Token with this link: ' + value);
                        youtubeStatus.wrap('<a href="' + value + '"></a>');
                        break;
                    case 'error':
                        if (value === "No broadcast live detected") youtubeStatus.addClass('wait');
                        console.log('Youtube API error: ' + value);
                        youtubeStatus.attr('title', value);
                        break
                    case 'ready':
                        value = (value === 'true');
                        // console.log(value + ' == true', value == true);
                        // console.log(isTrueSet);
                        if (value) {
                            console.log('Youtube API is ready');
                            youtubeStatus.addClass('ready');
                        } else {
                            console.log('Youtube API is not ready');
                            youtubeStatus.removeClass('ready');
                        }
                        break;
                }
                break;
            case 'twitch':
                switch (type) {
                    case 'ready':
                        console.log('Twitch API is ready');
                        $('#twitch-status').addClass('ready');
                        break;
                }
                break;
            case 'hitbox':
                switch (type) {
                    case 'ready':
                        console.log('Hitbox API is ready');
                        $('#hitbox-status').addClass('ready');
                        break;
                }
                break;
            case 'beam':
                switch (type) {
                    case 'ready':
                        console.log('Beam API is ready');
                        $('#beam-status').addClass('ready');
                        break;
                }
                break;
            case 'dailymotion':
                switch (type) {
                    case 'ready':
                        console.log('Dailymotion API is ready');
                        $('#dailymotion-status').addClass('ready');
                        break;
                }
                break;
        }
    }
};

Chat = {
    initialize: function (url) {
        var socket = io(url);

        window.noxalus = {
            socket: socket
        };

        console.log('Trying to connect to: ' + url);

        socket.on('connected', function () {
            console.log('Connected to: ' + url);
        });

        socket.on('oldChatMessages', function (data) {
            if (!Chat.vars.gotOldChatMessages) {
                Chat.vars.gotOldChatMessages = true;

                data.forEach(function (elt) {
                    if (Chat.vars.displayTime == 0 || Chat.vars.startTime - elt.date < Chat.vars.displayTime)
                        Chat.insert(elt)
                });
            }
        });

        socket.on('oldSystemMessages', function (data) {
            if (!Chat.vars.gotOldSystemMessages) {
                Chat.vars.gotOldSystemMessages = true;

                data.forEach(function (elt) {
                    console.log('New system message', elt);
                    System.handleMessage(elt);
                });
            }
        });

        socket.on('newChatMessage', function (data) {
            console.log('New message', data);
            Chat.insert(data)
        });

        socket.on('newSystemMessage', function (data) {
            System.handleMessage(data);
        });

        console.log('Display time: ' + Chat.vars.displayTime);
        console.log('Max messages: ' + Chat.vars.maxMessages);
        console.log('Max height: ' + Chat.vars.maxHeight);
    },
    insert: function (data) {
        var $newLine = $('<div></div>');
        $newLine.addClass('chat-line animated zoomIn');

        $newLine.attr('data-timestamp', data.date);

        var $formattedSource = $('<span></span>');
        $formattedSource.addClass('source_icon');
        $formattedSource.html('<img src="img/' + data.source + '.png" alt="' + data.source + '" />');
        $newLine.append($formattedSource);

        var $formattedUser = $('<span></span>');
        $formattedUser.addClass('author');

        if (data.color)
            $formattedUser.css('color', data.color);

        $formattedUser.html(data.author);
        $newLine.append($formattedUser);
        $newLine.append('<span class="colon">:</span>&nbsp;');

        message = data.message;

        // Replace emotes/emojis by their corresponding images
        switch (data.source) {
            case 'twitch':
                if (data.emotes)
                    message = Twitch.formatEmotes(message, data.emotes);
                break;
            case 'youtube':
                message = Youtube.parseEmoji(message);
                break;
        }

        // Hightlight "@"
        switch (data.source) {
            case 'twitch':
                message = Twitch.parseDogs(message);
                break;
            case 'youtube':
                message = Youtube.parseDogs(message);
                break;
        }

        var $formattedMessage = $('<span></span>');
        $formattedMessage.addClass('message');
        $formattedMessage.html(message);
        $newLine.append($formattedMessage);

        Chat.vars.queue.push($newLine.wrap('<div>').parent().html());
    },

    vars: {
        startTime: Date.now(),
        gotOldChatMessages: false,
        gotOldSystemMessages: false,
        queue: [],
        queueTimer: setInterval(function () {
            if (Chat.vars.queue.length > 0) {
                // Add new pending messages
                var newLines = Chat.vars.queue.join('');
                Chat.vars.queue = [];
                $('#chat-box').append(newLines);

                // If the max height has been reached, we clean all messages
                var totalHeight = Chat.vars.maxHeight;
                var currentHeight = $('#chat-box').outerHeight(true) + 5;
                var count = 0;
                var $chatLine, lineHeight;

                if (currentHeight > totalHeight) {
                    while (currentHeight > totalHeight) {
                        $chatLine = $('.chat-line').eq(count);
                        lineHeight = $chatLine.height();

                        $chatLine.animate({
                                "margin-top": -lineHeight
                            },
                            100,
                            function () {
                                $(this).remove();
                            }
                        );

                        currentHeight -= lineHeight;
                        count++;
                    }

                    return;
                }

                $('#chat-box')[0].scrollTop = $('#chat-box')[0].scrollHeight;

                // There are more messages than the maximum allowed
                if (Chat.vars.maxMessages > 0) {
                    var linesToDelete = $('#chat-box .chat-line').length - Chat.vars.maxMessages;

                    if (linesToDelete > 0) {
                        for (var i = 0; i < linesToDelete; i++) {
                            $('#chat-box .chat-line').eq(0).remove();
                        }
                    }
                }
            } else {
                // Fade out messages that are shown during too long
                if (Chat.vars.displayTime > 0) {
                    var messagePosted = $('#chat-box .chat-line').eq(0).data('timestamp');

                    if ((Date.now() - messagePosted) / 1000 >= Chat.vars.displayTime) {
                        $('#chat-box .chat-line').eq(0).addClass('on_out').fadeOut(function () {
                            $(this).remove();
                        });
                    }
                }
            }
        }, 250),
        displayTime: getParameterByName('display_time') || 60,
        maxMessages: getParameterByName('max_messages') || 10,
        maxHeight: getParameterByName('max_height') || 500
    }
};

ContextMenu = {
    _show: false,
    show: function (x, y) {
        $("#contextmenu").css("left", x);
        $("#contextmenu").css("top", y);
        $("#contextmenu").fadeIn(200);
        ContextMenu._show = true;
    },

    hide: function () {
        $("#contextmenu").hide();
        ContextMenu._show = false;
    },

    action: {
        _bg: false,
        _api: true,
        toggleBackground: function(){
            ContextMenu.action._bg = !ContextMenu.action._bg;
            $(document.body).css("background", ContextMenu.action._bg ? "#ff00ff" : "transparent");
        },
        toggleApi: function(){
            ContextMenu.action._api = !ContextMenu.action._api;
            $("#api-status")[ContextMenu.action._api ? "show" : "hide"]();
        },
        reload: function(){
            window.location.reload();
        },
        close: function(){
            window.close();
        }
    }
}

$(document).ready(function () {
    Chat.initialize(window.location.origin);
    Chat.insert({
        "source": "robot",
        "date": Date.now(),
        "author": "DMultichat",
        "message": "Добро пожаловать в DMultichat",
        "color": "lightblue"
    });

    $(".fade").fadeOut(500);

    // Hide API status? FIXME: Поддержка нескольких параметров
    if (getParameterByName('hide_api_status') || window.location.hash === '#noapi') {
        $('#api-status').hide();
        ContextMenu.action._api = false;
    }
});

$(document).bind("contextmenu", function (e) {
    e.preventDefault();
    // console.log(e.pageX + "," + e.pageY);
    ContextMenu.show(e.pageX, e.pageY);
});

$(document).on("click", function () {
    ContextMenu.hide();
});