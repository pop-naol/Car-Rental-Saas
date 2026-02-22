#!/bin/bash

# Car Rental Management SaaS - Stop Script
# This script stops both backend and frontend servers

echo "🛑 Stopping Car Rental Management SaaS..."
echo ""

# Stop Backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "🛑 Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ Backend stopped"
    else
        echo "⚠️  Backend process not found"
    fi
    rm .backend.pid
else
    echo "⚠️  Backend PID file not found"
fi

# Stop Frontend
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "🛑 Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ Frontend stopped"
    else
        echo "⚠️  Frontend process not found"
    fi
    rm .frontend.pid
else
    echo "⚠️  Frontend PID file not found"
fi

echo ""
echo "✅ All services stopped!"
