@echo off
if not exist node_modules (
    echo Installing dependencies...
    npm install
)
echo Starting Minecraft Clone Desktop...
node_modules\.bin\electron.cmd .
