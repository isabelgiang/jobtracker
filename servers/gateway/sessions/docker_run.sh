#!/bin/sh
docker rm -f redisServer || true;
docker run -d -p 6379:6379 --name redisServer redis;
