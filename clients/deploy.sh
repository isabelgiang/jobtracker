#!/bin/bash

# Login to Docker Hub
docker login

# Tag the Docker image with Docker Hub repository name
docker tag web-client hollowsunsets/web-client

# Push to Docker Hub
docker push hollowsunsets/web-client

echo "Finished deploying web server."

