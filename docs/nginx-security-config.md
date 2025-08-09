# Nginx Security Configuration for Firebase Config Endpoint

## 🔒 **Option 1: Custom Header Authentication (Most Secure)**

This method uses a custom header that only your frontend knows and cannot be easily spoofed:

```nginx
# In your Nginx server block
server {
    listen 443 ssl;
    server_name lyst.sunethdesoyza.live;
    
    # ... your SSL configuration ...
    
    # Secure the Firebase config endpoint
    location /api/firebase-config {
        # Check for custom authentication header
        if ($http_x_firebase_auth != "your-secret-token-here") {
            return 403 "Access Denied";
        }
        
        # Your existing proxy configuration
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Other locations remain unchanged
    location / {
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Option 2: Origin Header Check (Spoofable but Better than Referer)**

This method checks the `Origin` header, which is more reliable for AJAX requests:

```nginx
# In your Nginx server block
server {
    listen 443 ssl;
    server_name lyst.sunethdesoyza.live;
    
    # ... your SSL configuration ...
    
    # Secure the Firebase config endpoint
    location /api/firebase-config {
        # Check if origin is from your domain
        if ($http_origin !~ "^https://lyst\.sunethdesoyza\.live$") {
            return 403 "Access Denied";
        }
        
        # Set CORS headers for your domain
        add_header 'Access-Control-Allow-Origin' 'https://lyst.sunethdesoyza.live' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://lyst.sunethdesoyza.live' always;
            add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
            add_header 'Content-Length' 0;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            return 204;
        }
        
        # Your existing proxy configuration
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Other locations remain unchanged
    location / {
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Option 3: Referer Header Check (Easily Spoofable - Not Recommended)**

This method checks the `Referer` header, but it can be easily spoofed:

```nginx
# In your Nginx server block
server {
    listen 443 ssl;
    server_name lyst.sunethdesoyza.live;
    
    # ... your SSL configuration ...
    
    # Secure the Firebase config endpoint
    location /api/firebase-config {
        # Check if referer is from your domain (can be spoofed!)
        if ($http_referer !~ "^https://lyst\.sunethdesoyza\.live/") {
            return 403 "Access Denied";
        }
        
        # Your existing proxy configuration
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Other locations remain unchanged
    location / {
        proxy_pass http://localhost:3080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔧 **Frontend Changes for Custom Header (Option 3)**

If you choose Option 3, update your frontend code:

```javascript
// In public/index.html, update the loadFirebaseConfig function
async function loadFirebaseConfig() {
    try {
        console.log('🔍 Loading Firebase configuration...');
        const response = await fetch(`${API_BASE_URL}/api/firebase-config`, {
            headers: {
                'X-Firebase-Auth': 'your-secret-token-here'
            }
        });
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
            firebaseConfig = await response.json();
            console.log('✅ Firebase config loaded:', firebaseConfig);
            initializeFirebase();
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to load Firebase configuration:', response.status, errorText);
            showResult(`❌ Failed to load Firebase configuration (${response.status}): ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error loading Firebase configuration:', error);
        showResult(`❌ Error loading Firebase configuration: ${error.message}`, 'error');
    }
}
```

## 🚀 **Implementation Steps:**

### **1. Choose Your Security Method:**
- **Option 1 (Referer)**: Good for most cases, easy to implement
- **Option 2 (Origin)**: More reliable for AJAX requests
- **Option 3 (Custom Header)**: Most secure, requires frontend changes

### **2. Update Nginx Configuration:**
```bash
# Edit your Nginx config
sudo nano /etc/nginx/sites-available/lyst.sunethdesoyza.live

# Test the configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### **3. Test the Security:**
```bash
# This should work (from your domain)
curl -H "Referer: https://lyst.sunethdesoyza.live/" https://lyst.sunethdesoyza.live/api/firebase-config

# This should be blocked (from different domain)
curl -H "Referer: https://malicious-site.com/" https://lyst.sunethdesoyza.live/api/firebase-config
```

## 🎯 **Updated Recommendation:**

Given that both Referer and Origin headers can be spoofed, I now recommend **Option 1 (Custom Header Authentication)** because:
- ✅ **Cannot be easily spoofed** - requires knowledge of the secret token
- ✅ **Most secure** of the three options
- ✅ **Standard practice** for API protection
- ⚠️ **Requires frontend changes** but provides real security

**Alternative: Option 2 (Origin Header)** if you prefer no frontend changes, but understand it's spoofable.

**Avoid: Option 3 (Referer Header)** - too easily bypassed.

This will provide actual security for your Firebase configuration endpoint! 🔒 