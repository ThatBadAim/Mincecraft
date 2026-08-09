#!/bin/bash
# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the game
echo "Starting Minecraft Clone Desktop..."
node_modules/.bin/electron .
