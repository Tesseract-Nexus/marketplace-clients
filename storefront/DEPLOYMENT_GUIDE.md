# Storefront Deployment Guide

This guide details the environment variables required for the Tesseract Storefront to function correctly in a production environment.

## Critical Configuration
The application **will not function** without these variables.

| Variable | Description | Example (Production) |
|----------|-------------|----------------------|
| `NEXT_PUBLIC_APP_URL` | The public URL of the storefront. **CRITICAL** for server-side fetches. | `https://store.tesserix.app` |
| `NEXT_PUBLIC_PRODUCTS_API_URL` | URL for the Products Microservice | `https://api.tesserix.app/products/v1` |
| `NEXT_PUBLIC_ORDERS_SERVICE_URL` | URL for the Orders Microservice | `https://api.tesserix.app/orders/v1` |
| `NEXT_PUBLIC_CATEGORIES_API_URL` | URL for the Categories Microservice | `https://api.tesserix.app/categories/v1` |
| `NEXT_PUBLIC_SETTINGS_API_URL` | URL for the Settings/Tenant Microservice | `https://api.tesserix.app/settings/v1` |

## Authentication (Azure AD)
Required for user login and account management.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_AZURE_CLIENT_ID` | The Application (Client) ID from Azure Portal. |
| `NEXT_PUBLIC_AZURE_AUTHORITY` | The Authority URL (e.g., `https://login.microsoftonline.com/{tenant_id}`). |
| `NEXT_PUBLIC_REDIRECT_URI` | Must match the `NEXT_PUBLIC_APP_URL` (plus `/` usually). |

## Optional Features
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_REVIEWS` | `true` | Enable/Disable product reviews. |
| `NEXT_PUBLIC_ENABLE_WISHLIST` | `true` | Enable/Disable wishlist functionality. |
| `NEXT_PUBLIC_SHOW_ERRORS` | `false` | Set to `true` to see detailed stack traces in the error page (Use with caution). |

## Troubleshooting "Blank Page"
If you see a blank page or a "Critical Error":
1. Open the Browser Console (`F12`).
2. If you see errors about `localhost`, you are missing the API variables above.
3. If you see "Only absolute URLs are supported", you are missing `NEXT_PUBLIC_APP_URL`.
