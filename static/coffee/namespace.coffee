# ===========================================================================
#
# namespace.js
#
# Sets up namespacing for the app
# ===========================================================================
DECKVIZ = (()=>
    Views = {}
    Models = {}
    Collections = {}
    Charts = {}
    Deck = {}

    app = {}

    #Functions
    init = ()=>
        return true

    #Utility functions
    util = {
        capitalize: (text)=>
            return text.charAt(0).toUpperCase() + text.substring(1)
    }

    #Public API returned
    return {
        Views: Views
        Models: Models
        Collections: Collections
        Charts: Charts
        Deck: Deck

        init: init
        util: util
    }

)()

window.DECKVIZ = DECKVIZ
