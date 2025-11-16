# Myntra Clone - E-Commerce Platform with AI Virtual Try-On

A comprehensive e-commerce platform replicating Myntra's features with advanced AI-powered virtual try-on capabilities.

## Features

### Core E-Commerce Features
- **Product Catalog**: Advanced filtering, search, and product listings
- **User Authentication**: JWT-based secure authentication system
- **Shopping Cart**: Full cart management with persistence
- **Wishlist**: Save products for later purchase
- **Checkout Process**: Multi-step secure checkout with payment integration
- **Order Management**: Complete order tracking and management
- **Admin Panel**: Product and order management dashboard
- **Responsive Design**: Mobile-first responsive UI

### AI Virtual Try-On
- **Real-time Pose Detection**: Using MediaPipe and TensorFlow.js
- **Clothing Overlay**: Virtual clothing placement on live video
- **Size Recommendation**: AI-powered size suggestions
- **Multiple Clothing Types**: Support for various clothing categories
- **Social Sharing**: Share virtual try-on experiences

## Technology Stack

### Frontend (Client)
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **TensorFlow.js** for client-side AI processing
- **MediaPipe** for pose detection

### Backend (Server)
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Redis** for caching

### AI Service
- **Python** with FastAPI
- **OpenCV** for image processing
- **MediaPipe** for pose detection
- **NumPy** for numerical operations

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for development environment
- **Cloudinary** for image storage
- **MongoDB Atlas** for production database

## Quick Start

### Prerequisites
- Node.js 16+
- Python 3.9+
- Docker & Docker Compose
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd myntra-clone
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   cp ai-service/.env.example ai-service/.env

   # Fill in your API keys and configurations
   ```

4. **Start Development Environment**
   ```bash
   # Using Docker Compose (Recommended)
   docker-compose up

   # Or individually
   npm run dev
   ```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000
- **MongoDB**: mongodb://localhost:27017

## Project Structure

```
myntra-clone/
├── client/                 # React frontend application
├── server/                 # Node.js/Express backend API
├── ai-service/            # Python AI service for virtual try-on
├── shared/                # Shared types and utilities
├── uploads/               # Local file uploads (development)
├── docker-compose.yml     # Development environment setup
└── package.json           # Root package configuration
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Product Endpoints
- `GET /api/products` - Get products with filtering
- `GET /api/products/:id` - Get single product
- `GET /api/products/search` - Search products

### Cart Endpoints
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item

### AI Virtual Try-On Endpoints
- `POST /api/ai/process-clothing` - Process clothing image
- `POST /api/ai/generate-overlay` - Generate clothing overlay

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run client tests
npm run test:client

# Run server tests
npm run test:server
```

### Building for Production
```bash
# Build client for production
npm run build

# Start production server
npm start
```

## Environment Variables

### Server (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/myntra_clone
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AI_SERVICE_URL=http://localhost:8000
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository.