#!/bin/bash

# Check Private Registry Script
# Usage: ./scripts/check-registry.sh [registry-url]

REGISTRY_URL=${1:-"192.168.1.11:5000"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Private Registry Check${NC}"
echo -e "${BLUE}========================${NC}"
echo -e "${YELLOW}Registry URL: ${REGISTRY_URL}${NC}"
echo ""

# Test registry connectivity
echo -e "${YELLOW}📡 Testing registry connectivity...${NC}"
if curl -s -f http://${REGISTRY_URL}/v2/ > /dev/null; then
    echo -e "${GREEN}✅ Registry is accessible${NC}"
else
    echo -e "${RED}❌ Registry is not accessible${NC}"
    exit 1
fi

echo ""

# List all repositories
echo -e "${YELLOW}📦 Repositories in registry:${NC}"
REPOS=$(curl -s http://${REGISTRY_URL}/v2/_catalog | jq -r '.repositories[]?' 2>/dev/null)

if [ -z "$REPOS" ]; then
    echo -e "${YELLOW}  No repositories found${NC}"
else
    for repo in $REPOS; do
        echo -e "${GREEN}  📁 $repo${NC}"
        
        # Get tags for each repository
        TAGS=$(curl -s http://${REGISTRY_URL}/v2/${repo}/tags/list | jq -r '.tags[]?' 2>/dev/null)
        if [ ! -z "$TAGS" ]; then
            for tag in $TAGS; do
                echo -e "${BLUE}    🏷️  $tag${NC}"
            done
        fi
    done
fi

echo ""

# Check lyst-backend specifically
echo -e "${YELLOW}🎯 Lyst Backend Status:${NC}"
LYST_TAGS=$(curl -s http://${REGISTRY_URL}/v2/lyst-backend/tags/list 2>/dev/null | jq -r '.tags[]?' 2>/dev/null)

if [ ! -z "$LYST_TAGS" ]; then
    echo -e "${GREEN}✅ lyst-backend repository found${NC}"
    for tag in $LYST_TAGS; do
        echo -e "${GREEN}  📌 Tag: $tag${NC}"
        
        # Test if image can be pulled
        if docker pull ${REGISTRY_URL}/lyst-backend:${tag} > /dev/null 2>&1; then
            echo -e "${GREEN}  ✅ Pull test: SUCCESS${NC}"
        else
            echo -e "${RED}  ❌ Pull test: FAILED${NC}"
        fi
        
        # Get image size
        SIZE=$(docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep "lyst-backend:$tag" | awk '{print $2}' | head -1)
        if [ ! -z "$SIZE" ]; then
            echo -e "${BLUE}  📏 Size: $SIZE${NC}"
        fi
    done
else
    echo -e "${RED}❌ lyst-backend repository not found${NC}"
fi

echo ""

# Registry stats
echo -e "${YELLOW}📊 Registry Information:${NC}"
echo -e "${BLUE}  🌐 URL: http://${REGISTRY_URL}${NC}"
echo -e "${BLUE}  📋 Catalog: http://${REGISTRY_URL}/v2/_catalog${NC}"
echo -e "${BLUE}  🏷️  Tags: http://${REGISTRY_URL}/v2/lyst-backend/tags/list${NC}"

echo ""
echo -e "${GREEN}🎉 Registry check completed!${NC}" 