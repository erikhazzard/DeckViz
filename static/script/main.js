// ===========================================================================
//
// main.js
//
// Main app handling logic
// ===========================================================================
LUCID.init = (function(){
    //Setup the App model object and create its view
    LUCID.app = new LUCID.Models.App({});
    //Note: when the app model is created, a DataItems and Facets collection
    //  is added to it

    //Create the app view and store a ref to it
    //-----------------------------------
    LUCID.appView = new LUCID.Views.App({
        model: LUCID.app
    });


    //-----------------------------------
    //Bread crumbs
    //-----------------------------------
    var breadCrumbsCollectionView = new LUCID.Views.BreadCrumbs({
        collection: LUCID.app.get('facets')
    });
    //Similar to facetsCollectionView logic above
    breadCrumbsCollectionView.render();

    //Add event to create views for facets when a facet is added to the 
    //  facetsColleciton
    //-----------------------------------
    var facetsCollectionView = new LUCID.Views.Facets({
        collection: LUCID.app.get('facets')
    });

    //render the facetsCollectionView. This will loop through all facetObjects
    //  and add their model to the 'facets' collection, which will then in
    //  turn create a view object for each facet and render it 
    //  (see LUCID.Views.Facets in facet.js)
    facetsCollectionView.render();
    
    //-----------------------------------
    //Data Items
    //-----------------------------------
    var dataItemsCollectionView = new LUCID.Views.DataItems({
        collection: LUCID.app.get('dataItems')
    });

    //Setup DOM nodes for dataCollectionView
    //  Note: this will also fetch the data from the server.  This is what kicks
    //  off the initial data list
    dataItemsCollectionView.render(); 

    //Render the app
    //TODO: Make everything render here, make it an event
    //  Draws the facet elements, data items, etc.
    //  Note: The site-wrapper element the appView uses already exists,
    //  so we don't need to append the view's DOM node since it exists
    LUCID.appView.render();
});
