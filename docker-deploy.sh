#!/bin/bash

# Tag as develop
if [ $TRAVIS_BRANCH = "develop" ] && [ $TRAVIS_PULL_REQUEST = "false" ]
then
    echo "Building Docker image..."
    docker build . -t rv-backend
    echo "Pushing image to Docker registry..."
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    docker tag rv-backend tkoaly/rv-backend:latest-dev
    docker push tkoaly/rv-backend:latest-dev
fi

# Tag as latest
if [ $TRAVIS_BRANCH = "master" ] && [ $TRAVIS_PULL_REQUEST = "false" ]
then
    echo "Building Docker image..."
    docker build . -t rv-backend
    echo "Pushing image to Docker registry..."
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    docker tag rv-backend tkoaly/rv-backend:latest
    docker push tkoaly/rv-backend:latest
fi
