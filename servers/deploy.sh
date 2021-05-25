#!/bin/sh

# cd to current script directory
scriptdir=$(dirname $0)
cd $scriptdir

# Build containers
db/build.sh
gateway/build.sh
summary/build.sh
messaging/build.sh
messaging/src/database/build.sh

# Deploy docker images to Docker Hub
docker push wills0ng/info441-postgresstore
docker push wills0ng/info441-api-gateway-server
docker push wills0ng/info441-summary-microservice
docker push wills0ng/info441-messaging-microservice
docker push wills0ng/info441-messaging-mongodb

# Set local variables
docker_network=microservices

# Assumes POSTGRES_PASSWORD and SESSIONKEY are hard coded ~/.bashrc on the api server
#   POSTGRES_PASSWORD was originally generated using $(openssl rand -hex 6)
#   SESSION_KEY was originally generated using $(openssl rand -base64 32)
#
# This is done because below we remove and restart all containers
# except data store containers to avoid data loss,
# and we want to avoid the server and DB password environment variables from
# getting out of sync.
# 
# Data store containers need to be manually shut down on the api-server host
# before running this script if we want to redeploy them.
#
# SSH to API server host and execute remote commands
# Host configured in .ssh/config
ssh api-server "
docker system prune -f
docker image prune -f
docker volume prune -f

docker pull wills0ng/info441-postgresstore;
docker pull wills0ng/info441-api-gateway-server;
docker pull wills0ng/info441-summary-microservice;
docker pull wills0ng/info441-messaging-microservice;
docker pull wills0ng/info441-messaging-mongodb;

docker network create $docker_network || true;

docker run -d \
    -e POSTGRES_PASSWORD=\$POSTGRES_PASSWORD \
    --name postgresStore \
    --network $docker_network \
    wills0ng/info441-postgresstore || true;

docker run -d --name redisServer --network $docker_network redis || true;

docker run -d \
    --name mongoContainer \
    --network $docker_network \
    wills0ng/info441-messaging-mongodb || true;


docker rm -f summaryMicroservice || true;
docker run -d --name summaryMicroservice --network $docker_network wills0ng/info441-summary-microservice;

docker rm -f messagingMicroservice || true;
docker run -d \
    -e PORT=80 \
    -e MONGODB_HOST=mongoContainer \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=\$POSTGRES_PASSWORD \
    -e POSTGRES_HOST=postgresStore \
    -e POSTGRES_PORT=5432 \
    -e POSTGRES_DB=postgres \
    --name messagingMicroservice \
    --network $docker_network \
    wills0ng/info441-messaging-microservice;

docker rm -f apiServer || true;
docker run \
    -d \
    -p 443:443 \
    -v /etc/letsencrypt:/usr/share/info441-v1summary-api/letsencrypt:ro \
    -e TLSCERT=/usr/share/info441-v1summary-api/letsencrypt/live/api.awesome-ness.me/fullchain.pem \
    -e TLSKEY=/usr/share/info441-v1summary-api/letsencrypt/live/api.awesome-ness.me/privkey.pem \
    -e REDISADDR=redisServer:6379 \
    -e SESSIONKEY=\$SESSIONKEY \
    -e DSN=postgres://postgres:%s@postgresStore:5432/postgres?sslmode=disable \
    -e POSTGRES_PASSWORD=\$POSTGRES_PASSWORD \
    -e MESSAGESADDR=http://messagingMicroservice \
    -e SUMMARYADDR=http://summaryMicroservice \
    --name apiServer \
    --network $docker_network \
    wills0ng/info441-api-gateway-server;
"