(function(global) {
    var Credo = global.Credo || (global.Credo = {});
    
    var BASE_URL = Credo.config && Credo.config.baseUrl || '//platform.credoreference.com';
    var SDK_SCRIPT_URL = BASE_URL + '/sdk.js';
    var WIDGET_STYLES_URL = BASE_URL + '/search/css/search.css';


    // get reference to initializing script tag
    var script = (function() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    function init() {
        var target = document.createElement('div');
        target.id = Credo.sdk.uniqueId();
        script.parentNode.insertBefore(target, script);

        Credo.sdk.attachStyles(WIDGET_STYLES_URL);

        Credo.init('SearchWidget', function() {
            var params = Credo.sdk.parseQuery(script.src);
            var query = params.query || params.q || params.searchTerm || params.searchPhrase;
            if (params.ebsco) {
                query = cleanEbscoSearchQuery(query);
            }
            if (query) {
                Credo.SearchWidget({
                    query: query,
                    target: target.id,
                    institutionId: params.institutionId || params.id || params.apiKey
                });
            }
        });
    }

    function cleanEbscoSearchQuery(q) {
        return q && q.replace(/(^| )(TI|AU|TX|SU|SO|AB|IS|IB)( |$)/g, ' ').trim();
    }

    if (global.Credo && global.Credo.sdk) {
        init();
    }
    else {
        Credo.onReady = Credo.onReady || {};
        Credo.onReady.sdk = Credo.onReady.sdk || [];
        Credo.onReady.sdk.push(init);

        var sdkScript = document.createElement('script');
        sdkScript.type = 'text/javascript';
        sdkScript.src = SDK_SCRIPT_URL;
        sdkScript.async = true;
        document.body.appendChild(sdkScript);
    }
})(this);