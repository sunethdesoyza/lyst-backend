# Firebase Authentication Troubleshooting Guide

## Issue: Google Sign-In Button Not Visible on Remote Deployment

### 🔍 **Step 1: Check Browser Console**

Open your browser's Developer Tools (F12) and check the Console tab for any error messages. Look for:

- `🔍 Loading Firebase configuration...`
- `📡 Response status: 200` (or error status)
- `✅ Firebase config loaded:` followed by config object
- `🔥 Initializing Firebase...`
- `✅ Firebase initialized successfully`
- `🔧 Setting up Google Sign-In...`
- `✅ Google Sign-In button created successfully`

### 🔍 **Step 2: Test Firebase Config Endpoint**

Test if the Firebase config endpoint is accessible on your remote server:

```bash
curl -v https://your-remote-server.com/api/firebase-config
```

**Expected Response:**
```json
{
  "apiKey": "your-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project-id",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef",
  "measurementId": "G-XXXXXXXXXX"
}
```

### 🔍 **Step 3: Check Environment Variables**

Ensure these environment variables are set on your remote server:

```bash
# Required
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key

# Optional (will use defaults if not set)
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 🔍 **Step 4: Common Issues & Solutions**

#### **Issue 1: 404 Error on `/api/firebase-config`**
- **Cause**: AppController not registered in AppModule
- **Solution**: Ensure `AppController` and `AppService` are imported and registered in `src/app.module.ts`

#### **Issue 2: 500 Error on `/api/firebase-config`**
- **Cause**: Missing environment variables
- **Solution**: Set `FIREBASE_PROJECT_ID` and `FIREBASE_API_KEY` environment variables

#### **Issue 3: CORS Error**
- **Cause**: Cross-origin request blocked
- **Solution**: Ensure CORS is enabled in your NestJS app (should be enabled by default)

#### **Issue 4: Network Error**
- **Cause**: Server not accessible or wrong URL
- **Solution**: Check server URL and network connectivity

### 🔍 **Step 5: Debug Information**

The enhanced version now includes detailed console logging:

1. **Firebase Config Loading**: Shows when config loading starts and response status
2. **Firebase Initialization**: Shows when Firebase is being initialized
3. **Google Sign-In Setup**: Shows when the button is being created
4. **Error Details**: Shows specific error messages with context

### 🔍 **Step 6: Manual Testing**

If the button still doesn't appear, manually test the Firebase config:

```javascript
// In browser console
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(config => {
    console.log('Firebase config:', config);
    // Check if all required fields are present
    console.log('API Key present:', !!config.apiKey);
    console.log('Project ID present:', !!config.projectId);
  })
  .catch(error => console.error('Error:', error));
```

### 🔍 **Step 7: Fallback Mechanism**

The enhanced version includes a 5-second timeout that will show an error message if Firebase config fails to load:

```
⏰ Firebase configuration failed to load. Please check your server configuration.
```

### 🔍 **Step 8: Server Logs**

Check your server logs for any backend errors:

```bash
# If using Docker
docker-compose logs lyst-backend

# Look for:
# - AppController route registration
# - Firebase config endpoint errors
# - Environment variable issues
```

### 🔍 **Step 9: Environment Variable Verification**

Create a simple test endpoint to verify environment variables:

```typescript
@Get('api/debug/env')
getEnvironmentDebug() {
  return {
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasApiKey: !!process.env.FIREBASE_API_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
    apiKeyLength: process.env.FIREBASE_API_KEY?.length || 0
  };
}
```

### 🎯 **Quick Fix Checklist**

- [ ] Environment variables set on remote server
- [ ] Firebase config endpoint returns 200 OK
- [ ] No JavaScript errors in browser console
- [ ] CORS enabled on server
- [ ] AppController properly registered
- [ ] Server logs show no errors

### 📞 **Still Having Issues?**

If the problem persists after following these steps:

1. **Share the browser console output** (with sensitive data redacted)
2. **Share the server logs** (with sensitive data redacted)
3. **Test the Firebase config endpoint** and share the response
4. **Check if the issue is environment-specific** (dev vs production) 