// ===========================================================================
//
// data-item.js
//
// Contains the view, model, and collection class definitions for data items
//  A data item is an item returned from the server based on the facet / search
//  configutation
// ===========================================================================
// ===========================================================================
//
// VIEW
//
// ===========================================================================
LUCID.Views.DataItem = Backbone.View.extend({
    //Element config
    tagName: 'div',
    className: 'data-item-wrapper',

    //DOM Events
    events: {

    },

    //-----------------------------------
    //Functions
    //-----------------------------------
    initialize: function(){
        //Called when view is instaniated

        //Listen for model events
        this.model.on('destroy', this.remove, this);
        return this;
    },

    render: function(){
        //Renders an individual data item.  Called from the data item collection

        //Get modelPropertiesHtml
        var modelPropertiesHtml = [],
            //We'll iteratve over all properties except the default properties
            properties = this.model.attributes,
            defaults = this.model.defaults,
            prop,
            html;

        for(prop in properties){
            if(properties.hasOwnProperty(prop) && defaults[prop] === undefined){
                //Setup model html
                modelPropertiesHtml.push(
                    "<div class='model-properties'>"
                    +   "<span class='key'>"
                    +       LUCID.util.capitalize(prop)
                    +   "</span><span class='value'>"
                    +       properties[prop]
                    +   "</span>"
                    + "</div>" );
            }
        }
        modelPropertiesHtml = modelPropertiesHtml.join('');

        //Creates and returns the actual DOM element
        html = _.template( $('#template-data-item').html() )({
            model: this.model,
            modelProperties: modelPropertiesHtml
        });
        
        //Use the generated element
        this.$el.empty();
        this.$el.append($(html));
        
        return this.$el;
    },

    //Unrender destroys the view element
    unrender: function(){
        this.$el.remove();
    }
});

// ===========================================================================
//
// MODEL
//
// ===========================================================================
LUCID.Models.DataItem = Backbone.Model.extend({
    //Defaults the model starts with
    defaults: {
        title: 'Item Name',
        date: new Date(),
        description: 'Some description about this facet'

        //Anything not defined above are arbitrary key / vals which we'll 
        //  iterate over 
    }
});

// ===========================================================================
//
// COLLECTION
//
// ===========================================================================
// ===========================================================================
//
// COLLECTION VIEW
//
// ===========================================================================
LUCID.Views.DataItems = Backbone.View.extend({
    //View for the collection of data items. Handles rendering all subviews
    
    //Element config
    //  Element will already exist in DOM
    el: '.data-items',
    views: {},

    //DOM Events
    events: {

    },

    //-----------------------------------
    //Functions
    //-----------------------------------
    initialize: function(){
        //Called when view is instaniated
        //Collection needs to be passed in
        if(this.collection === undefined){
            console.log('No collection passed into data item view');
            return false;
        }

        //Listen for model events
        this.collection.on('add', this.addItem, this);
        this.collection.on('remove', this.removeItem, this);

        //Whenever the amount of data items changes, update the shown results
        this.collection.on('numResultsUpdated', this.updateDataItemsCount, this);

        //Whenever a new set of models is returned from the server, add them
        //Causes error
        this.collection.on('reset', this.resetItems, this);
        this.collection.on('reset', function(){
            this.updateDataItemsCount(0);
        }, this);

        //Anytime the facet configuration is changed, update this data item 
        //  collection
        //  Note: the facets collection must exist at this point 
        if(LUCID.app.get('facets')){
            //Note: pass in this.collection so this is bound to the right
            //  collection (if it's not passed in, this will be bound to
            //  the facets collection
            LUCID.app.get('facets').on(
                'change', 
                this.collection.updateCollection,
                this.collection);
        }

        return this;
    },

    render: function(){
        //Render each data item in the collection
        this.wrapper = this.wrapper || $('.data-items-wrapper');
        this.$resultsCount = $('.data-items-total .total');

        var that = this;

        //Get ALL items from server (no query passed in)
        //  Use fetch, will hits the backend to get the collection
        this.collection.fetch({
            success: function(collection, res){
                //When the collection returns, set the number of results
                //Set number of results
                that.collection.numResults = res.num_results;
                //Trigger numResultsUpdated, which will also update the view
                that.collection.trigger('numResultsUpdated');
            },
            error: function(res){
            }
        });

        return this;
    },

    //Unrender destroys the view element
    unrender: function(){
        this.$el.empty();
    },

    resetItems: function(){
        //Called when collection is reset
        //Empties all items and readds them
        this.unrender();
        this.addAllItems();
    },
    
    //-----------------------------------
    //Adding / removing models to create views
    //-----------------------------------
    addItem: function(model){
        //Creates a single view for a single item
        //Create data item view
        //NOTE: Don't create a view if it already exists
        this.views['view-' + model.cid] = new LUCID.Views.DataItem({
            model: model
        });
        this.$el.append( this.views['view-' + model.cid].render() );

        return this;
    },

    addAllItems: function(){
        //Adds view for each item in the collection
        //  Calls addItem() above. model is passed in
        //  (Note: pass in this context)
        this.collection.each(this.addItem, this);

        return this;
    },

    //-----------------------------------
    //removing items
    //-----------------------------------
    removeItem: function(model){
        //The view object will already exist
        //  it needs to be added before it can be removed, it gets created
        //  when it is added
        this.views['view-' + model.cid].unrender();
    },

    removeAllItems: function(){
        //Removes all data item objects
    },

    //-----------------------------------
    //Update data items count
    //-----------------------------------
    updateDataItemsCount: function(num){
        //Called whenever the amount of data item results changes
        //  Event listeners added in initialize for this, gets triggered on
        //  add, remove, reset
        //params: num (optional) overrides the number the html is set to
        //  Updates the total items count html
        if(this.$resultsCount){
            //Note: the DOM node might not exist at the time this gets called,
            //  so only update it if the dom not exists
            if(num === undefined){
                //Use database, num is not passed in
                this.$resultsCount.html(this.collection.numResults);
            }else{
                //Num was passed in, use it
                this.$resultsCount.html(num);
            }
        }
        return this;
    }
});
// ===========================================================================
//
// COLLECTION MODEL
//
// ===========================================================================
LUCID.Collections.DataItems = Backbone.Collection.extend({
    model: LUCID.Models.DataItem,
    url: 'items/',
    parse: function(response) {
        return response.models;
    },
    initialize: function(){
        //Called when the collection is initialized
        //  Set starting count (to zero)
        this.numResults = 0;
    },
    generateUrl: function(){
        //The URL will be generated based on the facet configuration
        var baseUrl = 'items/';
        var urlString = baseUrl + LUCID.app.get('facets').generateUrl();

        return urlString;
    },

    getActiveItems: function(){
        //Gets active items from the facet configuration
    },

    updateCollection: function(){
        //Called when the facet configuration changes
        this.url = this.generateUrl();
        var that = this;

        //Update the data items
        this.fetch({
            success: function(collection, res){
                //Set number of results
                that.numResults = res.num_results;
                //Trigger numResultsUpdated, which will also update the view
                //  and update the number for the total results div
                that.trigger('numResultsUpdated');
            },
            error: function(res){
            }
        });

        //Update the collection count
        //Note: Whenever the updateCollectionCount event is fired, update the 
        //  number of counts for each facet's field. This is found in facet.js
        LUCID.app.get('facets').trigger('updateCollectionCount');

        return this;
    }

});
