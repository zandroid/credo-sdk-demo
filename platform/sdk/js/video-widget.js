(function(global, undefined){
    var Credo = global.Credo || (global.Credo = {});

    var CREDO_VIDEO_WIDGET = 'credoVideoWidget';

    var defaults = {
        accessUrl: '//auth.credoreference.com/auth/access?callback=?',
        loginUrl: '//auth.credoreference.com/auth/success',
        selector: '[data-credo-video]',
        loginFrameStyle: 'border:0; width: 100%; height: 290px;',
        cssLoading: 'credo-state-loading',
        cssLogin: 'credo-state-login',
        cssError: 'credo-state-error',
        cssVideo: 'credo-state-video'
    };

    function VideoWidget(config) {
        if (!(this instanceof VideoWidget)) {
            return new VideoWidget(config);
        }

        var $ = config && (config.$ || config.jQuery) || Credo.jQuery || global.jQuery;
        if (!$ || !$.fn || !$.fn.jquery) {
            throw Error('jQuery is required');
        }
        //config.$ = undefined;
        config = $.extend({}, defaults, config);

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
            create: function(target, options) {
                var $target = $(target).filter(function() {
                    return !$(this).data(CREDO_VIDEO_WIDGET);
                });
                if (options && options.video) {
                    $target.data('credoVideo', options.video);
                }
                if (options && options.width) {
                    $target.data('credoVideoWidth', options.width);
                }
                if (options && options.height) {
                    $target.data('credoVideoHeight', options.height);
                }
                $target.data(CREDO_VIDEO_WIDGET, it);
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
                        case 'success': it.loadVideo($target, d); break;
                        case 'denied': it.login($target, d); break;
                    }
                }, function(xhr, status, error) {
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
            loadVideo: function($target, options) {
                $target.each(function() {
                    var $this = $(this),
                        video = $this.data('credoVideo') || config.video,
                        width = $this.data('credoVideoWidth') || config.width,
                        height = $this.data('credoVideoHeight') || config.height,
                        data = $this.data('credoVideoData');
                    if (video && !data) {
                        data = {
                            institutionId: options.institutionId,
                            access_token: options.accessToken,
                            embedType: 'iframe'
                        };
                        if (width === 'auto') {
                            data.width = $this.innerWidth();
                        }
                        else if (height === 'auto') {
                            data.height = $this.innerHeight();
                        }
                        else {
                            if (+width > 0) {
                                data.width = +width;
                            }
                            if (+height > 0) {
                                data.height = height;
                            }
                        }
                        $.ajax({
                            url: options.apiUrl + '/content/videohosting/media/' + video,
                            data: data
                        }).done(function(d) {
                            $this.data('credoVideoData', d);
                            if (d.html) {
                                $this
                                    .removeClass(config.cssLoading)
                                    .removeClass(config.cssLogin)
                                    .addClass(config.cssVideo);
                                $this[0].innerHTML = d.html;
                            }
                            else {
                                it.setError($this);
                            }
                        }).fail(function() {
                            it.setError($this);
                        });
                    }
                    else if (!video) {
                        it.setError($this);
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
                    .html('<iframe src="' + loginUrl + (loginUrl.indexOf('?') == -1 ? '?' : '&') + 'frame=1&type=video" style="' + config.loginFrameStyle + '"></iframe>');
            },
            reload: function() {
                it.getAccess($('.' + config.cssLogin).filter(function() {
                    return $(this).data(CREDO_VIDEO_WIDGET) === it;
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
    }

    var _prev = Credo.VideoWidget;
    Credo.VideoWidget = VideoWidget;
    VideoWidget.init = function(config) {
        return new VideoWidget(config);
    };
    VideoWidget.noConflict = function() {
        if (_prev) {
            Credo.VideoWidget = _prev;
            _prev = null;
        }
        return VideoWidget;
    };

})(this);