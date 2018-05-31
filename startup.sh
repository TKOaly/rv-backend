#!/bin/bash
if [ $NODE_ENV != "production" ]
then
    yarn start-nodemon
else
    yarn start
fi
