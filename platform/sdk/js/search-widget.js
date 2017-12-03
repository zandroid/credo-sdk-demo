(function(global) {
    var Credo = global.Credo || (global.Credo = {});

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
            h('p', {className: config.cssLoading}, config.loadingMessage));
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
                element.appendChild(h('span', {
                    className: config.cssError
                }, 'Error: ' + data.error));
                config.onError(data.error);
            }
            else {
                element.appendChild(h('span', {
                    className: config.cssNotFound
                }, config.notFoundMessage));
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

    function h(tag, attributes, children) {
        if (attributes && typeof attributes.length === 'number') {
            children = attributes;
            attributes = null;
        }
        var el = document.createElement(tag);
        if (attributes) {
            extend(el, attributes);
        }
        if (typeof children === 'string') {
            el.innerHTML = children;
        }
        else if (children && children.length) {
            for (var i = 0; i < children.length; ++i) {
                el.appendChild(children[i]);
            }
        }
        return el;
    }

    function empty(element) {
        element.innerHTML = '';
    }

    function addClassName(element, className) {
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
        var script = h('script', {
            src: url(src, {callback: cbName}),
            type: 'text/javascript',
            async: true
        });
        document.body.appendChild(script);
    }

    function resultsHtml(results, config) {
        var items = [];
        for (var i = 0; i < results.length; ++i) {
            items.push(resultHtml(results[i], config));
        }
        return h('ul', {
            className: config.cssList
        }, items);
    }

    function resultHtml(result, config) {
        var content = [h('a', {
            className: 'heading',
            href: result.link,
            target: '_blank'
        }, result.heading)];
        if (!isEmpty(result.images)) {
            content.push(h('img', {
                className: 'thumbnail',
                src: result.images[0].thumbnail
            }));
        }
        if (!isEmpty(result.snippets)) {
            content.push(h('p', {
                className: 'snippet'
            }, result.snippets[0]));
        }
        content.push(h('a', {
            className: config.cssReadMore,
            href: result.link,
            target: '_blank'
        }, config.readMoreMessage));
        return h('li', {className: 'topic'}, content);
    }

    var _prev = Credo.SearchWidget;
    Credo.SearchWidget = SearchWidget;
    SearchWidget.init = function(config) {
        return new SearchWidget(config);
    };
    SearchWidget.noConflict = function() {
        if (_prev) {
            Credo.SearchWidget = _prev;
            _prev = null;
        }
        return SearchWidget;
    };

})(this);