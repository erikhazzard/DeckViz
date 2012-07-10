// ===========================================================================
//
// namespace.js
//
// Sets up namespacing for the app
// ===========================================================================
LUCID = (function(){
    //Private variables
    var Views = {};
    var Models = {};
    var Collections = {};

    //Store references to the app model object. We can get all the other
    //  object models (facets, etc.) from it
    var app = {};

    //Store reference to the app view
    var appView = {};

    //init will get called when the page loads.  It is defined in
    //  main.js
    var init = false;

    //util functions
    var util = {
        capitalize: function(text){
            return text.charAt(0).toUpperCase() + text.substring(1);
        }
    };

    var facetObjects = {};
    
    //Public api
    return {
        Views: Views,
        Models: Models,
        Collections: Collections,

        //list of facetObjects
        facetObjects: facetObjects,

        //reference to the app model
        app: app,
        appView: appView,

        //Functions
        init: init,
        util: util
    };
})();
