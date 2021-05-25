#!/bin/sh
mongoimport mongodb://localhost:27017/messaging /docker-entrypoint-initdb.d/channels.json