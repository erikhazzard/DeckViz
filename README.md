# DeckViz 
Magic: The Gathering Deck visualization tool.  Visualizing MTG to help you make informed deck decision.

## Dependencies
Python, PIP, Mongo (used to filter / show data)
(Optional) - Node, NPM ( Node package manager - http://npmjs.org/ ) - used to compile Less and minify JS

## Getting Started
-----------------------------------------
Requirements: Python - PIP and Mongo
Included in this repo are the built files, so to get up and running simply make the files accessible via a server. 
A virtualenvironment and dependencies via PIP are included.  
(If you do not have PIP installed, use `easy_install pip`

Setup the local server (sets up virtualenv and flask and other dependencies)
* To setup PIP, 
		`sudo easy_install pip`
		or (if using debian based distro)
		`apt-get install python-pip`
		or (from source) 
		http://pypi.python.org/pypi/pip#downloads	

* Setup python requirements (will install Flask (simple HTTP server and pymongo (used to talk with mongo))
	`./server/install_local_server.sh`
		(Run as sudo if permissions are problematic)

* Download Mongo (used for data backend / querying)
	-http://www.mongodb.org/downloads
	(Any version greater than 2.0)

* To update the card json file that is read into mongo, put a cockatrice generated cards.xml file (~/Library/Application Support/Cockatrice/Cockatrice/cards.xml) in the server directory and the run 
    `python server/convert_cards_to_json.py`
    This generates a .json file which mongo will read in

* Run `mongod` and either create a `/data/db/` directory or create a folder (e.g., named datadb) in the bin folder (or anywhere) and pass in that folder's path as a param to dbpath., e.g.,
	`./mongod --dbpath=datadb/`

	(This assumes you are running the mongod executable from the bin folder from the mongo download, and created a datadb folder inside the bin folder)


* Get data into mongo

	-If you have mongo installed globally (e.g., through synaptic), you can run `make mongo` from this project's folder. If not, you just need to call the `mongoimport` binary and pass in the paramters:
	(Note: run this from the project's root directory):

	`mongoimport -d mtg -c cards server/cards.json`
    You can also run the following which will do the above command
    `./load_cards.sh`

	Where mongoimport is the binary file - e.g., if you downloaded mongo to ~/Downloads the command would look like:
		`~/Downloads/mongodb-linux-i686-2.0.6/bin/mongoimport -d mtg -c cards server/cards.json`

* Run the server
	./start_server.sh

* The site can be accessed via port 1337; go to http://localhost:1337


## Building
If you'd like to build the source, [NodeJS](http://nodejs.org) and [npm](http://npmjs.org/) is used.
Note - this step is optional, as the CSS and JS files are included 
The dependencies for Node are listed in package.json. To build:
* Install NodeJS
* Install NPM
* In this project's directory, run `npm install -d`
* Make the third party files in this project's directory, run `make third`
* Make everything, run `make`
* All done
