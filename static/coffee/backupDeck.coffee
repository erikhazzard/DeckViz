DECKVIZ.Deck.manaCurve = (deck, originalDeck)=>
    svgId = '#svg-el-deck-mana'

    $(svgId).empty()

    #get width and height
    width = $(svgId).attr('width')
    height = $(svgId).attr('height')

    #chart config
    maxManaCost = 10

    #Padding for graph
    padding = [
        10,
        0,
        0,
        50]
    
    #Store reference to convertedManaCost function which calculates the
    #   converted mana cost
    calcCC = DECKVIZ.util.convertedManaCost

    #Build a dict of mana costs: number of cards with that cost
    manaCostLookup = {}

    tmpDeck = []

    #Copy deck into new array / get null mana cost spells out
    for card in deck
        if manaCostLookup[calcCC(card.manacost)]
            manaCostLookup[calcCC(card.manacost)] += 1
        else
            manaCostLookup[calcCC(card.manacost)] = 1
        if card.manacost
            tmpDeck.push(card)
    
    #Store original deck with lands
    completeDeck = _.clone(deck)

    #reassign deck, point to the original deck that contains cards
    #   which have null manacost (e.g., land)
    deck = tmpDeck

    #turn manaCostLookup into array
    manaCostArray = []
    mostNumOfCards = 0
    
    #Setup array to have [cost, number of cards]
    #Determine the most number of cards and keep reference to it
    for cost, num of manaCostLookup
        if cost? and parseInt(cost)
            manaCostArray.push([cost, num])
            if num > mostNumOfCards
                mostNumOfCards = num

    #Create a bar chart for mana curve
    xScale = d3.scale.linear()
        #Goes from 0 to the highest mana cost
        .domain([0, maxManaCost])
        .range([padding[3], width])

    originalHeight = height
    height = height - 100

    #Highest number mana will go to
    highestCardCount = 20
    if mostNumOfCards > 20
        highestCardCount = mostNumOfCards * 1.2

    yScale = d3.scale.linear()
        #Goes from 0 to the highest occurence of cards with that mana cost
        .domain([0, highestCardCount])
        .rangeRound([padding[0], height])

    svgEl = d3.select(svgId)

    chart = svgEl
        .selectAll("rect")
        .data(manaCostArray)
        .enter()
        
    #------------------------------------
    #Add the bars for the mana curve
    #------------------------------------
    chart.append("rect")
        .attr("x", (d, i) =>
            return xScale(d[0]) - .5
        )
        .attr("width", (d,i)=>
            return width/(maxManaCost+2)
        )
        .style("fill", (d,i) =>
            return DECKVIZ.util.colorScale['X']
        )
        .attr("y", (d) =>
            return height
        )
        .attr("height", (d)=>
            return 0
        )
        .transition()
            .attr('height', (d)=>
                return yScale(d[1]) - .5
            )
            .attr('y', (d)=>
                return height - yScale(d[1]) - .5
            )
    
    #Labels for num of cards
    chart.append('text')
        .text((d,i)=>
            return d[1]
        )
        .attr("x", (d,i)=>
            return (xScale(d[0]) - 5) + ((width/(maxManaCost+2))/2)
        ).attr("y", height - 15)
        .style('fill', '#ffffff')
        .style('text-shadow', '0 -1px 2px #000000')

    #------------------------------------
    #Add bottom labels
    #------------------------------------
    svgEl.selectAll("text.label")
        .data(num for num in [0..maxManaCost])
        .enter()
        .append('svg:text')
            .attr('class', 'label')
            .attr("x", (d,i)=>
                return (xScale(d) - .5) + ((width/(maxManaCost+2))/2)
            ).attr("y", height + 20)
            .text((d,i)=>
                return d
            )

    #------------------------------------
    #bottom x axis
    #------------------------------------
    svgEl.append("line")
        .attr("x1", padding[3])
        .attr("x2", width)
        .attr("y1", height - .5)
        .attr("y2", height - .5)
        .style("stroke", "#000")

    #------------------------------------
    #left y axis
    #------------------------------------
    tickYScale= d3.scale.linear()
        #Goes from 0 to the highest occurence of cards with that mana cost
        .domain([highestCardCount,0])
        .rangeRound([padding[0], height])

    yAxis = d3.svg.axis()
        .scale(tickYScale)
        .ticks(9)
        .orient("left")

    yAxisGroup = svgEl.append("g")
        .attr("transform", "translate(" + [padding[3], 0] + ")")
        .classed("yaxis", true)
        .call(yAxis)
    yAxisGroup.selectAll("path")
        .style("fill", "none")
        .style("stroke", "#000")
    yAxisGroup.selectAll("line")
        .style("fill", "none")
        .style("stroke", "#000")

    return true
