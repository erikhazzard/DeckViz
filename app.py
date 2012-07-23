# ==============================================================================
# app.py
#   A backend example for the proto demo.  Will serve up data and static pages
#
# ==============================================================================
import flask
import pymongo 
import redis
import datetime
import json
import re

# ==============================================================================
#
# Setup flask app
#
# ==============================================================================
app = flask.Flask(__name__)
DB_CONNECTION = pymongo.Connection('localhost', 27017)
#use the mtg database
DB = DB_CONNECTION.mtg

redisClient = redis.StrictRedis(host='localhost', port=6379, db=0)
CACHE_PREFIX = 'mtg-viz:'
# ==============================================================================
#
# Static Endpoints
#
# ==============================================================================
#Base render func, everything get passed through here
def render_skeleton(template_name='index.html', **kwargs):
    return flask.render_template(template_name, **kwargs)

@app.route('/')
def index():
    return flask.render_template('index.html')

@app.route('/tests')
def tests():
    return flask.render_template('unit_tests.html')

# ==============================================================================
#
# Retrieve Data
#
# ==============================================================================
def get_items_from_query(query=None):
    #We'll turn the query into a JSON string, then load it to find
    #   objects in the DB
    #Note - this uses the cards DB
    target_db = DB.cards
    sort = None

    #Store key value pairs
    #If no query, get all items (limit and paginate
    if query is None:
        db_items = target_db.find()
    else:
        #A query exists, will be in the form of Key=Value&Key2=Value2
        #   Split on =
        kv_pairs = query.split('&')
        query = {}
        for pair in kv_pairs:
            #If we're looking at a sort key do special logic
            split_pair = pair.split('=')
            cur_key = split_pair[0]

            if cur_key != 'sort': 
                #Use $regex so we can do LIKE type searches
                #   Note: for demo this is fine, in production it'd be slow without
                #   any type of index or optimizations
                #Do regex by default
                query[split_pair[0]] = re.compile(split_pair[1], re.IGNORECASE)
                
            elif cur_key == 'sort':
                #The sort target is the split_pair[1] (the value passed into 
                #   sort)
                sort = split_pair[1]
                sort = sort.split(',')
                sortFinal = []
                #http://stackoverflow.com/questions/4940332/in-mongodb-how-do-i-first-sort-by-score-then-sort-by-time-if-there-is-a-tie
                for item in sort:
                    sortFinal.append([item, pymongo.ASCENDING])
                sort = sortFinal

        #Get the returned DB items
        if sort is None:
            #Don't use sort
            db_items = target_db.find(query)
        else:
            #Sort on the passed in value
            db_items = target_db.find(query).sort(sort)

    return db_items
# ==============================================================================
#
# Endpoints
#
# ==============================================================================
@app.route('/items/')
@app.route('/items/<query>/')
def items(query=None):
    '''Gets items from mongo based on query
    '''
    #Stringify the query to get a cache key
    cache_key = CACHE_PREFIX + json.dumps(query)

    #------------------------------------
    #Try to get from cache
    #------------------------------------
    cache_res = redisClient.get(cache_key)
    #If there's something in the cache, return it
    if cache_res is not None:
        res = json.loads(cache_res) 
        #Return the cached response
        return flask.jsonify(res)

    #------------------------------------
    #Get cards (not in cache)
    #------------------------------------
    #Get the items from the database based on the query (if any)
    db_items = get_items_from_query(query)

    items = [] 
    for item in db_items:
        #Remove the _id since it's returned as an ObjectID object
        del(item['_id'])
        items.append(item)

    #Get the total length
    num_results = len(items)
    
    #Build response
    res = {
        "cards": items, 
        "num_results": num_results
    }

    #Save to cache
    #TODO: SET TTL
    redisClient.set(cache_key, json.dumps(res))

    #Return response
    return flask.jsonify(res)


# ==============================================================================
#
# Run server
#
# ==============================================================================
if __name__ == "__main__":
    app.debug = True
    app.run(port=1337)
