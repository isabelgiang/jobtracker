#!/bin/sh
docker rm -f postgresStore || true;
docker run -d \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
    --name postgresStore \
    wills0ng/info441-postgresstore;
