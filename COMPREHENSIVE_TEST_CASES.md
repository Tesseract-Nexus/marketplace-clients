# Tesserix Marketplace Platform - Comprehensive Manual Test Cases

## Document Information
- **Version**: 1.0
- **Last Updated**: January 2026
- **Platform**: Tesserix Multi-Tenant E-Commerce Marketplace
- **Environment**: Production Testing

---

## Table of Contents
1. [Tenant Onboarding](#1-tenant-onboarding)
2. [Store Setup & Configuration](#2-store-setup--configuration)
3. [Staff Management & RBAC](#3-staff-management--rbac)
4. [Product Management](#4-product-management)
5. [Category Management](#5-category-management)
6. [Inventory Management](#6-inventory-management)
7. [Storefront - Customer Experience](#7-storefront---customer-experience)
8. [Order Placement Flow](#8-order-placement-flow)
9. [Order Management (Admin)](#9-order-management-admin)
10. [Approval Workflows](#10-approval-workflows)
11. [Reviews & Ratings](#11-reviews--ratings)
12. [Coupons & Promotions](#12-coupons--promotions)
13. [Gift Cards](#13-gift-cards)
14. [Marketing & Campaigns](#14-marketing--campaigns)
15. [Customer Management](#15-customer-management)
16. [Analytics & Reporting](#16-analytics--reporting)
17. [Ticket/Support Management](#17-ticketsupport-management)
18. [Vendor Management (Marketplace)](#18-vendor-management-marketplace)
19. [Supplier Management](#19-supplier-management)
20. [Shipping Configuration](#20-shipping-configuration)
21. [Tax Configuration](#21-tax-configuration)
22. [Payment Gateway Configuration](#22-payment-gateway-configuration)
23. [Settings & Security](#23-settings--security)
24. [Notifications Configuration](#24-notifications-configuration)
25. [Returns & Exchanges](#25-returns--exchanges)
26. [Import/Export Operations](#26-importexport-operations)
27. [Localization & Multi-Currency](#27-localization--multi-currency)
28. [Mobile App Testing](#28-mobile-app-testing)
29. [Integration Tests](#29-integration-tests)

---

## 1. Tenant Onboarding

### 1.1 New Tenant Registration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TO-001 | Start new onboarding session | 1. Navigate to onboarding.tesserix.app<br>2. Click "Start Selling" | Onboarding session created with status "started", redirected to business info form | High |
| TO-002 | Submit business information | 1. Enter business name (min 2 chars)<br>2. Select business type<br>3. Select industry<br>4. Enter optional description<br>5. Click Continue | Business info saved, progress 25%, moved to contact info step | High |
| TO-003 | Validate slug availability | 1. Enter desired subdomain/slug<br>2. Wait for real-time validation | System shows availability status, suggests alternatives if taken | High |
| TO-004 | Reject reserved/system slugs | 1. Enter "admin", "api", "www", "mail" as slug | Error: "This subdomain is reserved" | High |
| TO-005 | Submit contact information | 1. Enter first/last name<br>2. Enter valid email<br>3. Enter phone number<br>4. Click Continue | Contact info saved, progress 50% | High |
| TO-006 | Submit business address | 1. Enter street address<br>2. Enter city, state, postal code<br>3. Select country<br>4. Click Continue | Address saved, progress 75%, email verification triggered | High |
| TO-007 | Email verification - Valid OTP | 1. Check email for OTP<br>2. Enter correct 6-digit OTP<br>3. Click Verify | Email verified, progress 100%, proceed to account setup | High |
| TO-008 | Email verification - Invalid OTP | 1. Enter incorrect OTP 5 times | Account temporarily locked, "Max attempts exceeded" message | High |
| TO-009 | Email verification - Expired OTP | 1. Wait 15+ minutes<br>2. Enter OTP | Error: "Verification code expired", option to resend | Medium |
| TO-010 | Complete account setup | 1. Enter password (min 8 chars)<br>2. Select timezone<br>3. Select currency<br>4. Select business model (ONLINE_STORE/MARKETPLACE)<br>5. Click Create Account | Tenant created, vendor created, storefront created, user logged in, redirected to admin dashboard | High |
| TO-011 | Password validation | 1. Enter password with less than 8 chars | Error: Password must be at least 8 characters | High |
| TO-012 | Business model selection | 1. Select ONLINE_STORE<br>2. Complete setup | Tenant created with single vendor (isOwnerVendor=true), single storefront | High |
| TO-013 | Business model - Marketplace | 1. Select MARKETPLACE<br>2. Complete setup | Tenant created with marketplace capabilities, vendor management enabled | Medium |
| TO-014 | Duplicate email prevention | 1. Complete onboarding with email A<br>2. Start new onboarding with same email A | Error: "Email already registered", option to login | High |
| TO-015 | Session recovery | 1. Start onboarding<br>2. Close browser<br>3. Return within 7 days | Draft recovered, can continue from last step | Medium |
| TO-016 | Session expiration | 1. Start onboarding<br>2. Wait 7+ days | Session expired, must restart onboarding | Low |

### 1.2 Existing User - Create Additional Store

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TO-017 | Quick tenant creation | 1. Login with existing account<br>2. Navigate to create new store<br>3. Enter store name, slug, colors | New tenant created without full onboarding | Medium |
| TO-018 | Multi-tenant switching | 1. Create multiple stores<br>2. Switch between stores | Context switches correctly, correct data displayed | Medium |
| TO-019 | Set default tenant | 1. Have multiple tenants<br>2. Set one as default | Default tenant loads on login | Low |

---

## 2. Store Setup & Configuration

### 2.1 Storefront Configuration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SS-001 | View storefront list | 1. Navigate to Settings > Storefronts | List of storefronts displayed with status | High |
| SS-002 | Create new storefront | 1. Click "Add Storefront"<br>2. Enter name, slug<br>3. Upload logo, favicon<br>4. Save | Storefront created, appears in list | High |
| SS-003 | Update storefront details | 1. Select storefront<br>2. Change name, description<br>3. Save | Changes saved, storefront updated | High |
| SS-004 | Set default storefront | 1. Have multiple storefronts<br>2. Set one as default | Only one default at a time, previous default cleared | Medium |
| SS-005 | Deactivate storefront | 1. Toggle "Active" switch off | Storefront deactivated, not accessible publicly | High |
| SS-006 | Custom domain setup | 1. Enter custom domain<br>2. Configure DNS | Custom domain validated and active | Medium |
| SS-007 | Duplicate slug prevention | 1. Create storefront with existing slug | Error: "Slug already exists" | High |

### 2.2 Theme Configuration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SS-008 | Apply theme preset | 1. Navigate to Theme Settings<br>2. Select preset (vibrant, minimal, dark, etc.)<br>3. Save | Theme applied, colors and fonts updated | High |
| SS-009 | Customize primary/secondary colors | 1. Open color picker<br>2. Select colors<br>3. Save | Custom colors applied across storefront | High |
| SS-010 | Configure header | 1. Enable/disable announcement bar<br>2. Add navigation links<br>3. Toggle search, cart icons | Header configuration saved, visible on storefront | Medium |
| SS-011 | Configure homepage | 1. Toggle hero section<br>2. Set hero title, subtitle<br>3. Add featured sections | Homepage configuration applied | Medium |
| SS-012 | Configure footer | 1. Add footer links<br>2. Add social media links<br>3. Update copyright text | Footer configuration saved | Medium |
| SS-013 | Product display settings | 1. Set grid columns (2-6)<br>2. Enable/disable quick view<br>3. Configure hover effects | Product grid displays correctly | Medium |
| SS-014 | Checkout settings | 1. Enable/disable guest checkout<br>2. Configure required fields<br>3. Add trust badges | Checkout reflects settings | High |
| SS-015 | Preview theme changes | 1. Make theme changes<br>2. Click Preview | Preview shows changes without saving | Medium |
| SS-016 | Theme version rollback | 1. View theme history<br>2. Select previous version<br>3. Restore | Previous theme version restored | Low |
| SS-017 | Custom CSS | 1. Add custom CSS<br>2. Save | Custom styles applied to storefront | Low |

### 2.3 Content Pages

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SS-018 | Edit Privacy Policy | 1. Navigate to Content Pages<br>2. Edit Privacy Policy<br>3. Save | Privacy policy updated, accessible on storefront | High |
| SS-019 | Edit Terms of Service | 1. Edit Terms page<br>2. Save | Terms updated and accessible | High |
| SS-020 | Edit Refund Policy | 1. Edit Refund policy<br>2. Save | Refund policy updated | High |
| SS-021 | Edit About Us | 1. Edit About Us page<br>2. Save | About page updated | Medium |
| SS-022 | Create custom page | 1. Add new page<br>2. Enter content<br>3. Set URL slug<br>4. Publish | Custom page accessible at specified URL | Medium |

---

## 3. Staff Management & RBAC

### 3.1 Department Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SM-001 | Create department | 1. Navigate to Staff > Departments<br>2. Click Add Department<br>3. Enter name, code, description<br>4. Save | Department created successfully | High |
| SM-002 | Create child department | 1. Create department<br>2. Add child department with parent reference | Hierarchical structure created, level auto-calculated | Medium |
| SM-003 | Prevent circular reference | 1. Try to set department as its own parent | Error: "Circular reference not allowed" | High |
| SM-004 | Assign department head | 1. Select existing staff as department head | Department head assigned, visible in department details | Medium |
| SM-005 | Update department | 1. Edit department details<br>2. Save | Changes saved successfully | Medium |
| SM-006 | Delete department | 1. Delete department without staff | Department deleted | Medium |
| SM-007 | Delete department with staff | 1. Try to delete department with active staff | Error or warning about reassigning staff | Medium |

### 3.2 Team Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SM-008 | Create team | 1. Navigate to Teams<br>2. Add team under department<br>3. Enter name, code<br>4. Set default role<br>5. Save | Team created with default role | High |
| SM-009 | Assign team lead | 1. Select staff as team lead | Team lead assigned | Medium |
| SM-010 | Set team capacity | 1. Set max capacity for team | Capacity limit enforced | Low |

### 3.3 Staff Creation & Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SM-011 | Invite new staff member | 1. Navigate to Staff<br>2. Click Add Staff<br>3. Enter email, first/last name<br>4. Select role<br>5. Select department/team<br>6. Send invite | Invitation email sent, staff created with "pending_activation" status | High |
| SM-012 | Staff accepts invitation | 1. Staff receives email<br>2. Clicks invitation link<br>3. Sets password<br>4. Completes profile | Staff account activated, can login | High |
| SM-013 | Duplicate email prevention | 1. Invite staff with existing email | Error: "Email already exists in this tenant" | High |
| SM-014 | Update staff details | 1. Edit staff profile<br>2. Change department/team<br>3. Save | Staff details updated | Medium |
| SM-015 | Deactivate staff | 1. Change status to "suspended" or "deactivated" | Staff cannot login, access revoked | High |
| SM-016 | Delete staff | 1. Delete staff member | Soft delete applied, staff removed from active list | Medium |
| SM-017 | Bulk staff import | 1. Download import template<br>2. Fill with staff data<br>3. Upload CSV/XLSX | Staff imported with success/error report | Low |

### 3.4 Role Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SM-018 | View system roles | 1. Navigate to Roles | System roles displayed (store_owner, store_admin, store_manager, viewer) | High |
| SM-019 | Create custom role | 1. Click Add Role<br>2. Enter name, display name<br>3. Set priority level<br>4. Select permissions<br>5. Save | Custom role created | High |
| SM-020 | Edit role permissions | 1. Edit existing role<br>2. Add/remove permissions<br>3. Save | Permissions updated, takes effect immediately | High |
| SM-021 | Delete custom role | 1. Delete role without assignees | Role deleted | Medium |
| SM-022 | Delete role with assignees | 1. Try to delete role with active assignees | Error: "Role has active assignments" | High |
| SM-023 | Priority boundary enforcement | 1. Staff with priority 60 tries to create role with priority 70 | Error: Cannot create role with higher priority | High |

### 3.5 Role Assignment

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SM-024 | Assign role to staff | 1. Select staff<br>2. Assign role<br>3. Save | Role assigned, permissions take effect | High |
| SM-025 | Assign multiple roles | 1. Assign second role to staff | Staff has union of all permissions | Medium |
| SM-026 | Set primary role | 1. Mark one role as primary | Primary role displayed as main role | Low |
| SM-027 | Scoped role assignment | 1. Assign role with department scope | Role only effective within department | Medium |
| SM-028 | Time-limited role | 1. Assign role with expiration date | Role automatically expires at specified date | Medium |
| SM-029 | Self-assignment prevention | 1. Try to assign role to yourself | Error: "Cannot assign role to yourself" | High |
| SM-030 | Priority boundary on assignment | 1. Manager tries to assign owner role | Error: "Cannot assign role with higher priority" | High |
| SM-031 | Remove role from staff | 1. Remove role assignment<br>2. Save | Role removed, permissions revoked | High |
| SM-032 | Prevent removing last role from self | 1. Try to remove your only role | Error: "Cannot remove your last role" | High |

### 3.6 Permission Testing

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SM-033 | View effective permissions | 1. Navigate to staff profile<br>2. View permissions tab | All effective permissions from all roles displayed | Medium |
| SM-034 | Permission denied - Products | 1. Login as viewer<br>2. Try to create product | Error: "Permission denied" or hidden button | High |
| SM-035 | Permission denied - Staff | 1. Login without staff management permission<br>2. Try to access Staff section | Section hidden or access denied | High |
| SM-036 | Permission denied - Settings | 1. Login without settings permission<br>2. Try to access Settings | Access denied | High |
| SM-037 | Wildcard permission | 1. Assign "orders:*" permission<br>2. Try all order operations | All order operations allowed | Medium |

---

## 4. Product Management

### 4.1 Product Creation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PM-001 | Create basic product | 1. Navigate to Products<br>2. Click Add Product<br>3. Enter name, description, SKU<br>4. Set price<br>5. Select category<br>6. Save as Draft | Product created with DRAFT status | High |
| PM-002 | Required field validation | 1. Try to create product without name | Error: "Name is required" | High |
| PM-003 | Duplicate SKU prevention | 1. Create product with existing SKU | Error: "SKU already exists" | High |
| PM-004 | Add product images | 1. Upload up to 12 gallery images<br>2. Set primary image<br>3. Reorder images | Images saved, primary image displayed | High |
| PM-005 | Image limit enforcement | 1. Try to upload 13th image | Error: "Maximum 12 images allowed" | Medium |
| PM-006 | Add product videos | 1. Upload up to 2 videos | Videos saved and playable | Medium |
| PM-007 | Set pricing | 1. Enter price, compare price, cost price | Pricing saved, discount calculated if compare price set | High |
| PM-008 | Set inventory | 1. Enter quantity<br>2. Set low stock threshold | Inventory tracked, low stock alert at threshold | High |
| PM-009 | Add product attributes | 1. Add custom attributes (color, size, material)<br>2. Save | Attributes saved in JSONB | Medium |
| PM-010 | Add product tags | 1. Add tags for categorization<br>2. Save | Tags saved, searchable | Medium |
| PM-011 | Set product weight/dimensions | 1. Enter weight, length, width, height | Shipping calculations use this data | Medium |
| PM-012 | SEO fields | 1. Enter search keywords<br>2. Enter slug | Product searchable, accessible at slug URL | Medium |

### 4.2 Product Variants

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PM-013 | Create product variant | 1. Open product<br>2. Add variant<br>3. Enter name, SKU<br>4. Set price, quantity | Variant created, linked to product | High |
| PM-014 | Variant-specific pricing | 1. Create variant with different price | Variant has independent price | High |
| PM-015 | Variant-specific inventory | 1. Set different quantities per variant | Each variant has own stock level | High |
| PM-016 | Variant-specific images | 1. Add images to specific variant | Variant shows specific images | Medium |
| PM-017 | Variant attributes | 1. Set variant-specific attributes (e.g., Size: L, Color: Red) | Attributes differentiate variants | High |
| PM-018 | Update variant | 1. Edit variant details<br>2. Save | Variant updated | Medium |
| PM-019 | Delete variant | 1. Delete variant | Variant removed, inventory adjusted | Medium |

### 4.3 Product Status Workflow

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PM-020 | Submit for approval | 1. Change status from DRAFT to PENDING | Product in review queue | High |
| PM-021 | Approve product | 1. Admin approves PENDING product | Status changes to ACTIVE, product visible on storefront | High |
| PM-022 | Reject product | 1. Admin rejects with reason | Status changes to REJECTED, rejection notes saved | High |
| PM-023 | Deactivate product | 1. Change ACTIVE to INACTIVE | Product hidden from storefront | High |
| PM-024 | Archive product | 1. Archive old product | Status changes to ARCHIVED | Medium |
| PM-025 | Bulk status update | 1. Select multiple products<br>2. Update status | All selected products updated | Medium |

### 4.4 Product Search & Filtering

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PM-026 | Search by name | 1. Enter product name in search | Matching products displayed | High |
| PM-027 | Search by SKU | 1. Search by SKU | Product found | High |
| PM-028 | Filter by category | 1. Select category filter | Only products in category shown | High |
| PM-029 | Filter by status | 1. Filter by ACTIVE/DRAFT/etc. | Filtered results displayed | High |
| PM-030 | Filter by inventory status | 1. Filter by IN_STOCK/LOW_STOCK/OUT_OF_STOCK | Products matching status shown | Medium |
| PM-031 | Filter by price range | 1. Set min and max price | Products in range shown | Medium |
| PM-032 | Combine multiple filters | 1. Apply category + status + price filters | Combined filter results | Medium |

---

## 5. Category Management

### 5.1 Category CRUD

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CM-001 | Create root category | 1. Navigate to Categories<br>2. Add new category<br>3. Enter name, slug, description<br>4. Save | Category created at level 0 | High |
| CM-002 | Create child category | 1. Add category with parent<br>2. Save | Category created at level = parent+1 | High |
| CM-003 | Category hierarchy depth | 1. Create categories up to 10 levels deep | All levels created, max depth enforced | Medium |
| CM-004 | Prevent circular reference | 1. Try to set category as its own parent | Error: "Circular reference not allowed" | High |
| CM-005 | Prevent indirect circular reference | 1. A → B → C<br>2. Try to set C as parent of A | Error prevented | High |
| CM-006 | Update category | 1. Edit name, description<br>2. Save | Category updated | High |
| CM-007 | Change category parent | 1. Move category to different parent | Level recalculated automatically | Medium |
| CM-008 | Delete category without products | 1. Delete empty category | Category deleted | Medium |
| CM-009 | Delete category with products | 1. Try to delete category with products | Error or prompt to reassign products | High |
| CM-010 | Reorder categories | 1. Drag/drop to reorder<br>2. Save positions | New order saved | Medium |

### 5.2 Category Media

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CM-011 | Upload category image | 1. Add category icon/thumbnail<br>2. Save | Image displayed on category | High |
| CM-012 | Upload category banner | 1. Add 1920x480 banner<br>2. Save | Banner displayed on category page | Medium |
| CM-013 | Category gallery | 1. Add up to 3 gallery images | Gallery saved | Low |

### 5.3 Category Display

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CM-014 | View category tree | 1. Navigate to category tree view | Full hierarchy displayed with expand/collapse | High |
| CM-015 | Category on storefront | 1. View category on storefront | Category page shows products, subcategories | High |
| CM-016 | Category navigation | 1. Browse through category hierarchy on storefront | Breadcrumb and navigation work correctly | High |

---

## 6. Inventory Management

### 6.1 Warehouse Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IM-001 | Create warehouse | 1. Navigate to Inventory > Warehouses<br>2. Add warehouse<br>3. Enter details<br>4. Save | Warehouse created | High |
| IM-002 | Set default warehouse | 1. Mark warehouse as default | Only one default at a time | High |
| IM-003 | Update warehouse | 1. Edit warehouse details<br>2. Save | Changes saved | Medium |
| IM-004 | Deactivate warehouse | 1. Set status to INACTIVE | Warehouse not used for new allocations | Medium |
| IM-005 | Bulk import warehouses | 1. Upload CSV/XLSX with warehouse data | Warehouses imported | Low |

### 6.2 Stock Level Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IM-006 | View stock levels | 1. Navigate to Inventory > Stock | Stock levels for all products shown | High |
| IM-007 | Manual stock adjustment | 1. Select product<br>2. Adjust quantity<br>3. Save | Stock updated, history logged | High |
| IM-008 | Bulk stock adjustment | 1. Upload stock adjustment file | Multiple products updated | Medium |
| IM-009 | Stock reservation on checkout | 1. Customer adds to cart<br>2. Begins checkout | Stock reserved, quantityReserved increased | High |
| IM-010 | Stock release on abandoned cart | 1. Customer abandons checkout<br>2. Wait for reservation expiry | Stock released back to available | High |
| IM-011 | Stock deduction on order | 1. Order placed and paid | Stock deducted from quantityOnHand | High |
| IM-012 | Stock restoration on cancellation | 1. Cancel order | Stock restored | High |

### 6.3 Low Stock Alerts

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IM-013 | Configure alert threshold | 1. Set low stock threshold for product | Threshold saved | High |
| IM-014 | Low stock alert triggered | 1. Stock falls below threshold | Alert created with status ACTIVE | High |
| IM-015 | Out of stock alert | 1. Stock reaches 0 | CRITICAL priority alert created | High |
| IM-016 | Acknowledge alert | 1. Mark alert as acknowledged | Status updated, user tracked | Medium |
| IM-017 | Resolve alert | 1. Restock product | Alert can be resolved | Medium |
| IM-018 | View alert summary | 1. View alerts dashboard | Summary of alerts by type/priority | Medium |

### 6.4 Purchase Orders

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IM-019 | Create purchase order | 1. Create PO with supplier<br>2. Add items<br>3. Save | PO created with DRAFT status | High |
| IM-020 | Submit PO for approval | 1. Submit PO | Status changes to SUBMITTED | High |
| IM-021 | Approve PO | 1. Admin approves PO | Status changes to APPROVED | High |
| IM-022 | Place order with supplier | 1. Mark PO as ordered | Status changes to ORDERED | High |
| IM-023 | Receive inventory | 1. Mark items as received<br>2. Enter received quantities | Stock automatically added to warehouse | High |
| IM-024 | Partial receipt | 1. Receive fewer items than ordered | Partial receipt recorded, can complete later | Medium |
| IM-025 | Cancel PO | 1. Cancel order | Status changes to CANCELLED | Medium |

### 6.5 Inventory Transfers

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IM-026 | Create transfer request | 1. Create transfer between warehouses<br>2. Select products<br>3. Enter quantities | Transfer created with PENDING status | Medium |
| IM-027 | Approve transfer | 1. Approve transfer request | Status changes to approved | Medium |
| IM-028 | Ship transfer | 1. Mark as shipped | Stock deducted from source, status IN_TRANSIT | Medium |
| IM-029 | Complete transfer | 1. Mark as received at destination | Stock added to destination, transfer COMPLETED | Medium |

---

## 7. Storefront - Customer Experience

### 7.1 Customer Registration & Login

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SF-001 | Customer registration | 1. Navigate to storefront<br>2. Click Register<br>3. Enter email, name, password<br>4. Submit | Account created, verification email sent | High |
| SF-002 | Email verification | 1. Click verification link in email | Email verified, account activated | High |
| SF-003 | Customer login | 1. Enter email and password<br>2. Click Login | Logged in successfully, redirected to account | High |
| SF-004 | Invalid login | 1. Enter wrong password | Error: "Invalid credentials" | High |
| SF-005 | Password reset request | 1. Click Forgot Password<br>2. Enter email | Reset email sent | High |
| SF-006 | Password reset | 1. Click reset link<br>2. Enter new password | Password updated, can login | High |
| SF-007 | Social login - Google | 1. Click "Login with Google"<br>2. Authenticate | Logged in with Google account | Medium |
| SF-008 | Guest browsing | 1. Browse without login | Products visible, can add to cart | High |

### 7.2 Product Browsing

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SF-009 | View product listing | 1. Navigate to products page | Products displayed in grid with images, names, prices | High |
| SF-010 | View product details | 1. Click on product | Product detail page with images, description, price, variants | High |
| SF-011 | Product image gallery | 1. View product with multiple images<br>2. Click through images | All images viewable, zoom works | High |
| SF-012 | Select product variant | 1. View product with variants<br>2. Select size/color | Price and availability update for selected variant | High |
| SF-013 | Out of stock display | 1. View out of stock product | "Out of Stock" indicator, add to cart disabled | High |
| SF-014 | Search products | 1. Enter search term<br>2. View results | Relevant products displayed | High |
| SF-015 | Filter by category | 1. Select category from menu | Filtered products shown | High |
| SF-016 | Filter by price | 1. Set price range filter | Products within range shown | Medium |
| SF-017 | Sort products | 1. Sort by price/name/rating | Products reordered correctly | Medium |

### 7.3 Shopping Cart

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SF-018 | Add to cart | 1. Click Add to Cart on product | Item added, cart count updates | High |
| SF-019 | Add with quantity | 1. Set quantity to 3<br>2. Add to cart | 3 items added | High |
| SF-020 | Add variant to cart | 1. Select variant<br>2. Add to cart | Specific variant added | High |
| SF-021 | View cart | 1. Click cart icon | Cart page shows all items with prices | High |
| SF-022 | Update quantity in cart | 1. Change quantity | Subtotal updates | High |
| SF-023 | Remove item from cart | 1. Click remove on item | Item removed from cart | High |
| SF-024 | Clear cart | 1. Clear all items | Cart empty | Medium |
| SF-025 | Cart persistence (logged in) | 1. Add items<br>2. Logout<br>3. Login | Cart items preserved | High |
| SF-026 | Guest cart merge | 1. Add items as guest<br>2. Login | Guest cart merged with user cart | High |
| SF-027 | Cart validation - price change | 1. Add product<br>2. Admin changes price<br>3. View cart | Warning about price change displayed | High |
| SF-028 | Cart validation - out of stock | 1. Add product<br>2. Product goes out of stock<br>3. View cart | Item marked unavailable | High |
| SF-029 | Cart expiration | 1. Add items<br>2. Wait 90 days | Cart expired, items removed | Low |

### 7.4 Wishlist

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SF-030 | Add to wishlist | 1. Click heart/wishlist icon on product | Item added to wishlist | High |
| SF-031 | View wishlist | 1. Navigate to wishlist | All wishlist items displayed | High |
| SF-032 | Move to cart from wishlist | 1. Click "Add to Cart" from wishlist | Item moved to cart | Medium |
| SF-033 | Remove from wishlist | 1. Click remove | Item removed | Medium |
| SF-034 | Create named list | 1. Create "Birthday" list<br>2. Add items | Custom list created | Low |
| SF-035 | Check if product in list | 1. View product already in wishlist | Wishlist icon filled/highlighted | Medium |

### 7.5 Customer Account

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SF-036 | View profile | 1. Navigate to Account | Profile information displayed | High |
| SF-037 | Update profile | 1. Edit name, phone<br>2. Save | Profile updated | High |
| SF-038 | Add address | 1. Navigate to Addresses<br>2. Add new address | Address saved | High |
| SF-039 | Edit address | 1. Edit existing address<br>2. Save | Address updated | Medium |
| SF-040 | Set default address | 1. Mark address as default | Default used in checkout | High |
| SF-041 | Delete address | 1. Delete address | Address removed | Medium |
| SF-042 | View order history | 1. Navigate to Orders | Past orders displayed | High |
| SF-043 | View order details | 1. Click on order | Full order details with timeline | High |
| SF-044 | Track order | 1. View order tracking | Shipping status and tracking info | High |

---

## 8. Order Placement Flow

### 8.1 Checkout Process

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| OP-001 | Proceed to checkout | 1. Have items in cart<br>2. Click Checkout | Checkout page loads | High |
| OP-002 | Guest checkout | 1. Checkout without login<br>2. Enter email | Can proceed without account | High |
| OP-003 | Select shipping address | 1. Choose from saved addresses or enter new | Address selected | High |
| OP-004 | Add new address in checkout | 1. Click "Add New Address"<br>2. Enter details | Address added and selected | High |
| OP-005 | Select billing address | 1. Same as shipping or enter different | Billing address set | High |
| OP-006 | Select shipping method | 1. View available shipping options<br>2. Select carrier/method | Shipping cost calculated and added | High |
| OP-007 | Apply coupon code | 1. Enter valid coupon code<br>2. Apply | Discount applied, total updated | High |
| OP-008 | Invalid coupon code | 1. Enter invalid code | Error: "Invalid coupon code" | High |
| OP-009 | Coupon minimum not met | 1. Apply coupon with min order value<br>2. Cart below minimum | Error: "Minimum order value not met" | High |
| OP-010 | Apply gift card | 1. Enter gift card code | Gift card balance applied | High |
| OP-011 | Review order | 1. Review order summary | All items, pricing, shipping, discounts visible | High |

### 8.2 Payment Processing

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| OP-012 | Pay with credit card | 1. Enter card details<br>2. Complete payment | Payment successful, order created | High |
| OP-013 | Pay with PayPal | 1. Select PayPal<br>2. Complete in PayPal | Payment successful | High |
| OP-014 | Pay with Razorpay | 1. Select Razorpay<br>2. Complete payment | Payment successful | High |
| OP-015 | Pay with UPI | 1. Select UPI<br>2. Complete payment | Payment successful | Medium |
| OP-016 | Payment failure | 1. Use declined card | Payment failed, error message shown, can retry | High |
| OP-017 | Insufficient gift card balance | 1. Apply gift card with partial balance | Remaining amount charged to other method | Medium |
| OP-018 | 3D Secure authentication | 1. Use card requiring 3DS<br>2. Complete authentication | Payment successful after 3DS | High |

### 8.3 Order Confirmation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| OP-019 | Order confirmation page | 1. Complete checkout | Confirmation page with order number | High |
| OP-020 | Confirmation email | 1. Complete checkout<br>2. Check email | Order confirmation email received | High |
| OP-021 | Order in account | 1. Complete checkout<br>2. View order history | New order visible with PLACED status | High |
| OP-022 | Inventory deducted | 1. Complete checkout<br>2. Check product inventory | Stock reduced by ordered quantity | High |
| OP-023 | Cart cleared | 1. Complete checkout<br>2. View cart | Cart is empty | High |

---

## 9. Order Management (Admin)

### 9.1 Order List & Search

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| OM-001 | View all orders | 1. Navigate to Orders | Orders list with pagination | High |
| OM-002 | Search by order number | 1. Enter order number in search | Order found | High |
| OM-003 | Search by customer email | 1. Search by email | Customer's orders shown | High |
| OM-004 | Filter by status | 1. Filter by PLACED/CONFIRMED/etc. | Filtered results | High |
| OM-005 | Filter by payment status | 1. Filter by PAID/PENDING | Filtered results | High |
| OM-006 | Filter by fulfillment status | 1. Filter by UNFULFILLED/SHIPPED | Filtered results | High |
| OM-007 | Filter by date range | 1. Set start and end date | Orders in range shown | Medium |
| OM-008 | Sort orders | 1. Sort by date/amount | Orders reordered | Medium |

### 9.2 Order Details

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| OM-009 | View order details | 1. Click on order | Full details: items, customer, addresses, payment, timeline | High |
| OM-010 | View order timeline | 1. Check timeline section | All status changes with timestamps | High |
| OM-011 | View customer info | 1. Check customer section | Name, email, phone, address displayed | High |
| OM-012 | View payment details | 1. Check payment section | Payment method, transaction ID, status | High |

### 9.3 Order Status Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| OM-013 | Confirm order | 1. Change status to CONFIRMED | Order confirmed, customer notified | High |
| OM-014 | Start processing | 1. Change to PROCESSING | Status updated | High |
| OM-015 | Mark as shipped | 1. Add tracking number<br>2. Change to SHIPPED | Status updated, customer notified | High |
| OM-016 | Mark as delivered | 1. Change to DELIVERED | Status updated, customer notified | High |
| OM-017 | Complete order | 1. Change to COMPLETED | Order finalized | High |
| OM-018 | Invalid status transition | 1. Try to change DELIVERED to PROCESSING | Error: Invalid transition | High |

### 9.4 Fulfillment

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| OM-019 | Update fulfillment status | 1. Change to PROCESSING<br>2. Change to PACKED<br>3. Change to DISPATCHED | Each status update recorded | High |
| OM-020 | Add tracking number | 1. Enter carrier and tracking number | Tracking info saved | High |
| OM-021 | Update tracking | 1. Update tracking with new info | Tracking updated | Medium |
| OM-022 | Failed delivery | 1. Mark as FAILED_DELIVERY | Status updated, reason recorded | Medium |
| OM-023 | Mark as returned | 1. Change to RETURNED | Return recorded | Medium |

### 9.5 Order Cancellation & Refunds

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| OM-024 | Cancel order (before shipping) | 1. Click Cancel Order<br>2. Enter reason | Order cancelled, stock restored, customer notified | High |
| OM-025 | Cannot cancel shipped order | 1. Try to cancel SHIPPED order | Error or return flow suggested | High |
| OM-026 | Initiate refund | 1. Click Refund<br>2. Enter amount<br>3. Process | Refund processed, payment status updated | High |
| OM-027 | Partial refund | 1. Refund less than order total | Partial refund recorded, status PARTIALLY_REFUNDED | High |
| OM-028 | Full refund | 1. Refund full amount | Status changes to REFUNDED | High |
| OM-029 | Refund approval workflow | 1. Initiate refund over threshold | Approval request created (if approval required) | Medium |

### 9.6 Order Splitting

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| OM-030 | Split order for partial fulfillment | 1. Select items to split<br>2. Create split | New order created, original updated | Medium |
| OM-031 | Split for multi-warehouse | 1. Split based on warehouse | Separate orders per warehouse | Medium |
| OM-032 | View split orders | 1. View parent and child orders | Relationship visible, totals correct | Medium |

---

## 10. Approval Workflows

### 10.1 Refund Approvals

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AW-001 | Auto-approve small refund | 1. Initiate refund under $250 | Refund auto-approved and processed | High |
| AW-002 | Manager approval required | 1. Initiate refund $250-$1000 | Approval request sent to manager | High |
| AW-003 | Admin approval required | 1. Initiate refund $1000-$5000 | Approval request sent to admin | High |
| AW-004 | Owner approval required | 1. Initiate refund over $5000 | Approval request sent to owner | High |
| AW-005 | Approve refund request | 1. Approver clicks Approve | Refund processed | High |
| AW-006 | Reject refund request | 1. Approver clicks Reject<br>2. Enter reason | Request rejected, requester notified | High |

### 10.2 Vendor Approvals

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AW-007 | Vendor onboarding approval | 1. New vendor submits application | Approval request created | High |
| AW-008 | Approve vendor | 1. Review and approve | Vendor activated | High |
| AW-009 | Reject vendor | 1. Reject with reason | Vendor rejected, notified | High |
| AW-010 | Vendor status change approval | 1. Request to suspend vendor | Approval required for status change | Medium |

### 10.3 Staff/Role Approvals

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AW-011 | High-role invitation approval | 1. Invite staff with admin role | Approval required | Medium |
| AW-012 | Role escalation approval | 1. Promote staff to higher role | Approval required | Medium |

### 10.4 Delegation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AW-013 | Create delegation | 1. Create delegation to another user<br>2. Set date range | Delegation active during period | Medium |
| AW-014 | Delegate approves request | 1. Delegate user approves request | Approval valid, logged | Medium |
| AW-015 | Delegation expires | 1. Wait for end date | Delegation no longer active | Medium |
| AW-016 | Revoke delegation | 1. Revoke before end date | Delegation revoked | Medium |

### 10.5 Approval History & Escalation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AW-017 | View approval history | 1. Navigate to approval request<br>2. View history | All decisions and timestamps visible | Medium |
| AW-018 | Request timeout | 1. Let request exceed timeout (72 hours) | Request expires or escalates | Medium |
| AW-019 | Escalation on SLA breach | 1. Request not actioned within escalation threshold | Escalated to higher level | Medium |
| AW-020 | View pending approvals | 1. Navigate to My Approvals | Pending requests for current user | High |

---

## 11. Reviews & Ratings

### 11.1 Review Submission

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RV-001 | Submit product review | 1. Navigate to product<br>2. Click Write Review<br>3. Enter rating, title, content<br>4. Submit | Review submitted with PENDING status | High |
| RV-002 | Star rating | 1. Select 1-5 stars | Rating saved correctly | High |
| RV-003 | Multi-aspect ratings | 1. Rate Quality, Value, Shipping separately | All ratings saved | Medium |
| RV-004 | Add review images | 1. Upload images with review | Images attached to review | Medium |
| RV-005 | Verified purchase badge | 1. Review product purchased by customer | "Verified Purchase" badge shown | High |
| RV-006 | Review without purchase | 1. Try to review product not purchased | May be allowed but without badge | Medium |

### 11.2 Review Moderation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RV-007 | View pending reviews | 1. Navigate to Reviews (Admin)<br>2. Filter by PENDING | Pending reviews listed | High |
| RV-008 | Approve review | 1. Click Approve | Review status APPROVED, visible on storefront | High |
| RV-009 | Reject review | 1. Click Reject<br>2. Enter reason | Review rejected, not visible | High |
| RV-010 | Flag review | 1. Flag for investigation | Review status FLAGGED | Medium |
| RV-011 | Bulk moderation | 1. Select multiple reviews<br>2. Approve/Reject all | All selected updated | Medium |

### 11.3 Review Display

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RV-012 | View reviews on product | 1. View product page | Approved reviews displayed | High |
| RV-013 | Average rating calculation | 1. View product with multiple reviews | Average rating calculated correctly | High |
| RV-014 | Sort reviews | 1. Sort by Most Recent/Most Helpful | Reviews sorted | Medium |
| RV-015 | Filter reviews | 1. Filter by star rating | Filtered reviews shown | Medium |
| RV-016 | Review pagination | 1. View product with many reviews | Pagination works | Medium |

### 11.4 Review Engagement

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RV-017 | Mark review helpful | 1. Click "Helpful" on review | Helpful count increases | Medium |
| RV-018 | Report review | 1. Click Report<br>2. Enter reason | Report submitted | Medium |
| RV-019 | Auto-flag on report threshold | 1. Review receives multiple reports | Review auto-flagged | Low |

---

## 12. Coupons & Promotions

### 12.1 Coupon Creation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CP-001 | Create percentage coupon | 1. Navigate to Coupons<br>2. Create coupon with type PERCENTAGE<br>3. Set value (e.g., 10%)<br>4. Save | Coupon created | High |
| CP-002 | Create fixed amount coupon | 1. Create coupon with type FIXED<br>2. Set value (e.g., $10) | Coupon created | High |
| CP-003 | Create free shipping coupon | 1. Create coupon with type FREE_SHIPPING | Coupon created | Medium |
| CP-004 | Set validity period | 1. Set start and end dates | Coupon valid only within period | High |
| CP-005 | Set minimum order value | 1. Set minimum order requirement | Coupon only valid above minimum | High |
| CP-006 | Set maximum discount | 1. Set max discount cap | Discount capped at max | High |
| CP-007 | Set usage limits | 1. Set total usage limit<br>2. Set per-user limit | Limits enforced | High |
| CP-008 | First-time user only | 1. Enable first-time user restriction | Only new customers can use | Medium |
| CP-009 | Category/Product restrictions | 1. Limit to specific categories/products | Coupon only applies to specified items | Medium |

### 12.2 Coupon Validation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CP-010 | Apply valid coupon | 1. Enter valid coupon at checkout<br>2. Apply | Discount applied | High |
| CP-011 | Invalid coupon code | 1. Enter non-existent code | Error: "Invalid coupon code" | High |
| CP-012 | Expired coupon | 1. Apply expired coupon | Error: "Coupon has expired" | High |
| CP-013 | Not yet valid coupon | 1. Apply coupon before start date | Error: "Coupon not yet valid" | High |
| CP-014 | Minimum not met | 1. Apply coupon below min order | Error: "Minimum order value not met" | High |
| CP-015 | Usage limit reached | 1. Apply fully redeemed coupon | Error: "Coupon usage limit reached" | High |
| CP-016 | Per-user limit reached | 1. User tries to use coupon again beyond limit | Error: "You have already used this coupon" | High |
| CP-017 | First-time user restriction | 1. Existing customer applies first-time coupon | Error: "This coupon is for new customers only" | Medium |
| CP-018 | Category restriction | 1. Apply category-specific coupon without matching items | Error or partial application | Medium |

### 12.3 Coupon Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CP-019 | View coupon list | 1. Navigate to Coupons | All coupons listed with stats | High |
| CP-020 | View coupon usage | 1. Click on coupon<br>2. View usage history | Usage records displayed | Medium |
| CP-021 | Deactivate coupon | 1. Set coupon status to INACTIVE | Coupon no longer valid | High |
| CP-022 | Edit coupon | 1. Edit coupon details<br>2. Save | Changes saved | Medium |
| CP-023 | Delete coupon | 1. Delete coupon | Coupon removed | Medium |
| CP-024 | Coupon analytics | 1. View coupon analytics | Usage stats, revenue impact shown | Medium |

---

## 13. Gift Cards

### 13.1 Gift Card Issuance

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| GC-001 | Create gift card | 1. Navigate to Gift Cards<br>2. Create gift card<br>3. Set initial balance<br>4. Save | Gift card created with unique code (XXXX-XXXX-XXXX-XXXX) | High |
| GC-002 | Set recipient info | 1. Enter recipient email and name | Info saved, email sent to recipient | Medium |
| GC-003 | Add personal message | 1. Add sender name and message | Message included in email | Medium |
| GC-004 | Set expiration | 1. Set expiration date | Gift card expires on date | Medium |
| GC-005 | Gift card code format | 1. Check generated code | Code matches XXXX-XXXX-XXXX-XXXX format | High |

### 13.2 Gift Card Redemption

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| GC-006 | Check balance | 1. Enter gift card code<br>2. Check balance | Current balance displayed | High |
| GC-007 | Apply to order (full coverage) | 1. Apply gift card at checkout<br>2. Balance covers order | Order completed, gift card balance = 0 | High |
| GC-008 | Apply to order (partial) | 1. Apply gift card<br>2. Balance less than order | Remaining paid with other method | High |
| GC-009 | Remaining balance after use | 1. Use gift card for amount less than balance<br>2. Check balance | Correct remaining balance | High |
| GC-010 | Invalid gift card code | 1. Enter invalid code | Error: "Invalid gift card code" | High |
| GC-011 | Expired gift card | 1. Use expired gift card | Error: "Gift card has expired" | High |
| GC-012 | Fully redeemed gift card | 1. Use gift card with $0 balance | Error: "Gift card has no remaining balance" | High |
| GC-013 | Cancelled gift card | 1. Use cancelled gift card | Error: "Gift card is not active" | High |

### 13.3 Gift Card Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| GC-014 | View gift card list | 1. Navigate to Gift Cards | All gift cards with status and balance | High |
| GC-015 | View transaction history | 1. Click on gift card<br>2. View transactions | All redemptions and adjustments shown | Medium |
| GC-016 | Cancel gift card | 1. Cancel gift card | Status changed to CANCELLED | Medium |
| GC-017 | Adjust balance | 1. Add or remove balance | Balance updated, transaction logged | Medium |
| GC-018 | Gift card statistics | 1. View stats | Total value, redeemed, remaining | Medium |

---

## 14. Marketing & Campaigns

### 14.1 Customer Segmentation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MK-001 | Create static segment | 1. Navigate to Segments<br>2. Create segment<br>3. Manually add customers | Segment created with customers | High |
| MK-002 | Create dynamic segment | 1. Create segment with rules<br>2. Set conditions (e.g., total_spent > 100) | Segment auto-updates based on rules | High |
| MK-003 | View segment customers | 1. Click on segment | List of customers in segment | Medium |
| MK-004 | Update segment | 1. Edit segment rules | Customers recalculated | Medium |

### 14.2 Campaign Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MK-005 | Create email campaign | 1. Navigate to Campaigns<br>2. Create campaign<br>3. Set type: EMAIL<br>4. Select segment<br>5. Create content | Campaign created in DRAFT | High |
| MK-006 | Create SMS campaign | 1. Create campaign with type SMS | SMS campaign created | Medium |
| MK-007 | Schedule campaign | 1. Set schedule date/time<br>2. Save | Campaign scheduled | High |
| MK-008 | Send campaign immediately | 1. Click Send Now | Campaign sent to recipients | High |
| MK-009 | View campaign stats | 1. View campaign details | Sent, delivered, opened, clicked stats | High |
| MK-010 | Pause campaign | 1. Pause active campaign | Campaign paused | Medium |
| MK-011 | Cancel campaign | 1. Cancel scheduled campaign | Campaign cancelled | Medium |

### 14.3 Abandoned Cart Recovery

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MK-012 | Detect abandoned carts | 1. Customer adds items<br>2. Leaves without checkout<br>3. Wait detection threshold | Cart marked as abandoned | High |
| MK-013 | Send recovery email | 1. Configure recovery settings<br>2. Trigger reminder | Recovery email sent | High |
| MK-014 | View abandoned cart stats | 1. Navigate to Abandoned Carts | Stats: total, recovered, pending | High |
| MK-015 | Mark cart recovered | 1. Customer completes purchase | Cart marked as recovered | High |
| MK-016 | Cart expiration | 1. Wait past expiration period | Cart expired | Low |

### 14.4 Loyalty Program

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MK-017 | Configure loyalty program | 1. Set points per dollar<br>2. Set expiry days<br>3. Configure tiers | Program configured | High |
| MK-018 | Customer enrollment | 1. Customer enrolls in program | Loyalty account created | High |
| MK-019 | Earn points on purchase | 1. Customer makes purchase | Points credited based on spent amount | High |
| MK-020 | Redeem points | 1. Customer redeems points at checkout | Discount applied, points deducted | High |
| MK-021 | View points balance | 1. Customer checks loyalty account | Balance and history displayed | Medium |
| MK-022 | Tier progression | 1. Customer reaches tier threshold | Tier upgraded, benefits unlocked | Medium |
| MK-023 | Signup bonus | 1. New customer enrolls | Signup bonus points credited | Medium |
| MK-024 | Birthday bonus | 1. Customer birthday occurs | Birthday bonus credited | Low |
| MK-025 | Points expiration | 1. Points exceed expiry days | Points expired | Low |

### 14.5 Referral Program

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MK-026 | Generate referral code | 1. Customer gets referral code | Unique code generated | Medium |
| MK-027 | Referred signup | 1. New customer signs up with referral code | Referral recorded | Medium |
| MK-028 | Referral bonus | 1. Referred customer makes purchase | Bonus points to both referrer and referred | Medium |
| MK-029 | View referral stats | 1. Customer views referral history | All referrals and bonuses shown | Low |

---

## 15. Customer Management

### 15.1 Customer CRUD

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CU-001 | View customer list | 1. Navigate to Customers | Customer list with pagination and search | High |
| CU-002 | Search customers | 1. Search by email/name | Matching customers shown | High |
| CU-003 | Filter by status | 1. Filter by ACTIVE/INACTIVE/BLOCKED | Filtered results | Medium |
| CU-004 | View customer details | 1. Click on customer | Full profile with orders, addresses, stats | High |
| CU-005 | Update customer | 1. Edit customer details<br>2. Save | Changes saved | Medium |
| CU-006 | Block customer | 1. Change status to BLOCKED | Customer cannot login | High |
| CU-007 | Delete customer | 1. Delete customer | Customer soft-deleted | Medium |

### 15.2 Customer Addresses

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CU-008 | View customer addresses | 1. View addresses section | All addresses listed | High |
| CU-009 | Add address for customer | 1. Add new address from admin | Address added | Medium |
| CU-010 | Edit customer address | 1. Edit address<br>2. Save | Address updated | Medium |
| CU-011 | Delete customer address | 1. Delete address | Address removed | Medium |

### 15.3 Customer Analytics

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| CU-012 | View customer stats | 1. View customer profile | Total orders, total spent, average order value, lifetime value | High |
| CU-013 | Customer order history | 1. View orders tab | All customer orders | High |
| CU-014 | Customer notes | 1. Add internal note<br>2. Save | Note saved for internal reference | Medium |
| CU-015 | Customer communication history | 1. View communications | All emails/SMS sent to customer | Low |

---

## 16. Analytics & Reporting

### 16.1 Dashboard Overview

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AN-001 | View main dashboard | 1. Navigate to Analytics | Overview with key KPIs | High |
| AN-002 | Revenue metric | 1. View Total Revenue | Correct total with period comparison | High |
| AN-003 | Orders metric | 1. View Total Orders | Correct count with trend | High |
| AN-004 | Customers metric | 1. View Total Customers | Correct count with new customers | High |
| AN-005 | Change date range | 1. Select different date range | All metrics update for selected period | High |
| AN-006 | Refresh data | 1. Click refresh | Data reloaded | Medium |

### 16.2 Sales Analytics

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AN-007 | View sales analytics | 1. Navigate to Sales Analytics | Detailed sales data | High |
| AN-008 | Revenue trend chart | 1. View revenue over time | Accurate daily/weekly trend | High |
| AN-009 | Order status distribution | 1. View status breakdown | Pie chart with accurate percentages | High |
| AN-010 | Payment methods analysis | 1. View payment breakdown | Methods with order counts and percentages | Medium |
| AN-011 | Top products | 1. View top selling products | Ranked by revenue/units | High |
| AN-012 | Top categories | 1. View top categories | Ranked by revenue | Medium |
| AN-013 | Export sales data | 1. Export to CSV | CSV file downloaded | Medium |

### 16.3 Customer Analytics

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AN-014 | Customer growth | 1. View customer growth chart | New customers over time | High |
| AN-015 | Customer segments | 1. View segment breakdown | Customers by value/frequency | Medium |
| AN-016 | Geographic distribution | 1. View by location | Customers by country/state | Medium |
| AN-017 | Customer retention | 1. View retention rate | Accurate retention percentage | Medium |
| AN-018 | Cohort analysis | 1. View cohort retention | Monthly cohorts with retention | Low |
| AN-019 | Top customers | 1. View top customers | Ranked by spending | Medium |

### 16.4 Inventory Analytics

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AN-020 | Stock health overview | 1. View inventory dashboard | Total products, SKUs, value | High |
| AN-021 | Low stock products | 1. View low stock list | Products below threshold | High |
| AN-022 | Out of stock products | 1. View out of stock | Products with 0 quantity | High |
| AN-023 | Inventory by category | 1. View category breakdown | Value and count per category | Medium |
| AN-024 | Fast moving products | 1. View fast movers | High turnover products | Medium |
| AN-025 | Slow moving products | 1. View slow movers | Low turnover products | Medium |

### 16.5 Financial Reports

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| AN-026 | Revenue report | 1. View gross and net revenue | Accurate calculations | High |
| AN-027 | Refunds report | 1. View refund amounts | Total refunds, return rate | High |
| AN-028 | Profit margin | 1. View gross profit and margin | Accurate calculation | Medium |
| AN-029 | Monthly trends | 1. View monthly breakdown | Month-over-month trends | Medium |
| AN-030 | Export financial data | 1. Export to CSV/JSON | Data exported correctly | Medium |

---

## 17. Ticket/Support Management

### 17.1 Ticket Creation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TK-001 | Customer creates ticket | 1. Navigate to Support<br>2. Click Create Ticket<br>3. Enter title, description<br>4. Select type and priority<br>5. Submit | Ticket created with OPEN status, TKT-XXXXXXXX number | High |
| TK-002 | Required fields validation | 1. Submit ticket without title | Error: "Title is required" | High |
| TK-003 | Select ticket type | 1. Choose from: BUG, FEATURE, SUPPORT, INCIDENT, etc. | Type set correctly | High |
| TK-004 | Set priority | 1. Select LOW/MEDIUM/HIGH/CRITICAL/URGENT | Priority set | High |
| TK-005 | Add attachments | 1. Upload files with ticket | Files attached | Medium |
| TK-006 | Customer notification | 1. Create ticket | Confirmation email sent | High |

### 17.2 Ticket List & Search

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TK-007 | View ticket list (Admin) | 1. Navigate to Tickets | All tickets with filters | High |
| TK-008 | View my tickets (Customer) | 1. Customer views tickets | Only customer's tickets shown | High |
| TK-009 | Filter by status | 1. Filter by OPEN/IN_PROGRESS/etc. | Filtered results | High |
| TK-010 | Filter by priority | 1. Filter by priority | Filtered results | Medium |
| TK-011 | Filter by type | 1. Filter by type | Filtered results | Medium |
| TK-012 | Search tickets | 1. Search by title/number | Matching tickets | High |

### 17.3 Ticket Details & Updates

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TK-013 | View ticket details | 1. Click on ticket | Full details with comments, attachments | High |
| TK-014 | Update ticket status | 1. Change status to IN_PROGRESS<br>2. Save | Status updated, customer notified | High |
| TK-015 | Add comment | 1. Add comment<br>2. Post | Comment saved, visible in timeline | High |
| TK-016 | Internal comment | 1. Add internal comment | Comment visible only to staff | Medium |
| TK-017 | Customer replies | 1. Customer adds comment | Comment added to ticket | High |
| TK-018 | Update priority | 1. Change priority<br>2. Save | Priority updated | Medium |

### 17.4 Ticket Assignment

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TK-019 | Assign ticket | 1. Assign to staff member | Ticket assigned, assignee notified | High |
| TK-020 | Reassign ticket | 1. Change assignee | New assignee notified | Medium |
| TK-021 | Multiple assignees | 1. Add multiple assignees | All assignees shown | Low |

### 17.5 Ticket Resolution

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TK-022 | Resolve ticket | 1. Change status to RESOLVED | Status updated, resolved_at set | High |
| TK-023 | Customer closes ticket | 1. Customer marks as CLOSED | Ticket closed | Medium |
| TK-024 | Reopen ticket | 1. Reopen resolved ticket | Status changes to REOPENED | Medium |
| TK-025 | Cancel ticket | 1. Cancel ticket | Status CANCELLED | Medium |

### 17.6 Escalation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TK-026 | Escalate ticket | 1. Click Escalate<br>2. Enter reason | Status ESCALATED, admin notified | Medium |
| TK-027 | View escalated tickets | 1. Filter by ESCALATED | Escalated tickets shown | Medium |

---

## 18. Vendor Management (Marketplace)

### 18.1 Vendor Registration & Onboarding

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| VM-001 | Enable marketplace mode | 1. Set business model to MARKETPLACE | Vendor management features enabled | High |
| VM-002 | Vendor self-registration | 1. Vendor navigates to vendor portal<br>2. Fills registration form<br>3. Submits documents | Vendor application submitted with PENDING status | High |
| VM-003 | Admin reviews vendor application | 1. Navigate to Vendors<br>2. View pending applications | Application details visible | High |
| VM-004 | Approve vendor | 1. Review application<br>2. Click Approve | Vendor status ACTIVE, vendor notified | High |
| VM-005 | Reject vendor | 1. Click Reject<br>2. Enter rejection reason | Vendor status REJECTED, reason saved | High |
| VM-006 | Vendor document upload | 1. Vendor uploads business documents<br>2. Submits for KYC | Documents stored, validation status tracked | High |

### 18.2 Vendor Management

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| VM-007 | View vendor list | 1. Navigate to Vendors | All vendors with status and stats | High |
| VM-008 | Search vendors | 1. Search by name/email | Matching vendors shown | High |
| VM-009 | Filter by status | 1. Filter ACTIVE/PENDING/SUSPENDED | Filtered results | Medium |
| VM-010 | View vendor details | 1. Click on vendor | Full details with addresses, payments, products | High |
| VM-011 | Edit vendor | 1. Update vendor details<br>2. Save | Vendor updated | Medium |
| VM-012 | Suspend vendor | 1. Change status to SUSPENDED | Vendor suspended, products hidden | High |
| VM-013 | Terminate vendor | 1. Terminate vendor relationship | Vendor terminated, products disabled | High |
| VM-014 | Reactivate vendor | 1. Reactivate suspended vendor | Vendor active again | Medium |

### 18.3 Vendor Commission

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| VM-015 | Set commission rate | 1. Set vendor commission percentage | Rate saved for vendor | High |
| VM-016 | Commission calculation | 1. Vendor makes sale<br>2. Check commission | Commission calculated correctly | High |
| VM-017 | Commission change approval | 1. Change commission rate significantly | Approval workflow triggered | Medium |
| VM-018 | View commission reports | 1. View vendor earnings report | Commissions, payouts displayed | Medium |

### 18.4 Vendor Addresses & Payments

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| VM-019 | Add vendor address | 1. Add business/warehouse address | Address saved | High |
| VM-020 | Add payment information | 1. Add bank details<br>2. Verify account | Payment info saved and verified | High |
| VM-021 | Multiple warehouses | 1. Add multiple warehouse addresses | All addresses saved | Medium |

### 18.5 Vendor Products

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| VM-022 | Vendor creates product | 1. Vendor logs in<br>2. Creates product | Product created under vendor | High |
| VM-023 | Vendor product listing | 1. View vendor's products | Only vendor's products shown | High |
| VM-024 | Vendor product approval | 1. Vendor submits product<br>2. Admin approves | Product goes live | High |
| VM-025 | Vendor inventory isolated | 1. Check vendor inventory | Vendor sees only their stock | High |

---

## 19. Supplier Management

### 19.1 Supplier CRUD

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SP-001 | Create supplier | 1. Navigate to Suppliers<br>2. Add supplier<br>3. Enter details<br>4. Save | Supplier created | High |
| SP-002 | View supplier list | 1. Navigate to Suppliers | All suppliers listed | High |
| SP-003 | View supplier details | 1. Click on supplier | Full details with orders and performance | High |
| SP-004 | Update supplier | 1. Edit supplier<br>2. Save | Changes saved | Medium |
| SP-005 | Delete supplier | 1. Delete supplier | Supplier removed | Medium |
| SP-006 | Bulk import suppliers | 1. Upload CSV/XLSX | Suppliers imported | Low |

### 19.2 Supplier Performance

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SP-007 | Track supplier orders | 1. View purchase orders with supplier | Order history visible | Medium |
| SP-008 | Supplier rating | 1. Rate supplier after receiving goods | Rating saved | Medium |
| SP-009 | Lead time tracking | 1. Set expected lead time<br>2. Track actual delivery | Lead time metrics updated | Low |
| SP-010 | Supplier blacklist | 1. Change status to BLACKLISTED | Supplier cannot receive new POs | Medium |

---

## 20. Shipping Configuration

### 20.1 Shipping Zones

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SH-001 | Create shipping zone | 1. Navigate to Shipping Settings<br>2. Add zone<br>3. Define countries/states | Zone created | High |
| SH-002 | Edit shipping zone | 1. Edit zone coverage | Zone updated | Medium |
| SH-003 | Delete shipping zone | 1. Delete zone | Zone removed | Medium |

### 20.2 Shipping Rates

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SH-004 | Set flat rate | 1. Configure flat rate for zone | Rate applied | High |
| SH-005 | Set weight-based rate | 1. Configure weight-based pricing | Rate calculated by weight | High |
| SH-006 | Set price-based rate | 1. Configure rate based on order value | Rate calculated by price | Medium |
| SH-007 | Free shipping threshold | 1. Set minimum for free shipping | Free shipping above threshold | High |
| SH-008 | Shipping markup | 1. Set markup percentage | Markup added to carrier rates | Medium |

### 20.3 Carrier Integration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SH-009 | Configure Shiprocket | 1. Add Shiprocket credentials<br>2. Test connection | Integration active | High |
| SH-010 | Get live rates | 1. Configure live rate fetching<br>2. Test at checkout | Real-time rates displayed | High |
| SH-011 | Create shipment | 1. Order marked for shipping<br>2. Auto-create shipment | Shipment created with tracking | High |
| SH-012 | Track shipment | 1. View tracking in admin/storefront | Tracking status displayed | High |
| SH-013 | Multiple carrier options | 1. Configure multiple carriers | Customer can choose carrier | Medium |

### 20.4 Warehouse Settings

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| SH-014 | Set default warehouse | 1. Configure default shipping origin | Warehouse used for rate calculation | High |
| SH-015 | Multi-warehouse routing | 1. Configure multiple warehouses<br>2. Order allocates to nearest | Items ship from optimal location | Medium |

---

## 21. Tax Configuration

### 21.1 Tax Settings

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TX-001 | Enable tax calculation | 1. Enable tax in settings | Tax calculated on orders | High |
| TX-002 | Set tax-inclusive pricing | 1. Toggle tax-inclusive | Prices shown with tax included | Medium |
| TX-003 | Set tax-exclusive pricing | 1. Toggle tax-exclusive | Tax added at checkout | High |

### 21.2 Tax Rates

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TX-004 | Configure GST (India) | 1. Enable GST<br>2. Set CGST, SGST, IGST rates | GST calculated correctly | High |
| TX-005 | Interstate vs Intrastate | 1. Customer in same state | CGST+SGST applied | High |
| TX-006 | Interstate transaction | 1. Customer in different state | IGST applied | High |
| TX-007 | Configure VAT (EU) | 1. Enable VAT<br>2. Set VAT rates | VAT calculated | High |
| TX-008 | Reverse charge VAT | 1. B2B transaction with valid VAT ID | Reverse charge applied | Medium |
| TX-009 | Tax exemption | 1. Mark customer as tax exempt | No tax charged | Medium |

### 21.3 HSN/SAC Codes

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| TX-010 | Set HSN code on product | 1. Add HSN code to product | Code appears on invoice | High |
| TX-011 | Set SAC code for services | 1. Add SAC code | Code appears on invoice | Medium |
| TX-012 | GST slab by product | 1. Set GST slab (5%, 12%, 18%, 28%) | Correct rate applied | High |

---

## 22. Payment Gateway Configuration

### 22.1 Gateway Setup

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PG-001 | Configure Stripe | 1. Add Stripe API keys<br>2. Test connection | Stripe enabled | High |
| PG-002 | Configure Razorpay | 1. Add Razorpay credentials<br>2. Test connection | Razorpay enabled | High |
| PG-003 | Configure PayPal | 1. Add PayPal credentials | PayPal enabled | High |
| PG-004 | Configure PayU | 1. Add PayU credentials | PayU enabled | Medium |
| PG-005 | Configure Cashfree | 1. Add Cashfree credentials | Cashfree enabled | Medium |
| PG-006 | Gateway approval workflow | 1. Try to enable new gateway | Approval may be required | Medium |

### 22.2 Payment Methods

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PG-007 | Enable credit card | 1. Enable card payments | Cards accepted | High |
| PG-008 | Enable UPI | 1. Enable UPI payments | UPI option visible | High |
| PG-009 | Enable net banking | 1. Enable net banking | Bank options shown | Medium |
| PG-010 | Enable wallets | 1. Enable digital wallets | Wallet options shown | Medium |
| PG-011 | Disable payment method | 1. Disable specific method | Method not shown at checkout | Medium |

### 22.3 Gateway Testing

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| PG-012 | Test mode payments | 1. Enable test mode<br>2. Make test payment | Payment succeeds with test card | High |
| PG-013 | Switch to live mode | 1. Add live credentials<br>2. Switch to production | Real payments processed | High |
| PG-014 | Webhook configuration | 1. Configure webhook URL | Webhooks received correctly | High |
| PG-015 | Payment failure handling | 1. Simulate failed payment | Proper error shown, can retry | High |

---

## 23. Settings & Security

### 23.1 General Settings

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ST-001 | Update store name | 1. Change store name<br>2. Save | Name updated across platform | High |
| ST-002 | Update contact email | 1. Change billing/contact email | Email updated | High |
| ST-003 | Update timezone | 1. Change default timezone | All timestamps use new timezone | Medium |
| ST-004 | Update currency | 1. Change default currency | Currency updated | High |

### 23.2 Authentication Settings

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ST-005 | Configure password policy | 1. Set minimum length<br>2. Require uppercase/numbers | Policy enforced on new passwords | High |
| ST-006 | Enable MFA for admins | 1. Require MFA for owner/admin roles | MFA enforced on login | High |
| ST-007 | Configure MFA type | 1. Choose TOTP or Email MFA | Selected type used | Medium |
| ST-008 | Session timeout | 1. Set session timeout (minutes) | Sessions expire after timeout | Medium |
| ST-009 | Max concurrent sessions | 1. Set max sessions per user | Old sessions terminated | Medium |
| ST-010 | Account lockout policy | 1. Set max failed attempts<br>2. Set lockout duration | Account locked after failures | High |

### 23.3 SSO Configuration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ST-011 | Enable Google SSO | 1. Configure Google OAuth | Staff can login with Google | Medium |
| ST-012 | Enable Microsoft SSO | 1. Configure Azure AD | Staff can login with Microsoft | Medium |
| ST-013 | Disable password login | 1. Force SSO-only for staff | Password login disabled | Low |

### 23.4 IP & Access Control

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| ST-014 | Enable IP whitelist | 1. Add allowed IP addresses | Only whitelisted IPs can access admin | Medium |
| ST-015 | IP blacklist | 1. Block specific IPs | Blocked IPs denied access | Low |

---

## 24. Notifications Configuration

### 24.1 Email Notifications

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| NT-001 | Configure email provider | 1. Set up SMTP/SES/SendGrid | Emails sent correctly | High |
| NT-002 | Test email connection | 1. Send test email | Email received | High |
| NT-003 | Enable order notifications | 1. Enable order confirmation email | Customer receives email on order | High |
| NT-004 | Enable shipping notifications | 1. Enable shipping email | Customer notified when shipped | High |
| NT-005 | Customize email templates | 1. Edit email template<br>2. Save | Custom template used | Medium |
| NT-006 | Disable specific emails | 1. Disable particular notification | Email not sent for that event | Medium |

### 24.2 SMS Notifications

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| NT-007 | Configure SMS provider | 1. Set up Twilio/other provider | SMS sent correctly | Medium |
| NT-008 | Enable SMS for OTP | 1. Enable OTP via SMS | OTP sent via SMS | Medium |
| NT-009 | Enable order SMS | 1. Enable order confirmation SMS | Customer receives SMS | Low |

### 24.3 Push Notifications

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| NT-010 | Configure push notifications | 1. Set up push service | Push notifications work | Medium |
| NT-011 | Order push notification | 1. Enable order push | Customer receives push | Low |

### 24.4 In-App Notifications

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| NT-012 | View notification bell | 1. Click notification bell in admin | Recent notifications displayed | High |
| NT-013 | Mark as read | 1. Click on notification | Marked as read | Medium |
| NT-014 | Clear all notifications | 1. Clear all | All notifications cleared | Low |

---

## 25. Returns & Exchanges

### 25.1 Return Requests

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RT-001 | Customer initiates return | 1. Navigate to order<br>2. Click Request Return<br>3. Select items<br>4. Enter reason | Return request created | High |
| RT-002 | Return reason selection | 1. Choose from predefined reasons | Reason recorded | High |
| RT-003 | Return window enforcement | 1. Try to return after return window | Error: "Return period expired" | High |
| RT-004 | Non-returnable product | 1. Try to return non-returnable item | Error: "This item is not returnable" | High |
| RT-005 | Partial return | 1. Return some items from order | Partial return created | Medium |

### 25.2 Return Processing

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RT-006 | View return requests | 1. Navigate to Returns (Admin) | All return requests listed | High |
| RT-007 | Approve return | 1. Review return<br>2. Approve | Return approved, instructions sent | High |
| RT-008 | Reject return | 1. Reject with reason | Return rejected, customer notified | High |
| RT-009 | Return approval workflow | 1. High-value return initiated | Approval required based on threshold | Medium |
| RT-010 | Generate return label | 1. Generate shipping label | Label provided to customer | Medium |

### 25.3 Return Fulfillment

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RT-011 | Mark return received | 1. Product arrives at warehouse<br>2. Mark as received | Return status updated | High |
| RT-012 | Inspect returned item | 1. Quality check<br>2. Update condition | Condition noted | Medium |
| RT-013 | Process refund | 1. Initiate refund for return | Refund processed | High |
| RT-014 | Return to inventory | 1. Add returned item back to stock | Inventory updated | High |

### 25.4 Exchanges

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| RT-015 | Request exchange | 1. Select exchange instead of refund | Exchange request created | Medium |
| RT-016 | Process exchange | 1. Ship replacement item | New shipment created | Medium |
| RT-017 | Price difference handling | 1. Exchange for different price item | Charge/credit difference | Medium |

---

## 26. Import/Export Operations

### 26.1 Product Import/Export

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IE-001 | Download product template | 1. Click Export Template | CSV/XLSX template downloaded | High |
| IE-002 | Import products | 1. Upload filled template<br>2. Start import | Products imported, report generated | High |
| IE-003 | Import validation | 1. Upload file with errors | Validation errors shown per row | High |
| IE-004 | Export all products | 1. Click Export<br>2. Select format | Products exported | High |
| IE-005 | Export filtered products | 1. Apply filters<br>2. Export | Only filtered products exported | Medium |
| IE-006 | Import with images | 1. Include image URLs in import | Images downloaded and attached | Medium |

### 26.2 Category Import/Export

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IE-007 | Export categories | 1. Export category tree | Categories exported with hierarchy | Medium |
| IE-008 | Import categories | 1. Import category file | Categories created with hierarchy | Medium |

### 26.3 Customer Import/Export

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IE-009 | Export customers | 1. Export customer list | Customers exported | Medium |
| IE-010 | Import customers | 1. Upload customer file | Customers imported | Medium |

### 26.4 Order Export

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IE-011 | Export orders | 1. Select date range<br>2. Export | Orders exported | High |
| IE-012 | Export for accounting | 1. Export with tax details | Tax-compliant export | Medium |

### 26.5 Inventory Import/Export

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| IE-013 | Export stock levels | 1. Export inventory | Current stock exported | High |
| IE-014 | Bulk stock update | 1. Upload stock file | Stock levels updated | High |

---

## 27. Localization & Multi-Currency

### 27.1 Language Configuration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| LC-001 | Set default language | 1. Configure default language | Platform displays in default language | High |
| LC-002 | Add additional language | 1. Enable additional languages | Language selector available | Medium |
| LC-003 | Translate product | 1. Add translations for product name/description | Correct language shown based on locale | Medium |
| LC-004 | Translate categories | 1. Add category translations | Categories show in correct language | Medium |
| LC-005 | Customer language preference | 1. Customer selects language | Storefront shows preferred language | Medium |

### 27.2 Currency Configuration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| LC-006 | Set store currency | 1. Configure primary currency | All prices in store currency | High |
| LC-007 | Enable multi-currency | 1. Add additional currencies | Currency selector available | Medium |
| LC-008 | Currency conversion | 1. View product in different currency | Price converted correctly | Medium |
| LC-009 | Checkout in local currency | 1. Customer pays in their currency | Transaction in selected currency | Medium |
| LC-010 | Exchange rate update | 1. Update exchange rates | Prices reflect new rates | Low |

### 27.3 Regional Settings

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| LC-011 | Date format | 1. Configure date format | Dates displayed correctly | Medium |
| LC-012 | Number format | 1. Configure decimal/thousand separators | Numbers formatted correctly | Medium |
| LC-013 | Address format | 1. Configure address format by country | Addresses shown in local format | Low |

---

## 28. Mobile App Testing

### 28.1 Customer App

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MB-001 | App login | 1. Open mobile app<br>2. Login with credentials | Successfully logged in | High |
| MB-002 | Browse products | 1. Browse product catalog | Products displayed correctly | High |
| MB-003 | Product details | 1. Tap on product | Full details with images | High |
| MB-004 | Add to cart | 1. Add product to cart | Cart updated | High |
| MB-005 | Mobile checkout | 1. Complete checkout on mobile | Order placed | High |
| MB-006 | Push notification | 1. Enable push<br>2. Place order | Push notification received | Medium |
| MB-007 | Offline mode | 1. Browse while offline | Cached data displayed | Medium |
| MB-008 | App deep linking | 1. Click shared product link | App opens to product | Low |

### 28.2 Vendor/Admin App

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MB-009 | Admin app login | 1. Login to admin app | Dashboard displayed | High |
| MB-010 | View orders | 1. Navigate to orders | Order list shown | High |
| MB-011 | Update order status | 1. Change order status | Status updated | High |
| MB-012 | View analytics | 1. View sales analytics | Analytics displayed | Medium |
| MB-013 | Notifications | 1. Receive new order notification | Push notification works | High |
| MB-014 | Quick actions | 1. Use quick actions | Actions work correctly | Medium |

### 28.3 Mobile Responsiveness

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| MB-015 | Storefront on mobile browser | 1. Open storefront on mobile browser | Responsive layout works | High |
| MB-016 | Admin on tablet | 1. Access admin on tablet | Layout adapts correctly | Medium |
| MB-017 | Touch interactions | 1. Test swipe, pinch-zoom | Touch gestures work | Medium |

---

## 29. Integration Tests

### 29.1 End-to-End Order Flow

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| E2E-001 | Complete purchase flow | 1. Register customer<br>2. Browse products<br>3. Add to cart<br>4. Apply coupon<br>5. Checkout<br>6. Pay<br>7. View order | Order placed, all integrations work | Critical |
| E2E-002 | Order with variant | 1. Add variant product<br>2. Complete checkout | Correct variant ordered | High |
| E2E-003 | Order with gift card | 1. Apply gift card<br>2. Complete checkout | Gift card redeemed | High |
| E2E-004 | Multi-item order | 1. Add multiple products<br>2. Checkout | All items processed correctly | High |
| E2E-005 | Full refund flow | 1. Place order<br>2. Admin refunds<br>3. Check customer notification | Refund processed, stock restored | High |

### 18.2 Multi-Tenant Isolation

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| E2E-006 | Tenant data isolation | 1. Create order in Tenant A<br>2. Login to Tenant B admin | Order not visible in Tenant B | Critical |
| E2E-007 | Staff permission isolation | 1. Staff from Tenant A<br>2. Try to access Tenant B | Access denied | Critical |
| E2E-008 | Customer isolation | 1. Customer in Tenant A<br>2. Try to view Tenant B storefront | Separate experience | High |

### 18.3 Inventory Synchronization

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| E2E-009 | Stock deduction on order | 1. Note stock<br>2. Place order<br>3. Check stock | Stock reduced by order quantity | High |
| E2E-010 | Stock restoration on cancel | 1. Place order<br>2. Cancel order<br>3. Check stock | Stock restored | High |
| E2E-011 | Concurrent stock check | 1. Two customers try to buy last item simultaneously | Only one succeeds, other gets out of stock | High |

### 18.4 Notification Integration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| E2E-012 | Order confirmation email | 1. Place order<br>2. Check email | Confirmation email received | High |
| E2E-013 | Shipping notification | 1. Admin marks shipped<br>2. Check email | Shipping email with tracking | High |
| E2E-014 | Status update notifications | 1. Admin changes order status | Customer notified | High |
| E2E-015 | Ticket notification | 1. Create ticket<br>2. Staff replies | Customer notified of reply | High |

### 18.5 Search Integration

| Test ID | Test Case | Steps | Expected Result | Priority |
|---------|-----------|-------|-----------------|----------|
| E2E-016 | Product search indexing | 1. Create product<br>2. Search for product | Product found in search | High |
| E2E-017 | Product update in search | 1. Update product name<br>2. Search new name | Updated product found | High |
| E2E-018 | Product delete from search | 1. Delete product<br>2. Search | Product not found | High |

---

## Test Execution Guidelines

### Prerequisites
1. Access to production environment with test tenant
2. Test user accounts at various permission levels
3. Test payment credentials (sandbox/test mode)
4. Test email accounts for notification verification

### Test Data Setup
1. Create at least 3 test tenants
2. Create products across multiple categories
3. Create staff with different roles
4. Create test customers with various states

### Priority Levels
- **Critical**: Must pass for release
- **High**: Should pass for release
- **Medium**: Important but not blocking
- **Low**: Nice to have

### Reporting
- Document pass/fail status
- Capture screenshots for failures
- Log actual vs expected results
- Note environment and test data used

---

## Appendix A: Status Reference

### Order Statuses
- PLACED → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
- CANCELLED (from any non-terminal)

### Payment Statuses
- PENDING → PAID
- PENDING → FAILED
- PAID → PARTIALLY_REFUNDED
- PAID → REFUNDED

### Fulfillment Statuses
- UNFULFILLED → PROCESSING → PACKED → DISPATCHED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
- FAILED_DELIVERY → RETURNED

### Product Statuses
- DRAFT → PENDING → ACTIVE
- ACTIVE ↔ INACTIVE
- ACTIVE → ARCHIVED
- PENDING → REJECTED

### Ticket Statuses
- OPEN → IN_PROGRESS → RESOLVED → CLOSED
- OPEN → ON_HOLD → IN_PROGRESS
- RESOLVED → REOPENED → IN_PROGRESS
- Any → CANCELLED
- Any → ESCALATED

---

## Appendix B: Test User Roles

| Role | Permissions | Use For Testing |
|------|-------------|-----------------|
| Owner | All permissions | Full functionality testing |
| Admin | Most permissions (no billing) | Admin workflow testing |
| Manager | Orders, Products, Returns | Day-to-day operations |
| Viewer | Read-only access | Permission restriction testing |
| Customer | Storefront access | Customer journey testing |

---

*End of Document*
