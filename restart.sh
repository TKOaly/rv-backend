#!/bin/bash
docker-compose down
docker-compose build
docker-compose up -d db
docker-compose up -d rv-backend
echo "Restarted docker"