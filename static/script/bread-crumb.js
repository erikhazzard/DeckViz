// ===========================================================================
//
// bread-crumb.js
//
// Contains the view, model, and collection class definitions for breadcrumbs
//      Whenever a facet's settings are updated, the corresponding breadcrumb
//      will get updated
// ===========================================================================
// ===========================================================================
//
// BREADCRUMB VIEW
//
// ===========================================================================
LUCID.Views.BreadCrumb = Backbone.View.extend({
    //The BreadCrumb view is linked to a facet model.  
    // There is a breadcrumb for each facet
    //Whenever the facet 
    //  current value changes, this view gets updated

    tagName: 'div',
    className: 'bread-crumb-wrapper',

    events: {
        'click .close': 'closeBreadCrumb'
    },

    initialize: function(){
        //Listen on model events
        //  Note: the associated model is a facet model
        this.model.on('render:breadcrumb', this.render, this);
        //When the facet changes, render the associated breadcrumb
        //  (see facet.js)
        this.model.on('change', this.render, this);
        this.model.on('change:fields', this.render, this);
    },

    render: function(){
        //Creates the breadcrumb HTML
        var crumbs=[], 
            field, fields,
            crumbField,
            html;

        //Remove existing HTML
        this.$el.empty();

        //Don't add the HTML if the current value isn't defined 
        //  (e.g., if everything is selected)
        if(this.model.get('currentValue')){
            //Get crumbs HTML
            
            //Get the fields from the facet model
            fields = this.model.get('fields');

            //Set defaults if fields don't exist
            if(fields === undefined || fields === []){
                //If there are no fields, (e.g., date or search), use 
                //  the current value
                fields = {};
                //Check to see if it has a 'breadCrumbTitle'
                crumbField = (this.model.get('breadCrumbTitle') || this.model.get('currentValue'));

                fields[crumbField] = {
                    active: true,
                    count: this.model.get('numResults')
                };
            }

            //Iterate over the fields to build the breadcrumb html
            for(field in fields){
                if(fields.hasOwnProperty(field)){
                    //Only show the item if it's active
                    console.log(field);
                    if(fields[field].active){
                        crumbs.push('<span class="value-title">' + field + "</span>");
                    }
                }
            }

            //Turns the crumbs array into a string
            crumbs = crumbs.join(',');
            
            //Get HTML string
            html = _.template( $('#template-bread-crumb').html() )({
                crumbs: crumbs,
                model: this.model
            });

            this.$el.append($(html));
        }
        
        /* If we wanted tooltips...
        if($('.bread-crumb', this.$el).prop('rel') === undefined){
            //Note: only do this once. Render() will get called
            //  whenever the model's data is changed, and we don't want this
            //  to keep happening
            $('.bread-crumb', this.$el).prop({ 
                rel: 'tooltip'
            });

            //Setup popover (bootstrap plugin)
            $('.bread-crumb', this.$el).tooltip({
                title: this.model.get('title')
            });
        }
        */

        return this.$el;
    },

    //-----------------------------------
    //Event callbacks
    //-----------------------------------
    closeBreadCrumb: function(){
        //Called when the close button is clicked, will remove
        //  the breadcrumb and facet selection
        this.model.deactivateFields();
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
//Note - this is the Facets view for the collection of facets
LUCID.Views.BreadCrumbs = Backbone.View.extend({
    //View for the collection of facets
    //Element should already exist, it's the facets-list-wrapper container
    el: '.bread-crumbs-wrapper',

    events: {
    
    },

    //views will store a key:value pair of facet view objects
    views: {},

    //Functions
    //-----------------------------------
    initialize: function(){
        //When a model is added to the facets collection (this view's 
        //  collection ref), create a view for it
        //
        //  Note: Be sure to bind this to the event listener so we can acces
        //  this view's context
        this.collection.on('add', this.createViews, this);

        return this;
    },

    render: function(){
        //When render is called, create / render all the corresponding
        //  breadcrum views
        var key;
        var options = {};

        //We want to show all facets (including search)
        for(key in this.views){
            if(this.views.hasOwnProperty(key)){
                this.$el.append(this.views[key].render());
            }
        }
        return this;
    },

    //Helper functions
    //-----------------------------------
    createViews: function(model){
        //When a model is added to this collection, create a view for it
        var breadCrumbView = new LUCID.Views.BreadCrumb({
            model: model 
        });

        //Store ref to it
        this.views['view_' + model.cid] = breadCrumbView; 

        //Add the view to the view list
        this.$el.append(breadCrumbView.render());
    }
});
