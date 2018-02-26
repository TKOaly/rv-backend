#!/bin/bash

# Deploy to staging
if [ $TRAVIS_BRANCH = "feature/improved-docker" ] && [ $TRAVIS_PULL_REQUEST = "false" ]
then
    echo "Building Docker image..."
    docker build -t rv-backend .
    echo "Pushing image to Heroku..."
    docker login --username=_ --password=$HEROKU_API_KEY registry.heroku.com
    docker tag rv-backend registry.heroku.com/rvbtest/web
    docker push registry.heroku.com/rvbtest/web
    echo "Clearing and reseeding database..."
    heroku run "NODE_ENV=development ./node_modules/knex/bin/cli.js migrate:rollback" -a rvbtest
    heroku run "NODE_ENV=development ./node_modules/knex/bin/cli.js migrate:latest" -a rvbtest
    heroku run "NODE_ENV=development ./node_modules/knex/bin/cli.js seed:run" -a rvbtest
fi

# Deploy to production
if [ $TRAVIS_BRANCH = "master" ] && [ $TRAVIS_PULL_REQUEST = "false" ]
then
    echo "Building Docker image..."
    docker build -t rv-backend .
    echo "Pushing image to Heroku..."
    docker login --username=_ --password=$HEROKU_API_KEY registry.heroku.com
    docker tag rv-backend registry.heroku.com/rv-backend/web
    docker push registry.heroku.com/rv-backend/web
fi
