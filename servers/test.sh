#!/bin/sh

# cd to current script directory
scriptdir=$(dirname $0)
cd $scriptdir

# Build containers
db/build.sh
gateway/build.sh
summary/build.sh

# Set local variables
postgres_password=$(openssl rand -hex 6)
sessionkey=$(openssl rand -base64 32)
docker_network=microservices
selfsigned_tlscert=/Users/willsong/go/src/assignments-wills0ng/servers/gateway/fullchain.pem
selfsigned_tlskey=/Users/willsong/go/src/assignments-wills0ng/servers/gateway/privkey.pem

docker network create $docker_network || true;

docker rm -f postgresStore || true;
docker run -d \
    -e POSTGRES_PASSWORD=$postgres_password \
    --name postgresStore \
    --network $docker_network \
    wills0ng/info441-postgresstore;

docker rm -f redisServer || true;
docker run -d --name redisServer --network $docker_network redis;

docker rm -f summaryMicroservice || true;
docker run -d --name summaryMicroservice --network $docker_network wills0ng/info441-summary-microservice;

docker rm -f apiServer || true;
docker run \
    -d \
    -p 443:443 \
    -v $selfsigned_tlscert:/usr/share/info441-v1summary-api/letsencrypt/live/api.awesome-ness.me/fullchain.pem:ro \
    -v $selfsigned_tlskey:/usr/share/info441-v1summary-api/letsencrypt/live/api.awesome-ness.me/privkey.pem:ro \
    -e TLSCERT=/usr/share/info441-v1summary-api/letsencrypt/live/api.awesome-ness.me/fullchain.pem \
    -e TLSKEY=/usr/share/info441-v1summary-api/letsencrypt/live/api.awesome-ness.me/privkey.pem \
    -e REDISADDR=redisServer:6379 \
    -e SESSIONKEY=$sessionkey \
    -e DSN=postgres://postgres:%s@postgresStore:5432/postgres?sslmode=disable \
    -e POSTGRES_PASSWORD=$postgres_password \
    -e MESSAGESADDR=http://messagesMicroservice \
    -e SUMMARYADDR=http://summaryMicroservice \
    --name apiServer \
    --network $docker_network \
    wills0ng/info441-api-gateway-server;