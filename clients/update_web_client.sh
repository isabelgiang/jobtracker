#!/bin/bash

export HOSTNAME="jobtracker.fyi"
export TLSCERT="/etc/letsencrypt/live/$HOSTNAME/fullchain.pem"
export TLSKEY="/etc/letsencrypt/live/$HOSTNAME/privkey.pem"

# Login to DockerHub
docker login

# Pull the latest version of the web server
docker pull hollowsunsets/web-client

# If Docker container is already running, kill it
if [[ $(docker inspect --format '{(json .State.Running}}' web-client-container) ]]; then
    echo "Stopping previous Docker container for web server..."
    docker rm -f web-client-container    
fi

# Start detached Docker container
echo "Starting detached Docker container for web server..."
container_id=$(docker run -e ADDR=":443" \
    -e TLSKEY=$TLSKEY \
    -e TLSCERT=$TLSCERT \
    -d \
    -p 80:80 \
    -p 443:443 \
    --name web-client-container \
    -v /etc/letsencrypt:/etc/letsencrypt:ro \
    hollowsunsets/web-client)


# Check if Docker container is running
docker logs "${container_id}"
