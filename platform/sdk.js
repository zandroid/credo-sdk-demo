(function(global, undefined) {
    var Credo = global.Credo || {};
    var BASE_URL = Credo.config && Credo.config.baseUrl || '//platform.credoreference.com';

    var jQueryRequired = {
        HomeworkHelpWidget: true,
        VideoWidget: true
    };

    // get reference to initializing script tag
    var script = (function() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    Credo.onReady = Credo.onReady || {};
    Credo.sdk = Credo.sdk || {
        version: '2.0.0',
        loadScript: loadScript,
        attachStyles: attachStyles,
        uniqueId: uniqueId,
        parseQuery: parseQuery
    };

    Credo.require = function(widget, callback) {
        if (Array.isArray(widget)) {
            requireNext(widget, 0, callback);
            return;
        }

        if (typeof widget === 'function') {
            callback = widget;
            widget = 'SearchWidget';
        }

        if (jQueryRequired[widget] && !Credo.jQuery) {
            Credo.require(['jQuery', widget], callback);
            return;
        }

        var file;
        switch (widget) {
            case 'jQuery':
                if (Credo.jQuery) {
                    callback(Credo.jQuery);
                    return;
                }
                else if (global.jQuery) {
                    Credo.jQuery = global.jQuery;
                    callback(Credo.jQuery);
                    return;
                }
                file = 'jquery.js';
                break;
            case 'SearchWidget':
                file = 'search-widget.js';
                break;
            case 'HomeworkHelpWidget':
                file = 'homework-help-widget.js'
                break;
            case 'VideoWidget':
                file = 'video-widget.js';
                break;
            default:
                throw "Unknown SDK widget: " + widget;
        }

        if (Credo[widget] !== undefined) {
            callback(Credo[widget]);
            return;
        }
        if (Credo.onReady[widget] !== undefined) {
            Credo.onReady[widget].push(callback);
            return;
        }

        Credo.onReady[widget] = [callback];

        file = BASE_URL + '/sdk/js/' + file;
        loadScript(file, function() {
            if (widget === 'jQuery') {
                Credo.jQuery = global.jQuery.noConflict();
            }
            for (var i = 0; i < Credo.onReady[widget].length; ++i) {
                Credo.onReady[widget][i](Credo[widget]);
            }
        });
    };

    function requireNext(widgets, index, callback) {
        Credo.require(widgets[index], index === widgets.length - 1
            ? callback
            : function() { requireNext(widgets, index + 1, callback); });
    }

    // legacy
    Credo.init = function(widget, callback) {
        Credo.require('SearchWidget', function(SearchWidget) {
            Credo.require('HomeworkHelpWidget', function(HomeworkHelpWidget) {
                callback({
                    searchWidget: SearchWidget,
                    homeworkHelpWidget: homeworkHelpWidget,
                    attachStylesheet: attachStyles
                });

                function homeworkHelpWidget(options) {
                    if (options.inline) {
                        var target = document.createElement('div');
                        target.id = 'credo-homework-help';
                        target.className = 'credo homework-help';
                        script.parentElement.insertBefore(target, script);
                    }
                    return new HomeworkHelpWidget({
                        tab: options.inline !== true,
                        selector: '#credo-homework-help'
                    });
                }
            });
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
