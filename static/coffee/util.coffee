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
    R: '#E33939'
    G: '#78dd60'
    B: '#404040'
    U: '#5d9cdd'
    W: '#fffacf'
    X: '#aaaaaa'
}

#----------------------------------------
#Setup all colors
#----------------------------------------
#Set when createColorArray is called (in init)
DECKVIZ.util.colorArray = {}

DECKVIZ.util.createColorArray = ()=>
    #We want to keep track of every color combination, since each color combo
    #   is a unique bar we want to show
    startingColors = [ 'B','G','R','W','U','X']

    #Create new array which we'll use to setup all the colors for
    colorArray = _.clone(startingColors)

    #Generate all colors
    #   This should be done programatically
    #Two colors
    colorArray.push(
        'BG', 'BR', 'BW', 'BU',
        'GR', 'GW', 'GU',
        'RW', 'RU',
        'WU'
    )

    #Three colors
    colorArray.push(
        'BGR', 'BGW', 'BGU', 'BRW', 'BRU',
        'GRW', 'GRU', 'GWU',
        'RWU'
    )

    #Four colors
    colorArray.push(
        'BGRW', 'BGRU',
        'GRWU',
        'RWUB'
    )

    #All colors
    colorArray.push('BGRWU')
    console.log(colorArray)

    return colorArray
