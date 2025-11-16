// Polyfill for Node.js required by some dependencies
require('es6-polyfill').configure({
  targets: {
    node: 'current',
  },
  apply: ['es6', 'es7'],
});

// Configure Jest
require('@testing-library/jest-dom').configure({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/utils/setupTests.js'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(ts|tsx|js)',
  ],
  collectCoverageFrom: 'src',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.(css|scss|sass)$': 'jest-transform-stub',
  '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/node_modules/$1/src',
    '^(.*)$': '<rootDir>/node_modules/$1',
  },
});

// Mock fetch for testing
Object.defineProperty(window, 'fetch', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage for testing
const sessionStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/', search: '' }),
  useParams: jest.fn(() => ({ id: '1' })),
  Link: ({ children, ...props }) => (
    <a href={props.to || '#'} {...props}>
      {children}
    </a>
  ),
}));

// Mock Camera API
const mockMediaDevices = {
  getUserMedia: jest.fn(() =>
    Promise.resolve({
      getTracks: () => [
        { getSettings: () => Promise.resolve({}) },
      stop: () => {},
      applyConstraints: () => Promise.resolve([]),
        getCapabilities: () => Promise.resolve({}),
      getConstraints: () => Promise.resolve({
        video: { facingMode: 'user' },
      }),
    }),
    }),
  enumerateDevices: jest.fn(() =>
    Promise.resolve([
      { deviceId: '1', kind: 'videoinput', label: 'Mock Camera' },
    ]),
  }),
};

Object.defineProperty(navigator, 'mediaDevices', {
  value: mockMediaDevices,
});

// Mock Canvas API
const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    fillText: jest.fn(),
    drawImage: jest.fn(),
    toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
  })),
  createObject2D: jest.fn(() => ({
    getContext: jest.fn(),
  })),
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext,
});

Object.defineProperty(HTMLCanvasElement, 'getContext', {
  value: mockCanvas.getContext,
});

// Create mock canvas element
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: jest.fn(() => Object.assign({}, mockCanvas)),
});

// Export test utilities
export const createMockProduct = (overrides = {}) => ({
  _id: '1',
  name: 'Test Product',
  description: 'A test product for unit testing',
  brand: 'Test Brand',
  category: 'Test Category',
  subcategory: 'Test Subcategory',
  price: 100,
  discountPrice: 80,
  sizes: ['S', 'M', 'L', 'XL'],
  colors: [
    { name: 'Red', hex: '#FF0000', images: ['/red1.jpg'] },
    { name: 'Blue', hex: '#0000FF', images: ['/blue1.jpg'] },
  ],
  images: ['/product1.jpg'],
  tryOnImages: ['/tryon1.jpg'],
  specifications: {
    material: 'Cotton',
    care: 'Machine wash',
    fit: 'regular',
  },
  rating: 4.5,
  reviewCount: 12,
  stock: { S: 10, M: 15, L: 20, XL: 5 },
  tags: ['test', 'product'],
  isActive: true,
  featured: false,
  newArrival: true,
  bestSeller: false,
  seo: {
    title: 'Test Product - Myntra Clone',
    description: 'A high-quality test product',
    keywords: ['test', 'product'],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  _id: '1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'hashedpassword',
  phone: '+1234567890',
  avatar: '/avatar.jpg',
  addresses: [
    {
      _id: '1',
      type: 'home',
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      isDefault: true,
    },
  ],
  preferences: {
    sizes: { shirt: 'M', pants: '32' },
    brands: ['TestBrand'],
    categories: ['TestCategory'],
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  isActive: true,
  isEmailVerified: true,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCart = (overrides = {}) => ({
  _id: '1',
  userId: '1',
  items: [
    {
      productId: '1',
      name: 'Test Product',
      price: 100,
      discountPrice: 80,
      size: 'M',
      color: 'Red',
      quantity: 2,
      image: '/product1.jpg',
      maxQuantity: 15,
      addedAt: new Date(),
    },
  ],
  totalItems: 1,
  totalPrice: 200,
  totalDiscountPrice: 160,
  discountAmount: 0,
  lastUpdated: new Date(),
  ...overrides,
});

export const renderWithProviders = (component: React.ComponentType, { initialProps = {}, ...renderOptions } = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
  };

  return (
    <Wrapper>
      {component(renderOptions, initialProps)}
    </Wrapper>
  );
};