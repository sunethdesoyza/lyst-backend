# Lyst Backend API

A robust NestJS-based backend API for managing lists and items with Firebase authentication and MongoDB persistence.

## 🚀 Overview

Lyst Backend is a modern, scalable API built with NestJS that provides comprehensive list management functionality. The application features Firebase authentication, MongoDB data persistence, and a sophisticated "forgotten items" system that automatically handles expired lists.

## 🏗️ Architecture

### Technology Stack

- **Framework**: NestJS (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK
- **Documentation**: Swagger/OpenAPI
- **Health Checks**: @nestjs/terminus
- **Validation**: class-validator & class-transformer

### Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── auth.controller.ts   # Auth endpoints
│   ├── auth.service.ts      # Firebase token verification
│   ├── auth.module.ts       # Auth module configuration
│   ├── strategies/          # Passport strategies
│   │   └── firebase.strategy.ts
│   ├── filters/            # Exception filters
│   │   └── auth-exception.filter.ts
│   └── dto/               # Data transfer objects
│       └── auth.dto.ts
├── config/                 # Configuration management
│   ├── configuration.ts    # App configuration interface
│   └── firebase.config.ts # Firebase service setup
├── list/                   # List management module
│   ├── list.controller.ts  # List CRUD endpoints
│   ├── list.service.ts     # Business logic
│   ├── list.module.ts      # List module configuration
│   ├── schemas/           # MongoDB schemas
│   │   ├── list.schema.ts
│   │   ├── item.schema.ts
│   │   └── forgotten-item.schema.ts
│   └── dto/              # Data transfer objects
│       ├── create-list.dto.ts
│       ├── list-response.dto.ts
│       ├── item.dto.ts
│       ├── forgotten-item.dto.ts
│       └── forgotten-item-response.dto.ts
├── health/                # Health check endpoints
│   └── health.controller.ts
├── app.module.ts          # Root module
├── app.controller.ts      # Root controller
├── app.service.ts         # Root service
└── main.ts               # Application bootstrap
```

## 🔧 Core Functionalities

### 1. Authentication & Authorization

- **Firebase Integration**: Secure authentication using Firebase Admin SDK
- **JWT Token Validation**: Custom Passport strategy for Firebase JWT tokens
- **User Management**: Automatic user verification and data retrieval
- **Protected Routes**: All list operations require valid authentication

### 2. List Management

#### List Operations
- **Create Lists**: Create new lists with categories, priorities, and expiry dates
- **Read Lists**: Retrieve all active lists for authenticated users
- **Update Lists**: Modify list properties (name, category, priority, etc.)
- **Archive Lists**: Soft delete lists with reason tracking (DELETED/EXPIRED)

#### List Properties
- **Name**: Required list identifier
- **Category**: List classification (e.g., GROCERIES, TASKS)
- **Priority**: Priority levels (LOW, MEDIUM, HIGH)
- **Expiry Date**: Optional expiration timestamp
- **Color**: Custom color coding
- **User Association**: Lists are tied to Firebase user IDs

### 3. Item Management

#### Item Operations
- **Add Items**: Add items to existing lists
- **Update Items**: Modify item properties (name, quantity, notes, completion status)
- **Delete Items**: Remove items from lists
- **Complete Items**: Mark items as completed

#### Item Properties
- **Name**: Required item identifier
- **Quantity**: Optional quantity specification
- **Notes**: Additional item details
- **Completion Status**: Track item completion
- **Timestamps**: Creation and update tracking

### 4. Forgotten Items System

The application features an intelligent "forgotten items" system that automatically handles expired lists:

#### Automatic Processing
- **Expiry Detection**: Automatically detects when lists expire
- **Item Preservation**: Incomplete items from expired lists are preserved as "forgotten items"
- **List Archiving**: Expired lists are automatically archived with "EXPIRED" reason

#### Forgotten Items Management
- **View Forgotten Items**: Retrieve all forgotten items for a user
- **Dismiss Items**: Remove forgotten items (by list or specific items)
- **Reactivate Lists**: Restore archived lists with forgotten items
- **Move to New List**: Create new lists from forgotten items

#### Forgotten Item Properties
- **Original Context**: Tracks original list ID and name
- **User Association**: Tied to specific users
- **Expiry Information**: Preserves original expiry date
- **Item Details**: Maintains all original item information

### 5. Health Monitoring

- **Health Checks**: Built-in health monitoring endpoints
- **Service Status**: Monitor application and database connectivity
- **API Documentation**: Comprehensive Swagger documentation

## 🔌 API Endpoints

### Authentication
- All endpoints require Firebase JWT token in Authorization header
- Format: `Bearer <firebase-jwt-token>`

### Lists
```
POST   /lists                    # Create new list
GET    /lists                    # Get all active lists
GET    /lists/:id               # Get specific list
PUT    /lists/:id               # Update list
DELETE /lists/:id               # Archive list
```

### Items
```
POST   /lists/:id/items         # Add item to list
PUT    /lists/:id/items/:itemId # Update item
DELETE /lists/:id/items/:itemId # Delete item
```

### Forgotten Items
```
GET    /lists/forgotten-items                    # Get all forgotten items
POST   /lists/forgotten-items/dismiss           # Dismiss forgotten items
POST   /lists/forgotten-items/reactivate        # Reactivate list with items
POST   /lists/forgotten-items/move-to-new       # Move items to new list
```

### Health
```
GET    /health                   # Application health check
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB instance
- Firebase project with service account

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/lyst

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### Installation

```bash
# Install dependencies
npm install

# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Testing
npm run test
npm run test:e2e
```

## 📚 API Documentation

Once the application is running, access the interactive API documentation at:

```
http://localhost:3000/api
```

The Swagger UI provides:
- Complete endpoint documentation
- Request/response examples
- Interactive testing interface
- Authentication token management

## 🔒 Security Features

- **Firebase Authentication**: Secure user authentication
- **JWT Token Validation**: Automatic token verification
- **User Isolation**: Data isolation per authenticated user
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## 🗄️ Database Schema

### List Schema
```typescript
{
  name: string,           // Required
  userId: string,         // Firebase user ID
  category: string,       // List category
  priority: string,       // LOW, MEDIUM, HIGH
  expiryDate: Date,      // Optional expiration
  color: string,         // Custom color
  isArchived: boolean,   // Archive status
  archivedReason: string, // DELETED or EXPIRED
  items: Item[],         // Embedded items
  timestamps: true       // Created/updated timestamps
}
```

### Item Schema
```typescript
{
  name: string,          // Required
  quantity: string,      // Optional
  notes: string,         // Optional
  isCompleted: boolean,  // Completion status
  timestamps: true       // Created/updated timestamps
}
```

### Forgotten Item Schema
```typescript
{
  name: string,              // Item name
  quantity: string,          // Original quantity
  notes: string,             // Original notes
  userId: string,            // User ID
  originalListId: string,    // Source list ID
  originalListName: string,  // Source list name
  expiryDate: Date,         // Original expiry date
  timestamps: true          // Created/updated timestamps
}
```

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Environment Setup

1. **MongoDB**: Set up MongoDB instance (local or cloud)
2. **Firebase**: Configure Firebase project and service account
3. **Environment Variables**: Configure all required environment variables
4. **SSL/TLS**: Configure HTTPS for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED license.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api`
- Review the health endpoint at `/health`
- Check application logs for detailed error information 