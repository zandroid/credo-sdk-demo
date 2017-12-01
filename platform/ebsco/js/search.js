(function(global) {
    // get reference to initializing script tag
    var scripts = document.getElementsByTagName('script');
    var script = scripts[scripts.length - 1];
    var searchScript = document.createElement('script');
    searchScript.src = script.src.replace(/\/ebsco\/js\/search\.js/i, '/search/js/search.js') + '&ebsco=1';
    searchScript.async = false;
    script.parentElement.appendChild(searchScript);
})(this);
