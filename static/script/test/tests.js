/* ========================================================================    
    tests.js

    Contains all the unit tests for this app

    Some common test functions
    -------------------------------------
    ok ( state, message ) – passes if the first argument is truthy
    equal ( actual, expected, message ) – a simple comparison assertion with
        type coercion

    notEqual ( actual, expected, message ) – the opposite of the above

    expect( amount ) – the number of assertions expected to run within each test

    strictEqual( actual, expected, message) – offers a much stricter comparison
        than equal() and is considered the preferred method of checking equality
        as it avoids stumbling on subtle coercion bugs

    deepEqual( actual, expected, message ) – similar to strictEqual, comparing 
        the contents (with ===) of the given objects, arrays and primitives.
    -------------------------------------

    We also use Sinon, which allows us to use Spys, which can be used to
    make sure events get triggered, allow for fake AJAX requests, etc.
    See http://sinonjs.org/qunit/
    ======================================================================== */
$(document).ready( function(){
    //====================================================================
    //    
    //NameSpace testing
    //
    //====================================================================
    module('Namespace tests', {
        setup: function(){
            return this; 
        },
        teardown: function(){
            return this; 
        }
    });

    test('Namespace properties exist', function(){
        //Let's get started - some sanity checks to make sure the namespace 
        //  has been setup properly
        equal(
            LUCID !== undefined,
            true,
            'LUCID namespace is defined');
        equal(
            LUCID.app !== undefined,
            true,
            'LUCID.app namespace is defined');
        equal(
            LUCID.Views !== undefined,
            true,
            'LUCID.Views namespace is defined');
        equal(
            LUCID.Models !== undefined,
            true,
            'LUCID.Models namespace is defined');
        equal(
            LUCID.Collections !== undefined,
            true,
            'LUCID.Collections namespace is defined');
        equal(
            LUCID.facetObjects !== undefined,
            true,
            'LUCID.facetObjects namespace is defined');

        return this;
    });


    //====================================================================
    //    
    //APP Tests
    //
    //====================================================================
    module('APP Tests', {
        setup: function(){
            //Setup the App model object and create its view
            this.app = new LUCID.Models.App({});
            ok(this.app, 'App created successfully');
            ok(this.app.get('facets'), 
                'facets collection exists on the app model');
            ok(this.app.get('dataItems'), 
                'dataItems collection exists on the app model');
            return this; 
        },
        teardown: function(){
            this.app = undefined;
            return this; 
        }
    });

    test('App Dependencies Tests', function(){
        //This tests that collections / view that rely on this
        //  app work

        //Try to create a view  
        var appView = new LUCID.Views.App({
            model: this.app
        });
        ok(appView, 
            'app view created successfully');

        //Test facetCollection view
        var facetsCollectionView = new LUCID.Views.Facets({
            collection: this.app.get('facets')
        });
        ok(facetsCollectionView, 
            'facetsCollectionView created successfully');

        //Test dataItemsCollectionView
        var dataItemsCollectionView = new LUCID.Views.DataItems({
            collection: this.app.get('dataItems')
        });
        ok(dataItemsCollectionView, 
            'facetsCollectionView created successfully');

    });

    //====================================================================
    //    
    //Facet Testing
    //
    //====================================================================
    module('Facet Tests', {
        setup: function(){
            return this; 
        },
        teardown: function(){
            return this; 
        }
    });

    test('Facet Model Tests', function(){
        facetModel = new LUCID.Models.Facet({
            name: 'test',
            title: 'Test',
            currentValue: 'all',
            description: 'This is a test',
            active: true
        });

        ok( facetModel, 'Facet model created successfully' );
    });
});
