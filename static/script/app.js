// ===========================================================================
//
// app.js
//
// Contains the view, model, and collection class definitions for the app 
//
// ===========================================================================
// ===========================================================================
//
// VIEW
//
// ===========================================================================
LUCID.Views.App = Backbone.View.extend({
    //Element config
    //  Element already exists, use site-wrapper
    el: '#site-wrapper',

    optionsView: undefined,

    //DOM Events
    events: {
        //Options Wrapper
        'click .options-button-wrapper': 'optionsButtonClicked'
    },

    //-----------------------------------
    //Functions
    //-----------------------------------
    initialize: function(){
        //Called when view is instaniated

        //Listen for model events

        //Listen for sub view events
        return this;
    },

    render: function(){
        //Creates and returns the actual DOM element
        
        //Create subView for options
        this.optionsView = new LUCID.Views.AppOptions({ 
            el: this.$('.options-dialog-wrapper')
        });

        //Add tooltip functionality to options button
        $('.options-button').tooltip();

        return this;
    },

    //-----------------------------------
    //DOM Related Events
    //-----------------------------------
    optionsButtonClicked: function(){
        //Called when the options wrapper on the left sidebar is clicked
        if(this.optionsView.$el.css('display') === 'none'){
            //show the options dialog
            this.optionsView.render();
            $('.options-button-wrapper .options-button').addClass('active');
        }else{
            //hide the options dialog
            this.optionsView.unrender();
            $('.options-button-wrapper .options-button').removeClass('active');
        }

        return this;
    }
});


// ===========================================================================
//
// Sub Views
//
// ===========================================================================
LUCID.Views.AppOptions = Backbone.View.extend({
    render: function(){
        this.$el.fadeIn();
    },

    unrender: function(){
        this.$el.fadeOut();
    }
});

// ===========================================================================
//
// MODEL
//
// ===========================================================================
LUCID.Models.App = Backbone.Model.extend({
    //Defaults the model starts with
    defaults: {
        //Refernce to facet collection
        facets: {},
        dataItems: {}
    },

    initialize: function(){
        this.set({
            //Setup an empty facet collection
            facets: new LUCID.Collections.Facets(),
            
            //data items
            dataItems: new LUCID.Collections.DataItems()
        });
    }
});
