var _this = this;

DECKVIZ.util.convertedManaCost = function(cost) {
  var totalCost;
  if (cost === null || cost === void 0) {
    return null;
  } else if (typeof cost === 'number') {
    cost = '' + cost + '';
  }
  cost = cost.replace(/X/gi, '');
  totalCost = parseInt(cost, 10) || 0;
  totalCost += (cost.match(/[UWBRG]/gi) || []).length;
  totalCost -= (cost.match(/\([^pP]\/[^pP]\)/gi) || []).length;
  return totalCost;
};

DECKVIZ.util.colorScale = {
  R: '#ff0000',
  G: '#00ff00',
  B: '#000000',
  U: '#0000ff',
  W: '#D6AC51',
  X: '#707070'
};
