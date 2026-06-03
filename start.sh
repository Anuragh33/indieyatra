#!/usr/bin/env bash
set -e

export PATH="/opt/homebrew/bin:$PATH"

# Kill anything already on these ports
lsof -ti :8080 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

echo "→ Starting Redis..."
brew services start redis 2>/dev/null || true
until redis-cli ping > /dev/null 2>&1; do sleep 1; done
echo "✓ Redis"

echo "→ Database: NeonDB (cloud)"

echo "→ Starting backend (port 8080)..."
cd "$(dirname "$0")/backend"
/opt/homebrew/bin/go run ./cmd/server/... &
BACKEND_PID=$!
cd - > /dev/null

echo "→ Starting frontend (port 3000)..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!
cd - > /dev/null

echo "→ Waiting for servers to be ready..."
until curl -s http://localhost:8080/api/health | grep -q "ok"; do sleep 2; done
until curl -s http://localhost:3000 -o /dev/null -w "%{http_code}" 2>/dev/null | grep -q "200"; do sleep 2; done

echo ""
echo "✓ Backend  → http://localhost:8080  (NeonDB)"
echo "✓ Frontend → http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop."

trap "echo '→ Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
