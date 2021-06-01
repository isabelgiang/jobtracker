#!/bin/bash

docker pull hollowsunsets/api-gateway
docker pull hollowsunsets/postgres


docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
exit 0
