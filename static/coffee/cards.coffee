# ===========================================================================
#
# cards.coffee
#
# Contains the view, model, and collection class definitions for the cards
#
# ===========================================================================
# ===========================================================================
#
# VIEW
#
# ===========================================================================
DECKVIZ.Charts.Cards = ()=>
    #Function to generate graph of cards

    width = $('#svg-el').attr('width')
    height = $('#svg-el').attr('height')
   
    #Setup color scale
    color_scale = {
        R: '#ff0000'
        G: '#00ff00'
        B: '#000000'
        U: '#0000ff'
        W: '#D6AC51'
        X: '#707070'
    }

    #Get data
    d3.json('/items/setText=ISD|M13|DKA|AVR&sort=color,manacost/', (data)=>
        #Setup scales
        yscale = d3.scale.linear()
            .domain([0,18]).range([0, height])

        xscale = d3.scale.ordinal()
            .domain(d3.range(data.cards.length))
            .rangeBands([0, width], 0.2)

        #function to calculate total converted mana cost
        manaCost = (cost)->
            #If it has X in it, make it negative
            costNegative = false
            if cost.match(/X/gi)
                costNegative = true

            totalCost = parseInt(cost, 10)
            #use the length or an empty array if the match is none
            #   so it doesn't blow up with an error (can't get length of null)
            totalCost += (cost.match(/[UWBRGX]/gi) || []).length

            if costNegative
                totalCost = totalCost * -1

            return totalCost

        #Create bar for each
        bars = d3.select('#svg-el').selectAll("rect.bars")
        .data(data.cards)
        .enter()
        .append("rect")
        .attr("class", "bars")
        .attr("width", (d, i) =>
            return xscale.rangeBand()
        ).attr("height", (d,i)=>
            return yscale(manaCost(d.manacost || '0'))
        ).attr("fill", (d,i) =>
            return color_scale[d.color || 'X']
        ).attr("transform", (d,i) =>
            tx = xscale(i)
            ty = height - yscale(manaCost(d.manacost || '0'))
            return "translate(" + [tx, ty] + ")"
        )
        .on('mouseover', (d, i) =>
            console.log(d.manacost, d.color, d.name, d.type, d)
        )
    )
    return true
