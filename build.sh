#!/bin/bash

# FreshMart Docker Build Script
# Version: 1.0.0

set -e

VERSION="1.0.0"
REGISTRY="freshmart"

echo "🚀 Building FreshMart Docker Images - Version $VERSION"
echo "=================================================="

# Build Backend
echo ""
echo "📦 Building Backend..."
docker build -t $REGISTRY/backend:$VERSION -t $REGISTRY/backend:latest ./backend
echo "✅ Backend built successfully"

# Build Client
echo ""
echo "📦 Building Client..."
docker build -t $REGISTRY/client:$VERSION -t $REGISTRY/client:latest ./client
echo "✅ Client built successfully"

# Build Dashboard
echo ""
echo "📦 Building Dashboard..."
docker build -t $REGISTRY/dashboard:$VERSION -t $REGISTRY/dashboard:latest ./dashboard
echo "✅ Dashboard built successfully"

echo ""
echo "=================================================="
echo "✅ All images built successfully!"
echo ""
echo "Images created:"
echo "  - $REGISTRY/backend:$VERSION"
echo "  - $REGISTRY/client:$VERSION"
echo "  - $REGISTRY/dashboard:$VERSION"
echo ""
echo "To push to registry, run:"
echo "  docker push $REGISTRY/backend:$VERSION"
echo "  docker push $REGISTRY/client:$VERSION"
echo "  docker push $REGISTRY/dashboard:$VERSION"
