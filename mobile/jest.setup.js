import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve('mockURL')),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve()),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1,
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
  Version: '14.0',
}));

// Mock NetInfo
jest.mock('@react-native-netinfo/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
  })),
}));

// Mock Permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(() => Promise.resolve('granted')),
  request: jest.fn(() => Promise.resolve('granted')),
  openSettings: jest.fn(),
  PERMISSIONS: {
    CAMERA: 'android.permission.CAMERA',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  },
}));

// Mock Camera
jest.mock('react-native-camera', () => ({
  Constants: {
    Aspect: { fill: 'cover' },
    BarCodeType: { qr: 'QR_CODE' },
    CaptureMode: { still: 'still' },
    CaptureQuality: { high: 'high' },
    CaptureTarget: { cameraRoll: 'cameraRoll' },
    FlashMode: { on: 'on', off: 'off' },
    Orientation: { portrait: 'portrait' },
    TorchMode: { on: 'on', off: 'off' },
    Type: { back: 'back' },
  },
}));

// Mock Image Picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({
    assets: [{
      uri: 'mock-image-uri',
      fileName: 'mock-image.jpg',
      fileSize: 12345,
      width: 300,
      height: 400,
      type: 'image/jpeg',
    }],
  })),
  launchCamera: jest.fn(() => Promise.resolve({
    assets: [{
      uri: 'mock-camera-uri',
      fileName: 'mock-camera.jpg',
      fileSize: 23456,
      width: 400,
      height: 500,
      type: 'image/jpeg',
    }],
  })),
}));

// Mock Share
jest.mock('react-native-share', () => ({
  open: jest.fn(() => Promise.resolve({
    app: 'com.apple.UIActivity.ActivityTypePostToFacebook',
  })),
  shareSingle: jest.fn(() => Promise.resolve({
    app: 'com.apple.UIActivity.ActivityTypePostToTwitter',
  })),
}));

// Mock Device Info
jest.mock('react-native-device-info', () => ({
  getSystemName: jest.fn(() => Promise.resolve('iOS')),
  getVersion: jest.fn(() => Promise.resolve('1.0.0')),
  getBuildNumber: jest.fn(() => Promise.resolve('1')),
  isEmulator: jest.fn(() => Promise.resolve(false)),
}));

// Mock Biometrics
jest.mock('react-native-biometrics', () => ({
  isSensorAvailable: jest.fn(() => Promise.resolve({ available: true })),
  createKeys: jest.fn(() => Promise.resolve({ publicKey: 'mock-public-key' })),
  createSignature: jest.fn(() => Promise.resolve({ success: true })),
  deleteKeys: jest.fn(() => Promise.resolve()),
}));

// Mock Localize
jest.mock('react-native-localize', () => ({
  t: jest.fn((key, options) => {
    if (options && options.defaultValue) {
      return options.defaultValue;
    }
    return key;
  }),
  getCurrency: jest.fn(() => ({
    currencyCode: 'USD',
  })),
}));

// Mock Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => ({
  getFontFamily: jest.fn(() => 'MaterialIcons'),
  loadFont: jest.fn(() => Promise.resolve()),
}));