import '@testing-library/jest-native/extend-expect';

// Mock axios globally to prevent network requests
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: {
      headers: {
        common: {},
      },
    },
  })),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  isAxiosError: jest.fn(() => false),
}));

// Mock expo modules
jest.mock('expo-font');
jest.mock('expo-asset');

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    Ionicons: View,
    MaterialIcons: View,
    FontAwesome: View,
    Feather: View,
    AntDesign: View,
    Entypo: View,
    MaterialCommunityIcons: View,
    createIconSet: () => View,
  };
});
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:8080',
    },
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => '/',
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
    GestureHandlerRootView: View,
  };
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  useNetInfo: () => ({ isConnected: true, isInternetReachable: true }),
}));

// Mock secure-storage utility
jest.mock('./lib/utils/secure-storage', () => ({
  secureStorage: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clearAuthData: jest.fn(() => Promise.resolve()),
    setAuthTokens: jest.fn(() => Promise.resolve()),
    getAuthTokens: jest.fn(() => Promise.resolve(null)),
  },
}));

// Mock API client
jest.mock('./lib/api/client', () => ({
  apiClient: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

// Mock auth API
jest.mock('./lib/api/auth', () => ({
  authApi: {
    login: jest.fn(() => Promise.resolve({ user: {}, tokens: {} })),
    register: jest.fn(() => Promise.resolve({ user: {}, tokens: {} })),
    logout: jest.fn(() => Promise.resolve()),
    refreshToken: jest.fn(() => Promise.resolve({ tokens: {} })),
    forgotPassword: jest.fn(() => Promise.resolve()),
    resetPassword: jest.fn(() => Promise.resolve()),
    verifyEmail: jest.fn(() => Promise.resolve()),
    resendVerification: jest.fn(() => Promise.resolve()),
  },
}));

// Mock cart API
jest.mock('./lib/api/cart', () => ({
  cartApi: {
    get: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    addItem: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    updateItem: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    removeItem: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    clear: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    applyCoupon: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    removeCoupon: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    setShippingAddress: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    setBillingAddress: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    setShippingMethod: jest.fn(() => Promise.resolve({ items: [], subtotal: 0, total: 0 })),
    checkout: jest.fn(() => Promise.resolve({ id: 'order-1', order_number: 'ORD-001' })),
  },
}));

// Configure fake timers globally with legacy mode for better compatibility
jest.useFakeTimers({ legacyFakeTimers: true });

// Configure testing library to not wait for async operations
beforeEach(() => {
  jest.useFakeTimers({ legacyFakeTimers: true });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Global setup
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
