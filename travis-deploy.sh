#!/bin/bash

# Deploy to staging
if [ $TRAVIS_BRANCH = "develop" ] && [ $TRAVIS_PULL_REQUEST = "false" ]
then
    docker build -t rv-backend .
    docker login --username=_ --password=$HEROKU_AUTH_TOKEN registry.heroku.com
    docker tag rv-backend registry.heroku.com/rv-backend-dev/web
    docker push registry.heroku.com/rv-backend-dev/web
fi

# Deploy to production
if [ $TRAVIS_BRANCH = "master" ] && [ $TRAVIS_PULL_REQUEST = "false" ]
then
    docker build -t rv-backend .
    docker login --username=_ --password=$HEROKU_AUTH_TOKEN registry.heroku.com
    docker tag rv-backend registry.heroku.com/rv-backend/web
    docker push registry.heroku.com/rv-backend/web
fi
