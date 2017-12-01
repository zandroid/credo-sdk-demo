(function(global) {
    // get reference to initializing script tag
    var scripts = document.getElementsByTagName('script');
    var script = scripts[scripts.length - 1];
    var searchScript = document.createElement('script');
    searchScript.src = script.src.replace(/\/ebsco\/search\.js/i, '/search/search.js');
    searchScript.async = false;
    script.parentElement.appendChild(searchScript);
})(this);
