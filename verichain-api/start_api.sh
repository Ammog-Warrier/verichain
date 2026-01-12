#!/bin/bash
export JWT_SECRET=supersecretkey123
export ADMIN_PASSWORD=adminpw
export PORT=3000

# Kill any existing process on port 3000
fuser -k 3000/tcp > /dev/null 2>&1

echo "Starting VeriChain API..."
npm start > api.log 2>&1 &
echo $! > api.pid
echo "API Server started with PID $(cat api.pid)"
sleep 5
cat api.log
