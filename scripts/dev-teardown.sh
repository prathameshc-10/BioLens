#!/bin/bash

# BioLens Development Teardown Script
set -e

echo "🛑 Stopping BioLens development environment..."

# Stop and remove containers
docker-compose down

# Remove volumes (optional - uncomment if you want to clear data)
# docker-compose down -v

# Remove images (optional - uncomment if you want to clear images)
# docker-compose down --rmi all

echo "✅ BioLens development environment stopped."
echo ""
echo "💡 To completely clean up (remove volumes and images):"
echo "   docker-compose down -v --rmi all"