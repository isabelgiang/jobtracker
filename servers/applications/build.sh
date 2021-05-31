#!/bin/sh

# cd to current script directory
scriptdir=$(dirname $0)
cd $scriptdir

# TODO: replace with final container name
docker build -t $DOCKER_USER/jobtracker-applications-microservice .
docker system prune -f
