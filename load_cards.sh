#!/bin/bash
#remove existing cards
mongo mtg --eval "db.cards.drop()"
#import cards
mongoimport -d mtg -c cards server/cards.json
