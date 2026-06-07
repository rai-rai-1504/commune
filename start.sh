#!/bin/bash
# Commune — start both server and client dev servers

echo "🏙️  Starting Commune..."

# Install server deps if needed
if [ ! -d "server/node_modules" ]; then
  echo "📦 Installing server dependencies..."
  cd server && npm install && cd ..
fi

# Install client deps if needed
if [ ! -d "client/node_modules" ]; then
  echo "📦 Installing client dependencies..."
  cd client && npm install && cd ..
fi

# Start server in background
echo "🚀 Starting server on :4000..."
cd server && node server.js &
SERVER_PID=$!
cd ..

# Give server a moment to start
sleep 1

# Start client
echo "🌐 Starting client on :3000..."
cd client && npm start

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT
