#!/bin/bash

echo "Building Docker container for web client..."
docker build -t web-client .

echo "Build complete!"
