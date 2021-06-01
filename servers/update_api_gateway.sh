#!/bin/bash

# Pull down the most recent versions of all containers
docker-compose pull

# Restart oudated running containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
exit 0
