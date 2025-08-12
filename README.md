# Lyst Backend

A robust, scalable backend API built with NestJS for managing lists, items, and user authentication. This project provides a comprehensive solution for list management applications with Firebase authentication and MongoDB storage.

## 🚀 Features

- **Authentication & Authorization**
  - Firebase JWT-based authentication
  - User registration and login
  - Token verification and refresh
  - Role-based access control

- **List Management**
  - Create, read, update, and delete lists
  - Categorize lists with priority levels
  - Set expiry dates and color coding
  - Archive and restore lists

- **Item Management**
  - Add, update, and remove items from lists
  - Mark items as completed
  - Track item status and progress

- **Smart Features**
  - Forgotten items tracking
  - List reactivation capabilities
  - Category-based organization
  - Priority management
  - **List Sharing System**
    - Generate public sharing links for lists
    - Share links via any channel (WhatsApp, SMS, email, etc.)
    - Automatic user invitation for unregistered recipients
    - Share management and revocation
    - Real-time sharing status tracking

- **Developer Experience**
  - Comprehensive Swagger API documentation
  - Health check endpoints
  - Structured logging
  - Input validation and error handling

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK
- **Documentation**: Swagger/OpenAPI 3.0
- **Validation**: Class-validator & Class-transformer
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Firebase project with service account
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lyst-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
# Application Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/lyst

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key\n-----END PRIVATE KEY-----"
FIREBASE_API_KEY=your-api-key
```

### 4. Run the Application

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

### 5. Access the Application

- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api
- **OpenAPI JSON**: http://localhost:3000/api-json
- **Health Check**: http://localhost:3000/health

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Manual Docker Build

```bash
# Build the image
docker build -t lyst-backend .

# Run the container
docker run -p 3000:3000 --env-file .env lyst-backend
```

## 📚 API Documentation

The API is fully documented using Swagger/OpenAPI 3.0. Once the application is running, visit `/api` to explore the interactive API documentation.

### OpenAPI Specification

You can download the complete OpenAPI specification in JSON format:
- **Download OpenAPI JSON**: http://localhost:3000/api-json

This specification can be imported into:
- API design tools (Postman, Insomnia)
- Code generation tools (OpenAPI Generator, Swagger Codegen)
- API testing frameworks
- Documentation generators

### Key Endpoints

#### Authentication
- `POST /auth/login` - Login with Firebase token
- `POST /auth/login/credentials` - Login with email/password
- `POST /auth/register` - Register new user
- `POST /auth/verify` - Verify authentication token

#### Lists
- `GET /lists` - Get all user lists
- `POST /lists` - Create new list
- `GET /lists/:id` - Get specific list
- `PUT /lists/:id` - Update list
- `DELETE /lists/:id` - Archive list

#### Items
- `POST /lists/:id/items` - Add item to list
- `PUT /lists/:id/items/:itemId` - Update item
- `DELETE /lists/:id/items/:itemId` - Remove item

#### Categories
- `GET /lists/categories` - Get available categories

#### List Sharing
- `POST /sharing/share` - Create a sharing link for a list
- `POST /sharing/accept` - Accept a list share invitation
- `GET /sharing/received` - Get lists shared with the current user
- `GET /sharing/sent` - Get lists shared by the current user
- `DELETE /sharing/:shareId` - Revoke a list share
- `GET /sharing/invitation/:token` - Get invitation details (public)

## 🧪 Testing

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Test in watch mode
npm run test:watch
```

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Available Scripts

- `npm run build` - Build the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode

## 📁 Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Data transfer objects
│   ├── filters/         # Exception filters
│   └── strategies/      # Passport strategies
├── config/              # Configuration files
├── health/              # Health check endpoints
├── list/                # List management module
│   ├── dto/             # Data transfer objects
│   └── schemas/         # MongoDB schemas
└── main.ts              # Application entry point
```

## 🔐 Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore (if needed)
3. Go to Project Settings > Service Accounts
4. Generate a new private key
5. Download the JSON file and extract the required values
6. Update your `.env` file with the Firebase configuration

## 🗄️ MongoDB Setup

### Local MongoDB
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

### MongoDB Atlas
1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Update `MONGODB_URI` in your `.env` file

## 🚀 Deployment

### Production Considerations

- Set `NODE_ENV=production`
- Use environment-specific configuration files
- Configure proper CORS settings
- Set up monitoring and logging
- Use HTTPS in production
- Configure proper firewall rules

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Application port | No | 3000 |
| `NODE_ENV` | Environment mode | No | development |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes | - |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | Yes | - |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes | - |
| `FIREBASE_API_KEY` | Firebase API key | Yes | - |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the UNLICENSED license - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [API documentation](http://localhost:3000/api) when running locally
- Review the Firebase and MongoDB setup guides
- Check the troubleshooting documentation in the `docs/` folder

## 🔄 Changelog

### v0.0.1
- Initial release
- Basic CRUD operations for lists and items
- Firebase authentication integration
- MongoDB integration with Mongoose
- Swagger API documentation
- Docker support
- Health check endpoints 