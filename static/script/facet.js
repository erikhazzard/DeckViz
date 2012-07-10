// ===========================================================================
//
// facet.js
//
// Contains the view, model, and collection class definitions for facets
// ===========================================================================
// ===========================================================================
//
// FACET VIEW
//
// ===========================================================================
LUCID.Views.Facet = Backbone.View.extend({
    //Element config
    tagName: 'div',
    className: 'facet-wrapper',
    settingsView: false, 

    //DOM Events
    events: {
        'click .facet-header': 'toggleFacetSettings'
    },

    //-----------------------------------
    //Functions
    //-----------------------------------
    initialize: function(){
        //Called when view is instaniated

        //access the facet-objects factory method to get the 
        //  corresponding subview based on this models' name
        this.settingsView = LUCID.facetObjects.viewFactory(
            this.model );

        //Listen for model events
        //  Anytime anything changes, update the header
        this.model.on('change', this.updateHeader, this);
        return this;
    },

    render: function(){
        //Creates and returns the actual DOM element

        //Use the template (defined in index.html)
        var html = _.template( $('#template-facet-wrapper').html() )({
            model: this.model
        });

        //Make sure node is empty
        this.$el.empty();

        //Append the facetDiv to this element
        this.$el.append($(html));

        //Add the facet settings HTML from the settings subview
        //  The settings subview is passed in when this object is initialized
        $('.facet-settings', this.$el).append( this.settingsView.render() );

        //Set element visibility based on the active status
        //-------------------------------
        this.showHideView();

        //Add a tooltip rel to allow tooltips
        //-------------------------------
        if($('.facet-header', this.$el).prop('rel') === undefined){
            //Note: only do this once. Render() will get called
            //  whenever the model's data is changed, and we don't want this
            //  to keep happening
            $('.facet-header', this.$el).prop({ 
                rel: 'tooltip'
            });

            //Setup popover (bootstrap plugin)
            $('.facet-header', this.$el).popover({
                title: this.model.get('title'),
                content: this.model.get('description')
            });
        }

        return this.$el;
    },

    updateHeader: function(){
        //Updates the header's HTML whenever the model changes
        $('.title', this.$el).html(this.model.get('title'));
        if(this.model.get('numResults') > -1){
            $('.num-results', this.$el).html(this.model.get('numResults') + ' items');
        }else{
            $('.num-results', this.$el).html('');
        }
        return this;
    },

    //Helper functions
    //-----------------------------------
    showHideView: function(){
        if(this.model.get('active') === true){
            this.$el.css({ display: 'block' });
        }else{
            this.$el.css({ display: 'none' });
        }
        return this;
    },

    //Toggle facet options
    //-----------------------------------
    toggleFacetSettings: function(){
        //Called whenever the facet item is clicked.  Will shop options
        //  for this facet

        if(this.$el.hasClass('open')){
            //SHOW settings 
            //The options for this facet were not already shown
            this.$el.removeClass('open');

        }else{
            //HIDE settings 
            this.$el.addClass('open');
        }

        return this;
    }
});


// ===========================================================================
//
// MODEL
//
// ===========================================================================
LUCID.Models.Facet = Backbone.Model.extend({
    //Defaults the model starts with
    defaults: {
        //If a facet is active, it will be used to limit search results and
        //  its corresponding view will be rendered
        active: false,

        title: 'Facet Title',
        name: 'facet',
        currentValue: 'All',
        description: 'Some description about this facet',

        numResults: '',

        //This will be set when the model is created
        facetSettingsHtml: '',
        fields: undefined
    },

    initialize: function(){
        //Whenever the fields change, update numResults and currentValue
        this.on('change:fields', this.fieldsUpdated, this);
        this.on('fetchedFields', this.fetchedFields, this);
    },

    fieldsUpdated: function(){
        //Whenever fields is updated, set the current value
        var fields = this.get('fields');
        var field;
        var currentValue = []; 
        var numResults = 0;

        //Update current value based on active fields
        for(field in fields){
            if(fields.hasOwnProperty(field) && fields[field].active === true){
                currentValue.push(field);
                numResults += fields[field].count;
            }
        }
        //turn currentvalue into string
        currentValue = currentValue.join(',');
        this.set({
            currentValue: currentValue,
            numResults: numResults
        });

        return this;
    },

    fetchedFields: function(res){
        //Called when the fields are fetched from the serer
        //  Passed in data from server
        var fields = {}, 
            field,
            facet,
            facetName,
            facetNames;

        //For demo, we'll check everything manually
        //TODO: make this not hardcoded - this list should come from server 
        //  based on facets that have fields
        facetNames = ['categories', 'topics'];

        for(facet in facetNames){
            if(facetNames.hasOwnProperty(facet)){
                facetName = facetNames[facet];

                if(this.get('name') === facetName){
                    //store existing object
                    fields = this.get('fields');
                    for(field in fields){
                        if(fields.hasOwnProperty(field)){
                            fields[field].count = res.facets[facetName][field];
                        }
                    }
                    //Change the fields
                    //  It will also trigger a change:fields event
                    this.set({ fields: fields });
                }
            }
        }

    },

    deactivateFields: function(){
        //Helper function which sets all fields active status to false
        var fields = this.get('fields'),
            field;
        if(fields){
            for(field in fields){
                if(fields.hasOwnProperty(field)){
                    fields[field].active = false;
                }
            }
        }

        //Set the fields
        //  Suppress the change:fields event since it may not always be fired,
        //  we'll fire it manually next
        this.set({fields: fields, currentValue: ''}, {silent: true});

        //manually trigger the change:fields event since it wasn't fired
        this.trigger('change:fields');
        this.trigger('change:currentValue');

        return this;
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
//      these elements are shown in the left sidebar
LUCID.Views.Facets = Backbone.View.extend({
    //View for the collection of facets
    //Element should already exist, it's the facets-list-wrapper container
    el: '.facets-list-wrapper',

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
        this.collection.on('add', this.createView, this);

        return this;
    },

    render: function(){
        //When render is called, loop through all the facetObjects and add 
        //  them to the facet collection (this.collection)
        //Date facet
        var key;
        var options = {};

        for(key in LUCID.facetObjects.models){
            if(LUCID.facetObjects.models.hasOwnProperty(key)){
                //Add the model to the collection, which will trigger the add
                //  event which calls createView (defined below)
                //  (see initialize function to see event listener definition)
                //  (unless {silent: true} is passed in)
                this.collection.add(
                    LUCID.facetObjects.models[key],
                    options);
            }
        }
        return this;
    },

    //Helper functions
    //-----------------------------------
    createView: function(model, collection){
        //Creates a view for the model
        //params: model (required) - model to create a view for
        //          collection (required) - passed in automatically, reference 
        //              to collection
        if(model === undefined){
            console.log('No model passed into createView()');
        }

        var appendView = true;

        //Set appendView based on model
        if(model.get('name') === 'search'){
            appendView = false;
        }

        //When a model is added to this collection, create a view for it
        var facetView = new LUCID.Views.Facet({
            model: model 
        });

        //Store ref to it
        this.views['view_' + model.cid] = facetView; 

        //Add the view to the view list
        if(appendView === true){
            this.$el.append(facetView.render());
        }else{
            facetView.render();
        }

        //When the facet model's active property is set to true, the facet
        //  view will call render() (so we don't need to do it here - we just
        //  set the property)
        //triggers change:active event
        model.set({ active: true });
    }
});
// ===========================================================================
//
// COLLECTION MODEL
//
// ===========================================================================
LUCID.Collections.Facets = Backbone.Collection.extend({
    //Note: the visible data items are derived from the objects in this 
    //  collection
    model: LUCID.Models.Facet,

    initialize: function(){
        //Whenever the updateCollectionCount event is fired, update the 
        //  number of counts for each facet's field
        //Note: this will get fired whenever the dataItem collection is updated
        this.on('updateCollectionCount', this.updateCollectionCount);
        //Manually trigger it when the collection is initialized (normally
        //  it would be automatically fetched first)
        this.updateCollectionCount();
    },
    
    generateUrl: function(){
        //We won't get / replace data from the server on THIS collection, but we
        //  will use the settings in each model to generate a URL which will
        //  grab data from the server to update the currently shown items
        var url = [];
        var currentValue;
        var models = this.models, 
            modelsLength = models.length,
            currentModel,
            i;

        //Iterate over each model
        for(i=modelsLength-1;i>=0;i--){
            currentModel = models[i];
            //Get the current value
            currentValue = currentModel.get('currentValue');
            //Make sure currentValue has something in it
            if(currentValue && currentValue.length > 0){
                //Clean it up (make it URL safe)
                currentValue = encodeURIComponent(currentValue);
                //Add it to the url array
                url.push(currentModel.get('name') + '=' + currentValue); 
            }
        }

        //join the URL array on '&' to generate a valid url
        url = url.join('&');
        
        return url;
    },

    updateCollectionCount: function(){
        var that = this;
        //This is called whenever the collection is updated (e.g., whenever
        //  the user enables or disables a facet)
        $.ajax({
            url: '/facet_count/' + this.generateUrl(),
            dataType: 'json',
            
            success: function(res){
                //Update all the fields in each facet
                //Fire event on each model, passing in the response
                //  from the server.  Each model will update it's fields
                //  if necessary
                _.each(that.models, function(model){
                    model.trigger('fetchedFields', res);
                });
            }
        });
    }
});
