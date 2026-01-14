// Navigation types for type-safe routing

export type RootStackParamList = {
  '(auth)': undefined;
  '(onboarding)': undefined;
  '(tabs)': undefined;
  success: { tenantId: string; storeName: string };
};

export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  'verify-email': { email?: string };
  'forgot-password': undefined;
  'reset-password': { token: string };
};

export type OnboardingStackParamList = {
  'store-setup': undefined;
  'plan-selection': undefined;
  'business-details': undefined;
  'payment-setup': undefined;
  'storefront-config': undefined;
};

export type AdminTabParamList = {
  dashboard: undefined;
  products: undefined;
  orders: undefined;
  customers: undefined;
  settings: undefined;
};

export type StorefrontTabParamList = {
  home: undefined;
  browse: undefined;
  cart: undefined;
  account: undefined;
};

export type ProductStackParamList = {
  index: undefined;
  '[id]': { id: string };
  create: undefined;
  edit: { id: string };
};

export type OrderStackParamList = {
  index: undefined;
  '[id]': { id: string };
  create: undefined;
};

export type CustomerStackParamList = {
  index: undefined;
  '[id]': { id: string };
  create: undefined;
};

// Deep link params
export type DeepLinkParams = {
  tenant?: string;
  product?: string;
  order?: string;
  category?: string;
  action?: 'view' | 'edit' | 'create';
};
