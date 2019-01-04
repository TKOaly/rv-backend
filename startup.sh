#!/bin/bash
if [ $NODE_ENV != "production" ]
then
    npm run start-nodemon
else
    npm start
fi
