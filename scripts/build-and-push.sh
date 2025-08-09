#!/bin/bash

# Build and Push Script for Lyst Backend
# Usage: ./scripts/build-and-push.sh [registry-type] [image-name] [version] [platform]

set -e

# Default values
REGISTRY_TYPE=${1:-"dockerhub"}
IMAGE_NAME=${2:-"lyst-backend"}
VERSION=${3:-"latest"}
PLATFORM=${4:-"linux/amd64,linux/arm64"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Lyst Backend - Build and Push Script${NC}"
echo -e "${BLUE}======================================${NC}"

# Function to build multi-platform image
build_multiplatform_image() {
    local tag=$1
    local platforms=$2
    
    echo -e "${YELLOW}📦 Building multi-platform Docker image: ${tag}${NC}"
    echo -e "${YELLOW}🏗️  Platforms: ${platforms}${NC}"
    
    # Check if buildx builder exists
    if ! docker buildx ls | grep -q "multiplatform"; then
        echo -e "${YELLOW}Creating multiplatform builder...${NC}"
        docker buildx create --name multiplatform --use > /dev/null 2>&1
        docker buildx inspect --bootstrap > /dev/null 2>&1
    else
        docker buildx use multiplatform > /dev/null 2>&1
    fi
    
    docker buildx build --platform ${platforms} -t ${tag} .
    echo -e "${GREEN}✅ Multi-platform image built successfully${NC}"
}

# Function to build single platform image
build_single_platform_image() {
    local tag=$1
    local platform=$2
    
    echo -e "${YELLOW}📦 Building single-platform Docker image: ${tag}${NC}"
    echo -e "${YELLOW}🏗️  Platform: ${platform}${NC}"
    
    docker build --platform ${platform} -t ${tag} .
    echo -e "${GREEN}✅ Image built successfully${NC}"
}

# Function to push image
push_image() {
    local tag=$1
    echo -e "${YELLOW}🚀 Pushing Docker image: ${tag}${NC}"
    docker push ${tag}
    echo -e "${GREEN}✅ Image pushed successfully${NC}"
}

case $REGISTRY_TYPE in
    "private"|"local")
        echo -e "${BLUE}📋 Registry: Private/Local Registry${NC}"
        read -p "Enter your private registry URL (e.g., registry.local:5000): " REGISTRY_URL
        read -p "Enter username (leave empty if no auth): " REGISTRY_USERNAME
        read -p "Build multi-platform? (y/N): " MULTIPLATFORM
        
        if [ -z "$REGISTRY_URL" ]; then
            echo -e "${RED}❌ Registry URL is required${NC}"
            exit 1
        fi
        
        IMAGE_TAG="${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"
        LATEST_TAG="${REGISTRY_URL}/${IMAGE_NAME}:latest"
        AMD64_TAG="${REGISTRY_URL}/${IMAGE_NAME}:amd64"
        ARM64_TAG="${REGISTRY_URL}/${IMAGE_NAME}:arm64"
        
        # Login if username provided
        if [ ! -z "$REGISTRY_USERNAME" ]; then
            echo -e "${YELLOW}🔐 Logging in to private registry...${NC}"
            docker login $REGISTRY_URL -u $REGISTRY_USERNAME
        else
            echo -e "${YELLOW}ℹ️  No authentication required${NC}"
        fi
        
        # Check if registry is insecure (HTTP)
        if [[ $REGISTRY_URL == *":5000"* ]] || [[ $REGISTRY_URL != *"https"* ]]; then
            echo -e "${YELLOW}⚠️  Detected insecure registry. Make sure Docker daemon is configured to allow insecure registries.${NC}"
            echo -e "${YELLOW}   Add '\"insecure-registries\": [\"$REGISTRY_URL\"]' to ~/.docker/daemon.json${NC}"
        fi
        
        if [[ "$MULTIPLATFORM" =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}🌐 Building multi-platform images separately...${NC}"
            
            # Build AMD64 version
            build_single_platform_image $AMD64_TAG "linux/amd64"
            push_image $AMD64_TAG
            
            # Build ARM64 version  
            build_single_platform_image $ARM64_TAG "linux/arm64"
            push_image $ARM64_TAG
            
            # Tag AMD64 as latest (for better compatibility)
            docker tag $AMD64_TAG $LATEST_TAG
            push_image $LATEST_TAG
            
            echo -e "${GREEN}📋 Available tags:${NC}"
            echo -e "${GREEN}  🏷️  ${LATEST_TAG} (AMD64)${NC}"
            echo -e "${GREEN}  🏷️  ${AMD64_TAG}${NC}"
            echo -e "${GREEN}  🏷️  ${ARM64_TAG}${NC}"
            
        else
            # Build for current platform only
            CURRENT_ARCH=$(uname -m)
            if [[ "$CURRENT_ARCH" == "arm64" ]]; then
                PLATFORM="linux/arm64"
            else
                PLATFORM="linux/amd64"
            fi
            
            build_single_platform_image $IMAGE_TAG $PLATFORM
            push_image $IMAGE_TAG
            
            # Also push as latest if version is not latest
            if [ "$VERSION" != "latest" ]; then
                docker tag $IMAGE_TAG $LATEST_TAG
                push_image $LATEST_TAG
            fi
        fi
        ;;
        
    "dockerhub")
        echo -e "${BLUE}📋 Registry: Docker Hub${NC}"
        read -p "Enter your Docker Hub username: " DOCKER_USERNAME
        read -p "Build multi-platform? (y/N): " MULTIPLATFORM
        
        if [ -z "$DOCKER_USERNAME" ]; then
            echo -e "${RED}❌ Docker Hub username is required${NC}"
            exit 1
        fi
        
        IMAGE_TAG="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
        LATEST_TAG="${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
        
        # Login check
        echo -e "${YELLOW}🔐 Checking Docker Hub login...${NC}"
        if ! docker info | grep -q "Username"; then
            echo -e "${YELLOW}Please login to Docker Hub:${NC}"
            docker login
        fi
        
        if [[ "$MULTIPLATFORM" =~ ^[Yy]$ ]]; then
            # Use buildx for multi-platform build to Docker Hub
            build_multiplatform_image $IMAGE_TAG $PLATFORM
            
            # Push using buildx
            echo -e "${YELLOW}🚀 Pushing multi-platform image...${NC}"
            docker buildx build --platform $PLATFORM -t $IMAGE_TAG --push .
            
            if [ "$VERSION" != "latest" ]; then
                docker buildx build --platform $PLATFORM -t $LATEST_TAG --push .
            fi
        else
            build_single_platform_image $IMAGE_TAG "linux/$(uname -m)"
            push_image $IMAGE_TAG
            
            if [ "$VERSION" != "latest" ]; then
                docker tag $IMAGE_TAG $LATEST_TAG
                push_image $LATEST_TAG
            fi
        fi
        ;;
        
    "ghcr")
        echo -e "${BLUE}📋 Registry: GitHub Container Registry${NC}"
        read -p "Enter your GitHub username: " GITHUB_USERNAME
        
        if [ -z "$GITHUB_USERNAME" ]; then
            echo -e "${RED}❌ GitHub username is required${NC}"
            exit 1
        fi
        
        IMAGE_TAG="ghcr.io/${GITHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"
        LATEST_TAG="ghcr.io/${GITHUB_USERNAME}/${IMAGE_NAME}:latest"
        
        # Check for GitHub token
        if [ -z "$GITHUB_TOKEN" ]; then
            echo -e "${RED}❌ GITHUB_TOKEN environment variable is required${NC}"
            echo -e "${YELLOW}Please set your GitHub Personal Access Token:${NC}"
            echo -e "${YELLOW}export GITHUB_TOKEN=your_token_here${NC}"
            exit 1
        fi
        
        # Login to GitHub Container Registry
        echo -e "${YELLOW}🔐 Logging in to GitHub Container Registry...${NC}"
        echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
        
        build_single_platform_image $IMAGE_TAG "linux/$(uname -m)"
        push_image $IMAGE_TAG
        
        if [ "$VERSION" != "latest" ]; then
            docker tag $IMAGE_TAG $LATEST_TAG
            push_image $LATEST_TAG
        fi
        ;;
        
    "ecr")
        echo -e "${BLUE}📋 Registry: AWS Elastic Container Registry${NC}"
        read -p "Enter your AWS Account ID: " AWS_ACCOUNT_ID
        read -p "Enter AWS region (default: us-west-2): " AWS_REGION
        AWS_REGION=${AWS_REGION:-us-west-2}
        
        if [ -z "$AWS_ACCOUNT_ID" ]; then
            echo -e "${RED}❌ AWS Account ID is required${NC}"
            exit 1
        fi
        
        ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        IMAGE_TAG="${ECR_REGISTRY}/${IMAGE_NAME}:${VERSION}"
        LATEST_TAG="${ECR_REGISTRY}/${IMAGE_NAME}:latest"
        
        # Login to ECR
        echo -e "${YELLOW}🔐 Logging in to AWS ECR...${NC}"
        aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
        
        # Create repository if it doesn't exist
        echo -e "${YELLOW}📦 Ensuring ECR repository exists...${NC}"
        aws ecr describe-repositories --repository-names $IMAGE_NAME --region $AWS_REGION >/dev/null 2>&1 || \
        aws ecr create-repository --repository-name $IMAGE_NAME --region $AWS_REGION
        
        build_single_platform_image $IMAGE_TAG "linux/$(uname -m)"
        push_image $IMAGE_TAG
        
        if [ "$VERSION" != "latest" ]; then
            docker tag $IMAGE_TAG $LATEST_TAG
            push_image $LATEST_TAG
        fi
        ;;
        
    "gcr")
        echo -e "${BLUE}📋 Registry: Google Container Registry${NC}"
        read -p "Enter your Google Cloud Project ID: " GCP_PROJECT_ID
        
        if [ -z "$GCP_PROJECT_ID" ]; then
            echo -e "${RED}❌ Google Cloud Project ID is required${NC}"
            exit 1
        fi
        
        IMAGE_TAG="gcr.io/${GCP_PROJECT_ID}/${IMAGE_NAME}:${VERSION}"
        LATEST_TAG="gcr.io/${GCP_PROJECT_ID}/${IMAGE_NAME}:latest"
        
        # Configure Docker for GCR
        echo -e "${YELLOW}🔐 Configuring Docker for Google Container Registry...${NC}"
        gcloud auth configure-docker --quiet
        
        build_single_platform_image $IMAGE_TAG "linux/$(uname -m)"
        push_image $IMAGE_TAG
        
        if [ "$VERSION" != "latest" ]; then
            docker tag $IMAGE_TAG $LATEST_TAG
            push_image $LATEST_TAG
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Unsupported registry type: $REGISTRY_TYPE${NC}"
        echo -e "${YELLOW}Supported types: private, local, dockerhub, ghcr, ecr, gcr${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Build and push completed successfully!${NC}"
echo -e "${BLUE}📝 Image details:${NC}"
echo -e "   Registry: $REGISTRY_TYPE"
if [[ "$MULTIPLATFORM" =~ ^[Yy]$ ]] && [[ "$REGISTRY_TYPE" =~ ^(private|local)$ ]]; then
    echo -e "   Images: Multiple platform-specific tags created"
else
    echo -e "   Image: $IMAGE_TAG"
fi

# Show image size for local builds
if [[ "$REGISTRY_TYPE" =~ ^(private|local)$ ]] && [[ "$MULTIPLATFORM" =~ ^[Yy]$ ]]; then
    AMD64_SIZE=$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep "$IMAGE_NAME:amd64" | awk '{print $2}' | head -1)
    ARM64_SIZE=$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep "$IMAGE_NAME:arm64" | awk '{print $2}' | head -1)
    if [ ! -z "$AMD64_SIZE" ]; then
        echo -e "   AMD64 Size: $AMD64_SIZE"
    fi
    if [ ! -z "$ARM64_SIZE" ]; then
        echo -e "   ARM64 Size: $ARM64_SIZE"
    fi
else
    IMAGE_SIZE=$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep "$IMAGE_NAME:$VERSION" | awk '{print $2}' | head -1)
    if [ ! -z "$IMAGE_SIZE" ]; then
        echo -e "   Size: $IMAGE_SIZE"
    fi
fi 