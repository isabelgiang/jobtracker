#!/bin/sh

# cd to current script directory
scriptdir=$(dirname $0)
image_name = $1
cd $scriptdir

GOOS=linux go build
docker build -t $image_name .
