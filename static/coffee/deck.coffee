# ===========================================================================
#
# deck.coffee
#
# Contains the view, model, and collection class definitions for the deck 
# TODO: Colors for life - what color is Birthing Pod(?)
#
# ===========================================================================
DECKVIZ.Deck.getDeckFromInput = (params) =>
    #Get deck from text input
    #Parses a decklist and returns a deck object with Key: Value of CardName:
    #   CardAmount
    #Parameters (either are optional, but at least one must be passed):
    #   el: specify the input element to get the deckText from
    #   deckText: string containing the deck text
    if not params
        return false

    #Setup params
    params = params || {}

    #Get deckText either from passed in element oer passed in deckText
    if params.el
        #Set a defaulty element
        deckText = el.val()
    if params.deckText
        deckText = params.deckText

    #If the deck text is undefined (happens sometimes when an empty string
    #   is passed in) set the dectText to be an empty string
    if !deckText
        deckText = ''
        deckArray = false
    else
        #Split the lines
        deckArray = deckText.split('\n')

    #Setup deck we'll return
    deck = {}

    #For each line in the deck text, add it to the deck object
    if deckArray
        for cardText in deckArray
            #Get the number of cards
            #   Replace any non number or space characters.  Whatever number is
            #   found first will be parsed as the number of times this card is
            #   in the deck. e.g., "10 Forest" will get parsed as 10
            numCards = parseInt(cardText.replace(/[^0-9 ]/gi, ''), 10)

            #Replace the leading number and space with nothing
            #   e.g., "10 Forest" becomes "Forest"
            cardName = cardText.replace(/[0-9]+ */gi, '')

            #update the deck
            deck[cardName] = numCards

    return deck

DECKVIZ.Deck.getCardTypes = (params) =>
    #Get card types (instants, creatures, lands, etc.) from a passed in deck
    #Parses a decklist and returns a deck object with Key: Value of CardName:
    #   CardAmount
    #Parameters 
    #   deck: deck object containing an array of cards
    #Keep track of types
    cardTypes = {}
    params = params || {}
    if not params.deck
        console.log('No deck passed in!')
        return false

    #Keep track of how many times a card shows up
    for card in params.deck
        if cardTypes[card.type]?
            cardTypes[card.type] += 1
        else
            cardTypes[card.type] = 1

    #Return it
    return cardTypes

# ===========================================================================
#
# Create deck
#
# ===========================================================================
#Setup deck to change on keyup
$('#deck').on('keyup', (e)=>
    #Create the mana curve on each keyup
    DECKVIZ.Deck.create(
        DECKVIZ.Deck.getDeckFromInput({deckText: $('#deck').val()}),
        true
    )
)

#TODO: Load decks based on select list
$('#deck').val('''
2 Pillar of Flame
4 Huntmaster of the Fells
2 Kessig Wolf Run
1 Devil's Play
1 Whipflare
2 Green Sun's Zenith
4 Sphere of the Suns
3 Inkmoth Nexus
4 Slagstorm
1 Wurmcoil Engine
2 Galvanic Blast
4 Copperline Gorge
4 Glimmerpost
1 Inferno Titan
4 Primeval Titan
1 Acidic Slime
4 Rootbound Crag
3 Solemn Simulacrum
4 Mountain
5 Forest
4 Rampant Growth
1 Birds of Paradise
''')

DECKVIZ.Deck.create = (deck)=>
    #Takes in a deck parameter, which is an array of cards
    if not deck
        deckText = $('#deck').val()
        #If none specified, create it
        deck = DECKVIZ.Deck.getDeckFromInput({
            deckText: deckText
        })
        #Get a copy
        deckCopy = DECKVIZ.Deck.getDeckFromInput({
            deckText: deckText
        })

    #Construct call to get cards from DB
    #store names of each card, which we'll join by a |
    urlArray = []
    for cardName, num of deck
        urlArray.push('^' + cardName + '$')
 
    #Setup the url with the cards passed in
    url = '/items/name=' + urlArray.join('|')

    #This will be the final deck object, an array of
    #   card objects
    finalDeck = []

    #Make the call
    $.ajax({
        url: url
        success: (res)=>
            #res is the response from the server, which contains an array 
            #   of cards
            
            #For each card returned, append it to the finalDeck X times
            #   where X is the number of items in the deck
            for card in res.cards
                #NOTE: Reprinted cards may come up multiple times in the 
                #   response, so only add cards which were in the original deck 
                #   object
                #
                #To mitgate this, we'll set the value of the current card to -1
                #   after we've found it the first time
                if deck[card.name] > 0
                    #add the card X times
                    for i in [0..deck[card.name]-1]
                        finalDeck.push(card)
                    #Set the value to -1 so thie card isn't counted again
                    deck[card.name] = -1

            cardTypes = DECKVIZ.Deck.getCardTypes({deck: finalDeck})

            #Create the mana curve graph
            DECKVIZ.Deck.drawManaCurve(finalDeck, deck)
    })

#========================================
#
#Mana Curve
#
#========================================
DECKVIZ.Deck.drawManaCurve = (deck, originalDeck)=>
    #Draws the mana curve graph
    #   Redraws the axises each call, and transitions between bars / bar heights
    svgEl = d3.select('#svg-el-deck-mana')
    
    #Add defs - remove if it exists
    $('#svg-defs').remove()
    svgDefs = svgEl.append("svg:defs")
        .attr('id', 'svg-defs')

    #get width and height
    width = svgEl.attr('width')
    height = svgEl.attr('height')
    #Give the height some padding
    height = height - 100

    #chart config
    #Default the max cost to 7
    maxManaCost = 7

    #Padding for graph
    padding = [
        0,
        0,
        0,
        50]
    
    #Store reference to calculateCardManaCost function which calculates the
    #   converted mana cost
    calcCC = DECKVIZ.util.calculateCardManaCost

    #Build a dict of mana costs: number of cards with that cost
    manaCostLookup = {}

    #Keep track of all mana costs, which will be
    #   shown as another dimension in each bar in the graph
    colorCostArray = []

    #This option configures whether or not to scale the area based on
    #   mana cost
    scaleBarWidth = false

    #------------------------------------
    #Copy deck into new array / get null mana cost spells out
    #Setup the manaCostLookup object
    #------------------------------------
    for card in deck
        #Calculate the mana cost for each card
        #   e.g., turn "2BB" into "4"
        cardCost = calcCC(card.manacost)

        #Keep track of how many cards have what mana cost
        #--------------------------------
        if manaCostLookup[cardCost]
            #This key already exists, so add 1 to it
            manaCostLookup[cardCost].total += 1
        else
            #First time we've seen this card, so set it to 1
            manaCostLookup[cardCost] = {}
            manaCostLookup[cardCost].total = 1

            #Update the maxManaCost if we've found a card with a higher
            #   mana cost than the starting maxCost
            if cardCost > maxManaCost
                maxManaCost = cardCost
        
        #Store card cost (it's also the key)
        manaCostLookup[cardCost].cost = cardCost

        #Now we need to do the same for each card type
        #--------------------------------
        #Check card types
        #Make sure type object exists
        if !manaCostLookup[cardCost].type
            manaCostLookup[cardCost].type = {}

        if card.type
            #Get only the first type, not subtypes (for now)
            cardType = card.type.split(' - ')[0]
            if manaCostLookup[cardCost].type[cardType]
                manaCostLookup[cardCost].type[cardType] += 1
            else
                manaCostLookup[cardCost].type[cardType] = 1

        #Do it for each color
        #--------------------------------
        #Card color is defined by the mana cost
        curManaCost = card.manacost

        if curManaCost
            #TODO: Turn this into function, test it, etc
            
            #Get the number of colorless mana
            #   Replace it with C (e.g., (2) becomes CC)
            colorlessCost = parseInt(curManaCost,10)
            tmpCost = ''

            #If there is a colorless cost, keep track of it
            #   and set it up (e.g., CC)
            if colorlessCost > 0
                #Make sure to subtract 1 so we only loop N times
                for i in [0..colorlessCost-1]
                    tmpCost += 'C'

            #Store the colorless cost
            colorlessCost = tmpCost

            #Remove the existing colorcolor cost (in numbers
            curManaCost = curManaCost.replace(/^[0-9]*/,'')
            #Prepend the color cost (as 'C...')
            curManaCost = colorlessCost + curManaCost

            #Add the current mana cost to the colorCostArray
            colorCostArray.push(curManaCost)

            #Make sure the color object exists
            if !manaCostLookup[cardCost].color
                manaCostLookup[cardCost].color = {}

            #Add mana key and count to lookup dict
            #   e.g., "G": 1
            if manaCostLookup[cardCost].color[curManaCost]
                manaCostLookup[cardCost].color[curManaCost] += 1
            else
                manaCostLookup[cardCost].color[curManaCost] = 1

    #------------------------------------
    #Turn manaCostLookup into an array
    #------------------------------------
    manaCostLookupArray = []
    for key, val of manaCostLookup
        manaCostLookupArray.push(
            val
        )

    #Get unique values from colorCostArray (e.g, we want like
    #   ['GR', 'GGR'] but not ['GR', 'GR', 'GR', 'GGR', 'GGR']
    colorCostArray = _.unique(colorCostArray)

    #Get mapping for the stack layout
    #   Note: colorCostArray is an array of all colors and color combinations
    #   for this deck.
    #TODO: figure out why this breaks when no cards
    colorStackedData = d3.layout.stack()(colorCostArray.map((color)=>
        #TODO: TEST THIS

        #Setup up gradients - setup a gradient for each color
        gradient= svgDefs.append("svg:linearGradient")
            .attr("id", "gradient-" + color)

        #TODO: get (X/P) (color OR life (or color))
        #For now, we'll ignore the (X/P) and just do color combos
        curColors = color.split('(')

        #Create a gradient stop point for each color
        curColors = curColors[0].split('')

        i=0
        for c in curColors
            #Beginning stop
            gradient.append("svg:stop")
                .attr("offset", ((100/curColors.length) * i) + '%')
                .attr("stop-color", DECKVIZ.util.colorScale[c])
                .attr("stop-opacity", 1)
            #End stop (so we get a solid color, no fade
            gradient.append("svg:stop")
                #note - subtract 1 % from the stop so we get a smoother 
                #   transition
                .attr("offset", ((100/curColors.length) * (i+1) - 1) + '%')
                .attr("stop-color", DECKVIZ.util.colorScale[c])
                .attr("stop-opacity", 1)
            #increment counter
            i++
        
        #Use .map to setup the array
        map = manaCostLookupArray.map((d)=>
            #Make default value 0
            yValue = 0

            #Get the yValue from the color dict.  If it doesn't exist, it's 0
            #   (from above)
            if d.color and d.color[color]
                #Get the FIRST color, because we may have multicolors
                #If we do, add it to multiColor
                yValue = d.color[color]

            #Get the xValue (the cost)
            xValue = d.cost || -1
            
            #Return the dict containing an X and Y
            return {
                x: xValue
                y: yValue
                color: color
            }
        )
        return map
    ))

    #------------------------------------
    #Setup the data object used by the bars
    #------------------------------------
    #Add one to whatever the max mana cost was
    maxManaCost += 1
    #turn manaCostLookup into array
    manaCostArray = []
    mostNumOfCards = 0

    #Setup array to have [cost, number of cards]
    #Determine the most number of cards a mana cost has 
    #   and keep reference to it
    #This is used to setup the y scale
    for cost, value of manaCostLookup
        if cost? and parseInt(cost)
            manaCostArray.push([cost, value.total])
            if value.total > mostNumOfCards
                mostNumOfCards = value.total

    #------------------------------------
    #Final config
    #------------------------------------
    #Highest number mana will go to
    highestCardCount = 20
    if mostNumOfCards > 20
        highestCardCount = mostNumOfCards * 1.15

    #------------------------------------
    #SCALES - Group by color
    #Setup x and y scales
    #------------------------------------
    xScale = d3.scale.linear()
        #Use rangeRound since we want exact integers
        .rangeRound([padding[3], width])
        .domain([0, maxManaCost])

    yScale = d3.scale.linear()
        #Use rangeRound since we want exact integers
        .rangeRound([0, height])
        .domain([0, highestCardCount])

    #------------------------------------
    #Setup Mana bars
    #------------------------------------
    #Get the barsGroup which will contain the graph
    barsGroup = d3.select('#manaCurve')

    #Space between each bar
    barSpacingFactor = 1.5

    #Setup manaBar group
    colorGroup = barsGroup
        .selectAll("g.color")
        .data(colorStackedData)

    #Create a group for each item
    colorGroup.enter()
        .append('svg:g')
        .attr('class', 'color')

    #Remove groups we don't need
    colorGroup.exit()
        .remove()

    #Create selection for rects which represent each bar
    manaBars = colorGroup.selectAll('rect.cardBar')
        .data((d) =>
            return d
        )

    #Add each element
    manaBars.enter()
        .append('svg:rect')
            .attr("x", (d) =>
                return xScale(d.x)
            )
            .attr("y", height)
            .attr("height", 0)
            .attr('class', 'cardBar')
            .attr("width", width/(maxManaCost + barSpacingFactor))

    #Exit elements / cleanup
    manaBars.exit()
        .transition()
        .duration(300)
        .ease('circle')
            #Fade the items down
            .attr('y', height)
            .attr('height', 0)
            .remove()

    #Update each bar position
    #   Store a ref to all the transitioned states
    #   so we can style them later
    targetBars = manaBars.transition()
        .duration(250)
        .ease("quad")
            .attr("x", (d) =>
                return xScale(d.x)
            ).attr("y", (d) =>
                return (height - yScale(d.y0)) - yScale(d.y)
            ).attr("height", (d)=>
                #Don't give it a height if d.y is 0
                #   which means there are no cards for that color
                if d.y < 1
                    return 0
                else
                    return yScale(d.y)
            ).attr("width", (d)=>
                return width/(maxManaCost + barSpacingFactor)
            )

    #Stlye the bars based on some properties
    targetBars.style({
        'stroke': '#000000'
        'stroke-width': '1'
        'stroke-opacity': .7
        #'filter': "url(#filter4066)"
        'fill': (d)=>
            return 'url(#gradient-' + d.color + ')'
    })
    #------------------------------------
    #Labels for num of cards
    #------------------------------------
    manaBarsNumLabel = barsGroup
        .selectAll("text")
        .data(manaCostArray)

    #Enter each data element
    manaBarsNumLabel.enter()
        .append("text")
        .style("fill", '#000000')
        .style('text-shadow', '0 0 1px #ffffff')
        .style('opacity', .3)
        .attr("x", (d,i)=>
            return (xScale(d[0]) - 5) + ((width/(maxManaCost + barSpacingFactor))/2)
        )
        .attr("y", (d,i) =>
            #Make the label sit on top of the bar
            return height
        )

    #Remove the labels
    manaBarsNumLabel.exit()
        .transition()
        .duration(300)
        .ease('circle')
            #Fade the items down
            .attr('y', height)
            .attr('height', 0)
            .text('0')
            .remove()

    #Update the label position
    manaBarsNumLabel.transition()
        .duration(250)
        .ease("quad")
        .text((d,i)=>
            return d[1]
        )
        .attr("x", (d,i)=>
            return (xScale(d[0]) - 5) + ((width/(maxManaCost + barSpacingFactor))/2)
        )
        .attr("y", (d,i) =>
            #Make the label sit on top of the bar
            return height - yScale(d[1]) - 5
        )

    #------------------------------------
    #Add bottom labels for mana cost
    #------------------------------------
    svgEl = d3.select('#axesLabels')
    #Clear out existing labels / axes
    $(svgEl.node()).empty()

    svgEl = svgEl.append('g')
        .attr('class', 'axesGroup')

    svgEl.selectAll("text.label")
        .data(num for num in [0..maxManaCost-1])
        .enter()
        .append('svg:text')
            .attr('class', 'label')
            .attr("x", (d,i)=>
                return (xScale(d) - .5) + ((width/(maxManaCost + barSpacingFactor))/2)
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
    #y axis (on left side)
    #------------------------------------
    tickYScale = d3.scale.linear()
        #Goes from highest occurence of cards with that mana cost to 0
        .domain([highestCardCount,0])
        .range([0, height])

    #Create axis for ticks
    yAxisTicks = d3.svg.axis()
        .scale(tickYScale)
        .ticks(10)
        .orient("left")
        #give it a tick size to make it go across the graph
        .tickSize(-width)

    #Create axis for lines that go across the graph
    yAxisHorizontalLines = d3.svg.axis()
        .scale(tickYScale)
        #Make there always be ticks equal to the number of cards
        .ticks(highestCardCount)
        .orient("left")
        #give it a tick size to make it go across the graph
        .tickSize(-width)

    #Add groups
    yAxisGroup = svgEl.append("g")
        .attr("transform", "translate(" + [padding[3], 0] + ")")
        .classed("yaxis", true)
        .call(yAxisTicks)
    yAxisGroup.selectAll("path")
        .style("fill", "none")
        .style("stroke", "#000000")
    yAxisGroup.selectAll("line")
        .style("fill", "none")
        .style("stroke", "#404040")
        .style('stroke-width', 1)
        #Note: the horizontal lines stack on each other, so we'll get
        #   a slightly darker line for each of the ticks in this group
        .style("opacity", .4)

    #Shows a line at each tick mark across the graph
    yAxisHorizontalLines = svgEl.append("g")
        .attr("transform", "translate(" + [padding[3], 0] + ")")
        .classed("yaxis", true)
        .call(yAxisHorizontalLines)
    yAxisHorizontalLines.selectAll("path")
        .style("fill", "none")
        .style("stroke", "#000000")
    #Don't show text labels
    yAxisHorizontalLines.selectAll("text")
        .style("fill", "none")
        .style("opacity", 0)
    yAxisHorizontalLines.selectAll("line")
        .style("fill", "none")
        .style("stroke", "#404040")
        .style('stroke-width', 1)
        .style("opacity", .4)

    #------------------------------------
    #Move the graph down a bit so things aren't cut off
    #------------------------------------
    manaCurveVizWrapper = d3.select('#manaCurveViz')
    if not manaCurveVizWrapper.attr('transform')
        manaCurveVizWrapper.attr('transform', 'translate(0,30)')

    return true

#========================================
#
#Card Type Breakdown
#
#========================================
DECKVIZ.Deck.deckPie = (deck, originalDeck)=>
    svgId = '#svg-el-deck-pie'

    $(svgId).empty()

    #get width and height
    width = $(svgId).attr('width')
    height = $(svgId).attr('height')

    svgEl = d3.select(svgId)
    pie = d3.layout.pie

    #Loop through data to get creature types

