(function(window, undefined) {
  var version = '1.0';

  var exports = {};
  var apiUrl, institutionId;

  exports.searchWidget = function (options) {
    options = options || {};

    var query     = options.q;
    var targetDOM = options.target;
    var msg, link;

    apiUrl = options.apiUrl;
    institutionId = options.institutionId;

    addClassName(targetDOM, 'credoreference search-widget');
    renderLoadingMessage(targetDOM, 'Searching...');

    loadSearchResults(query, function(searchResults) {
			clearElement(targetDOM);

			if (searchResults.results && searchResults.results.length) {
				renderSearchWidget(targetDOM, searchResults);
			}

      if (searchResults.error) {
        // display error message
        msg = renderTextElement('span', searchResults.message, 'error');
        document.getElementById(targetDOM).appendChild(msg);
      }
    });
  };

  function loadSearchResults(query, callback) {
    var callbackName = jsonpCallback();

    window[ callbackName ] = function(results) {
      callback(results);
    };

    var searchResultsURL = apiUrl;
    searchResultsURL += '?id=' + institutionId;
    searchResultsURL += '&callback=' + callbackName;
    searchResultsURL += '&query=' + encodeURIComponent(query);
    loadScript(searchResultsURL);
  }

  function renderLoadingMessage(target, message) {
    if (typeof target === 'string') { target = document.getElementById(target); }
    target.appendChild(renderTextElement('p', message, 'loading-message'));
  }

  function renderSearchWidget(target, searchResults) {
    var resultsList = document.createElement('ul');
    for (var i = 0; i < searchResults.results.length; i++) {
      var resultItem = renderSearchResult(searchResults.results[i]);
      resultsList.appendChild(resultItem);
    }

    resultsList.className = 'topic-list';
    var appendTo = document.getElementById(target);
    appendTo.appendChild(resultsList);

    broadcast('searchWidget.rendered');
  }

  function renderSearchResult(searchResult, resultsList) {
    var item, heading, thumbnail, snippet, readMore;

    item = document.createElement('li');
    item.className = 'topic';

    // append topic heading
    heading = renderTextElement('a', searchResult.heading, 'heading');
    heading.href = searchResult.link;
    heading.target = '_blank';
    item.appendChild(heading);

    // append topic thumbnail
    if (searchResult.images && searchResult.images.length) {
      thumbnail = renderImage(searchResult.images.shift().thumbnail);
      thumbnail.className = 'thumbnail';
      item.appendChild(thumbnail);
    }

    // append topic snippet
    if (searchResult.snippets && searchResult.snippets.length) {
      snippet = renderTextElement('p', searchResult.snippets.shift(), 'snippet');
      item.appendChild(snippet);
    }

    // append read more link
    readMore = renderTextElement('a', 'Read More', 'read-more');
    readMore.href = searchResult.link;
    readMore.target = '_blank';
    item.appendChild(readMore);

    return item;
  }

  function renderTextElement(tagName, text, className) {
    var el = document.createElement(tagName);
    if (className) { el.className = className; }
    el.innerHTML = text;
    return el;
  }

  function renderImage(src) {
    var image = new Image();
    image.src = src;
    return image;
  }

  function addClassName(target, className) {
    if (typeof target === 'string') { target = document.getElementById(target); }
    target.className += (target.className) ? ' ' : '';
    target.className += className;
  }

  function clearElement(element) {
    if (typeof element === 'string') { element = document.getElementById(element); }
    while (element.firstChild) { element.removeChild(element.firstChild); }
  }

  var listeners = {};

  exports.listen = function (eventName, handler) {
    if (typeof listeners[eventName] === 'undefined') {
      listeners[eventName] = [];
    }

    listeners[eventName].push(handler);
  };

  exports.unlisten = function (eventName, handler) {
    if (!listeners[eventName]) {
      return;
    }

    for (var i = 0; i < listeners[eventName].length; i++) {
      if (listeners[eventName[i]] === handler) {
        listeners[eventName].splice(i, 1);
        break;
      }
    }
  };

  function broadcast(eventName) {
    if (!listeners[eventName]) {
      return;
    }

    for (var i = 0; i < listeners[eventName].length; i++) {
      listeners[eventName][i]();
    }
  }

  var jsonpCallbackCounter = 0;

  function jsonpCallback() {
    return 'Credo_' + version.replace(/\./g, '_') + '_jsonpCallback_' + jsonpCallbackCounter++;
  }

  exports.attachStylesheet = function(url) {
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.type = 'text/css';
    stylesheet.href = url;
    (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(stylesheet);
  };

  function loadScript(url) {
    var script = document.createElement('script');

    script.type  = 'text/javascript';
    script.async = true;
    script.src   = url;

    document.body.appendChild(script);
  }

  window.Credo.instances[version] = exports;
})(this);