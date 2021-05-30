#!/bin/sh

# cd to current script directory
scriptdir=$(dirname $0)
cd $scriptdir

docker build -t $DOCKER_USER/jobtracker-postgresstore .
docker system prune -f
