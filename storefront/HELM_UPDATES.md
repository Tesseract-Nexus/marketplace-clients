# Helm Chart Updates for Storefront

Since I cannot directly access the `tesserix-k8s` repository, please apply the following changes to your Helm chart manually.

## 1. Update `values.yaml`

Add the following configuration block under the `env` or `environment` section of your storefront's `values.yaml`. 
**Note:** Ensure your deployment template iterates over these and sets them as `env` vars on the container.

```yaml
storefront:
  env:
    # App URL (Critical for server-side absolute URLs)
    - name: NEXT_PUBLIC_APP_URL
      value: "https://dev-store.tesserix.app"
    
    # Azure AD Auth
    - name: NEXT_PUBLIC_AZURE_CLIENT_ID
      value: "YOUR_AZURE_CLIENT_ID"
    - name: NEXT_PUBLIC_AZURE_AUTHORITY
      value: "https://login.microsoftonline.com/YOUR_TENANT_ID"
    - name: NEXT_PUBLIC_REDIRECT_URI
      value: "https://dev-store.tesserix.app"

    # Microservice URLs (Must be publicly accessible for client-side)
    - name: NEXT_PUBLIC_PRODUCTS_API_URL
      value: "https://api.tesserix.app/products/v1"
    - name: NEXT_PUBLIC_ORDERS_SERVICE_URL
      value: "https://api.tesserix.app/orders/v1"
    - name: NEXT_PUBLIC_CATEGORIES_API_URL
      value: "https://api.tesserix.app/categories/v1"
    - name: NEXT_PUBLIC_COUPONS_API_URL
      value: "https://api.tesserix.app/coupons/v1"
    - name: NEXT_PUBLIC_REVIEWS_API_URL
      value: "https://api.tesserix.app/reviews/v1"
    - name: NEXT_PUBLIC_SETTINGS_API_URL
      value: "https://api.tesserix.app/settings/v1"
    - name: NEXT_PUBLIC_TENANT_API_URL
      value: "https://api.tesserix.app/tenant/v1"
    - name: NEXT_PUBLIC_TAX_SERVICE_URL
      value: "https://api.tesserix.app/tax/v1"
    - name: NEXT_PUBLIC_PAYMENT_SERVICE_URL
      value: "https://api.tesserix.app/payment/v1"
    
    # Feature Flags
    - name: NEXT_PUBLIC_ENABLE_REVIEWS
      value: "true"
    - name: NEXT_PUBLIC_ENABLE_WISHLIST
      value: "true"
```

## 2. IMPORTANT: Build-Time vs Run-Time Configuration

By default, Next.js "bakes in" `NEXT_PUBLIC_` variables at **build time**. 
Setting these values in Helm will **ONLY** affect the Server-Side (Node.js) code, NOT the Client-Side (Browser) code, unless your Docker image was built *with* these values present.

**If you deploy the SAME Docker image to Dev and Prod with DIFFERENT Helm values, the Browser will still see the values from when the image was BUILT (likely `localhost` or undefined).**

### Recommended Fix: Runtime Configuration
To support changing these values via Helm without rebuilding the Docker image, I will now update your codebase to support **Runtime Configuration Injection**.

I will:
1. Create an `EnvProvider` that reads environment variables on the Server (where Helm values work) and passes them to the Client.
2. Update `config.ts` to use these runtime values.
