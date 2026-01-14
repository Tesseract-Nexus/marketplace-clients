# Vendor & Staff Implementation Plan

## Files to Create:

### Vendor:
1. app/api/vendors/route.ts - GET, POST
2. app/api/vendors/[id]/route.ts - GET, PUT, DELETE
3. lib/api/vendors.ts - Service methods
4. lib/data/mockVendors.ts - Mock data
5. lib/services/vendorService.ts - Unified service
6. app/vendors/page.tsx - UI with stepper

### Staff:
1. app/api/staff/route.ts - GET, POST
2. app/api/staff/[id]/route.ts - GET, PUT, DELETE  
3. lib/api/staff.ts - Service methods
4. lib/data/mockStaff.ts - Mock data
5. lib/services/staffService.ts - Unified service
6. app/staff/page.tsx - UI with stepper

## Stepper Form Steps:

### Vendor (4 steps):
1. Basic Info - name, email, contact
2. Business Details - registration, tax, website
3. Contract Info - commission, dates, terms
4. Review & Submit

### Staff (4 steps):
1. Personal Info - name, email, phone
2. Employment Info - role, type, start date, salary
3. Organization - department, manager, location  
4. Review & Submit
