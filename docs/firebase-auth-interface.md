# Firebase Authentication Interface

This document provides a comprehensive guide to the Firebase authentication interface implemented in the Lyst Backend API.

## 🔐 **Available Endpoints**

### **1. User Authentication**

#### **POST /auth/login**
Authenticate user with Firebase ID token.

```bash
curl -X POST http://localhost:3080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user123456789",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastSignInTime": "2024-01-01T12:00:00.000Z"
  },
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "expiresAt": "2024-01-01T01:00:00.000Z"
}
```

#### **POST /auth/register**
Create a new user account.

```bash
curl -X POST http://localhost:3080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "displayName": "New User"
  }'
```

**Response:**
```json
{
  "uid": "newuser123456789",
  "email": "newuser@example.com",
  "displayName": "New User",
  "emailVerified": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastSignInTime": "2024-01-01T00:00:00.000Z"
}
```

#### **POST /auth/verify**
Verify a Firebase ID token.

```bash
curl -X POST http://localhost:3080/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user123456789",
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastSignInTime": "2024-01-01T12:00:00.000Z"
  },
  "expiresAt": "2024-01-01T01:00:00.000Z",
  "issuer": "https://securetoken.google.com/your-project-id"
}
```

### **2. User Management (Requires Authentication)**

#### **GET /auth/user/:uid**
Get user information by UID.

```bash
curl -X GET http://localhost:3080/auth/user/user123456789 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6..."
```

#### **GET /auth/users**
List all users (with pagination).

```bash
curl -X GET "http://localhost:3080/auth/users?maxResults=10" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6..."
```

#### **DELETE /auth/user/:uid**
Delete a user account.

```bash
curl -X DELETE http://localhost:3080/auth/user/user123456789 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6..."
```

#### **POST /auth/user/:uid/revoke-tokens**
Revoke all refresh tokens for a user.

```bash
curl -X POST http://localhost:3080/auth/user/user123456789/revoke-tokens \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6..."
```

## 🚀 **Client-Side Integration Examples**

### **JavaScript/TypeScript Client**

```typescript
class FirebaseAuthClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3080') {
    this.baseUrl = baseUrl;
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
  }

  // Get headers with authentication
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Login with Firebase token
  async login(idToken: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.idToken;
    return data;
  }

  // Register new user
  async register(email: string, password: string, displayName?: string) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Verify token
  async verifyToken(idToken: string) {
    const response = await fetch(`${this.baseUrl}/auth/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error(`Token verification failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user information
  async getUser(uid: string) {
    const response = await fetch(`${this.baseUrl}/auth/user/${uid}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Get user failed: ${response.statusText}`);
    }

    return response.json();
  }

  // List users
  async listUsers(maxResults?: number, nextPageToken?: string) {
    const params = new URLSearchParams();
    if (maxResults) params.append('maxResults', maxResults.toString());
    if (nextPageToken) params.append('nextPageToken', nextPageToken);

    const response = await fetch(`${this.baseUrl}/auth/users?${params}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`List users failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete user
  async deleteUser(uid: string) {
    const response = await fetch(`${this.baseUrl}/auth/user/${uid}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Delete user failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Revoke user tokens
  async revokeUserTokens(uid: string) {
    const response = await fetch(`${this.baseUrl}/auth/user/${uid}/revoke-tokens`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Revoke tokens failed: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### **Usage Example**

```typescript
// Initialize client
const authClient = new FirebaseAuthClient('http://localhost:3080');

// Example: Login flow
async function loginWithFirebase() {
  try {
    // Get Firebase ID token from client-side Firebase Auth
    const idToken = await firebase.auth().currentUser?.getIdToken();
    
    if (!idToken) {
      throw new Error('No Firebase token available');
    }

    // Login with our backend
    const result = await authClient.login(idToken);
    console.log('Login successful:', result.user);
    
    // Now you can use authenticated endpoints
    const userInfo = await authClient.getUser(result.user.uid);
    console.log('User info:', userInfo);
    
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Example: Register new user
async function registerUser() {
  try {
    const result = await authClient.register(
      'newuser@example.com',
      'password123',
      'New User'
    );
    console.log('User registered:', result);
  } catch (error) {
    console.error('Registration failed:', error);
  }
}

// Example: Verify token
async function verifyToken(idToken: string) {
  try {
    const result = await authClient.verifyToken(idToken);
    console.log('Token verified:', result);
  } catch (error) {
    console.error('Token verification failed:', error);
  }
}
```

## 🔧 **Error Handling**

The API returns appropriate HTTP status codes and error messages:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Invalid or missing authentication token
- **404 Not Found**: User not found
- **500 Internal Server Error**: Server-side error

**Error Response Format:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

## 🔒 **Security Considerations**

1. **Token Validation**: All tokens are verified using Firebase Admin SDK
2. **Authentication Required**: Protected endpoints require valid Firebase ID tokens
3. **Token Expiration**: Tokens are checked for expiration automatically
4. **User Isolation**: Users can only access their own data (implement additional checks as needed)

## 📚 **Swagger Documentation**

Access the interactive API documentation at:
```
http://localhost:3080/api
```

This provides:
- Complete endpoint documentation
- Request/response examples
- Interactive testing interface
- Authentication token management

## 🚀 **Next Steps**

1. **Client Integration**: Use the provided client examples to integrate with your frontend
2. **Custom Claims**: Implement custom user claims for role-based access control
3. **Email Verification**: Add email verification workflows
4. **Password Reset**: Implement password reset functionality
5. **Social Login**: Add support for Google, Facebook, etc. (handled by Firebase Auth) 