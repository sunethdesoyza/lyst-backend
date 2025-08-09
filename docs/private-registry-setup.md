# Private Docker Registry Setup Guide

This guide covers how to push your Lyst Backend Docker image to a private Docker registry on your local network.

## 🏠 **Private Registry Setup Options**

### **Option 1: Simple Docker Registry (Recommended for Local Development)**

#### **1. Run a Private Registry**
```bash
# Start a simple registry on port 5000
docker run -d -p 5000:5000 --name registry registry:2

# Or with persistence
docker run -d -p 5000:5000 --name registry \
  -v $(pwd)/registry-data:/var/lib/registry \
  registry:2
```

#### **2. Configure Docker for Insecure Registry**

**On macOS/Linux:**
```bash
# Edit Docker daemon configuration
sudo nano /etc/docker/daemon.json

# Add the following content:
{
  "insecure-registries": ["localhost:5000", "registry.local:5000"]
}

# Restart Docker
sudo systemctl restart docker
```

**On macOS (Docker Desktop):**
1. Open Docker Desktop preferences
2. Go to "Docker Engine"
3. Add to the configuration:
```json
{
  "insecure-registries": ["localhost:5000", "registry.local:5000"]
}
```
4. Click "Apply & Restart"

#### **3. Push to Private Registry**
```bash
# Using the script
./scripts/build-and-push.sh private lyst-backend v1.0.0

# Manual commands
docker build -t localhost:5000/lyst-backend:latest .
docker push localhost:5000/lyst-backend:latest
```

### **Option 2: Registry with Authentication**

#### **1. Create Authentication Files**
```bash
# Create auth directory
mkdir auth

# Create password file (replace 'admin' and 'password' with your credentials)
docker run --rm --entrypoint htpasswd httpd:2 -Bbn admin password > auth/htpasswd
```

#### **2. Run Registry with Authentication**
```bash
docker run -d -p 5000:5000 --name registry \
  -v $(pwd)/auth:/auth \
  -v $(pwd)/registry-data:/var/lib/registry \
  -e "REGISTRY_AUTH=htpasswd" \
  -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
  -e "REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd" \
  registry:2
```

#### **3. Login and Push**
```bash
# Login to registry
docker login localhost:5000

# Push using script
./scripts/build-and-push.sh private lyst-backend v1.0.0
```

### **Option 3: Registry with TLS/SSL**

#### **1. Generate SSL Certificates**
```bash
# Create certs directory
mkdir certs

# Generate self-signed certificate
openssl req -newkey rsa:4096 -nodes -sha256 -keyout certs/domain.key \
  -x509 -days 365 -out certs/domain.crt \
  -subj "/CN=registry.local"
```

#### **2. Run Secure Registry**
```bash
docker run -d -p 5000:5000 --name registry \
  -v $(pwd)/certs:/certs \
  -v $(pwd)/registry-data:/var/lib/registry \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/domain.key \
  registry:2
```

## 🔧 **Usage Examples**

### **Using the Build Script**

```bash
# For private registry without auth
./scripts/build-and-push.sh private lyst-backend latest

# For private registry with auth
./scripts/build-and-push.sh private lyst-backend v1.0.0
```

### **Manual Commands**

```bash
# Build image
docker build -t registry.local:5000/lyst-backend:latest .

# Login (if authentication enabled)
docker login registry.local:5000

# Push image
docker push registry.local:5000/lyst-backend:latest

# Pull image (on other machines)
docker pull registry.local:5000/lyst-backend:latest
```

## 🌐 **Network Configuration**

### **DNS Setup (Optional)**
Add to `/etc/hosts` on all machines that need access:
```
192.168.1.100  registry.local
```

### **Firewall Configuration**
Ensure port 5000 is open on the registry host:
```bash
# Ubuntu/Debian
sudo ufw allow 5000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

## 📋 **Registry Management**

### **List Images in Registry**
```bash
# List repositories
curl -X GET http://localhost:5000/v2/_catalog

# List tags for a repository
curl -X GET http://localhost:5000/v2/lyst-backend/tags/list
```

### **Delete Images**
```bash
# Get image digest
curl -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
  -X GET http://localhost:5000/v2/lyst-backend/manifests/latest

# Delete image (requires registry with delete enabled)
curl -X DELETE http://localhost:5000/v2/lyst-backend/manifests/DIGEST
```

### **Registry with UI (Portainer or Registry UI)**
```bash
# Run registry UI
docker run -d -p 8080:80 --name registry-ui \
  -e REGISTRY_URL=http://localhost:5000 \
  joxit/docker-registry-ui:static
```

## 🐳 **Docker Compose for Complete Setup**

Create `registry-compose.yml`:
```yaml
version: '3.8'

services:
  registry:
    image: registry:2
    container_name: private-registry
    ports:
      - "5000:5000"
    volumes:
      - registry-data:/var/lib/registry
      - ./auth:/auth:ro
      - ./certs:/certs:ro
    environment:
      - REGISTRY_AUTH=htpasswd
      - REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm
      - REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd
      - REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt
      - REGISTRY_HTTP_TLS_KEY=/certs/domain.key
    restart: unless-stopped

  registry-ui:
    image: joxit/docker-registry-ui:static
    container_name: registry-ui
    ports:
      - "8080:80"
    environment:
      - REGISTRY_URL=https://registry.local:5000
      - DELETE_IMAGES=true
      - REGISTRY_TITLE=Lyst Private Registry
    depends_on:
      - registry
    restart: unless-stopped

volumes:
  registry-data:
```

Start with: `docker-compose -f registry-compose.yml up -d`

## 🔍 **Troubleshooting**

### **Common Issues**

1. **"x509: certificate signed by unknown authority"**
   - Add registry to insecure registries OR
   - Install the self-signed certificate

2. **"connection refused"**
   - Check if registry is running: `docker ps`
   - Verify port is accessible: `telnet registry.local 5000`

3. **"unauthorized: authentication required"**
   - Login to registry: `docker login registry.local:5000`
   - Check credentials in htpasswd file

4. **"no route to host"**
   - Check network connectivity
   - Verify firewall settings
   - Check DNS resolution

### **Verification Commands**
```bash
# Test registry connectivity
curl -X GET http://localhost:5000/v2/

# Test authentication
curl -u admin:password -X GET http://localhost:5000/v2/_catalog

# Check Docker daemon configuration
docker info | grep -i "insecure registries"
```

## 🚀 **Production Considerations**

- **Use HTTPS** in production environments
- **Implement proper authentication** and authorization
- **Set up backup** for registry data
- **Monitor registry** health and storage usage
- **Use reverse proxy** (nginx) for additional security
- **Implement image scanning** for vulnerabilities 