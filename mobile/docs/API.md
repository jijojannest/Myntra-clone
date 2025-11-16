# Myntra Clone Mobile - API Documentation

This document provides comprehensive API information for the Myntra Clone mobile application.

## 🌐 Base URL

```
Development: http://localhost:5001/api/v1
Staging: https://staging-api.myntraclone.com/api/v1
Production: https://api.myntraclone.com/api/v1
```

## 🔐 Authentication

### Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "avatar": "https://example.com/avatar.jpg",
      "addresses": [...],
      "isEmailVerified": true,
      "createdAt": "2023-01-01T00:00:00Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

#### Social Login
```http
POST /auth/social-login
Content-Type: application/json

{
  "provider": "google",
  "token": "google_oauth_token",
  "email": "user@gmail.com",
  "name": "John Doe"
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer <refresh_token>

{
  "refreshToken": "jwt_refresh_token"
}
```

## 📦 Products API

### Get Products List
```http
GET /products?page=1&limit=20&category=clothing&brand=nike&sortBy=price_low_high
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `category` (string): Filter by category
- `subcategory` (string): Filter by subcategory
- `brand` (string[]): Filter by brand(s)
- `size` (string[]): Filter by size(s)
- `color` (string[]): Filter by color(s)
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `query` (string): Search query
- `sortBy` (string): Sort by field (relevance, price_low_high, newest_first, rating, popularity)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### Get Product Details
```http
GET /products/{productId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product_id",
    "name": "Nike Air Max",
    "brand": "Nike",
    "description": "Comfortable running shoes...",
    "price": 9999,
    "discountPrice": 7999,
    "images": ["https://example.com/image1.jpg"],
    "category": "footwear",
    "subcategory": "running",
    "tags": ["running", "sports", "nike"],
    "variants": [
      {
        "id": "variant_id",
        "size": "9",
        "color": "Black",
        "stock": 50,
        "sku": "NIKE-001",
        "price": 9999,
        "discountPrice": 7999,
        "images": ["https://example.com/variant1.jpg"]
      }
    ],
    "sizes": ["7", "8", "9", "10", "11"],
    "colors": ["Black", "White", "Red", "Blue"],
    "rating": 4.5,
    "reviews": 127,
    "inStock": true,
    "isNew": true,
    "isTrending": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-15T00:00:00Z"
  }
}
```

### Search Products
```http
GET /products/search?q=nike&category=footwear
```

### Get Filters
```http
GET /products/filters
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [...],
    "brands": [...],
    "sizes": [...],
    "colors": [...],
    "priceRanges": [...]
  }
}
```

## 🛒 Shopping Cart API

### Get Cart
```http
GET /cart
Authorization: Bearer <access_token>
```

### Add to Cart
```http
POST /cart/add
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "product_id",
  "variantId": "variant_id",
  "quantity": 2
}
```

### Update Cart Item
```http
PUT /cart/{itemId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove from Cart
```http
DELETE /cart/{itemId}
Authorization: Bearer <access_token>
```

### Clear Cart
```http
DELETE /cart/clear
Authorization: Bearer <access_token>
```

## 💝 Wishlist API

### Get Wishlist
```http
GET /wishlist
Authorization: Bearer <access_token>
```

### Add to Wishlist
```http
POST /wishlist
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "product_id",
  "variantId": "variant_id"
}
```

### Remove from Wishlist
```http
DELETE /wishlist/{itemId}
Authorization: Bearer <access_token>
```

### Move to Cart
```http
POST /wishlist/{itemId}/move-to-cart
Authorization: Bearer <access_token>
```

### Share Wishlist
```http
POST /wishlist/share
Authorization: Bearer <access_token>
```

## 📋 Orders API

### Get Orders
```http
GET /orders?page=1&limit=10&status=pending
Authorization: Bearer <access_token>
```

### Get Order Details
```http
GET /orders/{orderId}
Authorization: Bearer <access_token>
```

### Create Order
```http
POST /orders
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id",
      "variantId": "variant_id",
      "quantity": 1,
      "size": "9",
      "color": "Black"
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "landmark": "Near Railway Station",
    "phone": "+1234567890"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "landmark": "Near Railway Station",
    "phone": "+1234567890"
  },
  "paymentInfo": {
    "method": "credit_card",
    "amount": 9999,
    "currency": "INR"
  },
  "shippingMethod": {
    "name": "Standard Delivery",
    "price": 40,
    "estimatedDays": 5
  },
  "couponCode": "SAVE20",
  "giftWrap": false,
  "notes": "Please deliver carefully"
}
```

### Cancel Order
```http
POST /orders/{orderId}/cancel
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

### Track Order
```http
GET /orders/{orderId}/track
Authorization: Bearer <access_token>
```

## 👤 User Profile API

### Get Profile
```http
GET /user/profile
Authorization: Bearer <access_token>
```

### Update Profile
```http
PUT /user/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Address Management
```http
GET /user/addresses
POST /user/addresses
PUT /user/addresses/{addressId}
DELETE /user/addresses/{addressId}
Authorization: Bearer <access_token>
```

## 🤖 AI Virtual Try-On API

### Detect Pose
```http
POST /ai/detect-pose
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "poseLandmarks": [
      {"x": 100, "y": 150, "z": 0, "type": "nose_tip"},
      {"x": 110, "y": 160, "z": 0, "type": "left_eye"},
      // ... more landmarks
    ],
    "confidence": 0.95
  }
}
```

### Virtual Try-On
```http
POST /ai/try-on
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "product_id",
  "userImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "clothingImage": "https://example.com/clothing.jpg",
  "poseLandmarks": [...],
  "size": "M",
  "color": "Black"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resultImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "confidence": 0.87,
    "processingTime": 2.3,
    "fitScore": 0.92
  }
}
```

## 📱 Categories API

### Get Categories
```http
GET /categories
```

### Get Category Tree
```http
GET /categories/tree
```

### Get Category Details
```http
GET /categories/{categoryId}
```

## 🔔 Notifications API

### Get Notifications
```http
GET /notifications?page=1&limit=20
Authorization: Bearer <access_token>
```

### Mark as Read
```http
POST /notifications/{notificationId}/read
Authorization: Bearer <access_token>
```

### Update Notification Settings
```http
PUT /notifications/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "push": true,
  "email": true,
  "orderUpdates": true,
  "promotions": true,
  "priceDrops": true,
  "backInStock": true
}
```

## ⭐ Reviews API

### Get Product Reviews
```http
GET /products/{productId}/reviews?page=1&limit=10
```

### Add Review
```http
POST /products/{productId}/reviews
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rating": 5,
  "title": "Great product!",
  "comment": "Excellent quality and fit",
  "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."]
}
```

## 📊 Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2023-01-01T00:00:00Z"
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or expired token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid input data
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_SERVER_ERROR` (500): Server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable

## 🔐 Security

### Authentication
- All protected endpoints require JWT token in `Authorization` header
- Use `Bearer <token>` format
- Tokens expire after 24 hours

### Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user
- Rate limit headers included in responses

### CORS
- Proper CORS headers configured
- Allowed origins configured per environment

## 📱 Mobile-Specific Features

### Push Notification Tokens
```http
POST /notifications/token
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token": "firebase_device_token",
  "platform": "ios" // or "android"
}
```

### Device Information
```http
POST /analytics/device
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "deviceId": "unique_device_id",
  "platform": "ios",
  "osVersion": "15.0",
  "appVersion": "1.0.0",
  "manufacturer": "Apple",
  "model": "iPhone 14 Pro"
}
```

### Biometric Data
```http
POST /auth/biometrics
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "biometricType": "face_id",
  "publicKey": "base64_encoded_public_key"
}
```

## 📈 WebSocket API

For real-time updates (cart sync, order status, notifications):

### Connection
```
ws://api.myntraclone.com/ws
Authorization: Bearer <access_token>
```

### Events
- `cart_updated`: Cart items updated
- `order_status_changed`: Order status changed
- `new_notification`: New notification received
- `product_updated`: Product information updated

## 🧪 Testing

### Test Environment
```
Base URL: http://localhost:5001/api/v1
Test User: test@myntraclone.com
Test Password: test123
```

### Mock Data
The development environment includes mock data for testing without affecting production database.

## 📚 API Client Library

The mobile app includes a comprehensive API client (`src/utils/api.ts`) with:

- Automatic token management
- Request/response interceptors
- Error handling
- Offline request queuing
- Caching layer
- TypeScript types

## 🔗 Integration Examples

### Authentication Flow
```typescript
import { authService } from '../services/authService';

// Login
try {
  const result = await authService.login(email, password);
  console.log('User logged in:', result.user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Product Catalog
```typescript
import { useApi } from '../hooks/useApi';
import { endpoints } from '../utils/api';

const { data: products, loading, error } = useApi(
  () => apiClient.get(endpoints.PRODUCTS.LIST, {
    params: { category: 'clothing', page: 1, limit: 20 }
  })
);
```

### Virtual Try-On
```typescript
import { apiClient, endpoints } from '../utils/api';

const processVirtualTryOn = async (imageData, productId, poseLandmarks) => {
  const response = await apiClient.post(endpoints.AI.TRY_ON, {
    productId,
    userImage: imageData,
    clothingImage: productImage,
    poseLandmarks,
    size: selectedSize,
    color: selectedColor,
  });

  return response.data;
};
```

## 📞 Support

For API support and questions:
- Email: api-support@myntraclone.com
- Documentation: https://docs.myntraclone.com/api
- Status Page: https://status.myntraclone.com

---

*Last updated: January 2025*