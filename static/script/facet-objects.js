// ===========================================================================
//
// facet-items.js
//
// Stores facet objects (models).  Facets aren't dynamically created, they are
//  all defined here.
// ===========================================================================
LUCID.facetObjects = (function(){
    //Store dict of all facet objects
    var facets = {};
    var facetViews = {};
    //defined below
    var viewFactory = function(){};

    //Default view for facet settings if one isn't defined for a facet
    //  TODO: We can make a class out of this and just extend / overwrite
    //  the methods we want
    var defaultFacetSettingsView = Backbone.View.extend({
        className: 'inner',
        events: {},
        initalize: function(){
        },
        render: function(){
            var facetSettingsHtml = _.template( 
                $('#template-facet-settings-' + this.model.get('name')).html() )({ 
                    model: this.model 
            });
            //Empty HTML and append the created HTML to this.$el
            this.$el.empty();
            this.$el.append(facetSettingsHtml);
            return this.$el;
        }
    });

    //Note:
    //Each facet has its own very specific view and object model, which 
    //  we create and return in this function.
    //For the views, we need to create a new view class for each facet.  
    //  The view objects will be instaniated during the LUCID.Views.Facet
    //      view object's instaniation through this function's viewFactory 
    //      
    //      The LUCID.Views.Facet class then uses that facet view as a subview
    //
    //NOTE: The facet models' name property and the key in the facets object
    //  must match
    
    //-----------------------------------
    //Search facet
    //-----------------------------------
    //Note: search is bit different than any other facet since it will
    //  already have a DOM node created for it and will always be shown
    //MODEL
    facets.search = new LUCID.Models.Facet({
        name: 'search',
        title: 'Search',
        currentValue: '',
        description: '',
        active: true
    });
    facetViews.search =  Backbone.View.extend({
        el: '.search',
        events: { 
            'change .search-query': 'updateInput' 
        },
        initialize: function(){
            //Store DOM node reference
            this.$searchInput = $('#facet-search');
        },

        render: function(){
            var that = this;
            //Setup autocomplete
            this.$searchInput.autocomplete({
                source: function( request, response ) {
                    $.ajax({
                        url: "search_lookahead/",
                        dataType: "json",
                        data: {
                            term: request.term
                        },
                        success: function( data ) {
                            response( $.map( data.terms, function( item ) {
                                return {
                                    label: item,
                                    value: item
                                };
                            }));
                        }
                    });
                },
                minLength: 2,
                select: function( event, ui ) {
                    that.model.set({ currentValue: ui.item.value });
                }
            });
        },

        updateInput: function(e){
            //called whenever the input value is changed
            this.model.set({ currentValue: this.$searchInput.val() });
        }
    });
    

    //-----------------------------------
    //Date Facet
    //-----------------------------------
    facets.date = new LUCID.Models.Facet({
        name: 'date',
        title: 'Date Range',
        currentValue: '',
        description: 'Limits search results by a range of dates',
        active: true
    });

    //Date view
    facetViews.date = Backbone.View.extend({
        className: 'inner',
        events: {
            'change #facet-date-begin':  'changeDate',
            'change #facet-date-end':  'changeDate'
        },
        initalize: function(){
            //TODO: Listen on events to update the count correctly
        },
        render: function(){
            var that = this;
            var facetSettingsHtml = _.template( 
                $('#template-facet-settings-' + this.model.get('name')).html() )({ 
                    model: this.model 
            });
            //Empty HTML and append the created HTML to this.$el
            this.$el.empty();
            this.$el.append(facetSettingsHtml);

            //Setup tooltip
            $('input.date', this.$el).datetimepicker({
                changeMonth: true,
                changeYear: true   
            });

            return this.$el;
        },
        getTimes: function(){
            var startDate, endDate, 
                startTime, endTime;

            //Get the start and end date and times
            startDate = ($('#facet-date-begin').val() || 0);
            startTime = new Date(startDate).getTime() / 1000;

            endDate = ($('#facet-date-end').val() || 0);
            endTime = new Date(endDate).getTime() / 1000;

            return { 'start': startTime, 'end': endTime };

        },
        changeDate: function(){
            //Update the model whenever either date field changes
            var times = this.getTimes();
            var breadCrumbTitle = '';
            //Get the breadCrumbTitle (text displayed in the breadcrumb)
            //Get start date
            if(times.start < 1){
                breadCrumbTitle += 'Beginning of Time';
            }else{
                //Use jquery ui's datepicker.formatDate to
                //  format the date object
                //Pass in new Date(time.start * 1000) - we need to
                //  multiply by 1000 beacuse times.start uses a
                //  python friendly datetime, which uses a slightly different 
                //  format - so we need to multiply it by 1000 to get the
                //  appropriate JS date object
                breadCrumbTitle += $.datepicker.formatDate(
                    'yy-mm-dd', 
                    new Date(times.start * 1000)
                );
            }
            breadCrumbTitle += ' until ';

            //Get start date
            if(times.end < 1){
                breadCrumbTitle += 'End of Time';
            }else{
                breadCrumbTitle += $.datepicker.formatDate(
                    'yy-mm-dd', 
                    new Date(times.end * 1000)
                );
            }

            //Update the model
            this.model.set({ 
                currentValue: '' + times.start + ',' + times.end,
                breadCrumbTitle: breadCrumbTitle
            });
        }
    });

    //-----------------------------------
    //Categories
    //-----------------------------------
    facets.categories = new LUCID.Models.Facet({
        name: 'categories',
        title: 'Categories',
        currentValue: '',
        description: 'Limits search results by category',
        active: true,

        //Fields that will show up in list. TODO: This should be a collection
        //  of models returned from server.  key:val pair for demo
        fields: {
            Odin: {active: false, count: 0},
            Thor: {active: false, count: 0},
            Loki: {active: false, count: 0},
            Heimdall: {active: false, count: 0},
            Vidar: {active: false, count: 0},
            Njord: {active: false, count: 0}
        }

    });

    //categories view
    facetViews.categories = Backbone.View.extend({
        className: 'inner',
        events: {},
        initialize: function(){
            //Listen for the change:fields event and update the DOM nodes
            //  to show the active fields
            this.model.on('change:fields', this.updateListElements, this);
            this.model.on('fetchedFields', this.updateFieldCount, this);
        },

        generateFieldHtml: function(){
            //Gets the HTML for the fields based on the model
            var fields = this.model.get('fields');
            var fieldHtml = []; 
            var field;
            //Iterate over all the fields and create DOM elements for them
            for(field in fields){
                if(fields.hasOwnProperty(field)){
                    fieldHtml.push("<li><span class='field-wrapper name-" + field.toLowerCase().replace(/[^a-z]/gi,'') + "'>" + field + "<span class='count'>(" + fields[field].count + ")</span></span></li>");
                }
            }
            fieldHtml = fieldHtml.join('');
            return fieldHtml;
        },

        updateFieldCount: function(){
            var fields = this.model.get('fields');
            var fieldHtml = []; 
            var field;
            //Iterate over all the fields and create DOM elements for them
            for(field in fields){
                if(fields.hasOwnProperty(field)){
                    $('.field-wrapper.name-' + field.toLowerCase().replace(/[^a-z]/gi,'') + ' .count').html('(' + fields[field].count + ')');
                }
            }
        },

        render: function(){
            //Renders the DOM
            //TODO: This should be put into a view for each item
            var that = this;
            //Generate the HTML for each item
            var fieldHtml = this.generateFieldHtml();

            //Get HTML
            var facetSettingsHtml = _.template( 
                $('#template-facet-settings-' + this.model.get('name')).html() )({ 
                    model: this.model, 
                    fields: fieldHtml
            });
            //Empty HTML and append the created HTML to this.$el
            this.$el.empty();
            this.$el.append(facetSettingsHtml);

            //Set events for category clicks
            $('li', this.$el).click(function(e){
                //Click fires event to update the model's fields
                var fields = that.model.get('fields');
                var key;

                //TODO: This should be abstracted into models
                //Reget the fields each click since values may have changed
                var el = $(e.currentTarget);
                //Get this LI element's key
                key = $('.field-wrapper', el).html().match(/\w*/)[0];

                //Set the active field
                if(fields[key].active === true){
                    fields[key].active = false;
                }else {
                    fields[key].active = true;
                }

                //Update the fields.  This will trigger the updateListElements
                that.model.set({fields: fields}, {silent:true});
                that.model.trigger('change:fields');
                that.updateListElements();
            });

            return this.$el;
        },

        //-------------------------------
        //Event helpers
        //-------------------------------
        updateListElements: function(){
            //Function to update list element nodes when fields change
            //Store ref to fields
            var fields = this.model.get('fields');

            //Go through each list element and update it based on 
            //  if it is active or not
            $('li', this.$el).each(function(i, el){
                var key = $('.field-wrapper', el).html().match(/\w*/)[0];
                var categoriesValue = '';

                if(fields[key].active === true){
                    $(el).addClass('active'); 
                }else{
                    $(el).removeClass('active'); 
                }
            });
        }
    });

    //-----------------------------------
    //Topics
    //-----------------------------------
    facets.topics = new LUCID.Models.Facet({
        name: 'topics',
        title: 'Topics',
        currentValue: '',
        description: 'Limits search results by topic',
        active: true,

        fields: {
            Auto: {active: false, count: 0},
            Business: {active: false, count: 0},
            Communication: {active: false, count: 0},
            Electronics: {active: false, count: 0},
            Internet: {active: false, count: 0},
            Television: {active: false, count: 0}
        }
    });


    //categories view
    facetViews.topics = Backbone.View.extend({
        className: 'inner',
        events: {},
        initialize: facetViews.categories.prototype.initialize,
        generateFieldHtml: facetViews.categories.prototype.generateFieldHtml,
        render: facetViews.categories.prototype.render,
        updateListElements: facetViews.categories.prototype.updateListElements,
        updateFieldCount: facetViews.categories.prototype.updateFieldCount

    });

    //-----------------------------------
    //
    //View factory
    //
    //-----------------------------------
    viewFactory = function(model){
        //Takes in a model and returns the corresponding view
        var view;
        if(facetViews[model.get('name')]){
            //If a view was created above, use it
            view = new facetViews[model.get('name')]({ model: model });
        }else{
            //Otherwise, the view for this model doesn't exist
            //  and was generic enough to use the default view
            view = new defaultFacetSettingsView({model: model});

        }
        return view;
    };

    //Done, return facets
    return {
        models: facets,
        viewFactory: viewFactory,
        views: facetViews        
    };
})();
