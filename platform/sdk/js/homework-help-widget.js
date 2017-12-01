(function(global) {
    var Credo = global.Credo || (global.Credo = {});

    var CREDO_HOMEWORK_HELP_WIDGET = 'credoHomeworkHelpWidget',
        CREDO_HOMEWORK_HELP_WIDGET_DATA = 'credoHomeworkHelpWidgetData';

    var BASE_URL = Credo.config && Credo.config.baseUrl || '//platform.credoreference.com';

    var defaults = {
        accessUrl: '//auth.credoreference.com/auth/access?callback=?',
        loginUrl: '//auth.credoreference.com/auth/success',
        appUrl: '//homework.credoreference.com/HomeworkHelp.php',
        selector: '[data-credo-homework-help]',
        loginFrameStyle: 'border:0; width: 100%; height: 290px;',
        cssLoading: 'credo-state-loading',
        cssLogin: 'credo-state-login',
        cssError: 'credo-state-error',
        cssReady: 'credo-state-ready'
    };

    function HomeworkHelpWidget(config) {
        if (!(this instanceof HomeworkHelpWidget)) {
            return new HomeworkHelpWidget(config);
        }

        var $ = config && config.$ || global.jQuery;
        if (!$ || !$.fn || !$.fn.jquery) {
            throw Error('jQuery is required');
        }
        config = $.extend({}, defaults, config);

        if (!$.fancybox) {
            var p = global.jQuery;
            global.jQuery = $;
            loadScript(BASE_URL + '/homework-help/js/jquery.fancybox.pack.js', false);
            global.jQuery = p;
        }
        if (!$(document.body).data(CREDO_HOMEWORK_HELP_WIDGET)) {
            $(document.body).data(CREDO_HOMEWORK_HELP_WIDGET, true);
            attachStylesheet(BASE_URL + '/homework-help/css/homework-help.css');
            attachStylesheet(BASE_URL + '/homework-help/css/jquery.fancybox.css');
        }

        var it = this;

        $.extend(this, {
            init: function() {
                $(global).on('message', function(e) {
                    if (e.originalEvent.data === 'credo.login.success') {
                        config.accessUrl = e.originalEvent.origin + '/auth/access?callback=?';
                        it.reload();
                    }
                });
                if (config.selector) {
                    $(function() {
                        it.create(config.selector);
                    });
                }
            },
            create: function(target) {
                var $target = $(target).filter(function() {
                    return !$(this).data(CREDO_HOMEWORK_HELP_WIDGET);
                });
                $target.data(CREDO_HOMEWORK_HELP_WIDGET, it);
                it.getAccess($target);
            },
            getAccess: function($target) {
                $target
                    .removeClass(config.cssLogin)
                    .removeClass(config.cssError)
                    .addClass(config.cssLoading)
                    .text('Loading...');
                var request = $.getJSON(config.accessUrl);
                var d = request.then(function(d) {
                    switch (d.status) {
                        case 'success': it.loadWidget($target, d); break;
                        case 'denied': it.login($target, d); break;
                    }
                }, function(xhr, status) {
                    if (status === 'parsererror') {
                        var d = {
                            status: 'denied',
                            reason: 'parsererror',
                            loginUrl: config.loginUrl
                        };
                        it.login($target, d);
                        return $.when(d);
                    }
                });
                d.then(null, function() {
                    $target
                        .removeClass(config.cssLoading)
                        .addClass(config.cssError)
                        .text('Error');
                });
                d.abort = function() { request.abort(); };
                return d;
            },
            /**
             * @param $target
             * @param {Object} options
             * @param {number} options.institutionId
             * @param {string} options.accessToken
             */
            loadWidget: function($target, options) {
                $target.each(function() {
                    var $this = $(this),
                        data = $this.data(CREDO_HOMEWORK_HELP_WIDGET_DATA);
                    if (!data) {
                        data = {
                            institutionId: options.institutionId,
                            accessToken: options.accessToken
                        };
                        $this.data(CREDO_HOMEWORK_HELP_WIDGET_DATA, data);
                        $this
                            .removeClass(config.cssLoading)
                            .removeClass(config.cssLogin)
                            .addClass(config.cssVideo)
                            .addClass('credo homework-help')
                            .html(createInlineForm(options))
                            .show();
                    }
                });
            },
            login: function($target, options) {
                if (!options.loginUrl) {
                    it.setError($target);
                    return;
                }
                var loginUrl = options.loginUrl.replace(/%currentUrl%/gi, encodeURIComponent(location.href));
                $target
                    .removeClass(config.cssLoading)
                    .addClass(config.cssLogin)
                    .html('<iframe src="' + loginUrl + (loginUrl.indexOf('?') == -1 ? '?' : '&') + 'frame=1&type=hh" style="' + config.loginFrameStyle + '"></iframe>');
            },
            reload: function() {
                it.getAccess($('.' + config.cssLogin).filter(function() {
                    return $(this).data(CREDO_HOMEWORK_HELP_WIDGET) === it;
                }));
            },
            setError: function($target, message) {
                $target
                    .removeClass(config.cssLogin)
                    .removeClass(config.cssLoading)
                    .addClass(config.cssError)
                    .text(message || 'Error');
            }
        });

        if (config.init !== false) {
            this.init();
        }

        function loadScript(url, async) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = async !== false;
            script.src = url;
            document.body.appendChild(script);
        }
        function attachStylesheet(url) {
            var stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet';
            stylesheet.type = 'text/css';
            stylesheet.href = url;
            (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(stylesheet);
        }
        function displayFrame() {
            var frame = $('#credo-homework-help-frame');
            if (!frame.length) {
                frame = $('<iframe/>', {
                    'id': 'credo-homework-help-frame',
                    'name': 'credo-homework-help-frame',
                    'class': 'fancybox-iframe'
                }).appendTo(document.body);
            }
            return frame;
        }
        function getGradeField() {
            var field = $('<select/>', { 'name': 'grade', 'id': 'hh-grade' }), i;
            $('<option/>', { 'text': 'Please Select', 'value': '' }).appendTo(field);

            for (i = 3; i <= 12; i+=1) {
                $('<option/>', { 'value': i, 'text': i + (i < 4 ? 'rd' : 'th') }).appendTo(field);
            }
            return field;
        }
        function getSubjectField() {
            var field = $('<select/>', { 'name': 'subject', 'id': 'hh-subject' });
            field.append(
                $('<option/>', { 'text': 'Please Select', 'value': '' }),
                $('<option/>', { 'text': 'Biology', 'value': 'Biology' }),
                $('<option/>', { 'text': 'History / Social Studies', 'value': 'History / Social Studies' }),
                $('<option/>', { 'text': 'Math', 'value': 'Math' }),
                $('<option/>', { 'text': 'Reading', 'value': 'Reading' }),
                $('<option/>', { 'text': 'Science', 'value': 'Science' } ).data({ 'maxgrade': 8 }),
                $('<option/>', { 'text': 'Writing', 'value': 'Writing' }),
                $('<option/>', { 'text': 'SAT Prep - Math', 'value': 'SAT Prep - Math' }).data({ 'mingrade': 10 }),
                $('<option/>', { 'text': 'SAT Prep - English', 'value': 'SAT Prep - English' }).data({ 'mingrade': 10 })
            );
            return field;
        }
        function createInlineForm(options) {
            var $form = createForm(options);
            $form.on('submit', function() {
                return submitForm(this);
            });
            return $form;
        }
        /**
         * @param {Object} options
         * @param {number} options.institutionId
         * @param {string} options.accessToken
         */
        function createForm(options) {
            var form, fieldset, gradeField, subjectField;

            form = $('<form/>', {
                'method': 'post', 'target': 'credo-homework-help-frame', 'action': config.appUrl,
                'id': 'credo-homework-help-form'
            });

            form.append(
                // add form title and description
                $('<p/>', { 'class': 'title', 'text': 'Homework Help' }),
                $('<p/>', { 'class': 'description', 'text': 'Find a teacher to help you with your homework now.' })
            );

            fieldset = $('<fieldset/>').appendTo(form);

            fieldset.append(
                // add hidden fields
                $('<input/>', { 'name': 'clientId', 'type': 'hidden', 'value': options.institutionId }),
                $('<input/>', { 'name': 'key', 'type': 'hidden', value: options.accessToken }),

                // add name field
                $('<label/>', { 'for': 'hh-name', 'text': 'Name' }),
                $('<input/>', { 'name': 'name', 'type': 'text', 'id': 'hh-name' }),

                // add grade field
                $('<label/>', { 'for': 'hh-grade', 'text': 'Grade' }),
                gradeField = getGradeField(),

                // add subject field
                $('<label/>', { 'for': 'hh-subject', 'text': 'Subject' }),
                subjectField = getSubjectField()
            );

            form.append(
                $('<input/>', { 'type': 'submit', 'value': 'Find Me a Teacher' })
            );

            // bind
            gradeField.on('change', function() {
                var grade = gradeField.val();
                grade = grade && +grade;
                if (grade) {
                    subjectField.children().each(function() {
                        var subjectItem = $(this),
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
        function submitForm(form) {
            var	$form = $(form),
                $window = $(window),
                name, grade, subject;

            name = $form.find('input[name="name"]').val();
            grade = $form.find('select[name="grade"]').val();
            subject = $form.find('select[name="subject"]').val();

            if (!name) { window.alert('Please enter your name'); return false; }
            if (!grade) { window.alert('Please select a grade level'); return false; }
            if (!subject) { window.alert('Please select a subject'); return false; }

            $.fancybox(displayFrame(), {
                padding: 0,
                autoSize: false,
                width: $window.width(),
                height: $window.height()
            });

            return true;
        }
    }

    var _prev = global.Credo.HomeworkHelpWidget;
    Credo.HomeworkHelpWidget = HomeworkHelpWidget;
    HomeworkHelpWidget.init = function(config) {
        return new HomeworkHelpWidget(config);
    };
    HomeworkHelpWidget.noConflict = function() {
        if (_prev) {
            global.Credo.HomeworkHelpWidget = _prev;
            _prev = null;
        }
        return HomeworkHelpWidget;
    };

})(this);
