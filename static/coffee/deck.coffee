# ===========================================================================
#
# deck.coffee
#
# Contains the view, model, and collection class definitions for the deck 
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

    #Split the lines
    deckArray = deckText.split('\n')

    #Setup deck we'll return
    deck = {}

    #For each line in the deck text, add it to the deck object
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
        return false

    #Keep track of how many times a card shows up
    for card in params.deck
        if cardTypes[card.type]?
            cardTypes[card.type] += 1
        else
            cardTypes[card.type] = 0

    #Return it
    return cardTypes

# ===========================================================================
#
# Create deck
#
# ===========================================================================
#Setup deck to change on keyup
$('#deck').on('keyup', (e)=>
    DECKVIZ.Deck.create(DECKVIZ.Deck.getDeckFromInput({deckText: $('#deck').val()}))
)
DECKVIZ.Deck.create = (deck)=>
    #Takes in a deck parameter, which is an array of cards
    if not deck
        #Another test
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
        }
        #Sample deck
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
        }


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
                #add the card X times
                for i in [0..deck[card.name]-1]
                    finalDeck.push(card)

            cardTypes = DECKVIZ.Deck.getCardTypes({deck: finalDeck})
            console.log(JSON.stringify(cardTypes))

            #Setup deck with proper number of cards
            DECKVIZ.Deck.manaCurve(finalDeck, deck)
    })

#========================================
#
#Mana Curve
#
#========================================
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
    for cost, num of manaCostLookup
        costInt = parseInt(cost, 10)
        if costInt
            manaCostArray.push([costInt, num])
            if costInt > mostNumOfCards
                mostNumOfCards = costInt

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
        
    console.log(manaCostArray)
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

#========================================
#
#Card Type Breakdown
#
#========================================
DECKVIZ.Deck.deckPie= (deck, originalDeck)=>
    svgId = '#svg-el-deck-pie'

    $(svgId).empty()

    #get width and height
    width = $(svgId).attr('width')
    height = $(svgId).attr('height')

    svgEl = d3.select(svgId)
    pie = d3.layout.pie

    #Loop through data to get creature types

