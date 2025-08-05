#!/bin/bash

# Time Tracker App - Build Script
echo "🚀 Building Time Tracker App for Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t time-tracker-app .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Run with Docker Compose: docker-compose up -d"
    echo "2. Or run manually: docker run -d -p 9090:80 --name time-tracker-app time-tracker-app"
echo "3. Access the app at: http://localhost:9090"
    echo ""
    echo "📊 To view logs: docker-compose logs -f time-tracker"
else
    echo "❌ Build failed!"
    exit 1
fi 