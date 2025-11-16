# 📚 Myntra Clone API Documentation

## 🔍 Interactive API Documentation

This repository includes comprehensive interactive API documentation using **Swagger/OpenAPI 3.0** with a live testing interface.

## 🚀 Quick Start

### 1. Start API Documentation Server
```bash
# Navigate to mobile directory
cd Myntra-clone/mobile

# Start the documentation server
npm run start-docs

# Alternatively
npm run serve
```

### 2. Access Documentation
- **Local URL**: http://localhost:8000
- **Interactive Swagger UI**: http://localhost:8000/index.html

## 📖 Documentation Features

### ✨ Interactive API Testing
- **Live Testing**: Test all API endpoints directly from your browser
- **Request Builder**: Build requests with proper parameters
- **Response Preview**: See actual API responses
- **Authentication**: Include JWT tokens for protected endpoints

### 🏷️ Comprehensive Coverage
- **Authentication**: Login, registration, social auth, biometrics
- **Products**: Catalog, search, filtering, details
- **Shopping Cart**: Add, update, remove items
- **Wishlist**: Save products for later
- **Orders**: Create, track, manage orders
- **AI Virtual Try-On**: Pose detection and virtual fitting
- **User Profile**: Manage account and preferences
- **Notifications**: Push and in-app notifications

### 📱 Mobile-Specific Endpoints
- Push notification token management
- Device information analytics
- Biometric authentication
- Offline synchronization support

## 🔐 Authentication Testing

### Test Account
```
Email: test@myntraclone.com
Password: test123
```

### Social Authentication
- **Google**: OAuth 2.0 integration
- **Facebook**: Social media login
- **Apple**: Native iOS authentication
- **Biometrics**: Face ID, Touch ID, Fingerprint

## 🎯 Key Features

### 1. **Smart Request Builder**
- Auto-completion for parameters
- Required field validation
- Example values provided
- Format validation

### 2. **Real-time Testing**
- Instant API responses
- Error code explanations
- Success rate monitoring
- Response time tracking

### 3. **Security Testing**
- JWT token inclusion
- Permission testing
- Error scenario simulation
- Rate limiting awareness

### 4. **AI Virtual Try-On Testing**
- Upload base64 images
- Pose detection testing
- Virtual try-on processing
- Result image generation

## 📊 API Structure

### Base URLs
- **Development**: `http://localhost:5001/api/v1`
- **Staging**: `https://staging-api.myntraclone.com/api/v1`
- **Production**: `https://api.myntraclone.com/api/v1`

### Rate Limits
- **Public Endpoints**: 100 requests/minute
- **Authenticated**: 1000 requests/hour
- **AI Processing**: 10 requests/minute

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed",
  "timestamp": "2023-01-01T00:00:00Z"
}
```

## 🧪 Testing Workflows

### 1. **Authentication Flow Test**
```bash
# 1. Register new user
POST /auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}

# 2. Login with credentials
POST /auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

# 3. Use JWT token for authenticated requests
GET /cart
Authorization: Bearer <jwt_token>
```

### 2. **Product Catalog Testing**
```bash
# Browse products with filters
GET /products?category=clothing&brand=nike&size=M

# Search products
GET /products/search?q=running%20shoes

# Get product details
GET /products/{productId}
```

### 3. **Shopping Cart Testing**
```bash
# Add item to cart
POST /cart/add
{
  "productId": "prod_123",
  "variantId": "var_456",
  "quantity": 2
}

# View cart
GET /cart

# Update quantity
PUT /cart/{itemId}
{
  "quantity": 3
}
```

### 4. **AI Virtual Try-On Testing**
```bash
# Detect pose
POST /ai/detect-pose
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}

# Virtual try-on
POST /ai/try-on
{
  "productId": "prod_123",
  "userImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "size": "M",
  "color": "Black"
}
```

## 🔧 Development Tools

### **Swagger UI Features**
- 📝 **Request History**: Track previous API calls
- 🔍 **Search Filters**: Find endpoints quickly
- 📱 **Mobile View**: Optimized for mobile testing
- 🌙 **Dark Mode**: Comfortable viewing in low light

### **Code Generation**
- **cURL Commands**: Copy-paste ready API calls
- **JavaScript/TypeScript**: Client code snippets
- **React Native Hooks**: Pre-built API integration
- **Postman Collection**: Export for advanced testing

### **Documentation Export**
- **PDF**: Complete API reference
- **Markdown**: Development documentation
- **OpenAPI JSON**: Machine-readable spec
- **Collection**: Multiple format exports

## 🔒 Security & Best Practices

### **Authentication**
- JWT tokens with 24-hour expiry
- Automatic refresh mechanism
- Secure token storage
- Permission-based access control

### **Error Handling**
- Consistent error response format
- Detailed error codes
- User-friendly messages
- Security error masking

### **Data Validation**
- Input sanitization
- Type validation
- Required field checking
- Format validation

## 📈 Performance Metrics

### **Response Times**
- **Authentication**: <200ms
- **Product Catalog**: <500ms
- **Search**: <800ms
- **AI Processing**: 2-5 seconds

### **Reliability**
- **Uptime**: 99.9%
- **Error Rate**: <0.1%
- **Success Rate**: >99.5%
- **Response Caching**: CDN enabled

## 🚀 Advanced Features

### **WebSocket Support**
- Real-time order updates
- Live cart synchronization
- Push notification testing
- Multi-device sync

### **Offline Testing**
- Request queuing simulation
- Cache testing scenarios
- Sync validation testing
- Network failure simulation

### **Analytics Integration**
- Request logging
- Performance tracking
- User behavior analytics
- Error rate monitoring

## 📞 Support & Resources

### **Documentation Links**
- **Swagger UI**: http://localhost:8000/index.html
- **OpenAPI Spec**: http://localhost:8000/swagger.yaml
- **Mobile API Docs**: `./docs/API.md`
- **Social Auth Guide**: `./docs/SocialAuthentication.md`

### **Test Data**
- **Sample Products**: 1000+ realistic products
- **Mock Users**: Various user profiles
- **Test Images**: AI try-on sample images
- **Order History**: Sample order data

### **Helpful Tools**
```bash
# Generate test JWT token
npm run generate:test-token

# Reset test database
npm run reset:test-data

# Validate OpenAPI spec
npm run validate:api-spec

# Generate Postman collection
npm run generate:postman
```

## 🎯 Getting Started Checklist

- [ ] Start documentation server: `npm run start-docs`
- [ ] Open http://localhost:8000 in browser
- [ ] Test authentication endpoints
- [ ] Explore product catalog APIs
- [ ] Try AI virtual try-on features
- [ ] Test with real mobile app
- [ ] Review error handling scenarios
- [ ] Export documentation for team

## 🔗 Integration Guides

### **React Native Integration**
See `./docs/API.md` for comprehensive integration examples with:
- Custom hooks for API calls
- Error handling patterns
- Token management
- Offline support

### **Postman Integration**
1. Open Swagger UI: http://localhost:8000/index.html
2. Click "Download Postman Collection"
3. Import into Postman
4. Test with Postman's advanced features

### **Automated Testing**
```bash
# Run API test suite
npm run test:api

# Generate test coverage report
npm run test:api-coverage

# Run performance tests
npm run test:performance
```

---

**🎉 Ready to Test!**

The interactive API documentation provides everything you need to test, integrate, and understand the Myntra Clone API. Start the documentation server and explore the comprehensive interface today!

For additional support, check the detailed documentation files in the `./docs/` directory.