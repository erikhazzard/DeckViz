var _this = this;

DECKVIZ.Deck.getDeckFromInput = function(params) {
  var cardName, cardText, deck, deckArray, deckText, numCards, _i, _len;
  if (!params) return false;
  params = params || {};
  if (params.el) deckText = el.val();
  if (params.deckText) deckText = params.deckText;
  console.log(deckText);
  deckArray = deckText.split('\n');
  deck = {};
  for (_i = 0, _len = deckArray.length; _i < _len; _i++) {
    cardText = deckArray[_i];
    numCards = parseInt(cardText.replace(/[^0-9 ]/gi, ''), 10);
    cardName = cardText.replace(/[0-9]+ */gi, '');
    deck[cardName] = numCards;
  }
  return deck;
};

$('#deck').on('keyup', function(e) {
  return DECKVIZ.Deck.create(DECKVIZ.Deck.getDeckFromInput({
    deckText: $('#deck').val()
  }));
});

DECKVIZ.Deck.create = function(deck) {
  var cardName, finalDeck, num, url, urlArray;
  if (!deck) {
    deck = {
      "Tamiyo, the Moon Sage": 2,
      "Entreat the Angels": 3,
      "Terminus": 4,
      "Lingering Souls": 4,
      "Isolated Chapel": 1,
      "Spellskite": 1,
      "Dismember": 3,
      "Pristine Talisman": 4,
      "White Sun's Zenith": 1,
      "Seachrome Coast": 4,
      "Gideon Jura": 3,
      "Day of Judgment": 2,
      "Glacial Fortress": 4,
      "Drowned Catacomb": 4,
      "Oblivion Ring": 3,
      "Think Twice": 4,
      "Ghost Quarter": 4,
      "Swamp": 1,
      "Island": 3,
      "Plains": 5
    };
    deck = {
      "Mutilate": 4,
      "Liliana's Shade": 3,
      "Murder": 3,
      "Killing Wave": 4,
      "Demonic Taskmaster": 3,
      "Swamp": 23,
      "Nefarox, Overlord of Grixis": 2,
      "Homicidal Seclusion": 2,
      "Duress": 4,
      "Appetite for Brains": 3,
      "Death Wind": 4,
      "Shimian Specter": 2,
      "Essence Harvest": 3
    };
  }
  urlArray = [];
  for (cardName in deck) {
    num = deck[cardName];
    urlArray.push('^' + cardName + '$');
  }
  url = '/items/name=' + urlArray.join('|');
  finalDeck = [];
  return $.ajax({
    url: url,
    success: function(res) {
      var card, i, _i, _len, _ref, _ref2;
      _ref = res.cards;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        for (i = 0, _ref2 = deck[card.name] - 1; 0 <= _ref2 ? i <= _ref2 : i >= _ref2; 0 <= _ref2 ? i++ : i--) {
          finalDeck.push(card);
        }
      }
      return DECKVIZ.Deck.manaCurve(finalDeck, deck);
    }
  });
};

DECKVIZ.Deck.manaCurve = function(deck, originalDeck) {
  var calcCC, card, chart, completeDeck, cost, costInt, height, manaCostArray, manaCostLookup, num, originalHeight, tmpDeck, width, xScale, yScale, _i, _len;
  $('#svg-el').empty();
  width = $('#svg-el').attr('width');
  height = $('#svg-el').attr('height');
  calcCC = DECKVIZ.util.convertedManaCost;
  manaCostLookup = {};
  tmpDeck = [];
  for (_i = 0, _len = deck.length; _i < _len; _i++) {
    card = deck[_i];
    if (manaCostLookup[calcCC(card.manacost)]) {
      manaCostLookup[calcCC(card.manacost)] += 1;
    } else {
      manaCostLookup[calcCC(card.manacost)] = 1;
    }
    if (card.manacost) tmpDeck.push(card);
  }
  completeDeck = _.clone(deck);
  deck = tmpDeck;
  manaCostArray = [];
  for (cost in manaCostLookup) {
    num = manaCostLookup[cost];
    costInt = parseInt(cost, 10);
    if (costInt) manaCostArray.push([costInt, num]);
  }
  xScale = d3.scale.linear().domain([0, 9]).range([0, width]);
  originalHeight = height;
  height = height - 100;
  yScale = d3.scale.linear().domain([0, 60]).rangeRound([0, height]);
  chart = d3.select('#svg-el').selectAll("rect").data(manaCostArray).enter();
  chart.append("rect").attr("x", function(d, i) {
    return xScale(d[0]) - .5;
  }).attr("y", function(d) {
    cost = calcCC(d.manacost);
    return height - yScale(d[1]) - .5;
  }).attr("width", function(d, i) {
    return width / (manaCostArray.length * 2);
  }).attr("height", function(d) {
    cost = calcCC(d.manacost);
    return yScale(d[1]) - .5;
  }).style("fill", function(d, i) {
    return DECKVIZ.util.colorScale['X'];
  });
  chart.append("text").attr("x", function(d, i) {
    return (xScale(d[0]) - .5) + (width / (manaCostArray.length * 2) / 2);
  }).attr("y", height + 20).text(function(d, i) {
    return d[0];
  });
  d3.select('#svg-el').append("line").attr("x1", 0).attr("x2", width).attr("y1", height - .5).attr("y2", height - .5).style("stroke", "#000");
  return true;
};
