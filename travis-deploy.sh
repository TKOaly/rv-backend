#!/bin/bash

# Deploy to staging
if [ $TRAVIS_BRANCH = "develop" ] && [ $TRAVIS_PULL_REQUEST = "false" ]
then
    echo "Building Docker image..."
    docker build -t rv-backend .
    echo "Pushing image to Heroku..."
    docker login --username=_ --password=$HEROKU_AUTH_TOKEN registry.heroku.com
    docker tag rv-backend registry.heroku.com/rv-backend-dev/web
    docker push registry.heroku.com/rv-backend-dev/web
    export HEROKU_API_KEY=$HEROKU_AUTH_TOKEN
    echo "Clearing and reseeding database..."
    heroku run "NODE_ENV=development ./node_modules/knex/bin/cli.js migrate:rollback" -a rv-backend-dev
    heroku run "NODE_ENV=development ./node_modules/knex/bin/cli.js migrate:latest" -a rv-backend-dev
    heroku run "NODE_ENV=development ./node_modules/knex/bin/cli.js seed:run" -a rv-backend-dev
fi

# Deploy to production
if [ $TRAVIS_BRANCH = "master" ] && [ $TRAVIS_PULL_REQUEST = "false" ]
then
    echo "Building Docker image..."
    docker build -t rv-backend .
    echo "Pushing image to Heroku..."
    docker login --username=_ --password=$HEROKU_AUTH_TOKEN registry.heroku.com
    docker tag rv-backend registry.heroku.com/rv-backend/web
    docker push registry.heroku.com/rv-backend/web
fi
