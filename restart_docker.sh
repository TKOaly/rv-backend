#!/bin/bash
docker-compose down
docker-compose up -d --build
echo "Restarted RV backend & PostgreSQL server"