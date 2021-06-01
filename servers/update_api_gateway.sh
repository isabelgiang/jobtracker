#!/bin/bash

docker pull hollowsunsets/api-gateway
docker pull hollowsunsets/postgres

# Remove all containers and stop all running services
docker-compose down

# Restart all containers and start all services again
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
exit 0
