// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string; // Full name from API
  phone?: string;
  avatar_url?: string;
  avatar?: string; // Alias for avatar_url
  profile_picture_url?: string; // Another alias from API
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  // Tenant association
  tenant_id?: string;
  store_id?: string;
  is_active?: boolean;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'customer';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
}

// ============================================================================
// Tenant & Multi-tenancy
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  favicon_url?: string;
  owner_id: string;
  status: TenantStatus;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  settings: TenantSettings;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TenantStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface TenantSettings {
  theme: TenantTheme;
  currency: string;
  timezone: string;
  language: string;
  features: TenantFeatures;
  notifications: NotificationSettings;
  checkout: CheckoutSettings;
  shipping: ShippingSettings;
  taxes: TaxSettings;
}

export interface TenantTheme {
  primary_color: string;
  primary_dark: string;
  primary_light: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family?: string;
  border_radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export interface TenantFeatures {
  multi_vendor: boolean;
  reviews: boolean;
  wishlist: boolean;
  compare: boolean;
  coupons: boolean;
  loyalty_points: boolean;
  gift_cards: boolean;
  subscriptions: boolean;
  digital_products: boolean;
}

export interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  order_updates: boolean;
  marketing: boolean;
  newsletter?: boolean;
}

export interface CheckoutSettings {
  guest_checkout: boolean;
  require_phone: boolean;
  require_address: boolean;
  show_order_notes?: boolean;
  terms_required?: boolean;
  min_order_amount?: number;
  max_order_amount?: number;
}

export interface ShippingSettings {
  free_shipping_threshold?: number;
  default_shipping_method?: string;
  allow_pickup?: boolean;
}

export interface TaxSettings {
  tax_inclusive?: boolean;
  auto_calculate?: boolean;
  include_in_price?: boolean;
  tax_rate?: number;
  tax_id?: string;
}

// ============================================================================
// Products & Catalog
// ============================================================================

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  currency?: string;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  product_type?: ProductType;
  category_id?: string;
  category?: Category;
  vendor_id?: string;
  vendor?: Vendor;
  brand?: string;
  tags?: string[];
  images?: ProductImage[];
  variants?: ProductVariant[];
  options?: ProductOption[];
  inventory_quantity?: number;
  inventory_policy?: InventoryPolicy;
  low_stock_threshold?: number;
  weight?: number;
  weight_unit?: WeightUnit;
  dimensions?: ProductDimensions;
  seo_title?: string;
  seo_description?: string;
  is_featured?: boolean;
  is_taxable?: boolean;
  requires_shipping?: boolean;
  metadata?: Record<string, unknown>;
  rating_average?: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;
  // Aliases for backward compatibility
  productId?: string;
  track_inventory?: boolean;
  quantity?: number;
  is_active?: boolean;
  image?: string;
  variantId?: string;
  in_stock?: boolean;
  rating?: number;
  review_count?: number;
}

export type ProductStatus = 'active' | 'draft' | 'archived';
export type ProductVisibility = 'visible' | 'hidden' | 'catalog' | 'search';
export type ProductType = 'simple' | 'variable' | 'digital' | 'service' | 'bundle';
export type InventoryPolicy = 'track' | 'dont_track' | 'continue_selling';
export type WeightUnit = 'kg' | 'g' | 'lb' | 'oz';

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  alt?: string;
  position?: number;
  is_primary?: boolean;
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  inventory_quantity?: number;
  weight?: number;
  options?: VariantOption[];
  image_id?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface ProductOption {
  id: string;
  name: string;
  position: number;
  values: string[];
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

// ============================================================================
// Categories
// ============================================================================

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  icon?: string;
  position: number;
  is_active: boolean;
  product_count: number;
  seo_title?: string;
  seo_description?: string;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Vendors
// ============================================================================

export interface Vendor {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  email?: string;
  phone?: string;
  address?: Address;
  status: VendorStatus;
  commission_rate: number;
  rating_average: number;
  rating_count: number;
  product_count: number;
  order_count: number;
  created_at: string;
  updated_at: string;
}

export type VendorStatus = 'active' | 'inactive' | 'pending' | 'suspended';

// ============================================================================
// Orders
// ============================================================================

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_id?: string;
  customer?: Customer;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  fulfillment_status?: FulfillmentStatus;
  items?: OrderItem[];
  subtotal?: number;
  discount_total?: number;
  shipping_total?: number;
  tax_total?: number;
  total?: number;
  currency?: string;
  shipping_address?: Address;
  billing_address?: Address;
  shipping_method?: ShippingMethod;
  payment_method?: PaymentMethod;
  notes?: string;
  internal_notes?: string;
  tags?: string[];
  coupon_codes?: string[];
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  placed_at?: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed' | 'voided';

export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'restocked';

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id?: string;
  variant_id?: string;
  product_name?: string;
  name?: string;
  variant_name?: string;
  sku?: string;
  image_url?: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  discount_amount?: number;
  tax_amount?: number;
  total?: number;
  fulfilled_quantity?: number;
  refunded_quantity?: number;
  properties?: Record<string, string>;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  estimated_days?: number;
  price: number;
}

export interface PaymentMethod {
  id: string;
  type: PaymentType;
  provider: string;
  last_four?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
}

export type PaymentType = 'card' | 'bank_transfer' | 'wallet' | 'cash' | 'other';

// ============================================================================
// Customers
// ============================================================================

export interface Customer {
  id: string;
  tenant_id: string;
  user_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  status?: CustomerStatus;
  accepts_marketing?: boolean;
  default_address?: Address;
  addresses?: Address[];
  tags?: string[];
  notes?: string;
  total_orders?: number;
  total_spent?: number;
  average_order_value?: number;
  last_order_at?: string;
  loyalty_points?: number;
  loyalty_tier?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface Address {
  id?: string;
  first_name: string;
  last_name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  country_code: string;
  phone?: string;
  is_default?: boolean;
  type?: 'shipping' | 'billing' | 'both';
}

// ============================================================================
// Cart
// ============================================================================

export type CartItemStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'PRICE_CHANGED';

export interface PriceChangeInfo {
  old_price: number;
  new_price: number;
  difference: number;
  is_increase: boolean;
}

export interface Cart {
  id: string;
  tenant_id: string;
  customer_id?: string;
  session_id?: string;
  items: CartItem[];
  subtotal: number;
  original_subtotal?: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  currency: string;
  item_count: number;
  coupon_codes: string[];
  notes?: string;
  shipping_address?: Address;
  billing_address?: Address;
  selected_shipping_method?: string;
  // Validation state
  has_unavailable_items?: boolean;
  has_price_changes?: boolean;
  unavailable_count?: number;
  out_of_stock_count?: number;
  low_stock_count?: number;
  price_changed_count?: number;
  last_validated_at?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unit_price: number;
  total: number;
  properties?: Record<string, string>;
  // Validation fields
  price_at_add?: number;
  status?: CartItemStatus;
  available_stock?: number;
  status_message?: string;
  price_change?: PriceChangeInfo;
  added_at?: string;
  last_validated_at?: string;
}

export interface CartValidationResult {
  cart_id: string;
  items: CartItem[];
  subtotal: number;
  original_subtotal: number;
  has_unavailable_items: boolean;
  has_price_changes: boolean;
  unavailable_count: number;
  out_of_stock_count: number;
  low_stock_count: number;
  price_changed_count: number;
  validated_at: string;
  expires_at?: string;
}

// ============================================================================
// Reviews
// ============================================================================

export interface Review {
  id: string;
  tenant_id: string;
  product_id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string;
  order_id?: string;
  rating: number;
  title?: string;
  content?: string;
  images: string[];
  is_verified: boolean;
  is_featured: boolean;
  status: ReviewStatus;
  helpful_count: number;
  reply?: ReviewReply;
  created_at: string;
  updated_at: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface ReviewReply {
  content: string;
  author_name: string;
  created_at: string;
}

// ============================================================================
// Coupons
// ============================================================================

export interface Coupon {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  min_order_amount?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_customer?: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
  applicable_products: string[];
  applicable_categories: string[];
  excluded_products: string[];
  customer_eligibility: 'all' | 'specific' | 'new_customers';
  eligible_customer_ids: string[];
  created_at: string;
  updated_at: string;
}

export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';

// ============================================================================
// Notifications
// ============================================================================

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at?: string;
  action_url?: string;
  action_label?: string;
  created_at: string;
}

export type NotificationType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'refund_processed'
  | 'product_low_stock'
  | 'product_out_of_stock'
  | 'new_review'
  | 'new_customer'
  | 'support_ticket'
  | 'system';

// ============================================================================
// Analytics
// ============================================================================

export interface DashboardStats {
  total_revenue: number;
  revenue_change: number;
  total_orders: number;
  orders_change: number;
  total_customers: number;
  customers_change: number;
  average_order_value: number;
  aov_change: number;
  conversion_rate: number;
  conversion_change: number;
  top_products: TopProduct[];
  recent_orders: Order[];
  sales_chart: ChartDataPoint[];
}

export interface TopProduct {
  product: Product;
  quantity_sold: number;
  revenue: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// ============================================================================
// Common Types
// ============================================================================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOption {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'starts_with';
  value: unknown;
}
