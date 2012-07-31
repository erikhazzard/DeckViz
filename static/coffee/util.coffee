# ===========================================================================
#
# util.js
#
# Sets up util functions for the app
# ===========================================================================
DECKVIZ.util.calculateCardManaCost= (cost)=>
    #This function returns the converted mana cost of a passed in cost string
    #   X is considered 0
    if cost == null || cost == undefined
        return null
    else if typeof cost == 'number'
        #Turn cost to string
        cost = '' + cost + ''
    
    #Ignore X
    cost = cost.replace(/X/gi, '')

    #Get integer from cost
    #   If we can't get a number (if parseInt returns NaN) then use 0
    totalCost = (parseInt(cost, 10) || 0)

    #use the length or an empty array if the match is none
    #   so it doesn't blow up with an error (can't get length of null)
    totalCost += (cost.match(/[UWBRG]/gi) || []).length

    #The above regex would add (B/G) (either / or cost) as 2 instead of 1,
    #   so for each optional casting cost we find we need to subtract the 
    #   total cost by 1 per match (e.g., (B/G) added 2, so we need to
    #   subtract 1 when we match (B/G)) 
    #Ignore P, which is life
    totalCost -= (cost.match(/\([^pP]\/[^pP]\)/gi) || []).length

    return totalCost


#Setup color scale
DECKVIZ.util.colorScale = {
    R: '#ff0000'
    G: '#00ff00'
    B: '#000000'
    U: '#0000ff'
    W: '#D6AC51'
    X: '#707070'
}
