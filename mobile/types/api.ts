import type { Pagination } from './entities';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: ApiError[];
  status_code: number;
  request_id?: string;
}

// ============================================================================
// Authentication API
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: import('./entities').User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  // Optional - may be fetched separately
  tenants?: import('./entities').Tenant[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface RegisterResponse {
  user: import('./entities').User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  message?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface VerifyEmailRequest {
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface SetNewPasswordRequest {
  token: string;
  password: string;
  password_confirmation: string;
}

// ============================================================================
// Product API
// ============================================================================

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  vendor_id?: string;
  status?: string;
  visibility?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  is_featured?: boolean;
  tags?: string[];
  sort_by?: 'name' | 'price' | 'created_at' | 'updated_at' | 'rating' | 'popularity';
  sort_order?: 'asc' | 'desc';
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  short_description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  status?: string;
  visibility?: string;
  product_type?: string;
  category_id?: string;
  vendor_id?: string;
  brand?: string;
  tags?: string[];
  images?: { url: string; alt_text?: string; position: number }[];
  inventory_quantity?: number;
  inventory_policy?: string;
  low_stock_threshold?: number;
  weight?: number;
  weight_unit?: string;
  is_featured?: boolean;
  is_taxable?: boolean;
  requires_shipping?: boolean;
  seo_title?: string;
  seo_description?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface BatchUpdateInventoryRequest {
  updates: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    adjustment_type: 'set' | 'increment' | 'decrement';
  }[];
}

// ============================================================================
// Order API
// ============================================================================

export interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  min_total?: number;
  max_total?: number;
  sort_by?: 'order_number' | 'total' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface CreateOrderRequest {
  customer_id?: string;
  items: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price?: number;
    properties?: Record<string, string>;
  }[];
  shipping_address: import('./entities').Address;
  billing_address?: import('./entities').Address;
  shipping_method_id?: string;
  payment_method_id?: string;
  coupon_codes?: string[];
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  notes?: string;
  internal_notes?: string;
  tags?: string[];
}

export interface FulfillOrderRequest {
  items?: {
    order_item_id: string;
    quantity: number;
  }[];
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
  notify_customer?: boolean;
}

export interface RefundOrderRequest {
  amount: number;
  reason?: string;
  restock_items?: boolean;
  items?: {
    order_item_id: string;
    quantity: number;
  }[];
  notify_customer?: boolean;
}

// ============================================================================
// Customer API
// ============================================================================

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tags?: string[];
  created_from?: string;
  created_to?: string;
  sort_by?: 'name' | 'email' | 'total_spent' | 'total_orders' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface CreateCustomerRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  accepts_marketing?: boolean;
  tags?: string[];
  notes?: string;
  address?: import('./entities').Address;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: string;
  status?: string;
}

// ============================================================================
// Cart API
// ============================================================================

export interface AddToCartRequest {
  product_id: string;
  variant_id?: string;
  quantity: number;
  properties?: Record<string, string>;
}

export interface UpdateCartItemRequest {
  item_id: string;
  quantity: number;
}

export interface ApplyCouponRequest {
  code: string;
}

export interface SetShippingAddressRequest {
  address: import('./entities').Address;
}

export interface CheckoutRequest {
  shipping_address: import('./entities').Address;
  billing_address?: import('./entities').Address;
  shipping_method_id: string;
  payment_method_id?: string;
  payment_token?: string;
  notes?: string;
  save_address?: boolean;
}

// ============================================================================
// Tenant API
// ============================================================================

export interface CreateTenantRequest {
  name: string;
  slug: string;
  business_type?: string;
  business_name?: string;
  phone?: string;
  address?: import('./entities').Address;
  subscription_plan?: string;
  billing_cycle?: 'monthly' | 'yearly';
  payment_provider?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  logo_url?: string;
  favicon_url?: string;
  settings?: Partial<import('./entities').TenantSettings>;
}

export interface CheckSlugResponse {
  available: boolean;
  suggestions?: string[];
}

// ============================================================================
// Analytics API
// ============================================================================

export interface AnalyticsParams {
  date_from: string;
  date_to: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  compare_to_previous?: boolean;
}

export interface SalesAnalytics {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  revenue_by_day: import('./entities').ChartDataPoint[];
  orders_by_day: import('./entities').ChartDataPoint[];
  revenue_by_category: {
    category: string;
    revenue: number;
    percentage: number;
  }[];
  top_products: import('./entities').TopProduct[];
  comparison?: {
    revenue_change: number;
    orders_change: number;
    aov_change: number;
  };
}

export interface CustomerAnalytics {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  customer_retention_rate: number;
  average_lifetime_value: number;
  customers_by_day: import('./entities').ChartDataPoint[];
  top_customers: {
    customer: import('./entities').Customer;
    total_spent: number;
    order_count: number;
  }[];
}
