(function() {
  var _this = this;

  DECKVIZ.Deck.getDeckFromInput = function(params) {
    var cardName, cardText, deck, deckArray, deckText, numCards, _i, _len;
    if (!params) return false;
    params = params || {};
    if (params.el) deckText = el.val();
    if (params.deckText) deckText = params.deckText;
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

  DECKVIZ.Deck.getCardTypes = function(params) {
    var card, cardTypes, _i, _len, _ref;
    cardTypes = {};
    params = params || {};
    if (!params.deck) {
      console.log('No deck passed in!');
      return false;
    }
    _ref = params.deck;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      card = _ref[_i];
      if (cardTypes[card.type] != null) {
        cardTypes[card.type] += 1;
      } else {
        cardTypes[card.type] = 1;
      }
    }
    return cardTypes;
  };

  $('#deck').on('keyup', function(e) {
    return DECKVIZ.Deck.create(DECKVIZ.Deck.getDeckFromInput({
      deckText: $('#deck').val()
    }), true);
  });

  $('#deck').val('2 Tamiyo, the Moon Sage\n3 Entreat the Angels\n4 Terminus\n4 Lingering Souls\n1 Isolated Chapel\n1 Spellskite\n3 Dismember\n4 Pristine Talisman\n1 White Sun\'s Zenith\n4 Seachrome Coast\n3 Gideon Jura\n2 Day of Judgment\n4 Glacial Fortress\n4 Drowned Catacomb\n3 Oblivion Ring\n4 Think Twice\n4 Ghost Quarter\n1 Swamp\n3 Island\n5 Plains');

  DECKVIZ.Deck.create = function(deck) {
    var cardName, deckCopy, deckText, finalDeck, num, url, urlArray;
    if (!deck) {
      deckText = $('#deck').val();
      deck = DECKVIZ.Deck.getDeckFromInput({
        deckText: deckText
      });
      deckCopy = DECKVIZ.Deck.getDeckFromInput({
        deckText: deckText
      });
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
        var card, cardTypes, i, _i, _len, _ref, _ref2;
        _ref = res.cards;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          card = _ref[_i];
          if (deck[card.name] > 0) {
            for (i = 0, _ref2 = deck[card.name] - 1; 0 <= _ref2 ? i <= _ref2 : i >= _ref2; 0 <= _ref2 ? i++ : i--) {
              finalDeck.push(card);
            }
            deck[card.name] = -1;
          }
        }
        cardTypes = DECKVIZ.Deck.getCardTypes({
          deck: finalDeck
        });
        return DECKVIZ.Deck.drawManaCurve(finalDeck, deck);
      }
    });
  };

  DECKVIZ.Deck.drawManaCurve = function(deck, originalDeck) {
    var calcCC, card, chart, completeDeck, cost, height, highestCardCount, manaCostArray, manaCostLookup, maxManaCost, mostNumOfCards, num, originalHeight, padding, svgEl, tickYScale, tmpDeck, width, xScale, yAxis, yAxisGroup, yScale, _i, _len;
    svgEl = d3.select('#svg-el-deck-mana');
    width = svgEl.attr('width');
    height = svgEl.attr('height');
    maxManaCost = 10;
    padding = [10, 0, 0, 50];
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
    mostNumOfCards = 0;
    for (cost in manaCostLookup) {
      num = manaCostLookup[cost];
      if ((cost != null) && parseInt(cost)) {
        manaCostArray.push([cost, num]);
        if (num > mostNumOfCards) mostNumOfCards = num;
      }
    }
    xScale = d3.scale.linear().domain([0, maxManaCost]).range([padding[3], width]);
    originalHeight = height;
    height = height - 100;
    highestCardCount = 20;
    if (mostNumOfCards > 20) highestCardCount = mostNumOfCards * 1.2;
    yScale = d3.scale.linear().domain([0, highestCardCount]).rangeRound([padding[0], height]);
    svgEl = d3.select('#manaCurve');
    chart = svgEl.selectAll("rect").data(manaCostArray);
    chart.enter().append("rect").attr("x", function(d, i) {
      return xScale(d[0]) - .5;
    }).attr("width", function(d, i) {
      return width / (maxManaCost + 2);
    }).style("fill", function(d, i) {
      return DECKVIZ.util.colorScale['X'];
    }).attr('height', function(d) {
      return 0;
    }).attr('y', function(d) {
      return height;
    });
    chart.exit().transition().duration(300).ease('circle').attr('height', 0).remove();
    chart.transition().duration(300).ease("quad").attr("width", function(d, i) {
      return width / (maxManaCost + 2);
    }).attr('y', function(d, i) {
      return height - yScale(d[1]) - .5;
    }).attr('x', function(d, i) {
      return xScale(d[0]) - .5;
    }).attr("height", function(d, i) {
      return yScale(d[1]) - .5;
    });
    'chart.append(\'text\')\n    .text((d,i)=>\n        return d[1]\n    )\n    .attr("x", (d,i)=>\n        return (xScale(d[0]) - 5) + ((width/(maxManaCost+2))/2)\n    ).attr("y", height - 15)\n    .style(\'fill\', \'#ffffff\')\n    .style(\'text-shadow\', \'0 -1px 2px #000000\')';
    svgEl = d3.select('#axesLabels');
    $(svgEl.node()).empty();
    svgEl.selectAll("text.label").data((function() {
      var _results;
      _results = [];
      for (num = 0; 0 <= maxManaCost ? num <= maxManaCost : num >= maxManaCost; 0 <= maxManaCost ? num++ : num--) {
        _results.push(num);
      }
      return _results;
    })()).enter().append('svg:text').attr('class', 'label').attr("x", function(d, i) {
      return (xScale(d) - .5) + ((width / (maxManaCost + 2)) / 2);
    }).attr("y", height + 20).text(function(d, i) {
      return d;
    });
    svgEl.append("line").attr("x1", padding[3]).attr("x2", width).attr("y1", height - .5).attr("y2", height - .5).style("stroke", "#000");
    tickYScale = d3.scale.linear().domain([highestCardCount, 0]).rangeRound([padding[0], height]);
    yAxis = d3.svg.axis().scale(tickYScale).ticks(9).orient("left");
    yAxisGroup = svgEl.append("g").attr("transform", "translate(" + [padding[3], 0] + ")").classed("yaxis", true).call(yAxis);
    yAxisGroup.selectAll("path").style("fill", "none").style("stroke", "#000");
    yAxisGroup.selectAll("line").style("fill", "none").style("stroke", "#000");
    return true;
  };

  DECKVIZ.Deck.updateManaCurve = function(deck, originalDeck) {
    var calcCC, card, chart, completeDeck, cost, height, highestCardCount, manaCostArray, manaCostLookup, maxManaCost, mostNumOfCards, num, originalHeight, padding, svgEl, svgId, tmpDeck, width, xScale, yScale, _i, _len;
    svgId = '#svg-el-deck-mana';
    width = $(svgId).attr('width');
    height = $(svgId).attr('height');
    maxManaCost = 10;
    padding = [10, 0, 0, 50];
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
    mostNumOfCards = 0;
    for (cost in manaCostLookup) {
      num = manaCostLookup[cost];
      if ((cost != null) && parseInt(cost)) {
        manaCostArray.push([cost, num]);
        if (num > mostNumOfCards) mostNumOfCards = num;
      }
    }
    xScale = d3.scale.linear().domain([0, maxManaCost]).range([padding[3], width]);
    originalHeight = height;
    height = height - 100;
    highestCardCount = 20;
    if (mostNumOfCards > 20) highestCardCount = mostNumOfCards * 1.2;
    yScale = d3.scale.linear().domain([0, highestCardCount]).rangeRound([padding[0], height]);
    svgEl = d3.select(svgId);
    return chart = svgEl.selectAll("rect").data(manaCostArray).transition().attr("x", function(d, i) {
      return xScale(d[0]) - .5;
    }).attr("width", function(d, i) {
      return width / (maxManaCost + 2);
    }).style("fill", function(d, i) {
      return DECKVIZ.util.colorScale['X'];
    }).attr('height', function(d) {
      return yScale(d[1]) - .5;
    }).attr('y', function(d) {
      return height - yScale(d[1]) - .5;
    });
  };

  DECKVIZ.Deck.deckPie = function(deck, originalDeck) {
    var height, pie, svgEl, svgId, width;
    svgId = '#svg-el-deck-pie';
    $(svgId).empty();
    width = $(svgId).attr('width');
    height = $(svgId).attr('height');
    svgEl = d3.select(svgId);
    return pie = d3.layout.pie;
  };

}).call(this);
