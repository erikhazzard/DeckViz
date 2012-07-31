var DECKVIZ,
  _this = this;

DECKVIZ = (function() {
  var Charts, Collections, Deck, Models, Views, app, init, util;
  Views = {};
  Models = {};
  Collections = {};
  Charts = {};
  Deck = {};
  app = {};
  init = function() {
    return true;
  };
  util = {
    capitalize: function(text) {
      return text.charAt(0).toUpperCase() + text.substring(1);
    }
  };
  return {
    Views: Views,
    Models: Models,
    Collections: Collections,
    Charts: Charts,
    Deck: Deck,
    init: init,
    util: util
  };
})();

window.DECKVIZ = DECKVIZ;
