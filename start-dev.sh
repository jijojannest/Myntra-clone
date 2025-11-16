#!/bin/bash

# Myntra Clone Development Startup Script

echo "🚀 Starting Myntra Clone Development Environment..."

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

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Build and start development services
echo "🏗 Building and starting development services..."
docker-compose -f docker-compose.dev.yml up --build

echo "✅ Development environment started!"
echo ""
echo "🌐 Available services:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:5000"
echo "  • MongoDB: mongodb://localhost:27017"
echo "  • Redis: redis://localhost:6379"
echo ""
echo "📖 To view logs: docker-compose -f docker-compose.dev.yml logs -f [service-name]"
echo "🛑 To stop: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "🔧 To reset databases: docker-compose -f docker-compose.dev.yml down -v"