(function(global) {

    var defaults = {
        query: '',
        target: 'credo_search_widget',
        institutionId: null,
        apiUrl: '//sdk.credoreference.com/ebsco/api.jsonp.php',
        loadingMessage: 'Searching...',
        readMoreMessage: 'Read More',
        notFoundMessage: 'No results found',
        cssWidget: 'credoreference search-widget', 
        cssLoading: 'loading-message',
        cssError: 'error-message',
        cssNotFound: 'not-found-message',
        cssList: 'topic-list',
        cssReadMore: 'read-more',
        onRender: function() {},
        onError: function() {}
    };

    function SearchWidget(config) {
        config = extend({}, defaults, config);
        var element = $$(config.target);
        addClassName(element, config.cssWidget);
        element.appendChild(
            html('p', config.loadingMessage, {className: config.cssLoading}));
        getJSON(url(config.apiUrl, {
            //institutionId: config.institutionId,
            id: config.institutionId,
            query: config.query || config.q
        }), function(data) {
            empty(element);
            if (!isEmpty(data.results)) {
                element.appendChild(resultsHtml(data.results, config));
                config.onRender(data.results.length);
            }
            else if (data.error) {
                element.appendChild(html('span', 'Error: ' + data.error, {
                    className: config.cssError
                }));
                config.onError(data.error);
            }
            else {
                element.appendChild(html('span', config.notFoundMessage, {
                    className: config.cssNotFound
                }));
                config.onRender(0);
            }
        });
    }

    function extend(target, objects) {
        for (var i = 1, object; i < arguments.length; ++i) {
            object = arguments[i];
            if (object) for (var key in object) if (object.hasOwnProperty(key)) {
                target[key] = object[key];
            }
        }
        return target;
    }

    function isEmpty(obj) {
        return !obj || !obj.length;
    }

    function $$(element) {
        if (typeof element === 'string') {
            if (element[0] === '#') element = element.substring(1);
            return document.getElementById(element);
        }
        return element;
    }

    function html(tag, content, attributes) {
        var el = document.createElement(tag);
        if (content) { el.innerHTML = content; }
        if (attributes) { extend(el, attributes); }
        return el;
    }

    function empty(element) {
        $$(element).innerHTML = '';
    }

    function addClassName(element, className) {
        element = $$(element);
        element.className = (element.className ? ' ' : '') + className;
    }

    function url(baseUrl, params) {
        var p = [], nextUrl = baseUrl;
        if (params) {
            for (var key in params) {
                if (params.hasOwnProperty(key) && params[key] != null) {
                    p.push(encodeURIComponent(key) + '=' + 
                           encodeURIComponent(params[key]));
                }
            }
            if (p.length) {
                nextUrl += (nextUrl.indexOf('?') > -1 ? '&' : '?') + p.join('&');
            }
        }
        return nextUrl;
    }

    function getJSON(src, callback) {
        var cbName = '_callback' + (new Date()).getUTCMilliseconds();
        global[cbName] = callback;
        var script = html('script', null, {
            src: url(src, {callback: cbName}),
            type: 'text/javascript',
            async: true
        });
        document.body.appendChild(script);
    }

    function resultsHtml(results, config) {
        var list = html('ul', null, {
            className: config.cssList
        });
        for (var i = 0; i < results.length; ++i) {
            list.appendChild(resultHtml(results[i], config));
        }
        return list;
    }

    function resultHtml(result, config) {
        var item = html('li', null, {className: 'topic'});
        item.appendChild(html('a', result.heading, {
            className: 'heading',
            href: result.link,
            target: '_blank'
        }));
        if (!isEmpty(result.images)) {
            item.appendChild(html('img', null, {
                className: 'thumbnail',
                src: result.images[0].thumbnail
            }));
        }
        if (!isEmpty(result.snippets)) {
            item.appendChild(html('p', result.snippets[0], {
                className: 'snippet'
            }));
        }
        item.appendChild(html('a', config.readMoreMessage, {
            className: config.cssReadMore,
            href: result.link,
            target: '_blank'
        }))
        return item;
    }

    if (!global.Credo) {
        global.Credo = {};
    }

    var _prev = global.Credo.SearchWidget;
    SearchWidget.init = function(config) {
        return new SearchWidget(config);
    };
    SearchWidget.noConflict = function() {
        if (_prev) {
            global.Credo.SearchWidget = _prev;
            _prev = null;
        }
        return SearchWidget;
    };
    global.Credo.SearchWidget = SearchWidget;

})(this);