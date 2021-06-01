#!/bin/sh
# cd to current script directory
scriptdir=$(dirname $0)
cd $scriptdir
docker build -t postgres .
