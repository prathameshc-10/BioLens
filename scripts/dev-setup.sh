#!/bin/bash

# BioLens Development Setup Script
set -e

echo "🚀 Setting up BioLens development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment files from examples
echo "📝 Creating environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo "✅ Created frontend/.env.local file"
fi

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build

# Start services
echo "🚀 Starting development services..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

echo ""
echo "✅ BioLens development environment is ready!"
echo ""
echo "🌐 Services available at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - BioBERT Service: http://localhost:8001"
echo "  - Image Analysis Service: http://localhost:8002"
echo "  - Redis: localhost:6379"
echo ""
echo "📚 API Documentation:"
echo "  - Backend: http://localhost:8000/docs"
echo "  - BioBERT: http://localhost:8001/docs"
echo "  - Image Analysis: http://localhost:8002/docs"
echo ""
echo "🛠️  To stop services: docker-compose down"
echo "🔄 To restart services: docker-compose restart"
echo "📋 To view logs: docker-compose logs -f [service-name]"