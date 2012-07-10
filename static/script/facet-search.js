// ===========================================================================
//
// facet-search.js
//
// Contains the view for the search facet.  
//  Note: It shares the same facet model
// ===========================================================================
// ===========================================================================
//
// VIEW
//
// ===========================================================================
LUCID.Views.FacetSearch = Backbone.View.extend({
    //Element config
    el: '.search-wrapper',

    //DOM Events
    events: {

    },

    //-----------------------------------
    //Functions
    //-----------------------------------
    initialize: function(){
        //Called when view is instaniated

        //Listen for model events
        //this.model.bind('change', this.render, this);
        return this;
    },
    
    render: function(){
        return this;

    }

});
