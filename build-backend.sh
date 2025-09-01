#!/bin/bash

# Build backend Docker image
echo "Building backend Docker image..."
docker build -t tatsuyakari/webtools-backend:latest ./backend

if [ $? -eq 0 ]; then
    echo "✅ Backend image built successfully!"
    echo "Image: tatsuyakari/webtools-backend:latest"
else
    echo "❌ Failed to build backend image"
    exit 1
fi

# Test the image locally
echo "\nTesting backend image locally..."
docker run --rm -d --name test-backend \
    -p 8001:8000 \
    -e GOOGLE_API_KEY="${GOOGLE_API_KEY}" \
    tatsuyakari/webtools-backend:latest

if [ $? -eq 0 ]; then
    echo "✅ Backend container started successfully on port 8001"
    echo "Waiting 10 seconds for startup..."
    sleep 10
    
    # Test health endpoint
    echo "Testing health endpoint..."
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health)
    
    if [ "$response" = "200" ]; then
        echo "✅ Health check passed!"
        echo "Backend is ready for deployment"
        
        # Stop test container
        docker stop test-backend
        
        # Ask if user wants to push to Docker Hub
        read -p "Do you want to push to Docker Hub? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Pushing to Docker Hub..."
            docker push tatsuyakari/webtools-backend:latest
            if [ $? -eq 0 ]; then
                echo "✅ Successfully pushed to Docker Hub!"
            else
                echo "❌ Failed to push to Docker Hub"
                exit 1
            fi
        else
            echo "Skipping push to Docker Hub"
        fi
    else
        echo "❌ Health check failed (HTTP $response)"
        docker stop test-backend
        exit 1
    fi
else
    echo "❌ Failed to start backend container"
    exit 1
fi

echo "\n🎉 Backend build and test completed successfully!"