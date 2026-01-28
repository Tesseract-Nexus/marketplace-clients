// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
  metadata?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, any>;
  };
  timestamp?: string;
  requestId?: string;
}

// Category Types
export type CategoryStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type CategoryTier = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

// Category Image (mirrors ProductImage pattern)
export interface CategoryImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
  width?: number;
  height?: number;
}

export interface Category {
  id: string;
  tenantId: string;
  createdById: string;
  updatedById: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  images?: CategoryImage[];  // Gallery images (max 3)
  parentId?: string | null;
  level: number;
  position: number;
  isActive: boolean;
  status: CategoryStatus;
  tier?: CategoryTier;
  tags?: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  parent?: Category;
  children?: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  images?: CategoryImage[];  // Gallery images (max 3)
  parentId?: string | null;
  position?: number;
  isActive?: boolean;
  tier?: CategoryTier;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  images?: CategoryImage[];  // Gallery images (max 3)
  parentId?: string | null;
  position?: number;
  isActive?: boolean;
  status?: CategoryStatus;
  tier?: CategoryTier;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  metadata?: Record<string, any>;
}

export interface CategoryFilters {
  names?: string[];
  slugs?: string[];
  statuses?: CategoryStatus[];
  tiers?: CategoryTier[];
  parentIds?: string[];
  levels?: number[];
  isActive?: boolean;
  tags?: string[];
  hasChildren?: boolean;
}

// Product Types
export type ProductStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'REJECTED';
export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACK_ORDER' | 'DISCONTINUED';

export interface Product {
  id: string;
  tenantId: string;
  vendorId: string;
  categoryId: string;
  // Optional warehouse and supplier - auto-created if name provided
  warehouseId?: string;
  warehouseName?: string;
  supplierId?: string;
  supplierName?: string;
  createdById?: string;
  name: string;
  slug?: string;
  sku: string;
  brand?: string;
  description?: string;
  price: string;
  comparePrice?: string;
  costPrice?: string;
  status: ProductStatus;
  inventoryStatus?: InventoryStatus;
  quantity?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  lowStockThreshold?: number;
  weight?: string;
  dimensions?: Record<string, any>;
  searchKeywords?: string;
  averageRating?: number;
  reviewCount?: number;
  tags?: Record<string, any>;
  currencyCode?: string;
  attributes?: Record<string, any>;
  images?: (ProductImage | string)[];
  logoUrl?: string;      // Product logo (512x512 max)
  bannerUrl?: string;    // Product banner (1920x480)
  videos?: ProductVideo[]; // Promotional videos (max 2)
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdBy?: string;
  updatedBy?: string;
  metadata?: Record<string, any>;
}

// Product Image
export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
  width?: number;
  height?: number;
  isPrimary?: boolean; // Mark as one of the primary/featured images (max 3)
}

// Product Video
export interface ProductVideo {
  id: string;
  url: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;  // Duration in seconds
  size?: number;      // Size in bytes
  position: number;
}

// Media Limits
export const MediaLimits = {
  maxGalleryImages: 12,                   // Max product gallery images (updated from 7)
  maxCategoryImages: 3,                   // Max category images
  maxVideos: 2,
  maxImageSizeBytes: 10 * 1024 * 1024,    // 10MB
  maxLogoSizeBytes: 2 * 1024 * 1024,      // 2MB
  maxBannerSizeBytes: 5 * 1024 * 1024,    // 5MB
  maxVideoSizeBytes: 100 * 1024 * 1024,   // 100MB
  logoMaxWidth: 512,
  logoMaxHeight: 512,
  bannerMaxWidth: 1920,
  bannerMaxHeight: 480,
};

// Default Media URLs (Unsplash fallbacks)
export const DefaultMediaURLs = {
  productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  productLogo: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=200&q=80',
  productBanner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
  categoryIcon: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&q=80',
  categoryBanner: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80',
  warehouseLogo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80',
};

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: string;
  comparePrice?: string;
  costPrice?: string;
  quantity: number;
  lowStockThreshold?: number;
  weight?: string;
  dimensions?: Record<string, any>;
  inventoryStatus?: InventoryStatus;
  images?: Record<string, any>;
  attributes?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  slug?: string;
  sku: string;
  brand?: string;
  description?: string;
  price: string;
  comparePrice?: string;
  costPrice?: string;
  vendorId: string;
  categoryId: string;
  // Optional warehouse - use ID or Name (Name will auto-create if not exists)
  warehouseId?: string;
  warehouseName?: string;
  // Optional supplier - use ID or Name (Name will auto-create if not exists)
  supplierId?: string;
  supplierName?: string;
  quantity?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  lowStockThreshold?: number;
  weight?: string;
  dimensions?: Record<string, any>;
  searchKeywords?: string;
  tags?: string[];
  currencyCode?: string;
  attributes?: any[];
  images?: (ProductImage | string)[];
  logoUrl?: string;
  bannerUrl?: string;
  videos?: ProductVideo[];
}

export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  sku?: string;
  brand?: string;
  description?: string;
  price?: string;
  comparePrice?: string;
  costPrice?: string;
  vendorId?: string;
  categoryId?: string;
  // Optional warehouse - use ID or Name (Name will auto-create if not exists)
  warehouseId?: string;
  warehouseName?: string;
  // Optional supplier - use ID or Name (Name will auto-create if not exists)
  supplierId?: string;
  supplierName?: string;
  quantity?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  lowStockThreshold?: number;
  weight?: string;
  dimensions?: Record<string, any>;
  searchKeywords?: string;
  tags?: string[];
  currencyCode?: string;
  attributes?: any[];
  images?: (ProductImage | string)[];
  logoUrl?: string;
  bannerUrl?: string;
  videos?: ProductVideo[];
}

export interface ProductsAnalytics {
  overview: {
    totalProducts: number;
    activeProducts: number;
    draftProducts: number;
    outOfStock: number;
    lowStock: number;
    totalVariants: number;
    averagePrice: number;
    totalInventory: number;
  };
}

// Vendor Types
export type VendorStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
export type ValidationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  details?: string;
  status: VendorStatus;
  location?: string;
  primaryContact: string;
  secondaryContact?: string;
  email: string;
  validationStatus: ValidationStatus;
  commissionRate: number;
  isActive: boolean;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  website?: string;
  businessType?: string;
  foundedYear?: number;
  employeeCount?: number;
  annualRevenue?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  paymentTerms?: string;
  performanceRating?: number;
  tags?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateVendorRequest {
  name: string;
  details?: string;
  location?: string;
  primaryContact: string;
  secondaryContact?: string;
  email: string;
  commissionRate?: number;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  website?: string;
  businessType?: string;
  foundedYear?: number;
  employeeCount?: number;
  tags?: string[];
  notes?: string;
}

export interface UpdateVendorRequest {
  name?: string;
  details?: string;
  status?: VendorStatus;
  location?: string;
  primaryContact?: string;
  secondaryContact?: string;
  commissionRate?: number;
  isActive?: boolean;
  businessRegistrationNumber?: string;
  taxIdentificationNumber?: string;
  website?: string;
  businessType?: string;
  foundedYear?: number;
  employeeCount?: number;
  performanceRating?: number;
  notes?: string;
}

// Storefront Types (Vendor's customer-facing store)
export interface Storefront {
  id: string;
  vendorId: string;
  tenantId?: string;  // Tenant that owns this storefront - used for multi-tenant isolation
  slug: string;
  name: string;
  description?: string;
  customDomain?: string;
  isActive: boolean;
  themeConfig?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  logoUrl?: string;
  faviconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  // Computed field - the public URL for this storefront
  // This is computed by the backend based on STOREFRONT_DOMAIN config
  // Optional for backwards compatibility - frontend computes fallback if not provided
  storefrontUrl?: string;
  // Joined data
  vendor?: Vendor;
}

export interface CreateStorefrontRequest {
  vendorId: string;
  slug: string;
  name: string;
  description?: string;
  customDomain?: string;
  logoUrl?: string;
  faviconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  themeConfig?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface UpdateStorefrontRequest {
  slug?: string;
  name?: string;
  description?: string;
  customDomain?: string;
  isActive?: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  themeConfig?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export interface StorefrontResolutionData {
  storefrontId: string;
  vendorId: string;
  slug: string;
  name: string;
  customDomain?: string;
  themeConfig?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  logoUrl?: string;
  faviconUrl?: string;
  vendorName: string;
  vendorIsActive: boolean;
  // Computed field - the public URL for this storefront
  // Optional for backwards compatibility - frontend computes fallback if not provided
  storefrontUrl?: string;
}

// Staff Types
export type StaffRole = 'super_admin' | 'admin' | 'manager' | 'senior_employee' | 'employee' | 'intern' | 'contractor' | 'guest' | 'readonly';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary' | 'intern' | 'consultant' | 'volunteer';

// Authentication types for Staff
export type StaffAuthMethod =
  | 'password'
  | 'google_sso'
  | 'microsoft_sso'
  | 'invitation_pending'
  | 'sso_pending';

export type StaffAccountStatus =
  | 'pending_activation'
  | 'pending_password'
  | 'active'
  | 'suspended'
  | 'locked'
  | 'deactivated';

export interface Staff {
  id: string;
  tenantId: string;
  applicationId?: string;
  vendorId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  displayName?: string;
  email: string;
  alternateEmail?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  employeeId?: string;
  role: StaffRole;
  employmentType: EmploymentType;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  locationId?: string;
  profilePhotoUrl?: string;
  jobTitle?: string;
  salary?: number;
  currencyCode?: string;
  // Address fields (aligned with onboarding)
  streetAddress?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
  isActive: boolean;
  // Authentication fields
  authMethod?: StaffAuthMethod;
  accountStatus?: StaffAccountStatus;
  mustResetPassword?: boolean;
  isEmailVerified?: boolean;
  invitedAt?: string;
  invitationAcceptedAt?: string;
  lastPasswordChange?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  displayName?: string;
  email: string;
  alternateEmail?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  employeeId?: string;
  role: StaffRole;
  employmentType: EmploymentType;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  locationId?: string;
  profilePhotoUrl?: string;
  jobTitle?: string;
  salary?: number;
  currencyCode?: string;
  // Address fields
  streetAddress?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
  // Invitation fields - for auto-invite on staff creation
  activationBaseUrl?: string;
  businessName?: string;
}

export interface UpdateStaffRequest {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  role?: StaffRole;
  employmentType?: EmploymentType;
  departmentId?: string;
  jobTitle?: string;
  salary?: number;
  isActive?: boolean;
  // Address fields
  streetAddress?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
}

// Customer Types
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'VIP';
export type AddressType = 'SHIPPING' | 'BILLING' | 'BOTH';
export type PaymentType = 'card' | 'bank_account' | 'paypal' | 'upi';

export interface Customer {
  id: string;
  tenantId: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: CustomerStatus;
  customerType: CustomerType;

  // Analytics fields
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lifetimeValue: number;
  lastOrderDate?: string;
  firstOrderDate?: string;

  // Engagement
  tags?: string[];
  notes?: string;
  marketingOptIn: boolean;

  // Lock/Unlock metadata
  lockReason?: string;
  lockedAt?: string;
  lockedBy?: string;
  unlockReason?: string;
  unlockedAt?: string;
  unlockedBy?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Relationships
  addresses?: CustomerAddress[];
  paymentMethods?: CustomerPaymentMethod[];
  segments?: CustomerSegment[];
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  tenantId: string;
  addressType: AddressType;
  isDefault: boolean;

  // Address fields
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CustomerPaymentMethod {
  id: string;
  customerId: string;
  tenantId: string;
  paymentGateway: string;
  gatewayPaymentMethodId: string;
  paymentType: PaymentType;
  cardBrand?: string;
  lastFour?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CustomerSegment {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  rules?: Record<string, any>;
  isDynamic: boolean;
  customerCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  customerType?: CustomerType;
  tags?: string[];
  notes?: string;
  marketingOptIn?: boolean;
}

export interface UpdateCustomerRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
  tags?: string[];
  notes?: string;
  marketingOptIn?: boolean;
}

export interface CreateCustomerAddressRequest {
  addressType: AddressType;
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Review Types
export type ReviewStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'ARCHIVED';
export type ReviewType = 'PRODUCT' | 'SERVICE' | 'VENDOR' | 'EXPERIENCE';
export type VisibilityType = 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
export type ReactionType = 'helpful' | 'like' | 'dislike' | 'love' | 'angry' | 'laugh';

export interface ReviewRating {
  id: string;
  aspect: string;
  score: number;
  maxScore: number;
}

export interface ReviewMedia {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  uploadedAt: string;
}

export interface ReviewComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewReaction {
  id: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
}

export interface ReviewTag {
  id: string;
  name: string;
  color?: string;
}

export interface Review {
  id: string;
  tenantId: string;
  applicationId: string;
  targetId: string;
  targetType: string;
  userId: string;
  userName?: string;
  title?: string;
  content: string;
  status: ReviewStatus;
  type: ReviewType;
  visibility: VisibilityType;
  ratings?: ReviewRating[];
  comments?: ReviewComment[];
  reactions?: ReviewReaction[];
  media?: ReviewMedia[];
  tags?: ReviewTag[];
  helpfulCount: number;
  reportCount: number;
  featured: boolean;
  verifiedPurchase: boolean;
  language?: string;
  ipAddress?: string;
  userAgent?: string;
  spamScore?: number;
  sentimentScore?: number;
  moderationNotes?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  metadata?: Record<string, any>;
}

export interface CreateReviewRequest {
  targetId: string;
  targetType: string;
  title?: string;
  content: string;
  type: ReviewType;
  visibility?: VisibilityType;
  ratings?: ReviewRating[];
  tags?: string[];
  verifiedPurchase?: boolean;
  language?: string;
  metadata?: Record<string, any>;
}

export interface UpdateReviewRequest {
  title?: string;
  content?: string;
  visibility?: VisibilityType;
  ratings?: ReviewRating[];
  tags?: string[];
  featured?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateReviewStatusRequest {
  status: ReviewStatus;
  moderationNotes?: string;
}

export interface BulkUpdateReviewsRequest {
  reviewIds: string[];
  status: ReviewStatus;
  moderationNotes?: string;
}

export interface ReviewsAnalytics {
  overview: {
    totalReviews: number;
    averageRating: number;
    featuredCount: number;
    verifiedCount: number;
    pendingCount: number;
    flaggedCount: number;
    responseRate: number;
    satisfactionRate: number;
  };
  distribution: {
    byStatus: Record<ReviewStatus, number>;
    byType: Record<ReviewType, number>;
    byRating: Record<string, number>;
    byLanguage: Record<string, number>;
  };
}

// Order Types
// Order lifecycle status
export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

// Payment flow status
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';

// Fulfillment/delivery tracking status
export type FulfillmentStatus =
  | 'UNFULFILLED'      // Not yet picked
  | 'PROCESSING'       // Being picked/packed
  | 'PACKED'           // Ready for dispatch
  | 'DISPATCHED'       // Handed to carrier
  | 'IN_TRANSIT'       // With carrier, en route
  | 'OUT_FOR_DELIVERY' // Last mile delivery
  | 'DELIVERED'        // Successfully delivered
  | 'FAILED_DELIVERY'  // Delivery attempt failed
  | 'RETURNED';        // Returned to warehouse

// Valid status transitions response
export interface ValidTransitionsResponse {
  orderId: string;
  currentOrderStatus: OrderStatus;
  currentPaymentStatus: PaymentStatus;
  currentFulfillmentStatus: FulfillmentStatus;
  validOrderStatuses: OrderStatus[];
  validPaymentStatuses: PaymentStatus[];
  validFulfillmentStatuses: FulfillmentStatus[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string;
  variantId?: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  discount?: string;
  tax?: string;
  metadata?: Record<string, any>;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderCustomer {
  id: string;
  orderId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

// OrderShipping matches backend OrderShipping struct (different from ShippingAddress)
export interface OrderShipping {
  id: string;
  orderId: string;
  method: string;
  carrier?: string;
  trackingNumber?: string;
  cost: number;
  // Package dimensions captured at checkout for accurate shipping
  packageWeight?: number; // Weight in kg
  packageLength?: number; // Length in cm
  packageWidth?: number;  // Width in cm
  packageHeight?: number; // Height in cm
  // Shipping rate breakdown (for admin transparency)
  baseRate?: number;      // Original carrier rate before markup
  markupAmount?: number;  // Markup amount applied
  markupPercent?: number; // Markup percentage (e.g., 10 for 10%)
  street: string;
  city: string;
  state: string;
  stateCode?: string;
  postalCode: string;
  country: string;
  countryCode?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customer?: OrderCustomer;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  // Order amounts
  subtotal: string;
  discount: string;
  tax: string;
  shippingCost: string;
  total: string;
  currencyCode: string;

  // Items
  items: OrderItem[];
  totalItems: number;

  // Addresses (legacy format)
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;

  // Shipping (actual backend format)
  shipping?: OrderShipping;

  // Payment
  paymentMethod?: string;
  paymentGateway?: string;
  transactionId?: string;

  // Shipping
  shippingMethod?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;

  // Metadata
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;

  // Timestamps
  orderDate: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  customerId: string;
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: string;
  }[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod?: string;
  paymentMethod?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  tags?: string[];
}

export interface OrdersAnalytics {
  overview: {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

// Coupon Types
export type CouponStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DEPLETED';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
export type CouponApplicability = 'ALL_PRODUCTS' | 'SPECIFIC_PRODUCTS' | 'SPECIFIC_CATEGORIES' | 'MINIMUM_PURCHASE';

export interface CouponRestrictions {
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  allowedProducts?: string[];
  allowedCategories?: string[];
  excludedProducts?: string[];
  excludedCategories?: string[];
  firstOrderOnly?: boolean;
  onePerCustomer?: boolean;
}

export interface Coupon {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number; // percentage or fixed amount
  applicability: CouponApplicability;
  status: CouponStatus;

  // Usage limits
  totalUsageLimit?: number;
  perCustomerLimit?: number;
  currentUsageCount: number;

  // Date restrictions
  startDate?: string;
  endDate?: string;

  // Restrictions
  restrictions?: CouponRestrictions;

  // Metadata
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export type CouponScope = 'APPLICATION' | 'TENANT' | 'VENDOR' | 'CUSTOM';

export interface CreateCouponRequest {
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  scope: CouponScope;
  applicability?: CouponApplicability;
  totalUsageLimit?: number;
  perCustomerLimit?: number;
  validFrom: string;
  validTo?: string;
  startDate?: string;
  endDate?: string;
  restrictions?: CouponRestrictions;
  tags?: string[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCouponRequest {
  name?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  applicability?: CouponApplicability;
  status?: CouponStatus;
  totalUsageLimit?: number;
  perCustomerLimit?: number;
  startDate?: string;
  endDate?: string;
  restrictions?: CouponRestrictions;
  tags?: string[];
  notes?: string;
}

export interface CouponsAnalytics {
  overview: {
    totalCoupons: number;
    activeCoupons: number;
    expiredCoupons: number;
    totalRedemptions: number;
    totalDiscountGiven: number;
    averageDiscountValue: number;
  };
}

// Ticket Types (matching microservice)
export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'CANCELLED'
  | 'PENDING_APPROVAL'
  | 'ESCALATED';

export type TicketPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'URGENT';

export type TicketType =
  | 'BUG'
  | 'FEATURE'
  | 'IMPROVEMENT'
  | 'SUPPORT'
  | 'INCIDENT'
  | 'CHANGE_REQUEST'
  | 'MAINTENANCE'
  | 'CONSULTATION'
  | 'COMPLAINT'
  | 'QUESTION';

export interface Ticket {
  id: string;
  tenantId: string;
  applicationId: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  tags?: Record<string, any>;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  parentTicketId?: string;
  assignees?: Record<string, any>;
  attachments?: Record<string, any>;
  comments?: Record<string, any>;
  sla?: Record<string, any>;
  history?: Record<string, any>;
  deletedAt?: string;
  updatedBy?: string;
  metadata?: Record<string, any>;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  tags?: string[];
  dueDate?: string;
  estimatedTime?: number;
  assigneeIds?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  tags?: string[];
  dueDate?: string;
  estimatedTime?: number;
  actualTime?: number;
  metadata?: Record<string, any>;
}

export interface TicketsAnalytics {
  overview: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number; // in hours
  };
}

// ========================================
// Storefront Customization Types
// ========================================

export type ThemeTemplate =
  // Original themes
  | 'vibrant' | 'minimal' | 'dark' | 'neon' | 'ocean' | 'sunset' | 'forest' | 'luxury' | 'rose' | 'corporate' | 'earthy' | 'arctic'
  // Industry-specific themes
  | 'fashion' | 'streetwear' | 'food' | 'bakery' | 'cafe' | 'electronics' | 'beauty' | 'wellness' | 'jewelry' | 'kids' | 'sports' | 'home';
export type CardStyle = 'default' | 'minimal' | 'bordered' | 'elevated';
export type GridColumns = 2 | 3 | 4;
export type ColorMode = 'light' | 'dark' | 'both' | 'system';

export interface StorefrontSettings {
  id: string;
  tenantId: string;

  // Theme & Branding
  themeTemplate: ThemeTemplate;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontPrimary: string;
  fontSecondary: string;

  // Color Mode Setting
  colorMode: ColorMode;

  // Header Configuration
  headerConfig: StorefrontHeaderConfig;

  // Homepage Configuration
  homepageConfig: StorefrontHomepageConfig;

  // Footer Configuration
  footerConfig: StorefrontFooterConfig;

  // Product Display Configuration
  productConfig: StorefrontProductConfig;

  // Checkout Configuration
  checkoutConfig: StorefrontCheckoutConfig;

  // NEW: Typography Configuration
  typographyConfig?: TypographyConfig;

  // NEW: Layout Configuration
  layoutConfig?: LayoutConfig;

  // NEW: Spacing & Style Configuration
  spacingStyleConfig?: SpacingStyleConfig;

  // NEW: Mobile Configuration
  mobileConfig?: MobileConfig;

  // NEW: Advanced Configuration
  advancedConfig?: AdvancedConfig;

  // Custom CSS (legacy - now in advancedConfig)
  customCss?: string;

  // Content Pages
  contentPages?: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    featuredImage?: string;
    authorName?: string;
    publishedAt?: string;
    viewCount: number;
    showInMenu: boolean;
    showInFooter: boolean;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
  }>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface StorefrontHeaderConfig {
  showAnnouncement: boolean;
  announcementText?: string;
  announcementLink?: string;
  announcementBgColor?: string;
  navLinks: StorefrontNavLink[];
  showSearch: boolean;
  showCart: boolean;
  showAccount: boolean;
  stickyHeader: boolean;
}

export interface StorefrontNavLink {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  position: number;
  // Enhanced navigation features
  icon?: string;                    // Lucide icon name
  badge?: string;                   // e.g., "New", "Sale"
  badgeColor?: string;              // Badge background color
  children?: StorefrontNavLink[];   // Sub-menu items
  // Mega-menu config (only for top-level items)
  isMegaMenu?: boolean;
  megaMenuColumns?: number;         // 2, 3, or 4 columns
  megaMenuImage?: string;           // Featured image URL
  megaMenuImageAlt?: string;
}

export interface StorefrontHomepageConfig {
  heroEnabled: boolean;
  heroBackgroundType?: 'animated' | 'static' | 'image' | 'video' | 'color';
  heroImage?: string;
  heroVideo?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
  heroOverlayOpacity: number;
  heroTextColor?: string;           // Custom text color for hero section
  heroAnimationsEnabled?: boolean;  // Enable/disable blob animations (default true)

  sections: StorefrontSection[];

  featuredProductIds?: string[];
  featuredCategoryIds?: string[];

  showNewsletter: boolean;
  newsletterTitle?: string;
  newsletterSubtitle?: string;

  showTestimonials: boolean;
  testimonials?: StorefrontTestimonial[];
}

export interface StorefrontSection {
  id: string;
  type: 'featured_products' | 'categories' | 'banner' | 'newsletter' | 'testimonials' | 'custom_html';
  title?: string;
  subtitle?: string;
  enabled: boolean;
  position: number;
  config?: Record<string, any>;
}

export interface StorefrontTestimonial {
  id: string;
  name: string;
  role?: string;
  content: string;
  avatarUrl?: string;
  rating: number;
}

export interface StorefrontFooterConfig {
  showFooter: boolean;
  footerBgColor?: string;
  footerTextColor?: string;

  // Link columns (1-4)
  linkGroups: StorefrontFooterLinkGroup[];
  columnLayout?: 1 | 2 | 3 | 4;     // Number of columns

  showSocialIcons: boolean;
  socialLinks: StorefrontSocialLink[];

  showContactInfo: boolean;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;

  showNewsletter: boolean;

  // Payment icons
  showPaymentIcons?: boolean;
  paymentMethods?: PaymentMethod[];

  // Trust badges
  showTrustBadges?: boolean;
  trustBadges?: TrustBadge[];

  copyrightText?: string;
  showPoweredBy: boolean;
}

export type PaymentMethod =
  | 'visa' | 'mastercard' | 'amex' | 'discover'
  | 'paypal' | 'apple_pay' | 'google_pay' | 'stripe'
  | 'afterpay' | 'klarna' | 'zip' | 'bank_transfer';

export interface TrustBadge {
  id: string;
  label: string;
  icon?: string;          // Lucide icon name
  imageUrl?: string;      // Custom badge image
  href?: string;          // Link to verification page
}

export interface StorefrontFooterLinkGroup {
  id: string;
  title: string;
  links: StorefrontNavLink[];
}

export interface StorefrontSocialLink {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest';
  url: string;
}

export interface StorefrontProductConfig {
  gridColumns: GridColumns;
  cardStyle: CardStyle;
  showQuickView: boolean;
  showWishlist: boolean;
  showRatings: boolean;
  showSaleBadge: boolean;
  showStockStatus: boolean;
  imageAspectRatio: 'square' | 'portrait' | 'landscape';
  hoverEffect: 'none' | 'zoom' | 'fade' | 'slide';
}

export interface StorefrontCheckoutConfig {
  guestCheckoutEnabled: boolean;
  showOrderNotes: boolean;
  showGiftOptions: boolean;

  // Required fields
  requirePhone: boolean;
  requireCompany: boolean;

  // Display options
  showTrustBadges: boolean;
  trustBadges?: string[];

  // Terms
  showTermsCheckbox: boolean;
  termsText?: string;
  termsLink?: string;

  // Payment display
  showPaymentIcons: boolean;
  paymentIconsUrls?: string[];
}

// Request/Response types for storefront settings
export interface CreateStorefrontSettingsRequest {
  themeTemplate?: ThemeTemplate;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontPrimary?: string;
  fontSecondary?: string;
  colorMode?: ColorMode;
  headerConfig?: Partial<StorefrontHeaderConfig>;
  homepageConfig?: Partial<StorefrontHomepageConfig>;
  footerConfig?: Partial<StorefrontFooterConfig>;
  productConfig?: Partial<StorefrontProductConfig>;
  checkoutConfig?: Partial<StorefrontCheckoutConfig>;
  customCss?: string;
  // New enhanced configurations
  typographyConfig?: Partial<TypographyConfig>;
  layoutConfig?: Partial<LayoutConfig>;
  spacingStyleConfig?: Partial<SpacingStyleConfig>;
  mobileConfig?: Partial<MobileConfig>;
  advancedConfig?: Partial<AdvancedConfig>;
}

export interface UpdateStorefrontSettingsRequest extends Partial<CreateStorefrontSettingsRequest> {}

// Asset types
export interface StorefrontAsset {
  id: string;
  tenantId: string;
  storefrontId?: string;
  type: 'logo' | 'favicon' | 'hero' | 'banner' | 'product' | 'category' | 'custom' | 'other';
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface UploadAssetResponse {
  success: boolean;
  asset?: StorefrontAsset;
  message?: string;
  error?: string;
}

// Industry categories for theme organization
export type ThemeIndustry =
  | 'general'
  | 'fashion'
  | 'food'
  | 'tech'
  | 'beauty'
  | 'home'
  | 'sports'
  | 'kids'
  | 'luxury';

// Theme preset configurations - comprehensive industry-standard settings
export interface ThemePreset {
  id: ThemeTemplate;
  name: string;
  description: string;
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  // Extended colors for comprehensive theming
  surfaceColor?: string;       // Card/surface backgrounds
  borderColor?: string;        // Border colors
  mutedColor?: string;         // Muted text/elements
  // Industry & categorization
  industry?: ThemeIndustry;
  tags?: string[];             // e.g., ['minimal', 'bold', 'professional']
  // Typography recommendations
  recommendedHeadingFont?: string;
  recommendedBodyFont?: string;
  // Layout preferences
  recommendedCardStyle?: CardStyle;
  recommendedGridColumns?: GridColumns;
  // Button style preferences
  buttonRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  buttonStyle?: 'solid' | 'outline' | 'gradient' | 'glass';
  // Mobile optimizations
  mobileOptimized?: boolean;
  touchFriendly?: boolean;
  // Preview
  preview: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  // === GENERAL PURPOSE THEMES ===
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold gradients and eye-catching colors for modern brands',
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    textColor: '#18181B',
    surfaceColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    mutedColor: '#6B7280',
    industry: 'general',
    tags: ['bold', 'modern', 'gradient', 'creative'],
    recommendedHeadingFont: 'Plus Jakarta Sans',
    recommendedBodyFont: 'Inter',
    recommendedCardStyle: 'elevated',
    recommendedGridColumns: 4,
    buttonRadius: 'lg',
    buttonStyle: 'gradient',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/vibrant-preview.png',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean typography and subtle elegance for any industry',
    primaryColor: '#18181B',
    secondaryColor: '#71717A',
    accentColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#18181B',
    surfaceColor: '#FAFAFA',
    borderColor: '#E4E4E7',
    mutedColor: '#A1A1AA',
    industry: 'general',
    tags: ['minimal', 'clean', 'professional', 'universal'],
    recommendedHeadingFont: 'Inter',
    recommendedBodyFont: 'Inter',
    recommendedCardStyle: 'minimal',
    recommendedGridColumns: 3,
    buttonRadius: 'md',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/minimal-preview.png',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Sleek dark mode aesthetic for tech-forward brands',
    primaryColor: '#A855F7',
    secondaryColor: '#22D3EE',
    accentColor: '#F472B6',
    backgroundColor: '#09090B',
    textColor: '#FAFAFA',
    surfaceColor: '#18181B',
    borderColor: '#27272A',
    mutedColor: '#71717A',
    industry: 'tech',
    tags: ['dark', 'modern', 'tech', 'sleek'],
    recommendedHeadingFont: 'Space Grotesk',
    recommendedBodyFont: 'Inter',
    recommendedCardStyle: 'bordered',
    recommendedGridColumns: 4,
    buttonRadius: 'md',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/dark-preview.png',
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Cyberpunk-inspired glow effects for gaming & tech',
    primaryColor: '#22D3EE',
    secondaryColor: '#A3E635',
    accentColor: '#F472B6',
    backgroundColor: '#0F172A',
    textColor: '#F8FAFC',
    surfaceColor: '#1E293B',
    borderColor: '#334155',
    mutedColor: '#94A3B8',
    industry: 'tech',
    tags: ['neon', 'cyberpunk', 'gaming', 'bold'],
    recommendedHeadingFont: 'Orbitron',
    recommendedBodyFont: 'Roboto',
    recommendedCardStyle: 'bordered',
    recommendedGridColumns: 3,
    buttonRadius: 'sm',
    buttonStyle: 'outline',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/neon-preview.png',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calm blues and teals for wellness & travel brands',
    primaryColor: '#0EA5E9',
    secondaryColor: '#14B8A6',
    accentColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    textColor: '#0F172A',
    surfaceColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    mutedColor: '#64748B',
    industry: 'general',
    tags: ['calm', 'professional', 'trustworthy', 'wellness'],
    recommendedHeadingFont: 'Outfit',
    recommendedBodyFont: 'Open Sans',
    recommendedCardStyle: 'default',
    recommendedGridColumns: 4,
    buttonRadius: 'lg',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/ocean-preview.png',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm and inviting oranges for food & hospitality',
    primaryColor: '#F97316',
    secondaryColor: '#EF4444',
    accentColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
    textColor: '#292524',
    surfaceColor: '#FEF3C7',
    borderColor: '#FDE68A',
    mutedColor: '#78716C',
    industry: 'food',
    tags: ['warm', 'inviting', 'food', 'hospitality'],
    recommendedHeadingFont: 'Poppins',
    recommendedBodyFont: 'Nunito',
    recommendedCardStyle: 'elevated',
    recommendedGridColumns: 3,
    buttonRadius: 'full',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/sunset-preview.png',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens for organic & eco-friendly brands',
    primaryColor: '#16A34A',
    secondaryColor: '#15803D',
    accentColor: '#84CC16',
    backgroundColor: '#F0FDF4',
    textColor: '#14532D',
    surfaceColor: '#DCFCE7',
    borderColor: '#BBF7D0',
    mutedColor: '#4B5563',
    industry: 'food',
    tags: ['natural', 'organic', 'eco', 'sustainable'],
    recommendedHeadingFont: 'DM Sans',
    recommendedBodyFont: 'Lato',
    recommendedCardStyle: 'default',
    recommendedGridColumns: 3,
    buttonRadius: 'lg',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/forest-preview.png',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Elegant gold and black for premium & high-end brands',
    primaryColor: '#B8860B',
    secondaryColor: '#18181B',
    accentColor: '#D4AF37',
    backgroundColor: '#FAFAFA',
    textColor: '#18181B',
    surfaceColor: '#F5F5F5',
    borderColor: '#D4D4D4',
    mutedColor: '#737373',
    industry: 'luxury',
    tags: ['luxury', 'premium', 'elegant', 'sophisticated'],
    recommendedHeadingFont: 'Playfair Display',
    recommendedBodyFont: 'Lora',
    recommendedCardStyle: 'minimal',
    recommendedGridColumns: 3,
    buttonRadius: 'none',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/luxury-preview.png',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft and romantic pinks for beauty & lifestyle',
    primaryColor: '#DB2777',
    secondaryColor: '#EC4899',
    accentColor: '#F472B6',
    backgroundColor: '#FDF2F8',
    textColor: '#831843',
    surfaceColor: '#FCE7F3',
    borderColor: '#FBCFE8',
    mutedColor: '#9D174D',
    industry: 'beauty',
    tags: ['romantic', 'feminine', 'beauty', 'lifestyle'],
    recommendedHeadingFont: 'Cormorant Garamond',
    recommendedBodyFont: 'Quicksand',
    recommendedCardStyle: 'elevated',
    recommendedGridColumns: 4,
    buttonRadius: 'full',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/rose-preview.png',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional blue for B2B & enterprise businesses',
    primaryColor: '#2563EB',
    secondaryColor: '#1D4ED8',
    accentColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1E293B',
    surfaceColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    mutedColor: '#64748B',
    industry: 'general',
    tags: ['professional', 'corporate', 'trustworthy', 'B2B'],
    recommendedHeadingFont: 'IBM Plex Sans',
    recommendedBodyFont: 'Source Sans Pro',
    recommendedCardStyle: 'bordered',
    recommendedGridColumns: 4,
    buttonRadius: 'sm',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/corporate-preview.png',
  },
  {
    id: 'earthy',
    name: 'Earthy',
    description: 'Warm browns and naturals for artisan & handmade',
    primaryColor: '#92400E',
    secondaryColor: '#78350F',
    accentColor: '#D97706',
    backgroundColor: '#FFFBEB',
    textColor: '#451A03',
    surfaceColor: '#FEF3C7',
    borderColor: '#FDE68A',
    mutedColor: '#78716C',
    industry: 'home',
    tags: ['artisan', 'handmade', 'natural', 'warm'],
    recommendedHeadingFont: 'Merriweather',
    recommendedBodyFont: 'Source Serif Pro',
    recommendedCardStyle: 'default',
    recommendedGridColumns: 3,
    buttonRadius: 'md',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/earthy-preview.png',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Cool whites and icy blues for tech & healthcare',
    primaryColor: '#0284C7',
    secondaryColor: '#0369A1',
    accentColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
    textColor: '#0C4A6E',
    surfaceColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    mutedColor: '#475569',
    industry: 'tech',
    tags: ['clean', 'modern', 'tech', 'healthcare'],
    recommendedHeadingFont: 'Figtree',
    recommendedBodyFont: 'Inter',
    recommendedCardStyle: 'minimal',
    recommendedGridColumns: 4,
    buttonRadius: 'lg',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/arctic-preview.png',
  },
  // === INDUSTRY-SPECIFIC THEMES ===
  {
    id: 'fashion',
    name: 'Fashion',
    description: 'Elegant editorial style for fashion & apparel brands',
    primaryColor: '#1A1A2E',
    secondaryColor: '#E94560',
    accentColor: '#FF6B6B',
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A2E',
    surfaceColor: '#F8F8FA',
    borderColor: '#E8E8EC',
    mutedColor: '#6C6C80',
    industry: 'fashion',
    tags: ['editorial', 'elegant', 'high-fashion', 'runway'],
    recommendedHeadingFont: 'Playfair Display',
    recommendedBodyFont: 'Montserrat',
    recommendedCardStyle: 'minimal',
    recommendedGridColumns: 3,
    buttonRadius: 'none',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/fashion-preview.png',
  },
  {
    id: 'streetwear',
    name: 'Streetwear',
    description: 'Bold and edgy for urban fashion & streetwear',
    primaryColor: '#0D0D0D',
    secondaryColor: '#FF6B35',
    accentColor: '#F7C59F',
    backgroundColor: '#FAFAFA',
    textColor: '#0D0D0D',
    surfaceColor: '#F0F0F0',
    borderColor: '#D0D0D0',
    mutedColor: '#666666',
    industry: 'fashion',
    tags: ['urban', 'bold', 'street', 'edgy'],
    recommendedHeadingFont: 'Bebas Neue',
    recommendedBodyFont: 'Roboto',
    recommendedCardStyle: 'bordered',
    recommendedGridColumns: 4,
    buttonRadius: 'sm',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/streetwear-preview.png',
  },
  {
    id: 'food',
    name: 'Food & Grocery',
    description: 'Fresh and appetizing for food delivery & grocery',
    primaryColor: '#2D5016',
    secondaryColor: '#F4A261',
    accentColor: '#E9C46A',
    backgroundColor: '#FEFDF8',
    textColor: '#2D5016',
    surfaceColor: '#F5F3ED',
    borderColor: '#E5E1D8',
    mutedColor: '#6B7B5E',
    industry: 'food',
    tags: ['fresh', 'appetizing', 'grocery', 'organic'],
    recommendedHeadingFont: 'Nunito',
    recommendedBodyFont: 'Open Sans',
    recommendedCardStyle: 'elevated',
    recommendedGridColumns: 4,
    buttonRadius: 'lg',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/food-preview.png',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    description: 'Warm and cozy for bakeries, cafes & dessert shops',
    primaryColor: '#8B4513',
    secondaryColor: '#F5DEB3',
    accentColor: '#DEB887',
    backgroundColor: '#FFF8F0',
    textColor: '#5D3510',
    surfaceColor: '#FFF0E0',
    borderColor: '#E8D5C4',
    mutedColor: '#8B7355',
    industry: 'food',
    tags: ['cozy', 'warm', 'artisan', 'homemade'],
    recommendedHeadingFont: 'Lobster',
    recommendedBodyFont: 'Quicksand',
    recommendedCardStyle: 'elevated',
    recommendedGridColumns: 3,
    buttonRadius: 'full',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/bakery-preview.png',
  },
  {
    id: 'cafe',
    name: 'Café',
    description: 'Rustic and inviting for coffee shops & roasteries',
    primaryColor: '#3C2415',
    secondaryColor: '#D4A574',
    accentColor: '#C9A959',
    backgroundColor: '#FFFBF5',
    textColor: '#3C2415',
    surfaceColor: '#F5EDE5',
    borderColor: '#E0D0C0',
    mutedColor: '#7A6B5B',
    industry: 'food',
    tags: ['rustic', 'coffee', 'artisan', 'inviting'],
    recommendedHeadingFont: 'Josefin Sans',
    recommendedBodyFont: 'Libre Baskerville',
    recommendedCardStyle: 'default',
    recommendedGridColumns: 3,
    buttonRadius: 'md',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/cafe-preview.png',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Modern and futuristic for tech gadgets & devices',
    primaryColor: '#0F1419',
    secondaryColor: '#00D4FF',
    accentColor: '#7C3AED',
    backgroundColor: '#F8FAFC',
    textColor: '#0F1419',
    surfaceColor: '#EFF3F8',
    borderColor: '#D1D9E6',
    mutedColor: '#5C6B7A',
    industry: 'tech',
    tags: ['futuristic', 'tech', 'gadgets', 'modern'],
    recommendedHeadingFont: 'Exo 2',
    recommendedBodyFont: 'Inter',
    recommendedCardStyle: 'bordered',
    recommendedGridColumns: 4,
    buttonRadius: 'md',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/electronics-preview.png',
  },
  {
    id: 'beauty',
    name: 'Beauty',
    description: 'Glamorous and soft for cosmetics & skincare',
    primaryColor: '#2D1B4E',
    secondaryColor: '#E8B4B8',
    accentColor: '#F5CAC3',
    backgroundColor: '#FDF9F9',
    textColor: '#2D1B4E',
    surfaceColor: '#F8F0F2',
    borderColor: '#E8D8DC',
    mutedColor: '#8B7085',
    industry: 'beauty',
    tags: ['glamorous', 'soft', 'skincare', 'cosmetics'],
    recommendedHeadingFont: 'Cormorant Garamond',
    recommendedBodyFont: 'Raleway',
    recommendedCardStyle: 'elevated',
    recommendedGridColumns: 4,
    buttonRadius: 'full',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/beauty-preview.png',
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Calm and natural for health, spa & wellness',
    primaryColor: '#1B4D3E',
    secondaryColor: '#A8E6CF',
    accentColor: '#88D8B0',
    backgroundColor: '#F5FDF9',
    textColor: '#1B4D3E',
    surfaceColor: '#E8F5ED',
    borderColor: '#C5E0D0',
    mutedColor: '#5A7B6A',
    industry: 'beauty',
    tags: ['calm', 'natural', 'spa', 'meditation'],
    recommendedHeadingFont: 'Tenor Sans',
    recommendedBodyFont: 'Work Sans',
    recommendedCardStyle: 'minimal',
    recommendedGridColumns: 3,
    buttonRadius: 'lg',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/wellness-preview.png',
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    description: 'Premium and luxurious for jewelry & fine accessories',
    primaryColor: '#1C1C1C',
    secondaryColor: '#D4AF37',
    accentColor: '#C9B037',
    backgroundColor: '#FDFCF9',
    textColor: '#1C1C1C',
    surfaceColor: '#F8F6F0',
    borderColor: '#E8E4D8',
    mutedColor: '#6B6860',
    industry: 'luxury',
    tags: ['premium', 'luxury', 'gold', 'exclusive'],
    recommendedHeadingFont: 'Cinzel',
    recommendedBodyFont: 'EB Garamond',
    recommendedCardStyle: 'minimal',
    recommendedGridColumns: 3,
    buttonRadius: 'none',
    buttonStyle: 'outline',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/jewelry-preview.png',
  },
  {
    id: 'kids',
    name: 'Kids',
    description: 'Playful and colorful for kids toys & children clothing',
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
    accentColor: '#FFE66D',
    backgroundColor: '#FFFCF9',
    textColor: '#2D3436',
    surfaceColor: '#FFF5F0',
    borderColor: '#FFE0D5',
    mutedColor: '#6D6D6D',
    industry: 'kids',
    tags: ['playful', 'colorful', 'fun', 'toys'],
    recommendedHeadingFont: 'Baloo 2',
    recommendedBodyFont: 'Nunito',
    recommendedCardStyle: 'elevated',
    recommendedGridColumns: 4,
    buttonRadius: 'full',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/kids-preview.png',
  },
  {
    id: 'sports',
    name: 'Sports',
    description: 'Dynamic and energetic for sports gear & fitness',
    primaryColor: '#1E3A5F',
    secondaryColor: '#00D9FF',
    accentColor: '#32E0C4',
    backgroundColor: '#F8FAFC',
    textColor: '#1E3A5F',
    surfaceColor: '#EEF2F6',
    borderColor: '#D0DCE8',
    mutedColor: '#5A6B7C',
    industry: 'sports',
    tags: ['dynamic', 'energetic', 'fitness', 'athletic'],
    recommendedHeadingFont: 'Oswald',
    recommendedBodyFont: 'Roboto',
    recommendedCardStyle: 'bordered',
    recommendedGridColumns: 4,
    buttonRadius: 'md',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/sports-preview.png',
  },
  {
    id: 'home',
    name: 'Home & Décor',
    description: 'Modern and sophisticated for furniture & home goods',
    primaryColor: '#2C3E50',
    secondaryColor: '#E67E22',
    accentColor: '#F39C12',
    backgroundColor: '#FDFBF7',
    textColor: '#2C3E50',
    surfaceColor: '#F5F2EC',
    borderColor: '#E0DAD0',
    mutedColor: '#6B7280',
    industry: 'home',
    tags: ['modern', 'sophisticated', 'furniture', 'interior'],
    recommendedHeadingFont: 'Bodoni Moda',
    recommendedBodyFont: 'Karla',
    recommendedCardStyle: 'default',
    recommendedGridColumns: 3,
    buttonRadius: 'sm',
    buttonStyle: 'solid',
    mobileOptimized: true,
    touchFriendly: true,
    preview: '/themes/home-preview.png',
  },
];

// Helper function to get themes by industry
export function getThemesByIndustry(industry: ThemeIndustry): ThemePreset[] {
  return THEME_PRESETS.filter(theme => theme.industry === industry);
}

// Helper function to get themes by tag
export function getThemesByTag(tag: string): ThemePreset[] {
  return THEME_PRESETS.filter(theme => theme.tags?.includes(tag));
}

// Get all available industries
export function getAvailableIndustries(): ThemeIndustry[] {
  const industries = new Set(THEME_PRESETS.map(theme => theme.industry).filter(Boolean));
  return Array.from(industries) as ThemeIndustry[];
}

// Get all available tags
export function getAvailableTags(): string[] {
  const tags = new Set(THEME_PRESETS.flatMap(theme => theme.tags || []));
  return Array.from(tags).sort();
}

// ========================================
// Typography Configuration
// ========================================

export type HeadingScale = 'compact' | 'default' | 'large';
export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800;
export type LineHeight = 'tight' | 'normal' | 'relaxed';
export type LetterSpacing = 'tight' | 'normal' | 'wide';

export interface TypographyConfig {
  // Font Families
  headingFont: string;
  bodyFont: string;

  // Font Sizes
  baseFontSize: number; // 14-18px
  headingScale: HeadingScale;

  // Font Weights
  headingWeight: FontWeight;
  bodyWeight: FontWeight;

  // Line Heights
  headingLineHeight: LineHeight;
  bodyLineHeight: LineHeight;

  // Letter Spacing
  headingLetterSpacing: LetterSpacing;
}

// Curated Google Fonts list
export const GOOGLE_FONTS = [
  // Sans-serif
  { name: 'Inter', category: 'sans-serif' },
  { name: 'Roboto', category: 'sans-serif' },
  { name: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', category: 'sans-serif' },
  { name: 'Poppins', category: 'sans-serif' },
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Nunito', category: 'sans-serif' },
  { name: 'Work Sans', category: 'sans-serif' },
  { name: 'Raleway', category: 'sans-serif' },
  { name: 'DM Sans', category: 'sans-serif' },
  { name: 'Plus Jakarta Sans', category: 'sans-serif' },
  { name: 'Outfit', category: 'sans-serif' },
  { name: 'Manrope', category: 'sans-serif' },
  { name: 'Space Grotesk', category: 'sans-serif' },
  { name: 'Figtree', category: 'sans-serif' },
  { name: 'Lexend', category: 'sans-serif' },
  { name: 'Urbanist', category: 'sans-serif' },
  { name: 'Sora', category: 'sans-serif' },
  // Serif
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'Crimson Text', category: 'serif' },
  { name: 'Source Serif Pro', category: 'serif' },
  { name: 'Libre Baskerville', category: 'serif' },
  { name: 'Cormorant Garamond', category: 'serif' },
  { name: 'EB Garamond', category: 'serif' },
  { name: 'Fraunces', category: 'serif' },
  { name: 'DM Serif Display', category: 'serif' },
  // Display
  { name: 'Oswald', category: 'display' },
  { name: 'Bebas Neue', category: 'display' },
  { name: 'Anton', category: 'display' },
  { name: 'Archivo Black', category: 'display' },
  { name: 'Righteous', category: 'display' },
  { name: 'Abril Fatface', category: 'display' },
  // Monospace
  { name: 'JetBrains Mono', category: 'monospace' },
  { name: 'Fira Code', category: 'monospace' },
  { name: 'Source Code Pro', category: 'monospace' },
] as const;

// ========================================
// Layout Configuration
// ========================================

export type NavigationStyle = 'header' | 'sidebar-left' | 'sidebar-right' | 'minimal';
export type ContainerWidth = 'narrow' | 'default' | 'wide' | 'full';
export type ContentPadding = 'compact' | 'default' | 'spacious';
export type HomepageLayout = 'hero-grid' | 'carousel' | 'minimal' | 'magazine';
export type HeaderLayout = 'logo-left' | 'logo-center' | 'mega-menu';
export type HeaderHeight = 'compact' | 'default' | 'tall';
export type FooterLayout = 'simple' | 'multi-column' | 'minimal' | 'centered';
export type ProductListLayout = 'grid' | 'list' | 'masonry';
export type ProductDetailLayout = 'image-left' | 'image-right' | 'gallery-top' | 'split';
export type CategoryLayout = 'sidebar-left' | 'sidebar-right' | 'no-sidebar';

export interface LayoutConfig {
  // Navigation Style (header vs sidebar)
  navigationStyle: NavigationStyle;

  // Global Layout
  containerWidth: ContainerWidth;
  contentPadding: ContentPadding;

  // Homepage Layout
  homepageLayout: HomepageLayout;

  // Header Layout
  headerLayout: HeaderLayout;
  headerHeight: HeaderHeight;

  // Footer Layout
  footerLayout: FooterLayout;

  // Product Listing Layout
  productListLayout: ProductListLayout;
  productGridColumns: {
    mobile: 1 | 2;
    tablet: 2 | 3;
    desktop: 3 | 4 | 5;
  };

  // Product Detail Layout
  productDetailLayout: ProductDetailLayout;

  // Category Page Layout
  categoryLayout: CategoryLayout;
  showCategoryBanner: boolean;
}

// ========================================
// Spacing & Style Configuration
// ========================================

export type BorderRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
export type ButtonStyle = 'square' | 'rounded' | 'pill';
export type ButtonSize = 'small' | 'medium' | 'large';
export type CardStyleType = 'flat' | 'bordered' | 'elevated' | 'glass';
export type CardPadding = 'compact' | 'default' | 'spacious';
export type SectionSpacing = 'compact' | 'default' | 'spacious';
export type ShadowIntensity = 'none' | 'subtle' | 'medium' | 'strong';
export type AnimationSpeed = 'none' | 'fast' | 'normal' | 'slow';

export interface SpacingStyleConfig {
  // Border Radius
  borderRadius: BorderRadius;

  // Button Styles
  buttonStyle: ButtonStyle;
  buttonSize: ButtonSize;

  // Card Styles
  cardStyle: CardStyleType;
  cardPadding: CardPadding;

  // Section Spacing
  sectionSpacing: SectionSpacing;

  // Image Styles
  imageRadius: BorderRadius;
  productImageAspect: 'square' | 'portrait' | 'landscape' | 'auto';

  // Shadows
  shadowIntensity: ShadowIntensity;

  // Animations
  animationSpeed: AnimationSpeed;
  hoverEffects: boolean;
}

// ========================================
// Mobile Configuration
// ========================================

export type MobileMenuStyle = 'slide' | 'fullscreen' | 'dropdown';
export type MobileHeaderStyle = 'compact' | 'standard' | 'minimal';
export type MobileButtonSize = 'default' | 'large' | 'extra-large';

export interface MobileConfig {
  // Navigation
  mobileMenuStyle: MobileMenuStyle;
  bottomNav: boolean;
  bottomNavItems: ('home' | 'search' | 'categories' | 'cart' | 'account')[];

  // Header
  mobileHeaderStyle: MobileHeaderStyle;
  hideHeaderSearch: boolean;
  showMobileSearch: boolean;

  // Product Pages
  stickyAddToCart: boolean;
  mobileProductGridColumns: 1 | 2;
  swipeGestures: boolean;
  pinchToZoom: boolean;

  // Touch & Accessibility
  touchFriendlyButtons: boolean;
  mobileButtonSize: MobileButtonSize;
  hapticFeedback: boolean;

  // Performance
  reducedMotion: boolean;
  lowDataMode: boolean;
}

// ========================================
// Advanced Configuration
// ========================================

export interface AdvancedConfig {
  // Custom CSS
  customCss: string;

  // Component Visibility
  visibility: {
    showBreadcrumbs: boolean;
    showBackToTop: boolean;
    showCookieBanner: boolean;
    showPromoBar: boolean;
  };

  // Performance
  performance: {
    lazyLoadImages: boolean;
    preloadCriticalFonts: boolean;
  };
}

// ========================================
// Default Configurations
// ========================================

export const DEFAULT_TYPOGRAPHY_CONFIG: TypographyConfig = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  baseFontSize: 16,
  headingScale: 'default',
  headingWeight: 700,
  bodyWeight: 400,
  headingLineHeight: 'normal',
  bodyLineHeight: 'normal',
  headingLetterSpacing: 'normal',
};

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  navigationStyle: 'header',
  containerWidth: 'default',
  contentPadding: 'default',
  homepageLayout: 'hero-grid',
  headerLayout: 'logo-left',
  headerHeight: 'default',
  footerLayout: 'multi-column',
  productListLayout: 'grid',
  productGridColumns: { mobile: 2, tablet: 3, desktop: 4 },
  productDetailLayout: 'image-left',
  categoryLayout: 'sidebar-left',
  showCategoryBanner: true,
};

export const DEFAULT_SPACING_STYLE_CONFIG: SpacingStyleConfig = {
  borderRadius: 'medium',
  buttonStyle: 'rounded',
  buttonSize: 'medium',
  cardStyle: 'elevated',
  cardPadding: 'default',
  sectionSpacing: 'default',
  imageRadius: 'medium',
  productImageAspect: 'square',
  shadowIntensity: 'subtle',
  animationSpeed: 'normal',
  hoverEffects: true,
};

export const DEFAULT_MOBILE_CONFIG: MobileConfig = {
  // Navigation
  mobileMenuStyle: 'slide',
  bottomNav: true,
  bottomNavItems: ['home', 'search', 'categories', 'cart', 'account'],

  // Header
  mobileHeaderStyle: 'standard',
  hideHeaderSearch: false,
  showMobileSearch: true,

  // Product Pages
  stickyAddToCart: true,
  mobileProductGridColumns: 2,
  swipeGestures: true,
  pinchToZoom: true,

  // Touch & Accessibility
  touchFriendlyButtons: true,
  mobileButtonSize: 'large',
  hapticFeedback: false,

  // Performance
  reducedMotion: false,
  lowDataMode: false,
};

export const DEFAULT_ADVANCED_CONFIG: AdvancedConfig = {
  customCss: '',
  visibility: {
    showBreadcrumbs: true,
    showBackToTop: true,
    showCookieBanner: false,
    showPromoBar: false,
  },
  performance: {
    lazyLoadImages: true,
    preloadCriticalFonts: true,
  },
};

// ========================================
// Theme Version History Types
// ========================================

export interface ThemeHistoryEntry {
  id: string;
  themeSettingsId: string;
  tenantId: string;
  version: number;
  snapshot: StorefrontSettings;
  changeSummary?: string;
  createdBy?: string;
  createdAt: string;
}

export interface ThemeHistoryListResponse {
  success: boolean;
  data: ThemeHistoryEntry[];
  total: number;
  message?: string;
}

export interface ThemeHistoryResponse {
  success: boolean;
  data?: ThemeHistoryEntry;
  message?: string;
}

// Default storefront settings
export const DEFAULT_STOREFRONT_SETTINGS: Omit<StorefrontSettings, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
  themeTemplate: 'vibrant',
  primaryColor: '#8B5CF6',
  secondaryColor: '#EC4899',
  fontPrimary: 'Inter',
  fontSecondary: 'Inter',
  colorMode: 'both',

  headerConfig: {
    showAnnouncement: false,
    navLinks: [
      { id: '1', label: 'Products', href: '/products', isExternal: false, position: 0 },
      { id: '2', label: 'Categories', href: '/categories', isExternal: false, position: 1 },
    ],
    showSearch: true,
    showCart: true,
    showAccount: true,
    stickyHeader: true,
  },

  homepageConfig: {
    heroEnabled: true,
    heroBackgroundType: 'animated',
    heroTitle: 'Welcome to Our Store',
    heroSubtitle: 'Discover amazing products',
    heroCtaText: 'Shop Now',
    heroCtaLink: '/products',
    heroOverlayOpacity: 0.4,
    sections: [
      { id: '1', type: 'featured_products', title: 'Featured Products', enabled: true, position: 0 },
      { id: '2', type: 'categories', title: 'Shop by Category', enabled: true, position: 1 },
    ],
    showNewsletter: true,
    newsletterTitle: 'Subscribe to our newsletter',
    newsletterSubtitle: 'Get updates on new products and exclusive offers',
    showTestimonials: false,
  },

  footerConfig: {
    showFooter: true,
    columnLayout: 2,
    linkGroups: [
      {
        id: '1',
        title: 'Shop',
        links: [
          { id: '1', label: 'All Products', href: '/products', isExternal: false, position: 0 },
          { id: '2', label: 'New Arrivals', href: '/products?sort=newest', isExternal: false, position: 1 },
        ],
      },
      {
        id: '2',
        title: 'Support',
        links: [
          { id: '1', label: 'Contact Us', href: '/contact', isExternal: false, position: 0 },
          { id: '2', label: 'FAQ', href: '/faq', isExternal: false, position: 1 },
        ],
      },
    ],
    showSocialIcons: true,
    socialLinks: [],
    showContactInfo: true,
    showNewsletter: false,
    showPoweredBy: true,
  },

  productConfig: {
    gridColumns: 4,
    cardStyle: 'default',
    showQuickView: true,
    showWishlist: true,
    showRatings: true,
    showSaleBadge: true,
    showStockStatus: true,
    imageAspectRatio: 'square',
    hoverEffect: 'zoom',
  },

  checkoutConfig: {
    guestCheckoutEnabled: true,
    showOrderNotes: true,
    showGiftOptions: false,
    requirePhone: true,
    requireCompany: false,
    showTrustBadges: true,
    showTermsCheckbox: true,
    termsText: 'I agree to the terms and conditions',
    termsLink: '/terms',
    showPaymentIcons: true,
  },

  // New enhanced configuration defaults
  typographyConfig: DEFAULT_TYPOGRAPHY_CONFIG,
  layoutConfig: DEFAULT_LAYOUT_CONFIG,
  spacingStyleConfig: DEFAULT_SPACING_STYLE_CONFIG,
  advancedConfig: DEFAULT_ADVANCED_CONFIG,
}

// Abandoned Cart Types
export type AbandonedCartStatus = 'PENDING' | 'REMINDED' | 'RECOVERED' | 'EXPIRED';

export interface AbandonedCartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface AbandonedCart {
  id: string;
  tenantId: string;
  cartId: string;
  customerId: string;
  status: AbandonedCartStatus;
  items: AbandonedCartItem[];
  subtotal: number;
  itemCount: number;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  abandonedAt: string;
  lastCartActivity: string;
  reminderCount: number;
  lastReminderAt?: string;
  nextReminderAt?: string;
  recoveredAt?: string;
  recoveredOrderId?: string;
  expiredAt?: string;
  recoverySource?: string;
  discountUsed?: string;
  recoveredValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AbandonedCartStats {
  totalAbandoned: number;
  totalRecovered: number;
  recoveryRate: number;
  totalAbandonedValue: number;
  totalRecoveredValue: number;
  pendingCount: number;
}

export interface AbandonedCartSettings {
  id?: string;
  tenantId: string;
  abandonmentThresholdMinutes: number;
  expirationDays: number;
  enabled: boolean;
  firstReminderHours: number;
  secondReminderHours: number;
  thirdReminderHours: number;
  maxReminders: number;
  offerDiscountOnReminder: number;
  discountType?: string;
  discountValue?: number;
  discountCode?: string;
  reminderEmailTemplate1?: string;
  reminderEmailTemplate2?: string;
  reminderEmailTemplate3?: string;
}

export interface AbandonedCartListResponse {
  carts: AbandonedCart[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================================
// Campaign Types
// ========================================

export type CampaignType = 'PROMOTION' | 'ABANDONED_CART' | 'WELCOME' | 'WINBACK' | 'PRODUCT_LAUNCH' | 'NEWSLETTER' | 'TRANSACTIONAL' | 'RE_ENGAGEMENT';
export type CampaignChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'MULTI';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: CampaignType;
  channel: CampaignChannel;
  status: CampaignStatus;
  segmentId?: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  metadata?: Record<string, any>;
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  failed: number;
  unsubscribed: number;
  revenue: number;
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type: CampaignType;
  channel: CampaignChannel;
  segmentId?: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  type?: CampaignType;
  channel?: CampaignChannel;
  status?: CampaignStatus;
  segmentId?: string;
  subject?: string;
  content?: string;
  htmlContent?: string;
  metadata?: Record<string, any>;
}

export interface ScheduleCampaignRequest {
  scheduledAt: string;
}

export interface CampaignStats {
  totalCampaigns: number;
  totalSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  totalRevenue: number;
  activeCampaigns: number;
  draftCampaigns: number;
  scheduledCampaigns: number;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================================
// Loyalty Program Types
// ========================================

export interface LoyaltyTier {
  name: string;
  minimumPoints: number;
  discountPercent: number;
  benefits: string;
}

export interface LoyaltyProgram {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  pointsPerDollar: number;
  minimumRedemption: number;
  pointsExpiration: number;
  isActive: boolean;
  tiers: LoyaltyTier[];
  signupBonus: number;
  birthdayBonus: number;
  referralBonus: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoyaltyProgramRequest {
  name: string;
  description?: string;
  pointsPerDollar: number;
  minimumRedemption?: number;
  pointsExpiration?: number;
  isActive?: boolean;
  tiers?: LoyaltyTier[];
  signupBonus?: number;
  birthdayBonus?: number;
  referralBonus?: number;
}

export interface UpdateLoyaltyProgramRequest {
  name?: string;
  description?: string;
  pointsPerDollar?: number;
  minimumRedemption?: number;
  pointsExpiration?: number;
  isActive?: boolean;
  tiers?: LoyaltyTier[];
  signupBonus?: number;
  birthdayBonus?: number;
  referralBonus?: number;
}

export interface CustomerLoyalty {
  id: string;
  tenantId: string;
  customerId: string;
  programId: string;
  pointsBalance: number;
  lifetimePoints: number;
  currentTier: string;
  tierProgress: number;
  enrolledAt: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerLoyaltyId: string;
  type: 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'EXPIRATION' | 'BONUS';
  points: number;
  balanceAfter: number;
  description?: string;
  orderId?: string;
  createdAt: string;
}

export interface PointsAdjustmentRequest {
  points: number;
  reason: string;
}

export interface CustomerLoyaltyListResponse {
  customers: CustomerLoyalty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================================
// Gift Card Types
// ========================================

export type GiftCardStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

export interface GiftCard {
  id: string;
  tenantId: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currencyCode: string;
  status: GiftCardStatus;
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  message?: string;
  purchaseDate?: string;
  expiresAt?: string;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGiftCardRequest {
  initialBalance: number;
  currencyCode?: string;
  recipientEmail?: string;
  recipientName?: string;
  senderName?: string;
  message?: string;
  expiresInDays?: number;
}

export interface UpdateGiftCardRequest {
  status?: GiftCardStatus;
  recipientEmail?: string;
  recipientName?: string;
}

export interface GiftCardStats {
  totalCards: number;
  activeCards: number;
  redeemedCards: number;
  expiredCards: number;
  totalValue: number;
  redeemedValue: number;
  remainingValue: number;
  averageBalance: number;
  redemptionRate: number;
}

export interface GiftCardListResponse {
  giftCards: GiftCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================================
// Shipping Types
// ========================================

export type ShipmentStatus =
  | 'PENDING'
  | 'CREATED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED';

export type CarrierType =
  // India carriers
  | 'SHIPROCKET'
  | 'DELHIVERY'
  | 'BLUEDART'
  | 'DTDC'
  // Global carriers
  | 'SHIPPO'
  | 'SHIPENGINE'
  | 'FEDEX'
  | 'UPS'
  | 'DHL';

export interface ShipmentAddress {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Shipment {
  id: string;
  tenantId: string;
  orderId: string;
  orderNumber: string;
  carrier: CarrierType;
  carrierShipmentId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  status: ShipmentStatus;
  fromAddress: ShipmentAddress;
  toAddress: ShipmentAddress;
  weight: number;
  length: number;
  width: number;
  height: number;
  shippingCost: number;
  currency: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  pickupScheduled?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentTracking {
  id: string;
  shipmentId: string;
  status: string;
  location?: string;
  description?: string;
  timestamp: string;
  createdAt: string;
}

export interface ShippingRate {
  carrier: CarrierType;
  serviceName: string;
  serviceCode: string;
  rate: number;           // Final rate (including markup)
  baseRate?: number;      // Original carrier rate (before markup)
  markupAmount?: number;  // Markup amount applied
  markupPercent?: number; // Markup percentage applied
  currency: string;
  estimatedDays: number;
  estimatedDelivery?: string;
  available: boolean;
  errorMessage?: string;
}

export interface ShipmentItem {
  name: string;
  sku?: string;
  quantity: number;
  price: number;
}

export interface CreateShipmentRequest {
  orderId: string;
  orderNumber: string;
  carrier?: string;
  fromAddress: ShipmentAddress;
  toAddress: ShipmentAddress;
  weight: number;
  length: number;
  width: number;
  height: number;
  serviceType?: 'express' | 'standard' | 'economy';
  shippingCost?: number; // Pre-calculated shipping cost from checkout
  orderValue?: number; // Total order value for carrier
  items?: ShipmentItem[]; // Order items for carrier
}

export interface GetRatesRequest {
  fromAddress: ShipmentAddress;
  toAddress: ShipmentAddress;
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface TrackShipmentResponse {
  shipmentId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  carrier: CarrierType;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: ShipmentTracking[];
}

export interface ShipmentListResponse {
  success: boolean;
  data: Shipment[];
  total: number;
  limit: number;
  offset: number;
}

// ========================================
// QR Code Types
// ========================================

export type QRCodeType = 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms' | 'geo' | 'app' | 'payment';
export type QRCodeFormat = 'png' | 'base64';
export type QRCodeQuality = 'low' | 'medium' | 'high' | 'highest';

export interface WiFiData {
  ssid: string;
  password?: string;
  encryption?: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export interface VCardData {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  organization?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  website?: string;
  note?: string;
}

export interface EmailData {
  address: string;
  subject?: string;
  body?: string;
}

export interface SMSData {
  phone: string;
  message?: string;
}

export interface GeoData {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface AppData {
  ios_url?: string;
  android_url?: string;
  fallback_url?: string;
}

export interface PaymentData {
  type: 'upi' | 'bitcoin' | 'ethereum';
  upi_id?: string;
  address?: string;
  name?: string;
  amount?: number;
  currency?: string;
  reference?: string;
}

export interface QRData {
  url?: string;
  text?: string;
  phone?: string;
  wifi?: WiFiData;
  vcard?: VCardData;
  email?: EmailData;
  sms?: SMSData;
  geo?: GeoData;
  app?: AppData;
  payment?: PaymentData;
}

export interface GenerateQRRequest {
  type: QRCodeType;
  data: QRData;
  size?: number;
  quality?: QRCodeQuality;
  format?: QRCodeFormat;
  save?: boolean;
  tenantId?: string;
  label?: string;
}

export interface GenerateQRResponse {
  id: string;
  type: QRCodeType;
  qr_code: string;
  format: QRCodeFormat;
  size: number;
  quality: QRCodeQuality;
  encrypted: boolean;
  storage_url?: string;
  created_at: string;
}

export interface BatchQRItem {
  type: QRCodeType;
  data: QRData;
  label?: string;
}

export interface BatchGenerateRequest {
  items: BatchQRItem[];
  size?: number;
  quality?: QRCodeQuality;
  save?: boolean;
}

export interface BatchQRResult {
  label?: string;
  qr_code?: string;
  error?: string;
}

export interface BatchGenerateResponse {
  results: BatchQRResult[];
  total: number;
  success: number;
  failed: number;
}

export interface QRTypeInfo {
  type: QRCodeType;
  name: string;
  description: string;
  icon: string;
}

export interface QRTypesResponse {
  types: QRTypeInfo[];
}

export interface QRHistoryItem {
  id: string;
  tenantId: string;
  type: QRCodeType;
  label?: string;
  qrCode: string;
  storageUrl?: string;
  createdAt: string;
}

export interface QRHistoryResponse {
  success: boolean;
  data: QRHistoryItem[];
  pagination: PaginationInfo;
}

// ========================================
// Ad Manager Types
// ========================================

// Ad Status
export type AdStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';

// Creative Types
export type AdCreativeType = 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'BANNER' | 'NATIVE' | 'HTML5';

// Placement Types - aligned with storefront AdZone placements
export type AdPlacementType =
  | 'HOMEPAGE_HERO'        // homepage-hero-below
  | 'HOMEPAGE_BANNER'      // homepage-products-between
  | 'CATEGORY_BANNER'      // category-header
  | 'PRODUCT_LISTING'      // plp-after-row-3, plp-after-row-6 (in-feed native)
  | 'SEARCH_RESULTS'       // search-results
  | 'CHECKOUT'             // checkout pages
  | 'SIDEBAR'              // plp-sidebar, pdp-sidebar, cart-sidebar (right-rail)
  | 'CART'                 // cart page specific
  | 'PRODUCT_DETAIL'       // pdp-below-description
  | 'MEGA_MENU'            // mega-menu card
  | 'PROMO_RIBBON'         // promo-ribbon between sections
  | 'INTERSTITIAL';        // full-width between-section

// Bid Strategy
export type AdBidStrategy = 'CPC' | 'CPM' | 'CPA' | 'FIXED_DAILY';

// Submission Status
export type AdSubmissionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUESTED';

// Targeting Match Type
export type AdTargetingMatchType = 'INCLUDE' | 'EXCLUDE';

// Targeting Rule Types
export type AdTargetingRuleType =
  | 'CATEGORY'
  | 'PRODUCT'
  | 'AUDIENCE_SEGMENT'
  | 'GEOGRAPHY'
  | 'DEVICE'
  | 'TIME_OF_DAY'
  | 'KEYWORD'
  | 'PRICE_RANGE';

// Ad Campaign
export interface AdCampaign {
  id: string;
  tenantId: string;
  vendorId: string;
  name: string;
  description?: string;
  status: AdStatus;
  budgetTotal: number;
  budgetDaily?: number;
  spentTotal: number;
  bidStrategy: AdBidStrategy;
  bidAmount: number;
  startDate: string;
  endDate?: string;
  targetStorefrontIds?: string[];
  targetAllStorefronts: boolean;
  // Analytics
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cvr: number;
  roas: number;
  // Audit
  createdById: string;
  createdByName?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Relations
  ads?: Ad[];
  targetingRules?: AdTargetingRule[];
}

// Ad (individual ad unit within a campaign)
export interface Ad {
  id: string;
  campaignId: string;
  tenantId: string;
  vendorId: string;
  name: string;
  status: AdStatus;
  creativeId: string;
  placementIds: string[];
  destinationUrl: string;
  displayText?: string;
  callToAction?: string;
  // Analytics
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  // Scheduling
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  creative?: AdCreative;
  placements?: AdPlacement[];
  campaign?: AdCampaign;
}

// Ad Creative
export interface AdCreative {
  id: string;
  tenantId: string;
  vendorId: string;
  name: string;
  type: AdCreativeType;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  // Media
  primaryImageUrl: string;
  primaryImageAltText?: string;
  secondaryImageUrls?: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  htmlContent?: string;
  // Dimensions
  width: number;
  height: number;
  // Content
  headline?: string;
  description?: string;
  brandName?: string;
  brandLogoUrl?: string;
  // Product links
  productIds?: string[];
  categoryIds?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Ad Placement
export interface AdPlacement {
  id: string;
  tenantId: string;
  storefrontId: string;
  storefrontName?: string;
  name: string;
  type: AdPlacementType;
  description?: string;
  // Dimensions
  width: number;
  height: number;
  // Pricing
  baseCpm: number;
  baseCpc?: number;
  minimumBid: number;
  // Availability
  isActive: boolean;
  maxAdsPerPage: number;
  // Eligibility
  eligibleVendorIds?: string[];
  excludedCategoryIds?: string[];
  requiresApproval: boolean;
  // Analytics
  avgImpressions: number;
  avgCtr: number;
  createdAt: string;
  updatedAt: string;
}

// Ad Submission (for approval workflow)
export interface AdSubmission {
  id: string;
  tenantId: string;
  vendorId: string;
  vendorName?: string;
  campaignId?: string;
  adId?: string;
  creativeId?: string;
  submissionType: 'CAMPAIGN' | 'AD' | 'CREATIVE' | 'PLACEMENT_REQUEST';
  status: AdSubmissionStatus;
  // Submitter info
  submittedById: string;
  submittedByName: string;
  submittedByEmail?: string;
  submittedAt: string;
  // Reviewer info
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  // Decision
  rejectionReason?: string;
  revisionNotes?: string;
  conditions?: string;
  message?: string;
  metadata?: Record<string, any>;
  // Relations
  campaign?: AdCampaign;
  ad?: Ad;
  creative?: AdCreative;
}

// Ad Approval Decision
export interface AdApprovalDecision {
  id: string;
  submissionId: string;
  tenantId: string;
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  decidedById: string;
  decidedByName: string;
  reason?: string;
  conditions?: string;
  decidedAt: string;
}

// Ad Targeting Rule
export interface AdTargetingRule {
  id: string;
  campaignId: string;
  ruleType: AdTargetingRuleType;
  matchType: AdTargetingMatchType;
  values: string[];
  metadata?: Record<string, any>;
}

// Ad Analytics Summary
export interface AdAnalyticsSummary {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cvr: number;
  roas: number;
  cpc: number;
  cpm: number;
  uniqueReach?: number;
  frequency?: number;
}

// Ad Analytics Event
export interface AdAnalyticsEvent {
  id: string;
  adId: string;
  campaignId: string;
  tenantId: string;
  vendorId: string;
  eventType: 'IMPRESSION' | 'CLICK' | 'CONVERSION' | 'VIEW_CONTENT' | 'ADD_TO_CART' | 'PURCHASE';
  storefrontId: string;
  placementId: string;
  customerId?: string;
  sessionId: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
  attributionValue?: number;
  orderId?: string;
  productId?: string;
  pageUrl: string;
  referrer?: string;
  timestamp: string;
}

// Ad Campaign Stats (for dashboard)
export interface AdCampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  pendingApproval: number;
  totalSpend: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgRoas: number;
}

// Request Types
export interface CreateAdCampaignRequest {
  name: string;
  description?: string;
  budgetTotal: number;
  budgetDaily?: number;
  bidStrategy: AdBidStrategy;
  bidAmount: number;
  startDate: string;
  endDate?: string;
  targetStorefrontIds?: string[];
  targetAllStorefronts?: boolean;
  targetingRules?: Omit<AdTargetingRule, 'id' | 'campaignId'>[];
}

export interface UpdateAdCampaignRequest {
  name?: string;
  description?: string;
  status?: AdStatus;
  budgetTotal?: number;
  budgetDaily?: number;
  bidStrategy?: AdBidStrategy;
  bidAmount?: number;
  startDate?: string;
  endDate?: string;
  targetStorefrontIds?: string[];
  targetAllStorefronts?: boolean;
  targetingRules?: Omit<AdTargetingRule, 'id' | 'campaignId'>[];
}

export interface CreateAdRequest {
  campaignId: string;
  name: string;
  creativeId: string;
  placementIds: string[];
  destinationUrl: string;
  displayText?: string;
  callToAction?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateAdRequest {
  name?: string;
  status?: AdStatus;
  creativeId?: string;
  placementIds?: string[];
  destinationUrl?: string;
  displayText?: string;
  callToAction?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateAdCreativeRequest {
  name: string;
  type: AdCreativeType;
  primaryImageUrl: string;
  primaryImageAltText?: string;
  secondaryImageUrls?: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  htmlContent?: string;
  width: number;
  height: number;
  headline?: string;
  description?: string;
  brandName?: string;
  brandLogoUrl?: string;
  productIds?: string[];
  categoryIds?: string[];
}

export interface UpdateAdCreativeRequest {
  name?: string;
  type?: AdCreativeType;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  primaryImageUrl?: string;
  primaryImageAltText?: string;
  secondaryImageUrls?: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  htmlContent?: string;
  width?: number;
  height?: number;
  headline?: string;
  description?: string;
  brandName?: string;
  brandLogoUrl?: string;
  productIds?: string[];
  categoryIds?: string[];
}

export interface SubmitAdForApprovalRequest {
  submissionType: 'CAMPAIGN' | 'AD' | 'CREATIVE' | 'PLACEMENT_REQUEST';
  campaignId?: string;
  adId?: string;
  creativeId?: string;
  storefrontIds?: string[];
  message?: string;
}

export interface AdApprovalDecisionRequest {
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  reason?: string;
  conditions?: string;
}

export interface AdAnalyticsQuery {
  campaignId?: string;
  adId?: string;
  storefrontId?: string;
  placementId?: string;
  dateFrom: string;
  dateTo: string;
  groupBy?: 'DAY' | 'WEEK' | 'MONTH' | 'PLACEMENT' | 'CREATIVE' | 'STOREFRONT';
}

export interface AdAnalyticsTimeSeriesData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface AdAnalyticsResponse {
  summary: AdAnalyticsSummary;
  timeSeries?: AdAnalyticsTimeSeriesData[];
  byPlacement?: Record<string, AdAnalyticsSummary>;
  byCreative?: Record<string, AdAnalyticsSummary>;
  byStorefront?: Record<string, AdAnalyticsSummary>;
}

// ==========================================
// Ad Billing & Commission Types
// ==========================================

export type AdPaymentType = 'DIRECT' | 'SPONSORED';
export type AdPaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type AdLedgerEntryType = 'PAYMENT' | 'SPEND' | 'REFUND' | 'ADJUSTMENT' | 'COMMISSION';

export interface AdCommissionTier {
  id: string;
  tenantId: string;
  name: string;
  minDays: number;
  maxDays?: number;
  commissionRate: number; // e.g., 0.019 = 1.9%
  taxInclusive: boolean;
  isActive: boolean;
  priority: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionCalculation {
  tierId: string;
  tierName: string;
  campaignDays: number;
  budgetAmount: number;
  commissionRate: number;
  commissionAmount: number;
  taxInclusive: boolean;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export interface AdCampaignPayment {
  id: string;
  tenantId: string;
  vendorId: string;
  campaignId: string;
  paymentType: AdPaymentType;
  status: AdPaymentStatus;
  budgetAmount: number;
  commissionRate?: number;
  commissionAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  commissionTierId?: string;
  campaignDays?: number;
  paymentTransactionId?: string;
  gatewayType?: string;
  gatewayTransactionId?: string;
  paidAt?: string;
  refundedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  commissionTier?: AdCommissionTier;
}

export interface AdVendorBalance {
  id: string;
  tenantId: string;
  vendorId: string;
  currentBalance: number;
  totalDeposited: number;
  totalSpent: number;
  totalRefunded: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdRevenueLedger {
  id: string;
  tenantId: string;
  vendorId: string;
  campaignId: string;
  entryType: AdLedgerEntryType;
  amount: number;
  currency: string;
  balanceAfter: number;
  campaignPaymentId?: string;
  invoiceId?: string;
  paymentTransactionId?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CalculateCommissionRequest {
  campaignDays: number;
  budgetAmount: number;
  currency?: string;
}

export interface CreateAdPaymentRequest {
  vendorId: string;
  campaignId: string;
  budgetAmount: number;
  campaignDays: number;
  currency?: string;
}

export interface ProcessAdPaymentRequest {
  gatewayType: 'STRIPE' | 'RAZORPAY' | 'PAYPAL' | 'PAYU';
}

export interface AdPaymentIntentResponse {
  paymentId: string;
  status: AdPaymentStatus;
  totalAmount: number;
  currency: string;
  // Stripe specific
  stripeSessionId?: string;
  stripeSessionUrl?: string;
  stripePublicKey?: string;
  // Razorpay specific
  razorpayOrderId?: string;
  options?: Record<string, any>;
}

export interface CreateCommissionTierRequest {
  name: string;
  minDays: number;
  maxDays?: number;
  commissionRate: number;
  taxInclusive?: boolean;
  priority?: number;
  description?: string;
}

export interface UpdateCommissionTierRequest {
  name?: string;
  minDays?: number;
  maxDays?: number;
  commissionRate?: number;
  taxInclusive?: boolean;
  priority?: number;
  description?: string;
  isActive?: boolean;
}
