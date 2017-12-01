(function(window, undefined) {
	var version = '1.1';

	var exports = {};
	var apiUrl, institutionId;
	var script, params;

	exports.searchWidget = function (options) {
		options = options || {};

		var query     = options.q;
		var targetDOM = options.target;
		var msg, link;

		function loadSearchResults(query, callback) {
			var callbackName = jsonpCallback();

			window[callbackName] = function(results) {
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

	function loadScript(url, callback) {
		var script = document.createElement('script');

		script.type  = 'text/javascript';
		script.async = true;
		script.src   = url;

		document.body.appendChild(script);

		if (callback) {
			if (script.addEventListener) {
			script.addEventListener('load', callback, false);
			} else {
			script.attachEvent('onreadystatechange', function() {
				if (/complete|loaded/.test(script.readyState))
					callback();
			});
			}
		}
	}

	function getQueryParams(url) {
		var params = {}, buffer, parts, i, l;

		if (url.indexOf('?') > -1) {
			buffer = url.split('?')[1].split('&');
			l = buffer.length;

			for (i = 0; i < l; i += 1) {
				parts = buffer[i].split('=');
				params[parts[0]] = parts[1];
			}
		}
		return params;
	}

	exports.homeworkHelpWidget = function(options) {
		options = options || {};

		var baseUrl = '//platform.credoreference.com/homework-help/',
			appUrl = '//homework.credoreference.com/HomeworkHelp.php',
			sdkUrl = '//sdk.credoreference.com',
			accessToken, jQuery;

		function getGradeField() {
			var field = jQuery('<select/>', { 'name': 'grade', 'id': 'hh-grade' }), i;
			jQuery('<option/>', { 'text': 'Please Select', 'value': '' }).appendTo(field);

			for (i = 3; i <= 12; i+=1) {
				jQuery('<option/>', { 'value': i, 'text': i + (i < 4 ? 'rd' : 'th') }).appendTo(field);
			}
			return field;
		}

		function getSubjectField() {
			var field = jQuery('<select/>', { 'name': 'subject', 'id': 'hh-subject' });
			field.append(
				jQuery('<option/>', { 'text': 'Please Select', 'value': '' }),
				jQuery('<option/>', { 'text': 'Biology', 'value': 'Biology' }),
                                jQuery('<option/>', { 'text': 'History / Social Studies', 'value': 'History / Social Studies' }),
				jQuery('<option/>', { 'text': 'Math', 'value': 'Math' }),
				jQuery('<option/>', { 'text': 'Reading', 'value': 'Reading' }),
				jQuery('<option/>', { 'text': 'Science', 'value': 'Science' } ).data({ 'maxgrade': 8 }),
				jQuery('<option/>', { 'text': 'Writing', 'value': 'Writing' }),
				jQuery('<option/>', { 'text': 'SAT Prep - Math', 'value': 'SAT Prep - Math' }).data({ 'mingrade': 10 }),
				jQuery('<option/>', { 'text': 'SAT Prep - English', 'value': 'SAT Prep - English' }).data({ 'mingrade': 10 })
			);
			return field;
		}

		function getAuthTypeField() {
			var field = jQuery('<select/>', { 'name': 'auth-type', 'id': 'hh-auth-type' });
			field.append(
				jQuery('<option/>', { 'text': 'Library Card', 'value': 'libcard' }),
				jQuery('<option/>', { 'text': 'Username & Password', 'value': 'unpw' })
			);
			return field;
		}

		function createForm() {
			var form, fieldset, gradeField, subjectField;

			form = jQuery('<form/>', {
				'method': 'post', 'target': 'credo-homework-help-frame', 'action': appUrl,
				'id': 'credo-homework-help-form', 'css': { 'display': 'none' }
			});

			form.append(
				// add form title and description
				jQuery('<p/>', { 'class': 'title', 'text': 'Homework Help' }),
				jQuery('<p/>', { 'class': 'description', 'text': 'Find a teacher to help you with your homework now.' })
			);

			fieldset = jQuery('<fieldset/>').appendTo(form);

			fieldset.append(
				// add hidden fields
				jQuery('<input/>', { 'name': 'clientId', 'type': 'hidden', 'value': options.apiKey }),
				jQuery('<input/>', { 'name': 'key', 'type': 'hidden', value: accessToken }),

				// add name field
				jQuery('<label/>', { 'for': 'hh-name', 'text': 'Name' }),
				jQuery('<input/>', { 'name': 'name', 'type': 'text', 'id': 'hh-name' }),

				// add grade field
				jQuery('<label/>', { 'for': 'hh-grade', 'text': 'Grade' }),
				gradeField = getGradeField(),

				// add subject field
				jQuery('<label/>', { 'for': 'hh-subject', 'text': 'Subject' }),
				subjectField = getSubjectField()
			);

			form.append(
				jQuery('<input/>', { 'type': 'submit', 'value': 'Find Me a Teacher' })
			);

            // bind
            gradeField.on('change', function() {
                var grade = gradeField.val();
                grade = grade && +grade;
                if (grade) {
                    subjectField.children().each(function() {
                        var subjectItem = jQuery(this),
                            minGrade = subjectItem.data('mingrade'),
                            maxGrade = subjectItem.data('maxgrade'),
                            hidden = minGrade != null && grade < minGrade || maxGrade != null && grade > maxGrade;
                        if (hidden && subjectItem.prop('selected')) {
                            subjectField.children().first().prop('selected', true);
                        }
                        subjectItem.toggle(!hidden);
                    });
                }
            });

			return form;
		}

		function createLoginForm() {
			var form, fieldset, authUrl, authTypeField;

			form = jQuery('<form/>', {
				'method': 'post', 'id': 'credo-homework-help-login-form', 'css': { 'display': 'none' }
			});

			form.append(
				// add form title and description
				jQuery('<p/>', { 'class': 'title', 'text': 'Homework Help' }),
				jQuery('<p/>', { 'class': 'description', 'text': 'Please login below to access Homework Help' })
			);

			fieldset = jQuery('<fieldset/>', { 'id': 'credo-hh-auth-type' }).appendTo(form);
			fieldset.append(
				jQuery('<input/>', { 'name': 'id', 'type': 'hidden', 'value': options.apiKey}),
				jQuery('<label/>', { 'for': 'hh-auth-type', 'text': 'Login With' }),
				authTypeField = getAuthTypeField()
			);

			fieldset = jQuery('<fieldset/>', { 'id': 'credo-hh-login-libcard' }).appendTo(form);

			fieldset.append(
				// add username field
				jQuery('<label/>', { 'for': 'credo-hh-login-cardNumber', 'text': 'Card Number' }),
				jQuery('<input/>', { 'id': 'credo-hh-login-cardNumber', 'name': 'cardNumber', 'type': 'text' })
			);

			fieldset = jQuery('<fieldset/>', { 'id': 'credo-hh-login-unpw', 'css': { 'display': 'none' } }).appendTo(form);

			fieldset.append(
				// add username field
				jQuery('<label/>', { 'for': 'credo-hh-login-username', 'text': 'Username' }),
				jQuery('<input/>', { 'id': 'credo-hh-login-username', 'name': 'username', 'type': 'text' }),

				// add password field
				jQuery('<label/>', { 'for': 'credo-hh-login-password', 'text': 'Password' }),
				jQuery('<input/>', { 'id': 'credo-hh-login-password', 'name': 'password', 'type': 'password' })
			);

			form.append(
				jQuery('<input/>', { 'type': 'submit', 'value': 'Login' })
			);

			authTypeField.on('change', function(e) {
				var type = this.options[this.selectedIndex].value;
				jQuery('#credo-hh-login-unpw').toggle(type == 'unpw');
				jQuery('#credo-hh-login-libcard').toggle(type == 'libcard');
			});

			form.on('submit', function(e) {
				var type = authTypeField.val(),
					params = { 'id': options.apiKey };

				e.preventDefault();
				if (type == 'libcard') {
					params['cardNumber'] = jQuery('#credo-hh-login-cardNumber').val();
					if (!params['cardNumber']) { window.alert('Please enter a library card number'); return false; }
				} else {
					params['username'] = jQuery('#credo-hh-login-username').val();
					params['password'] = jQuery('#credo-hh-login-password').val();
					if (!params['username']) { window.alert('Please enter a username'); return false; }
					if (!params['password']) { window.alert('Please enter a password'); return false; }
				}

				authenticateUser(params, function(response) {
					if (!response) { alert('Authentication Failed'); }
				}, function(error) {
					alert('An unknown error has occurred');
				});
			});

			return form;
		}

		function createDisplayFrame() {
			var frame = jQuery('#credo-homework-help-frame');

			if (!frame.length) {
				frame = jQuery('<iframe/>', { 'id': 'credo-homework-help-frame', 'name': 'credo-homework-help-frame', 'class': 'fancybox-iframe' });
			}
			return frame;
		}

		function createFixedTab() {
			var $tab, $image, $content, $form;

			$form = jQuery(createForm());
			$tab = jQuery('<div/>', { 'id': 'credo-homework-help', 'class': 'credo homework-help fixed-tab' });
			$image = jQuery('<img/>', { 'class': 'tab-image', 'src': baseUrl + 'images/homework_help_tab.png' });
			$content = jQuery('<div/>', { 'class': 'tab-content' });
			$content.append($form, createLoginForm());

			$tab.append($image, $content);

			// add slide event to homework help tab
			$image.on('click', { parent: $tab, content: $content }, function(e) {
				var $this = jQuery(this), right = parseInt(e.data.parent.css('right'), 10), width;

				if (right === 0) {
					width = e.data.content.width();
					right = -(width + 20);
				} else {
					right = 0;
				}
				e.data.parent.animate({ 'right': right + 'px' }, { 'queue': false });
			});

			$form.on('submit', function(e) {
				if (submitForm(this)) { $tab.trigger('click'); }
			});

			return $tab;
		}

		function createInlineForm() {
			var $form = createForm();
			$form.on('submit', function(e) {
				return submitForm(this);
			});
			return $form;
		}

		function submitForm(form) {
			var	$form = jQuery(form),
				$window = jQuery(window),
				name, grade, subject;

			name = $form.find('input[name="name"]').val();
			grade = $form.find('select[name="grade"]').val();
			subject = $form.find('select[name="subject"]').val();

			if (!name) { window.alert('Please enter your name'); return false; }
			if (!grade) { window.alert('Please select a grade level'); return false; }
			if (!subject) { window.alert('Please select a subject'); return false; }

			jQuery.fancybox(jQuery('#credo-homework-help-frame'), {
				padding: 0,
				autoSize: false,
				width: $window.width(),
				height: $window.height()
			});

			return true;
		}

		function loadWidget() {
			loadScript(baseUrl + 'js/jquery-1.9.1.min.js', function() {
				// fancybox plugin does not work with noConflict(true) - global jQuery removed
				jQuery = window.jQuery.noConflict();

				loadScript(baseUrl + 'js/jquery.fancybox.pack.js');

				exports.attachStylesheet(baseUrl + 'css/homework-help.css');
				exports.attachStylesheet(baseUrl + 'css/jquery.fancybox.css');

				jQuery(createDisplayFrame()).appendTo(document.body);

				if (options.inline) {
					jQuery(script).after(
						jQuery('<div/>', {
							'id': 'credo-homework-help',
							'class': 'credo homework-help'
						}).append(createInlineForm(), createLoginForm())
					);
				} else {
					jQuery(createFixedTab()).appendTo(document.body);
				}

				// try to auto-authenticate user
				authenticateUser({ 'id': options.apiKey }, jQuery.noop, jQuery.noop);
			});
		}

		function getAccessToken(institutionId, success, fail) {
			var callbackName = jsonpCallback();

			window[callbackName] = function(response) {
				if (response.error) { return fail(response); }
				accessToken = response.access_token;
				return success(response);
			};

			var searchResultsURL = sdkUrl + '/homework-help/getAccessToken.php';
			searchResultsURL += '?id=' + institutionId;
			searchResultsURL += '&callback=' + callbackName;
			loadScript(searchResultsURL);
		}

		function authenticateUser(params, success, fail) {
			var url = sdkUrl + '/homework-help/authenticate.php',
				callbackName = jsonpCallback(),
				params = params || [];

			window[callbackName] = function(response) {
				if (response.error) { return fail(response); }
				jQuery('#credo-homework-help-form').toggle(response !== false);
				jQuery('#credo-homework-help-login-form').toggle(response === false);
				return success(response);
			};

			params['callback'] = callbackName;
			url += '?' + jQuery.param(params);
			loadScript(url);
		}

		getAccessToken(options.apiKey, loadWidget, function(response) {
			// display error message
			var error = renderTextElement('div', response.message, 'error');
			script.parentNode.insertBefore(error, script);
		});
	};

	// get reference to initializing script tag
	script = (function() {
		var scripts = document.querySelectorAll('script[src*="credoreference.com"]');
		return scripts[scripts.length - 1];
	})();

	params = getQueryParams(script.src);

	window.Credo.instances[version] = exports;
})(this);
