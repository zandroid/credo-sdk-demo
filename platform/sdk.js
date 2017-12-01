(function(global, undefined) {
    var Credo = global.Credo || {};
    var BASE_URL = Credo.config && Credo.config.baseUrl || '//platform.credoreference.com';

    Credo.onReady = Credo.onReady || {};
    Credo.sdk = Credo.sdk || {
        version: '2.0.0',
        loadScript: loadScript,
        attachStyles: attachStyles,
        uniqueId: uniqueId,
        parseQuery: parseQuery
    };

    Credo.require = function(widget, callback) {
        if (typeof widget === 'function') {
            callback = widget;
            widget = 'search';
        }

        var file;
        switch (widget.toLowerCase()) {
            case 'SearchWidget':
                widget = 'SearchWidget';
                file = 'search-widget.js';
                break;
            case 'HomeworkHelpWidget':
                widget = 'HomeworkHelpWidget';
                file = 'homework-help-widget.js'
                break;
            case 'VideoWidget':
                widget = 'VideoWidget';
                file = 'video-widget.js';
            default:
                throw "Unknown SDK widget: " + widget;
        }

        if (Credo[widget] !== undefined) {
            callback(Credo[widget]);
            return;
        }
        if (Credo.onReady[widget] !== undefined) {
            Credo.onReady.push(callback);
            return;
        }

        Credo.onReady[widget] = [callback];

        file = BASE_URL + '/sdk/js/' + file;
        loadScript(file, function() {
            for (var i = 0; i < Credo.onReady[widget].length; ++i) {
                Credo.onReady[widget][i](Credo[widget]);
            }
        });
    };

    // legacy
    Credo.init = function(widget, callback) {
        Credo.require('SearchWidget', function() {
            callback(Credo);
        });
    };

    function loadScript(url, callback) {
        var script = document.createElement('script');

        script.type  = 'text/javascript';
        script.async = true;
        script.src   = url;

        var entry = document.getElementsByTagName('script')[0];
        entry.parentNode.insertBefore(script, entry);

        if (script.addEventListener) {
            script.addEventListener('load', callback, false);
        }
        else {
            script.attachEvent('onreadystatechange', function() {
                if (/complete|loaded/.test(script.readyState)) callback();
            });
        }
    }

    function attachStyles(url) {
        var stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.type = 'text/css';
        stylesheet.href = url;
        (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(stylesheet);
    };

	function uniqueId(prefix) {
		var num = new Date().getUTCMilliseconds(),
			id = prefix + num;
		while (document.getElementById(id)) {
			num += 1;
			id = prefix + num;
		}
		return id;
	}

	function parseQuery(url) {
		var params = {}, buffer, parts, i, l;

		if (url.indexOf('?') > -1) {
            buffer = url.split('?').slice(1).join('?').split('&');
			l = buffer.length;

			for (i = 0; i < l; i += 1) {
				parts = buffer[i].split('=');
                params[decodeURIComponent(parts.shift())] =
                    decodeURIComponent(parts.join('='));
			}
		}
		return params;
	}

    global.Credo = Credo;

    if (Credo.onReady.sdk) {
        for (var i = 0; i < Credo.onReady.sdk.length; ++i) {
            Credo.onReady.sdk[i](Credo);
        }
    }
})(this);
