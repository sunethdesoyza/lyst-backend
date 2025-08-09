# Secure Firebase Config Access - No Frontend Secrets

## 🔒 **The Problem with Custom Headers**

Custom headers in frontend JavaScript are **not secure** because:
- ❌ **Token is visible** in browser source code
- ❌ **Anyone can inspect** and reuse the token
- ❌ **No real security** - just obfuscation

## 🛡️ **Secure Alternatives**

### **Option 1: Session-Based Protection (Recommended)**

Instead of a custom header, use session-based authentication:

#### **Backend Changes:**

```typescript
// src/app.controller.ts
import { Controller, Get, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  // ... existing code ...

  @Get('api/firebase-config')
  getFirebaseConfig(@Req() req: Request) {
    // Check if request comes from your domain's session
    const userAgent = req.get('User-Agent');
    const referer = req.get('Referer');
    const origin = req.get('Origin');
    
    // Basic validation - can be enhanced
    if (!this.isValidRequest(userAgent, referer, origin)) {
      throw new UnauthorizedException('Invalid request source');
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const apiKey = this.configService.get<string>('FIREBASE_API_KEY');
    
    if (!projectId || !apiKey) {
      throw new Error('Firebase configuration not available');
    }

    return {
      apiKey: apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId: projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
      messagingSenderId: this.configService.get<string>('FIREBASE_MESSAGING_SENDER_ID', '936036645672'),
      appId: this.configService.get<string>('FIREBASE_APP_ID', '1:936036645672:web:675865f75c539f2aa92e1d'),
      measurementId: this.configService.get<string>('FIREBASE_MEASUREMENT_ID', 'G-P77WVKL62E')
    };
  }

  private isValidRequest(userAgent?: string, referer?: string, origin?: string): boolean {
    // Check if request has reasonable headers
    if (!userAgent || userAgent.includes('curl') || userAgent.includes('Postman')) {
      return false; // Block obvious API testing tools
    }
    
    // Check referer/origin if present
    if (referer && !referer.includes('lyst.sunethdesoyza.live')) {
      return false;
    }
    
    if (origin && origin !== 'https://lyst.sunethdesoyza.live') {
      return false;
    }
    
    return true;
  }
}
```

#### **Frontend (No Changes Needed):**
```javascript
// Your existing code works unchanged
const response = await fetch(`${API_BASE_URL}/api/firebase-config`);
```

### **Option 2: Rate Limiting + IP Whitelisting**

#### **Nginx Configuration:**
```nginx
# Rate limiting
http {
    # Define rate limiting zone
    limit_req_zone $binary_remote_addr zone=firebase_config:10m rate=10r/m;
    
    server {
        listen 443 ssl;
        server_name lyst.sunethdesoyza.live;
        
        # Apply rate limiting to Firebase config endpoint
        location /api/firebase-config {
            limit_req zone=firebase_config burst=5 nodelay;
            
            # Optional: IP whitelisting (if you have fixed IPs)
            # allow 192.168.1.0/24;
            # deny all;
            
            proxy_pass http://localhost:3080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Other locations...
    }
}
```

### **Option 3: JWT-Based Temporary Tokens**

#### **Backend Implementation:**
```typescript
// src/app.controller.ts
import { JwtService } from '@nestjs/jwt';

@Controller()
export class AppController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('api/firebase-config-token')
  getFirebaseConfigToken(@Req() req: Request) {
    // Validate request source
    if (!this.isValidRequest(req)) {
      throw new UnauthorizedException('Invalid request source');
    }

    // Generate temporary token (valid for 5 minutes)
    const token = this.jwtService.sign(
      { 
        purpose: 'firebase-config',
        timestamp: Date.now()
      },
      { 
        expiresIn: '5m',
        secret: this.configService.get<string>('JWT_SECRET')
      }
    );

    return { token };
  }

  @Get('api/firebase-config')
  getFirebaseConfig(@Req() req: Request) {
    const authHeader = req.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      });
      
      if (payload.purpose !== 'firebase-config') {
        throw new UnauthorizedException('Invalid token purpose');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    // Return Firebase config
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const apiKey = this.configService.get<string>('FIREBASE_API_KEY');
    
    return {
      apiKey: apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId: projectId,
      storageBucket: `${projectId}.firebasestorage.app`,
      messagingSenderId: this.configService.get<string>('FIREBASE_MESSAGING_SENDER_ID', '936036645672'),
      appId: this.configService.get<string>('FIREBASE_APP_ID', '1:936036645672:web:675865f75c539f2aa92e1d'),
      measurementId: this.configService.get<string>('FIREBASE_MEASUREMENT_ID', 'G-P77WVKL62E')
    };
  }
}
```

#### **Frontend Implementation:**
```javascript
// Two-step process: get token, then get config
async function loadFirebaseConfig() {
    try {
        console.log('🔍 Loading Firebase configuration...');
        
        // Step 1: Get temporary token
        const tokenResponse = await fetch(`${API_BASE_URL}/api/firebase-config-token`);
        if (!tokenResponse.ok) {
            throw new Error('Failed to get access token');
        }
        
        const { token } = await tokenResponse.json();
        
        // Step 2: Get Firebase config with token
        const response = await fetch(`${API_BASE_URL}/api/firebase-config`, {
            headers: {
                'Authorization': `Bearer ${token}`
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

## 🎯 **Recommendation**

**Start with Option 1 (Session-Based Protection)** because:
- ✅ **No frontend changes needed**
- ✅ **Reasonable security** for most use cases
- ✅ **Easy to implement**
- ✅ **Blocks obvious abuse** (curl, Postman, etc.)

**Upgrade to Option 3 (JWT Tokens)** if you need stronger security.

**Remember:** The Firebase config contains public keys anyway, so the main goal is to prevent abuse, not absolute secrecy. 