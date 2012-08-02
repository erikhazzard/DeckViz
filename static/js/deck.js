(function() {
  var _this = this;

  DECKVIZ.Deck.getDeckFromInput = function(params) {
    var cardName, cardText, deck, deckArray, deckText, numCards, _i, _len;
    if (!params) return false;
    params = params || {};
    if (params.el) deckText = el.val();
    if (params.deckText) deckText = params.deckText;
    if (!deckText) {
      deckText = '';
      deckArray = false;
    } else {
      deckArray = deckText.split('\n');
    }
    deck = {};
    if (deckArray) {
      for (_i = 0, _len = deckArray.length; _i < _len; _i++) {
        cardText = deckArray[_i];
        numCards = parseInt(cardText.replace(/[^0-9 ]/gi, ''), 10);
        cardName = cardText.replace(/[0-9]+ */gi, '');
        deck[cardName] = numCards;
      }
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
    var barSpacingFactor, barsGroup, calcCC, card, cardCost, cardType, colorGroup, colorStackedData, cost, curManaCost, height, highestCardCount, key, manaBars, manaBarsNumLabel, manaCostArray, manaCostLookup, manaCostLookupArray, maxManaCost, mostNumOfCards, num, padding, svgEl, tickYScale, val, value, width, xScale, yAxis, yAxisGroup, yScale, _i, _len;
    svgEl = d3.select('#svg-el-deck-mana');
    width = svgEl.attr('width');
    height = svgEl.attr('height');
    height = height - 100;
    maxManaCost = 7;
    padding = [0, 0, 0, 50];
    calcCC = DECKVIZ.util.calculateCardManaCost;
    manaCostLookup = {};
    for (_i = 0, _len = deck.length; _i < _len; _i++) {
      card = deck[_i];
      cardCost = calcCC(card.manacost);
      if (manaCostLookup[cardCost]) {
        manaCostLookup[cardCost].total += 1;
      } else {
        manaCostLookup[cardCost] = {};
        manaCostLookup[cardCost].total = 1;
        if (cardCost > maxManaCost) maxManaCost = cardCost;
      }
      manaCostLookup[cardCost].cost = cardCost;
      if (!manaCostLookup[cardCost].type) manaCostLookup[cardCost].type = {};
      if (card.type) {
        cardType = card.type.split(' - ')[0];
        if (manaCostLookup[cardCost].type[cardType]) {
          manaCostLookup[cardCost].type[cardType] += 1;
        } else {
          manaCostLookup[cardCost].type[cardType] = 1;
        }
      }
      curManaCost = card.manacost;
      if (curManaCost) {
        curManaCost = curManaCost.replace(/[^UWBRG]+/gi, '');
        curManaCost = _.unique(curManaCost.split('')).join('');
        if (curManaCost.length > 0) {
          curManaCost = curManaCost;
        } else {
          curManaCost = 'X';
        }
        if (!manaCostLookup[cardCost].color) manaCostLookup[cardCost].color = {};
        if (manaCostLookup[cardCost].color[curManaCost]) {
          manaCostLookup[cardCost].color[curManaCost] += 1;
        } else {
          manaCostLookup[cardCost].color[curManaCost] = 1;
        }
      }
    }
    manaCostLookupArray = [];
    for (key in manaCostLookup) {
      val = manaCostLookup[key];
      manaCostLookupArray.push(val);
    }
    colorStackedData = d3.layout.stack()(['B', 'G', 'R', 'W', 'U', 'X'].map(function(color) {
      var map;
      map = manaCostLookupArray.map(function(d) {
        var xValue, yValue;
        yValue = 0;
        if (d.color && d.color[color]) yValue = d.color[color];
        xValue = d.cost || -1;
        return {
          x: xValue,
          y: yValue,
          color: color
        };
      });
      return map;
    }));
    maxManaCost += 1;
    manaCostArray = [];
    mostNumOfCards = 0;
    for (cost in manaCostLookup) {
      value = manaCostLookup[cost];
      if ((cost != null) && parseInt(cost)) {
        manaCostArray.push([cost, value.total]);
        if (value.total > mostNumOfCards) mostNumOfCards = value.total;
      }
    }
    highestCardCount = 20;
    if (mostNumOfCards > 20) highestCardCount = mostNumOfCards * 1.2;
    'xScale = d3.scale.linear()\n    #Goes from 0 to the highest mana cost\n    .rangeRound([padding[3], width])\n    .domain([0, maxManaCost])\n\nyScale = d3.scale.linear()\n    #Goes from 0 to the highest occurence of cards with that mana cost\n    .rangeRound([padding[0], height])\n    .domain([0, highestCardCount])';
    xScale = d3.scale.linear().rangeRound([padding[3], width]).domain([0, maxManaCost]);
    yScale = d3.scale.linear().rangeRound([padding[0], height]).domain([0, highestCardCount]);
    barsGroup = d3.select('#manaCurve');
    barSpacingFactor = 1.5;
    colorGroup = barsGroup.selectAll("g.color").data(colorStackedData);
    colorGroup.enter().append('svg:g').attr('class', 'color');
    manaBars = colorGroup.selectAll('rect.cardBar').data(function(d) {
      return d;
    });
    manaBars.enter().append('svg:rect').attr("x", function(d) {
      return xScale(d.x);
    }).attr("y", height).attr("height", 0).attr('class', 'cardBar').attr("width", width / (maxManaCost + barSpacingFactor));
    manaBars.exit().transition().duration(300).ease('circle').attr('y', height).attr('height', 0).remove();
    manaBars.transition().duration(250).ease("quad").attr("x", function(d) {
      return xScale(d.x);
    }).attr("y", function(d) {
      return (height - yScale(d.y0)) - yScale(d.y) + padding[0];
    }).attr("height", function(d) {
      if (d.y < 1) {
        return 0;
      } else {
        return yScale(d.y);
      }
    }).attr("width", width / (maxManaCost + barSpacingFactor)).style('fill', function(d) {
      return DECKVIZ.util.colorScale[d.color];
    }).style('stroke', '#343434').style('stroke-width', '1').style('stroke-opacity', .7);
    manaBarsNumLabel = barsGroup.selectAll("text").data(manaCostArray);
    manaBarsNumLabel.enter().append("text").style("fill", '#000000').style('text-shadow', '0 0 1px #ffffff').style('opacity', .3).attr("x", function(d, i) {
      return (xScale(d[0]) - 5) + ((width / (maxManaCost + barSpacingFactor)) / 2);
    }).attr("y", function(d, i) {
      return height;
    });
    manaBarsNumLabel.exit().transition().duration(300).ease('circle').attr('y', height).attr('height', 0).text('0').remove();
    manaBarsNumLabel.transition().duration(250).ease("quad").text(function(d, i) {
      return d[1];
    }).attr("x", function(d, i) {
      return (xScale(d[0]) - 5) + ((width / (maxManaCost + barSpacingFactor)) / 2);
    }).attr("y", function(d, i) {
      return height - yScale(d[1]) - 5;
    });
    svgEl = d3.select('#axesLabels');
    $(svgEl.node()).empty();
    svgEl = svgEl.append('g').attr('class', 'axesGroup');
    svgEl.selectAll("text.label").data((function() {
      var _results;
      _results = [];
      for (num = 0; 0 <= maxManaCost ? num <= maxManaCost : num >= maxManaCost; 0 <= maxManaCost ? num++ : num--) {
        _results.push(num);
      }
      return _results;
    })()).enter().append('svg:text').attr('class', 'label').attr("x", function(d, i) {
      return (xScale(d) - .5) + ((width / (maxManaCost + barSpacingFactor)) / 2);
    }).attr("y", height + 20).text(function(d, i) {
      return d;
    });
    svgEl.append("line").attr("x1", padding[3]).attr("x2", width).attr("y1", height - .5).attr("y2", height - .5).style("stroke", "#000");
    tickYScale = d3.scale.linear().domain([highestCardCount, 0]).range([padding[0], height]);
    yAxis = d3.svg.axis().scale(tickYScale).ticks(9).orient("left");
    yAxisGroup = svgEl.append("g").attr("transform", "translate(" + [padding[3], 0] + ")").classed("yaxis", true).call(yAxis);
    yAxisGroup.selectAll("path").style("fill", "none").style("stroke", "#000");
    yAxisGroup.selectAll("line").style("fill", "none").style("stroke", "#000");
    return true;
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
